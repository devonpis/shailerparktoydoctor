import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  listPublishImagePaths,
  selectImagesForSocial,
  SOCIAL_CAROUSEL_MAX,
} from './project-media.mjs';

const STEM_SCORE = { after: 1000, hero: 900, before: 800 };

/** Higher = better for social carousel. */
export async function scoreImageForSocial(imagePath) {
  const base = path.basename(imagePath).toLowerCase();
  let score = 0;
  for (const [stem, pts] of Object.entries(STEM_SCORE)) {
    if (base.startsWith(stem)) score += pts;
  }

  const meta = await sharp(imagePath).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const pixels = w * h;
  score += Math.min(pixels / 8000, 400);
  if (w > 0 && h > 0) {
    const ratio = w / h;
    if (ratio >= 0.75 && ratio <= 1.33) score += 40;
  }

  const { channels } = await sharp(imagePath).stats();
  const mean = channels?.[0]?.mean ?? 128;
  if (mean > 25 && mean < 245) score += 30;

  score += Math.min(fs.statSync(imagePath).size / 8000, 80);
  return score;
}

function ensureKeyStems(pickedSet, storyOrder, max) {
  for (const stem of ['hero', 'before', 'after']) {
    const hit = storyOrder.find((p) => path.basename(p).toLowerCase().startsWith(stem));
    if (!hit || pickedSet.has(hit)) continue;
    if (pickedSet.size >= max) {
      const wips = storyOrder.filter(
        (p) => pickedSet.has(p) && /^wip-/i.test(path.basename(p))
      );
      if (wips.length) pickedSet.delete(wips[wips.length - 1]);
    }
    if (pickedSet.size < max) pickedSet.add(hit);
  }
}

/**
 * Pick images using local sharp scores (no external API).
 */
export async function selectImagesWithHeuristic(dir, max = SOCIAL_CAROUSEL_MAX) {
  const storyOrder = listPublishImagePaths(dir);
  if (storyOrder.length <= max) {
    return { included: storyOrder, omitted: [], method: 'all', summary: null, notes: {} };
  }

  const scored = await Promise.all(
    storyOrder.map(async (p) => ({ path: p, score: await scoreImageForSocial(p) }))
  );

  const reserved = [];
  const wipCandidates = [];
  for (const { path: p, score } of scored) {
    const base = path.basename(p).toLowerCase();
    if (base.startsWith('hero') || base.startsWith('before') || base.startsWith('after')) {
      reserved.push({ path: p, score });
    } else {
      wipCandidates.push({ path: p, score });
    }
  }

  reserved.sort((a, b) => b.score - a.score);
  wipCandidates.sort((a, b) => b.score - a.score);

  const pickedSet = new Set();
  for (const { path: p } of reserved) {
    if (pickedSet.size >= max) break;
    pickedSet.add(p);
  }
  for (const { path: p } of wipCandidates) {
    if (pickedSet.size >= max) break;
    pickedSet.add(p);
  }
  ensureKeyStems(pickedSet, storyOrder, max);

  const included = storyOrder.filter((p) => pickedSet.has(p));
  const omitted = storyOrder.filter((p) => !pickedSet.has(p));
  const notes = Object.fromEntries(
    omitted.map((p) => [path.basename(p), 'lower heuristic score'])
  );

  return {
    included,
    omitted,
    method: 'heuristic',
    summary: 'Ranked by clarity, resolution, and role (after/hero/before preferred).',
    notes,
  };
}

/** Narrow a long WIP list before sending to vision API. */
export async function prefilterCandidatesForVision(storyOrder, maxCandidates = 22) {
  if (storyOrder.length <= maxCandidates) return storyOrder;

  const scored = await Promise.all(
    storyOrder.map(async (p) => ({ path: p, score: await scoreImageForSocial(p) }))
  );
  scored.sort((a, b) => b.score - a.score);

  const stems = scored.filter(({ path: p }) => {
    const b = path.basename(p).toLowerCase();
    return b.startsWith('hero') || b.startsWith('before') || b.startsWith('after');
  });
  const wips = scored.filter(({ path: p }) => /^wip-/i.test(path.basename(p)));
  const slotsForWip = Math.max(0, maxCandidates - stems.length);
  return [...stems.map((x) => x.path), ...wips.slice(0, slotsForWip).map((x) => x.path)];
}
