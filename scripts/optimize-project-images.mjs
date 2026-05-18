#!/usr/bin/env node
/**
 * T-00027: Optimize project repair images (single encode per file).
 *
 * Orientation (EXIF + manual rotate) runs in the same sharp pipeline as resize/convert
 * so images are not JPEG-recompressed twice.
 *
 * Rules:
 * - EXIF orientation is baked by default; other EXIF (capture date, camera, etc.) is kept via withMetadata
 * - PNG > 500 KB → .jpg at 90%; scale to fit 1024×1024 when width or height > 1024
 * - JPEG/WebP/GIF > 500 KB and oversized → JPEG at 90%, scaled inside 1024×1024
 * - Updates index.html and projects-index.json when filenames change
 *
 * Usage:
 *   npm install
 *   node scripts/optimize-project-images.mjs --all [--dry-run]
 *   node scripts/optimize-project-images.mjs 0003 [--dry-run]
 *   node scripts/optimize-project-images.mjs 0003 --rotate after.jpg --cw
 *
 * Options:
 *   --dry-run          Report only, no writes
 *   --no-exif-orient   Skip EXIF bake (not recommended — resize will ignore phone/camera rotation)
 *   --exif-orient      Same as default (compatibility)
 *   --rotate <file> --cw|--ccw|--180   Manual rotation (repeatable; before resize in same pass)
 *   --quality N        JPEG quality for resize/convert (default: 90)
 *   --orient-quality N JPEG quality for orient-only writes (default: 92)
 *   --min-kb N         Size threshold in KB (default: 500)
 *   --max-px N         Max width/height for oversized resize (default: 1024)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listProjectImages } from './lib/project-media.mjs';
import { updateProjectPathReferences } from './lib/update-project-path-refs.mjs';
import { parseRotatePreset } from './lib/rotate-image.mjs';
import {
  executeImagePlan,
  logPlanResult,
  planImageProcessing,
} from './lib/process-project-image.mjs';
import { ensureAcceptableProjectImages } from './lib/project-image-extensions.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

function parseArgs(argv) {
  const flags = {
    dryRun: false,
    exifOrient: true,
    quality: 90,
    orientQuality: 92,
    minBytes: 500 * 1024,
    maxPx: 1024,
    all: false,
    targets: [],
    rotations: [],
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--exif-orient') flags.exifOrient = true;
    else if (a === '--no-exif-orient') flags.exifOrient = false;
    else if (a === '--quality') flags.quality = Number(argv[++i]);
    else if (a === '--orient-quality') flags.orientQuality = Number(argv[++i]);
    else if (a === '--min-kb') flags.minBytes = Number(argv[++i]) * 1024;
    else if (a === '--max-px') flags.maxPx = Number(argv[++i]);
    else if (a === '--rotate') {
      const file = argv[++i];
      const dirFlag = argv[++i];
      if (!file || !dirFlag?.startsWith('--')) {
        throw new Error('Use: --rotate <filename> --cw|--ccw|--180');
      }
      flags.rotations.push({ file, dirFlag });
    } else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else flags.targets.push(a);
  }
  if (!flags.all && !flags.targets.length) {
    throw new Error(
      'Usage: node scripts/optimize-project-images.mjs --all | <project-id> […] [--no-exif-orient] [--rotate file --cw] [--dry-run]'
    );
  }
  return flags;
}

function listProjectDirs(targets, all) {
  if (all) {
    return fs
      .readdirSync(PROJECTS_DIR)
      .filter((n) => /^\d{4} - /.test(n) && n !== '0000 - template')
      .map((n) => path.join(PROJECTS_DIR, n));
  }
  const dirs = [];
  for (const t of targets) {
    const direct = path.isAbsolute(t) ? t : path.join(REPO_ROOT, t);
    if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) {
      dirs.push(direct);
      continue;
    }
    const id = t.replace(/\D/g, '').padStart(4, '0').slice(-4);
    const match = fs.readdirSync(PROJECTS_DIR).find((n) => n.startsWith(`${id} -`));
    if (match) dirs.push(path.join(PROJECTS_DIR, match));
    else throw new Error(`No project folder for: ${t}`);
  }
  return dirs;
}

function buildRotationMap(rotations, dir) {
  const map = new Map();
  for (const { file, dirFlag } of rotations) {
    const degrees = parseRotatePreset(dirFlag);
    if (degrees == null) throw new Error(`Bad rotate flag after ${file}: ${dirFlag}`);
    const hit = listProjectImages(dir).find((n) => n.toLowerCase() === file.toLowerCase());
    if (!hit) throw new Error(`Image not found for --rotate: ${file}`);
    map.set(hit.toLowerCase(), degrees);
  }
  return map;
}

async function processProjectDir(dir, flags) {
  const ext = ensureAcceptableProjectImages(dir, { dryRun: flags.dryRun });
  if (ext.errors.length) {
    throw new Error(ext.errors.join('\n'));
  }
  if (ext.renames.length) {
    console.log(`\n${path.basename(dir)} (extensions):`);
    for (const { oldName, newName } of ext.renames) {
      console.log(`  ${oldName} → ${newName}`);
    }
    for (const f of ext.updatedFiles || []) console.log(`  updated refs: ${f}`);
  }

  const rotationMap = buildRotationMap(flags.rotations, dir);
  const names = listProjectImages(dir);
  const plans = [];

  for (const name of names) {
    const filePath = path.join(dir, name);
    const manualDegrees = rotationMap.get(name.toLowerCase()) ?? null;
    const plan = await planImageProcessing(filePath, flags, manualDegrees);
    if (plan) plans.push(plan);
  }

  if (!plans.length) return { plans: [], updatedFiles: [] };

  const renames = [];
  console.log(`\n${path.basename(dir)}:`);
  for (const plan of plans) {
    const result = await executeImagePlan(plan, flags);
    logPlanResult(plan, result, flags);
    if (plan.oldName !== plan.newName) {
      renames.push({ oldName: plan.oldName, newName: plan.newName });
    }
  }

  let updatedFiles = [];
  if (!flags.dryRun && renames.length) {
    updatedFiles = updateProjectPathReferences(renames);
    for (const f of updatedFiles) console.log(`  updated refs: ${f}`);
  } else if (flags.dryRun && renames.length) {
    console.log(`  would update HTML/JSON for: ${renames.map((r) => r.oldName).join(', ')}`);
  }

  return { plans, updatedFiles };
}

async function main() {
  const flags = parseArgs(process.argv);
  const dirs = listProjectDirs(flags.targets, flags.all);
  const parts = [
    `Process ${dirs.length} project(s)`,
    `> ${flags.minBytes / 1024} KB resize/convert`,
    `max ${flags.maxPx}px`,
    `JPEG ${flags.quality}%`,
  ];
  if (flags.exifOrient) parts.push(`EXIF orient on (${flags.orientQuality}% when orient-only)`);
  else parts.push('EXIF orient off (--no-exif-orient)');
  if (flags.rotations.length) parts.push(`${flags.rotations.length} manual rotation(s)`);
  console.log(`${parts.join('; ')} — one encode per file`);

  let total = 0;
  for (const dir of dirs) {
    const { plans } = await processProjectDir(dir, flags);
    total += plans.length;
  }

  console.log(
    flags.dryRun
      ? `\nDry run: ${total} file(s) would be processed.`
      : `\nDone: ${total} file(s) processed.`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
