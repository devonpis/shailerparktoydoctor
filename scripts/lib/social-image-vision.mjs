import path from 'node:path';
import sharp from 'sharp';
import {
  listPublishImagePaths,
  selectImagesForSocial,
  SOCIAL_CAROUSEL_MAX,
} from './project-media.mjs';
import { prefilterCandidatesForVision } from './social-image-heuristic.mjs';

const THUMB_MAX_PX = 512;

async function encodeThumbnail(imagePath) {
  const buf = await sharp(imagePath)
    .rotate()
    .resize(THUMB_MAX_PX, THUMB_MAX_PX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  return buf.toString('base64');
}

function buildPrompt({ projectName, description, max, filenames }) {
  return `You are choosing photos for a toy repair business Instagram/Facebook carousel (max ${max} images).

Project: ${projectName}
Summary: ${description.slice(0, 400)}

Available files (each image is attached in the same order, labeled in the message):
${filenames.map((n, i) => `${i + 1}. ${n}`).join('\n')}

Pick up to ${max} images that tell the repair story best for social media:
- Include a clear BEFORE (damage/problem) and AFTER (finished) if those shots exist.
- Prefer sharp, well-lit, non-blurry photos; skip near-duplicates.
- Show a logical repair progression; not every WIP is needed.
- Filenames hint at role: before.*, after.*, hero.*, WIP-###.* — use these as guides but judge visual content.

Respond with JSON only:
{
  "selected": ["exact-filename.jpg", ...],
  "summary": "one sentence why",
  "notes": { "omitted-filename.jpg": "short reason" }
}

"selected" must use exact filenames from the list, length <= ${max}, carousel order: before → WIP (numeric) → hero → after.`;
}

function normalizeSelected(names, allowedBasenames) {
  const byLower = new Map(allowedBasenames.map((n) => [n.toLowerCase(), n]));
  const out = [];
  for (const raw of names) {
    const hit = byLower.get(String(raw).toLowerCase());
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}

function storySort(included, storyOrder) {
  const order = new Map(storyOrder.map((p, i) => [p, i]));
  return [...included].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function ensureKeyStems(pickedNames, storyOrder, max) {
  const byPath = new Map(storyOrder.map((p) => [path.basename(p), p]));
  const set = new Set(pickedNames);
  for (const stem of ['hero', 'before', 'after']) {
    const hit = storyOrder.find((p) => path.basename(p).toLowerCase().startsWith(stem));
    if (!hit) continue;
    const name = path.basename(hit);
    if (set.has(name)) continue;
    if (set.size >= max) {
      const wipNames = [...set].filter((n) => /^wip-/i.test(n));
      if (wipNames.length) {
        const drop = wipNames.sort().at(-1);
        set.delete(drop);
      }
    }
    if (set.size < max) set.add(name);
  }
  return [...set].map((n) => byPath.get(n)).filter(Boolean);
}

export async function selectImagesWithVision(dir, config, options = {}) {
  const max = options.max ?? SOCIAL_CAROUSEL_MAX;
  const storyOrder = listPublishImagePaths(dir);
  if (storyOrder.length <= max) {
    return { included: storyOrder, omitted: [], method: 'all', summary: null, notes: {} };
  }

  const apiKey = options.apiKey?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const baseUrl = (options.apiBase || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = options.model || 'gpt-4o-mini';

  const candidates = await prefilterCandidatesForVision(storyOrder);
  const filenames = candidates.map((p) => path.basename(p));
  const projectName = config.projectName || config.title || path.basename(dir);
  const description = config.description || '';

  const content = [
    {
      type: 'text',
      text: buildPrompt({ projectName, description, max, filenames }),
    },
  ];

  for (const filePath of candidates) {
    const name = path.basename(filePath);
    const b64 = await encodeThumbnail(filePath);
    content.push({ type: 'text', text: `File: ${name}` });
    content.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' },
    });
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error?.message || `Vision API HTTP ${res.status}`);
  }

  const text = body.choices?.[0]?.message?.content;
  if (!text) throw new Error('Vision API returned empty content');

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Vision API returned invalid JSON');
  }

  let selectedNames = normalizeSelected(parsed.selected || [], filenames).slice(0, max);
  const includedPaths = ensureKeyStems(
    selectedNames,
    storyOrder.filter((p) => candidates.includes(p)),
    max
  );
  let included = storySort(
    includedPaths.length ? includedPaths : [],
    storyOrder
  );

  if (included.length > max) {
    included = included.slice(0, max);
  }
  if (included.length < Math.min(max, storyOrder.length)) {
    const fallback = selectImagesForSocial(dir, max);
    const merge = new Set([...included, ...fallback.included]);
    included = storySort([...merge], storyOrder).slice(0, max);
  }

  const includedSet = new Set(included);
  const omitted = storyOrder.filter((p) => !includedSet.has(p));
  const notes = parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {};
  for (const p of omitted) {
    const base = path.basename(p);
    if (!notes[base]) notes[base] = 'not selected for carousel';
  }

  return {
    included,
    omitted,
    method: 'vision',
    summary: parsed.summary || 'Vision model selected best story images.',
    notes,
  };
}
