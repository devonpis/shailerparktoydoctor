import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { dimensionsAfterRotate } from './rotate-image.mjs';

export function isOversized(width, height, maxPx) {
  return width > maxPx || height > maxPx;
}

export function jpegOutputPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return filePath.replace(/\.png$/i, '.jpg');
  if (ext === '.webp' || ext === '.gif') return filePath.replace(/\.(webp|gif)$/i, '.jpg');
  return filePath;
}

function dimsAfterOrient(width, height, orientation) {
  const swaps = orientation >= 5 && orientation <= 8;
  return swaps ? { width: height, height: width } : { width, height };
}

function outputDims(width, height, orientation, needsExif, manualDegrees) {
  let w = width;
  let h = height;
  if (needsExif) {
    const d = dimsAfterOrient(w, h, orientation);
    w = d.width;
    h = d.height;
  }
  if (manualDegrees != null) {
    const d = dimensionsAfterRotate(w, h, manualDegrees);
    w = d.width;
    h = d.height;
  }
  return { width: w, height: h };
}

/**
 * Plan a single encode pass: EXIF orient → manual rotate → resize/convert (optional).
 * Returns null when no work is needed.
 */
export async function planImageProcessing(filePath, flags, manualDegrees = null) {
  const stat = fs.statSync(filePath);
  const meta = await sharp(filePath).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const orientation = meta.orientation ?? 1;
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath);

  const needsExif = flags.exifOrient && orientation !== 1;
  const needsManual = manualDegrees != null;
  const needsOrient = needsExif || needsManual;

  const overMin = stat.size > flags.minBytes;
  const pngConvert = ext === '.png' && overMin;
  const rasterResize =
    overMin && isOversized(width, height, flags.maxPx) && ['.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
  const needsOptimize = pngConvert || rasterResize;

  if (!needsOrient && !needsOptimize) return null;

  const after = outputDims(width, height, orientation, needsExif, manualDegrees);
  const resize = needsOptimize && (pngConvert || isOversized(after.width, after.height, flags.maxPx));
  const to = needsOptimize ? jpegOutputPath(filePath) : filePath;
  const outputJpeg = needsOptimize || (needsOrient && ['.jpg', '.jpeg'].includes(ext));

  let action = 'orient';
  if (pngConvert) action = 'png-to-jpg';
  else if (needsOptimize) action = 'resize-to-jpeg';

  return {
    from: filePath,
    to,
    oldName: base,
    newName: path.basename(to),
    beforeBytes: stat.size,
    width,
    height,
    afterWidth: after.width,
    afterHeight: after.height,
    orientation,
    needsExif,
    manualDegrees: needsManual ? manualDegrees : null,
    resize,
    outputJpeg,
    outputPng: needsOrient && !needsOptimize && ext === '.png',
    outputWebp: needsOrient && !needsOptimize && ext === '.webp',
    outputGif: needsOrient && !needsOptimize && ext === '.gif',
    quality: needsOptimize ? flags.quality : flags.orientQuality,
    action,
    steps: [
      needsExif && 'exif',
      needsManual && 'rotate',
      resize && 'resize',
      needsOptimize ? 'jpeg' : 'reencode',
    ].filter(Boolean),
  };
}

/** One sharp pipeline → one write (avoids rotate-then-optimize double JPEG loss). */
export async function executeImagePlan(plan, flags) {
  if (flags.dryRun) {
    return { afterBytes: plan.beforeBytes, dryRun: true };
  }

  let pipeline = sharp(plan.from);
  if (plan.needsExif) pipeline = pipeline.rotate();
  if (plan.manualDegrees != null) pipeline = pipeline.rotate(plan.manualDegrees);
  if (plan.resize) {
    pipeline = pipeline.resize(flags.maxPx, flags.maxPx, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const tmpPath = `${plan.to}.proc-tmp`;
  if (plan.outputJpeg) {
    await pipeline.jpeg({ quality: plan.quality, mozjpeg: true }).toFile(tmpPath);
  } else if (plan.outputPng) {
    await pipeline.png().toFile(tmpPath);
  } else if (plan.outputWebp) {
    await pipeline.webp({ quality: plan.quality }).toFile(tmpPath);
  } else if (plan.outputGif) {
    await pipeline.gif().toFile(tmpPath);
  } else {
    throw new Error(`Unsupported output for ${plan.oldName}`);
  }

  const afterBytes = fs.statSync(tmpPath).size;
  const inPlace = plan.from === plan.to;

  if (inPlace && afterBytes >= plan.beforeBytes && plan.action !== 'orient') {
    fs.unlinkSync(tmpPath);
    return { afterBytes: plan.beforeBytes, skipped: true };
  }

  fs.renameSync(tmpPath, plan.to);
  if (!inPlace && fs.existsSync(plan.from)) fs.unlinkSync(plan.from);
  return { afterBytes, skipped: false };
}

export function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function logPlanResult(plan, result, flags) {
  const tag = flags.dryRun ? '[dry-run]' : result.skipped ? 'skip' : 'ok';
  const dim = `${plan.width}×${plan.height}`;
  const afterDim =
    plan.afterWidth !== plan.width || plan.afterHeight !== plan.height
      ? ` → ${plan.afterWidth}×${plan.afterHeight}`
      : '';
  const steps = plan.steps.join('+');
  const afterKb = formatKb(result.afterBytes);
  const beforeKb = formatKb(plan.beforeBytes);

  if (plan.oldName !== plan.newName) {
    console.log(
      `  ${tag} ${plan.oldName} → ${plan.newName}: ${dim}${afterDim}, ${beforeKb} → ${afterKb} (${steps})`
    );
    return;
  }

  const note =
    result.skipped && !flags.dryRun
      ? 'no gain, kept original'
      : flags.dryRun
        ? steps
        : `−${formatKb(plan.beforeBytes - result.afterBytes)}`;
  console.log(`  ${tag} ${plan.oldName}: ${dim}${afterDim}, ${beforeKb} → ${afterKb} (${note})`);
}
