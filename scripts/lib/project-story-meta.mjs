import fs from 'node:fs';
import path from 'node:path';
import { listProjectImages } from './project-media.mjs';

export const SITE_ORIGIN = 'https://sptoydoctor.com.au';

export function storyCanonicalUrl(folderName) {
  return `${SITE_ORIGIN}/projects/${encodeURIComponent(folderName)}/`;
}

export function storyImageUrl(folderName, fileName) {
  return `${storyCanonicalUrl(folderName)}${encodeURIComponent(fileName)}`;
}

/** Prefer after (repair result), then hero, then before. */
export function pickStoryOgImageName(dir) {
  const names = listProjectImages(dir);
  for (const stem of ['after', 'hero', 'before']) {
    const hit = names.find((n) => n.toLowerCase().startsWith(stem));
    if (hit) return hit;
  }
  const wip = names.filter((n) => /^wip-/i.test(n)).sort()[0];
  return wip || null;
}

function stripForMeta(text) {
  return String(text || '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[🛠🦆🕷▶️✨🧚‍♀️🧚📱]/gu, '')
    .replace(/\bFull repair:\s*/gi, '')
    .replace(/\bShort:\s*/gi, '')
    .replace(/\s+([:;,])\s*/g, '$1 ')
    .replace(/[:;,]\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWord(text, maxLen) {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function firstSentencesUpTo(text, maxLen) {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return truncateAtWord(text, maxLen);
  let out = '';
  for (const s of parts) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > maxLen) break;
    out = next;
  }
  if (out.length >= 24) return out;
  return truncateAtWord(text, maxLen).replace(/…$/, '');
}

/** Meta description ≤ ~160 chars for search snippets. */
export function seoMetaDescription(description, maxLen = 160) {
  const t = stripForMeta(description);
  if (!t) return 'Toy and collectible repair at Shailer Park Toy Doctor.';
  const suffix = ' Shailer Park toy repair.';
  const lead = firstSentencesUpTo(t, maxLen - suffix.length);
  if (!/shailer park/i.test(lead)) return `${lead}${suffix}`;
  if (lead.length <= maxLen) return lead;
  return truncateAtWord(lead, maxLen);
}

/** Open Graph description — repair lead without redundant site suffix. */
export function ogMetaDescription(description, maxLen = 155) {
  const t = stripForMeta(description);
  if (!t) return 'Toy and collectible repair story';
  return firstSentencesUpTo(t, maxLen);
}

export function buildStoryMeta(config, folderName, dir) {
  const projectName = (config.projectName || folderName).trim();
  const pageTitle = `${projectName} — Shailer Park Toy Doctor`;
  const canonical = storyCanonicalUrl(folderName);
  const ogImageName = pickStoryOgImageName(dir);
  const description = config.description || '';

  return {
    projectName,
    pageTitle,
    canonical,
    metaDescription: seoMetaDescription(description),
    ogTitle: pageTitle,
    ogDescription: ogMetaDescription(description),
    ogImageName,
    ogImageUrl: ogImageName ? storyImageUrl(folderName, ogImageName) : null,
    ogUrl: canonical,
    ogType: 'article',
    heroAlt: `${projectName} — repair`,
  };
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function replaceOne(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

/**
 * Patch <head> SEO tags and project-hero image on an existing story index.html.
 */
export function applyStoryMetaToHtml(html, meta, folderName) {
  let out = html;

  out = replaceOne(out, /<title>[^<]*<\/title>/i, `<title>${escapeAttr(meta.pageTitle)}</title>`);

  out = replaceOne(
    out,
    /<meta\s+name="description"[\s\S]*?\/?>/i,
    `<meta name="description" content="${escapeAttr(meta.metaDescription)}" />`
  );

  out = replaceOne(
    out,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeAttr(meta.canonical)}" />`
  );

  out = replaceOne(
    out,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeAttr(meta.ogTitle)}" />`
  );

  out = replaceOne(
    out,
    /<meta\s+property="og:description"[\s\S]*?\/?>/i,
    `<meta property="og:description" content="${escapeAttr(meta.ogDescription)}" />`
  );

  if (meta.ogImageUrl) {
    out = replaceOne(
      out,
      /<meta\s+property="og:image"[\s\S]*?\/?>/i,
      `<meta property="og:image" content="${escapeAttr(meta.ogImageUrl)}" />`
    );
  }

  out = replaceOne(
    out,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeAttr(meta.ogUrl)}" />`
  );

  if (!/<meta\s+property="og:type"/i.test(out)) {
    out = out.replace(
      /(<meta\s+property="og:url"[^>]*\/?>)/i,
      `$1\n    <meta property="og:type" content="${escapeAttr(meta.ogType)}" />`
    );
  } else {
    out = replaceOne(
      out,
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:type" content="${escapeAttr(meta.ogType)}" />`
    );
  }

  if (meta.ogImageName) {
    const imgPath = `/projects/${encodeURIComponent(folderName)}/${encodeURIComponent(meta.ogImageName)}`;
    out = replaceOne(
      out,
      /(<div class="project-hero">[\s\S]*?<img\s+src=")[^"]*"/i,
      `$1${imgPath}"`
    );
    out = replaceOne(
      out,
      /(<div class="project-hero">[\s\S]*?<img[^>]*\salt=")[^"]*"/i,
      `$1${escapeAttr(meta.heroAlt)}"`
    );
  }

  return out;
}

export function updateProjectStoryMeta(dir, config, { dryRun = false } = {}) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    return { skipped: true, reason: 'no index.html' };
  }

  const folderName = path.basename(dir);
  const meta = buildStoryMeta(config, folderName, dir);
  const before = fs.readFileSync(htmlPath, 'utf8');
  const after = applyStoryMetaToHtml(before, meta, folderName);
  const changed = after !== before;

  if (!dryRun && changed) {
    fs.writeFileSync(htmlPath, after);
  }

  let webpageUrlSet = false;
  if (!dryRun && !config.webpageUrl) {
    config.webpageUrl = meta.canonical;
    fs.writeFileSync(path.join(dir, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);
    webpageUrlSet = true;
  }

  return { skipped: false, changed, dryRun, meta, webpageUrlSet };
}
