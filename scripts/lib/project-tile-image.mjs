/**
 * Portrait tile crop — bake class="is-portrait" when height > width (matches js/skills.js).
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { REPO_ROOT } from './resolve-project-dir.mjs';

const portraitCache = new Map();

export function publicUrlToRepoPath(publicUrl) {
  if (!publicUrl || typeof publicUrl !== 'string') return null;
  const rel = publicUrl.startsWith('/') ? publicUrl.slice(1) : publicUrl;
  return path.join(REPO_ROOT, decodeURIComponent(rel));
}

export async function isPortraitPublicUrl(publicUrl) {
  if (portraitCache.has(publicUrl)) return portraitCache.get(publicUrl);
  const fp = publicUrlToRepoPath(publicUrl);
  let portrait = false;
  if (fp && fs.existsSync(fp)) {
    try {
      const meta = await sharp(fp).metadata();
      portrait = Boolean(meta.width && meta.height && meta.height > meta.width);
    } catch {
      portrait = false;
    }
  }
  portraitCache.set(publicUrl, portrait);
  return portrait;
}

export function buildTileImgTag({ src, alt, portrait }) {
  const cls = portrait ? ' class="is-portrait"' : '';
  return `<img src="${src}" alt="${alt}" loading="lazy"${cls} />`;
}

export async function buildTileImgTagForUrl(publicUrl, alt) {
  const portrait = await isPortraitPublicUrl(publicUrl);
  return buildTileImgTag({ src: publicUrl, alt, portrait });
}

export function clearPortraitCache() {
  portraitCache.clear();
}
