#!/usr/bin/env node
/**
 * T-00027: Optimize project repair images.
 *
 * Rules:
 * - PNG > 500 KB → .jpg at 90%; scale to fit 1024×1024 when width or height > 1024; delete PNG
 * - Other types (JPEG, WebP, GIF) > 500 KB and (width > 1024 or height > 1024)
 *   → JPEG at 90%, scaled to fit inside a 1024×1024 box (aspect preserved); delete
 *     source when the output filename changes
 * - Updates index.html and projects-index.json when filenames change
 *
 * Usage:
 *   npm install
 *   node scripts/optimize-project-images.mjs --all [--dry-run]
 *   node scripts/optimize-project-images.mjs 0003 [--dry-run]
 *
 * Options:
 *   --dry-run          Report only, no writes
 *   --quality N        JPEG quality 1–100 (default: 90)
 *   --min-kb N         Size threshold in KB (default: 500)
 *   --max-px N         Max width/height for oversized resize (default: 1024)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { listProjectImages } from './lib/project-media.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

const INDEX_JSON_PATHS = [
  path.join(REPO_ROOT, 'new/data/projects-index.json'),
  path.join(REPO_ROOT, 'data/projects-index.json'),
];

function parseArgs(argv) {
  const flags = {
    dryRun: false,
    quality: 90,
    minBytes: 500 * 1024,
    maxPx: 1024,
    all: false,
    targets: [],
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--quality') flags.quality = Number(argv[++i]);
    else if (a === '--min-kb') flags.minBytes = Number(argv[++i]) * 1024;
    else if (a === '--max-px') flags.maxPx = Number(argv[++i]);
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else flags.targets.push(a);
  }
  if (!flags.all && !flags.targets.length) {
    throw new Error(
      'Usage: node scripts/optimize-project-images.mjs --all | <project-id> […] [--dry-run]'
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

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function jpegOutputPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return filePath.replace(/\.png$/i, '.jpg');
  if (ext === '.webp' || ext === '.gif') return filePath.replace(/\.(webp|gif)$/i, '.jpg');
  return filePath;
}

function isOversized(width, height, maxPx) {
  return width > maxPx || height > maxPx;
}

async function imageDimensions(filePath) {
  const meta = await sharp(filePath).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

async function optimizeImage(filePath, flags) {
  const stat = fs.statSync(filePath);
  if (stat.size <= flags.minBytes) return null;

  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath);

  if (ext === '.png') {
    const { width, height } = await imageDimensions(filePath);
    const outPath = jpegOutputPath(filePath);
    return {
      action: 'png-to-jpg',
      from: filePath,
      to: outPath,
      oldName: base,
      newName: path.basename(outPath),
      beforeBytes: stat.size,
      width,
      height,
      resize: isOversized(width, height, flags.maxPx),
    };
  }

  const other = ['.jpg', '.jpeg', '.webp', '.gif'];
  if (!other.includes(ext)) return null;

  const { width, height } = await imageDimensions(filePath);
  if (!isOversized(width, height, flags.maxPx)) return null;

  const outPath = jpegOutputPath(filePath);
  return {
    action: 'resize-to-jpeg',
    from: filePath,
    to: outPath,
    oldName: base,
    newName: path.basename(outPath),
    beforeBytes: stat.size,
    width,
    height,
    resize: true,
  };
}

async function writeOptimized(plan, flags) {
  let pipeline = sharp(plan.from);
  const jpegOpts = { quality: flags.quality, mozjpeg: true };

  if (plan.resize) {
    pipeline = pipeline.resize(flags.maxPx, flags.maxPx, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const tmpPath = `${plan.to}.optimize-tmp`;
  await pipeline.jpeg(jpegOpts).toFile(tmpPath);

  const afterBytes = fs.statSync(tmpPath).size;
  if (flags.dryRun) {
    fs.unlinkSync(tmpPath);
    return afterBytes;
  }

  const replacesInPlace = plan.from === plan.to;
  if (replacesInPlace && afterBytes >= plan.beforeBytes) {
    fs.unlinkSync(tmpPath);
    return plan.beforeBytes;
  }

  fs.renameSync(tmpPath, plan.to);
  if (!replacesInPlace && fs.existsSync(plan.from)) {
    fs.unlinkSync(plan.from);
  }
  return afterBytes;
}

function updatePathReferences(renames) {
  const files = [];
  for (const dir of fs.readdirSync(PROJECTS_DIR)) {
    const html = path.join(PROJECTS_DIR, dir, 'index.html');
    if (fs.existsSync(html)) files.push(html);
  }
  for (const p of INDEX_JSON_PATHS) {
    if (fs.existsSync(p)) files.push(p);
  }

  const updated = [];
  for (const filePath of files) {
    let text = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const { oldName, newName } of renames) {
      if (oldName === newName) continue;
      if (text.includes(oldName)) {
        text = text.split(oldName).join(newName);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, text);
      updated.push(path.relative(REPO_ROOT, filePath));
    }
  }
  return updated;
}

async function processProjectDir(dir, flags) {
  const names = listProjectImages(dir);
  const plans = [];
  for (const name of names) {
    const filePath = path.join(dir, name);
    const plan = await optimizeImage(filePath, flags);
    if (plan) plans.push(plan);
  }
  if (!plans.length) return { plans: [], updatedFiles: [] };

  const renames = [];
  console.log(`\n${path.basename(dir)}:`);
  for (const plan of plans) {
    const afterBytes = await writeOptimized(plan, flags);
    const saved = plan.beforeBytes - afterBytes;
    const tag = flags.dryRun ? '[dry-run]' : 'ok';

    if (plan.action === 'png-to-jpg') {
      const removed = flags.dryRun ? '' : ' (original PNG removed)';
      const dim = plan.width ? `${plan.width}×${plan.height}, ` : '';
      const fit = plan.resize ? ` (fit ${flags.maxPx}px)` : '';
      console.log(
        `  ${tag} ${plan.oldName} → ${plan.newName}: ${dim}${formatKb(plan.beforeBytes)} → ${formatKb(afterBytes)}${fit}${removed}`
      );
      renames.push({ oldName: plan.oldName, newName: plan.newName });
    } else if (plan.oldName !== plan.newName) {
      const removed = flags.dryRun ? '' : ' (original removed)';
      console.log(
        `  ${tag} ${plan.oldName} → ${plan.newName}: ${plan.width}×${plan.height}, ${formatKb(plan.beforeBytes)} → ${formatKb(afterBytes)} (fit ${flags.maxPx}px)${removed}`
      );
      renames.push({ oldName: plan.oldName, newName: plan.newName });
    } else {
      const note =
        afterBytes >= plan.beforeBytes ? 'no gain, kept original' : `−${formatKb(saved)}`;
      console.log(
        `  ${tag} ${plan.oldName}: ${plan.width}×${plan.height}, ${formatKb(plan.beforeBytes)} → ${formatKb(afterBytes)} (fit ${flags.maxPx}px, ${note})`
      );
    }
  }

  let updatedFiles = [];
  if (!flags.dryRun && renames.length) {
    updatedFiles = updatePathReferences(renames);
    for (const f of updatedFiles) console.log(`  updated refs: ${f}`);
  } else if (flags.dryRun && renames.length) {
    console.log(`  would update HTML/JSON for: ${renames.map((r) => r.oldName).join(', ')}`);
  }

  return { plans, updatedFiles };
}

async function main() {
  const flags = parseArgs(process.argv);
  const dirs = listProjectDirs(flags.targets, flags.all);
  console.log(
    `Optimize ${dirs.length} project(s); > ${flags.minBytes / 1024} KB; max ${flags.maxPx}px; JPEG ${flags.quality}%`
  );

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
