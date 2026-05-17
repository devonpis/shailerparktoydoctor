import path from 'node:path';
import sharp from 'sharp';
import { listProjectImages } from './project-media.mjs';
import { executeImagePlan, planImageProcessing } from './process-project-image.mjs';

const PRIMARY_STEMS = ['hero', 'before', 'after'];

export function imageStem(name) {
  return name.replace(/\.[^.]+$/, '').toLowerCase();
}

export function isPrimaryImage(name) {
  const s = imageStem(name);
  return PRIMARY_STEMS.some((p) => s === p || s.startsWith(p));
}

/** Review hint only — many landscape repair shots are correct. */
export function heuristicOrientationFlag(width, height, name) {
  if (!width || !height) return '';
  const ratio = width / height;
  const s = imageStem(name);
  if (isPrimaryImage(name) && ratio > 1.15) return 'review_landscape_primary';
  if (/^wip-\d+/.test(s) && ratio > 1.4) return 'review_landscape_wip';
  return '';
}

export async function readImageOrientation(filePath) {
  const meta = await sharp(filePath).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    orientation: meta.orientation ?? 1,
  };
}

/** Apply EXIF orientation (single encode per file; use optimize script when resize is also needed). */
export async function orientProjectExif(dir, { dryRun = false, orientQuality = 92 } = {}) {
  const flags = {
    exifOrient: true,
    dryRun,
    orientQuality,
    quality: 90,
    minBytes: Number.POSITIVE_INFINITY,
    maxPx: 99999,
  };
  const fixed = [];
  const skipped = [];
  for (const name of listProjectImages(dir)) {
    const filePath = path.join(dir, name);
    const plan = await planImageProcessing(filePath, flags, null);
    if (!plan) {
      skipped.push(name);
      continue;
    }
    await executeImagePlan(plan, flags);
    fixed.push({
      name,
      orientation: plan.orientation,
      before: { width: plan.width, height: plan.height },
      after: { width: plan.afterWidth, height: plan.afterHeight },
    });
  }
  return { fixed, skipped };
}

/** Scan for remaining EXIF tags and heuristic review hints (no writes). */
export async function scanProjectOrientation(dir) {
  const warnings = [];
  for (const name of listProjectImages(dir)) {
    const filePath = path.join(dir, name);
    const { width, height, orientation } = await readImageOrientation(filePath);
    if (orientation !== 1) {
      warnings.push({
        name,
        type: 'exif',
        message: `${name}: EXIF orientation ${orientation} still set — re-run publish or rotate manually`,
      });
    }
    const heuristic = heuristicOrientationFlag(width, height, name);
    if (heuristic) {
      warnings.push({
        name,
        type: 'heuristic',
        message: `${name}: ${heuristic} (visual check — may be a correct landscape shot)`,
      });
    }
  }
  return warnings;
}
