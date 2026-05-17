#!/usr/bin/env node
/**
 * Rotate a project repair image in place (quick one-off).
 * For publish workflow, prefer publish-webpage.mjs / optimize-project-images.mjs --rotate
 * so rotation and resize share one JPEG encode.
 *
 * Usage:
 *   node scripts/rotate-project-image.mjs <project-id> <filename> --cw | --ccw | --180
 *   node scripts/rotate-project-image.mjs <project-id> <filename> --degrees 90
 *   node scripts/rotate-project-image.mjs <project-id> --exif [--all]
 *
 * Options:
 *   --dry-run     Report dimensions only
 *   --exif        Auto-orient from EXIF (one file, or all with --all)
 *   --all         With --exif: every before/after/hero/WIP image in the folder
 */

import fs from 'node:fs';
import path from 'node:path';
import { listProjectImages } from './lib/project-media.mjs';
import { resolveProjectDir } from './lib/resolve-project-dir.mjs';
import { autoOrientInPlace, parseRotatePreset, rotateImageInPlace } from './lib/rotate-image.mjs';

function parseArgs(argv) {
  const flags = { dryRun: false, exif: false, all: false, degrees: null };
  const positional = [];
  let rotateFlag = null;

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--exif') flags.exif = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--degrees') flags.degrees = Number(argv[++i]);
    else if (a === '--cw' || a === '--ccw' || a === '--180') rotateFlag = a;
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else positional.push(a);
  }

  if (!positional[0]) {
    throw new Error(
      'Usage: node scripts/rotate-project-image.mjs <project-id> <filename> --cw|--ccw|--180\n' +
        '       node scripts/rotate-project-image.mjs <project-id> --exif [--all] [--dry-run]'
    );
  }

  return { projectArg: positional[0], fileArg: positional[1], rotateFlag, flags };
}

function resolveFile(dir, name) {
  const direct = path.join(dir, name);
  if (fs.existsSync(direct)) return direct;
  const hit = listProjectImages(dir).find((n) => n.toLowerCase() === name.toLowerCase());
  if (hit) return path.join(dir, hit);
  throw new Error(`Image not found: ${name} (${listProjectImages(dir).join(', ') || 'none'})`);
}

function logResult(r) {
  const base = path.basename(r.filePath);
  if (r.skipped) {
    console.log(`${base}: EXIF orientation already upright (${r.before.width}×${r.before.height})`);
    return;
  }
  const tag = r.mode === 'exif' ? `EXIF orient (was ${r.orientation})` : `rotate ${r.degrees}°`;
  console.log(
    `${base}: ${tag} — ${r.before.width}×${r.before.height} → ${r.after.width}×${r.after.height}`
  );
}

async function main() {
  const { projectArg, fileArg, rotateFlag, flags } = parseArgs(process.argv);
  const dir = resolveProjectDir(projectArg);

  if (flags.exif) {
    const files = flags.all
      ? listProjectImages(dir).map((n) => path.join(dir, n))
      : [resolveFile(dir, fileArg || 'hero.jpeg')];
    if (!files.length) throw new Error('No images to orient');
    for (const f of files) {
      logResult(await autoOrientInPlace(f, { dryRun: flags.dryRun }));
    }
    return;
  }

  if (!fileArg) throw new Error('filename required unless using --exif --all');
  const preset = rotateFlag ? parseRotatePreset(rotateFlag) : null;
  const degrees = flags.degrees ?? preset;
  if (degrees == null || Number.isNaN(degrees)) {
    throw new Error('Specify --cw, --ccw, --180, or --degrees');
  }

  const filePath = resolveFile(dir, fileArg);
  logResult(await rotateImageInPlace(filePath, degrees, { dryRun: flags.dryRun }));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
