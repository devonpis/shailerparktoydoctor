import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/** Sharp rotate: positive degrees = counter-clockwise. */
export const ROTATE_PRESETS = {
  cw: -90,
  ccw: 90,
  '180': 180,
};

export function parseRotatePreset(flag) {
  if (flag === '--cw') return ROTATE_PRESETS.cw;
  if (flag === '--ccw') return ROTATE_PRESETS.ccw;
  if (flag === '--180') return ROTATE_PRESETS['180'];
  return null;
}

export function dimensionsAfterRotate(width, height, degrees) {
  const norm = ((degrees % 360) + 360) % 360;
  if (norm === 90 || norm === 270) return { width: height, height: width };
  return { width, height };
}

async function writeRotated(pipeline, filePath, tmpPath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') await pipeline.png().toFile(tmpPath);
  else if (ext === '.webp') await pipeline.webp({ quality: 90 }).toFile(tmpPath);
  else if (ext === '.gif') await pipeline.gif().toFile(tmpPath);
  else await pipeline.jpeg({ quality: 90, mozjpeg: true }).toFile(tmpPath);
}

/**
 * Rotate image in place. Strips EXIF orientation on write (pixels match display).
 * @param {string} filePath
 * @param {number} degrees - Sharp convention (positive = CCW)
 */
export async function rotateImageInPlace(filePath, degrees, { dryRun = false } = {}) {
  const before = await sharp(filePath).metadata();
  const bw = before.width ?? 0;
  const bh = before.height ?? 0;
  const expected = dimensionsAfterRotate(bw, bh, degrees);

  if (dryRun) {
    return {
      filePath,
      degrees,
      before: { width: bw, height: bh },
      after: expected,
    };
  }

  const tmpPath = `${filePath}.rotate-tmp`;
  await writeRotated(sharp(filePath).rotate(degrees), filePath, tmpPath);
  fs.renameSync(tmpPath, filePath);

  const after = await sharp(filePath).metadata();
  return {
    filePath,
    degrees,
    before: { width: bw, height: bh },
    after: { width: after.width ?? 0, height: after.height ?? 0 },
  };
}

/** Apply EXIF orientation to pixels (no extra angle). */
export async function autoOrientInPlace(filePath, { dryRun = false } = {}) {
  const before = await sharp(filePath).metadata();
  const bw = before.width ?? 0;
  const bh = before.height ?? 0;
  const orientation = before.orientation ?? 1;
  const swaps = orientation >= 5 && orientation <= 8;
  const expected = swaps ? { width: bh, height: bw } : { width: bw, height: bh };

  if (dryRun) {
    return {
      filePath,
      mode: 'exif',
      orientation,
      before: { width: bw, height: bh },
      after: expected,
    };
  }

  if (orientation === 1) {
    return {
      filePath,
      mode: 'exif',
      orientation,
      before: { width: bw, height: bh },
      after: { width: bw, height: bh },
      skipped: true,
    };
  }

  const tmpPath = `${filePath}.rotate-tmp`;
  await writeRotated(sharp(filePath).rotate(), filePath, tmpPath);
  fs.renameSync(tmpPath, filePath);

  const after = await sharp(filePath).metadata();
  return {
    filePath,
    mode: 'exif',
    orientation,
    before: { width: bw, height: bh },
    after: { width: after.width ?? 0, height: after.height ?? 0 },
  };
}
