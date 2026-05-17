#!/usr/bin/env node
/**
 * Crop uniform margins from images (e.g. letterbox bars).
 *
 * Usage:
 *   node scripts/crop-image-margins.mjs <file-or-dir> [--top 0.08] [--bottom 0.08] [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_RE = /\.(jpe?g|png|webp|gif)$/i;

function parseArgs(argv) {
  const flags = { top: 0.08, bottom: 0.08, dryRun: false, paths: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--top') flags.top = Number(argv[++i]);
    else if (a === '--bottom') flags.bottom = Number(argv[++i]);
    else if (!a.startsWith('--')) flags.paths.push(a);
  }
  return flags;
}

function collectImages(target) {
  const abs = path.isAbsolute(target) ? target : path.resolve(process.cwd(), target);
  if (!fs.existsSync(abs)) throw new Error(`Not found: ${abs}`);
  if (fs.statSync(abs).isFile()) return IMG_RE.test(abs) ? [abs] : [];
  return fs
    .readdirSync(abs)
    .filter((n) => IMG_RE.test(n))
    .map((n) => path.join(abs, n))
    .sort();
}

async function cropFile(filePath, flags) {
  const meta = await sharp(filePath).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) throw new Error(`No dimensions: ${filePath}`);

  const topPx = Math.round(h * flags.top);
  const bottomPx = Math.round(h * flags.bottom);
  const cropH = h - topPx - bottomPx;
  if (cropH < 1) throw new Error(`Crop too aggressive for ${path.basename(filePath)}`);

  const label = `${path.basename(filePath)}: ${w}×${h} → crop top ${topPx}px bottom ${bottomPx}px (${flags.top * 100}% / ${flags.bottom * 100}%)`;
  if (flags.dryRun) {
    console.log(`[dry-run] ${label}`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const tmp = `${filePath}.crop-tmp`;
  let pipeline = sharp(filePath).extract({ left: 0, top: topPx, width: w, height: cropH });
  if (ext === '.png') await pipeline.png().toFile(tmp);
  else await pipeline.jpeg({ quality: 90, mozjpeg: true }).toFile(tmp);

  fs.renameSync(tmp, filePath);
  const after = await sharp(filePath).metadata();
  console.log(`${label} → ${after.width}×${after.height}`);
}

async function main() {
  const flags = parseArgs(process.argv);
  if (!flags.paths.length) {
    console.error(
      'Usage: node scripts/crop-image-margins.mjs <file|dir> [--top 0.08] [--bottom 0.08] [--dry-run]'
    );
    process.exit(1);
  }

  const files = flags.paths.flatMap(collectImages);
  if (!files.length) {
    console.error('No images found.');
    process.exit(1);
  }

  for (const f of files) {
    await cropFile(f, flags);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
