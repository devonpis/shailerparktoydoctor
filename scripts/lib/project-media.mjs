import fs from 'node:fs';
import path from 'node:path';

const IMAGE_RE = /^(before|after|hero|WIP-\d{3})\.(jpe?g|png|webp|gif)$/i;
const PRIORITY = ['hero', 'after', 'before'];

export function listProjectImages(dir) {
  return fs
    .readdirSync(dir)
    .filter((n) => IMAGE_RE.test(n))
    .sort();
}

/** Pick by stem: after, hero, before, or auto (hero → after → before → WIP). */
export function pickImage(dir, stem = 'auto') {
  if (stem === 'auto') return pickPrimaryImage(dir);
  const names = listProjectImages(dir);
  const hit = names.find((n) => n.toLowerCase().startsWith(stem.toLowerCase()));
  if (!hit) {
    throw new Error(`No image matching "${stem}" in ${path.basename(dir)} (${names.join(', ') || 'none'}).`);
  }
  return path.join(dir, hit);
}

/** Primary image for social: hero → after → before → lowest WIP */
export function pickPrimaryImage(dir) {
  const names = listProjectImages(dir);
  for (const stem of PRIORITY) {
    const hit = names.find((n) => n.toLowerCase().startsWith(stem));
    if (hit) return path.join(dir, hit);
  }
  const wip = names
    .filter((n) => /^WIP-/i.test(n))
    .sort()
    .at(0);
  if (wip) return path.join(dir, wip);
  throw new Error('No project image found (before, after, hero, or WIP-###).');
}

/** Story order for carousels: before → WIP sequence → hero → after. */
export function listPublishImagePaths(dir) {
  const names = listProjectImages(dir);
  const rank = (name) => {
    const lower = name.toLowerCase();
    if (lower.startsWith('before')) return [0, 0, name];
    const wip = lower.match(/^wip-(\d+)/i);
    if (wip) return [1, Number(wip[1]), name];
    if (lower.startsWith('hero')) return [2, 0, name];
    if (lower.startsWith('after')) return [3, 0, name];
    return [4, 0, name];
  };
  return names
    .sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      return ra[0] - rb[0] || ra[1] - rb[1] || ra[2].localeCompare(rb[2]);
    })
    .map((n) => path.join(dir, n));
}

/** Base URL must be the HTTPS directory that already contains the image file. */
export function publicImageUrl(publicBaseUrl, imageFileName) {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/${encodeURIComponent(imageFileName)}`;
}
