import fs from 'node:fs';
import path from 'node:path';

/** Listed repair images: .jpeg / .jpg (rename to .jpeg on publish) or .png. */
const IMAGE_RE = /^(before|after|hero|WIP-\d{3})\.(jpe?g|png)$/i;

export function listProjectImages(dir) {
  return fs
    .readdirSync(dir)
    .filter((n) => IMAGE_RE.test(n))
    .sort();
}

/**
 * Featured image filename for gallery tiles, story hero, and OG image.
 * Order: hero → after → WIP-001… → before.
 */
export function pickFeaturedImageName(dir) {
  const names = listProjectImages(dir);
  for (const stem of ['hero', 'after']) {
    const hit = names.find((n) => n.toLowerCase().startsWith(stem));
    if (hit) return hit;
  }
  const wip = names
    .filter((n) => /^WIP-/i.test(n))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
  if (wip) return wip;
  const before = names.find((n) => n.toLowerCase().startsWith('before'));
  if (before) return before;
  return null;
}

/** Pick by stem: hero, after, before, or auto (hero → after → WIP → before). */
export function pickImage(dir, stem = 'auto') {
  if (stem === 'auto') return pickPrimaryImage(dir);
  const names = listProjectImages(dir);
  const hit = names.find((n) => n.toLowerCase().startsWith(stem.toLowerCase()));
  if (!hit) {
    throw new Error(`No image matching "${stem}" in ${path.basename(dir)} (${names.join(', ') || 'none'}).`);
  }
  return path.join(dir, hit);
}

/** Primary image path for gallery tile / story hero (hero → after → WIP → before). */
export function pickPrimaryImage(dir) {
  const name = pickFeaturedImageName(dir);
  if (!name) {
    throw new Error('No project image found (hero, after, WIP-###, or before).');
  }
  return path.join(dir, name);
}

/** Max images per unified FB / IG / Threads carousel in this repo. */
export const SOCIAL_CAROUSEL_MAX = 10;

/**
 * Story page “Work in progress” gallery: before → WIP-### → after.
 * Excludes hero.* only (before/after/WIP show even when also used as page hero).
 */
export function listStoryGalleryImageNames(dir) {
  const names = listProjectImages(dir).filter((n) => !/^hero\./i.test(n));
  const rank = (name) => {
    const lower = name.toLowerCase();
    if (lower.startsWith('before')) return [0, 0, name];
    const wip = lower.match(/^wip-(\d+)/i);
    if (wip) return [1, Number(wip[1]), name];
    if (lower.startsWith('after')) return [2, 0, name];
    return [3, 0, name];
  };
  return names.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2].localeCompare(rb[2]);
  });
}

export function storyGalleryImageAlt(name, index) {
  const lower = name.toLowerCase();
  if (lower.startsWith('before')) return 'Before — repair';
  if (lower.startsWith('after')) return 'After — repair';
  if (/^wip-/i.test(lower)) {
    const n = Number(lower.match(/^wip-(\d+)/i)?.[1]) || index + 1;
    return `Repair in progress ${n}`;
  }
  return 'Repair';
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

const SOCIAL_SELECTION_STEMS = ['hero', 'before', 'after'];

/**
 * Pick up to `max` images for social carousel.
 * Selection priority: hero → before → after → WIP-### (numeric).
 * Returned paths are re-sorted in story order (before → WIP → hero → after).
 */
export function selectImagesForSocial(dir, max = SOCIAL_CAROUSEL_MAX) {
  const storyOrder = listPublishImagePaths(dir);
  if (storyOrder.length <= max) {
    return { included: storyOrder, omitted: [] };
  }

  const pickedSet = new Set();

  for (const stem of SOCIAL_SELECTION_STEMS) {
    if (pickedSet.size >= max) break;
    const hit = storyOrder.find((p) => path.basename(p).toLowerCase().startsWith(stem));
    if (hit) pickedSet.add(hit);
  }

  for (const wip of storyOrder) {
    if (pickedSet.size >= max) break;
    if (/^wip-/i.test(path.basename(wip))) pickedSet.add(wip);
  }

  const included = storyOrder.filter((p) => pickedSet.has(p));
  const omitted = storyOrder.filter((p) => !pickedSet.has(p));
  return { included, omitted };
}

/** Base URL must be the HTTPS directory that already contains the image file. */
export function publicImageUrl(publicBaseUrl, imageFileName) {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/${encodeURIComponent(imageFileName)}`;
}
