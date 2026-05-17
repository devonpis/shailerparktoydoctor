#!/usr/bin/env node
/**
 * Webpage publish prep: rotate → optimize → validate → go-live checklist.
 * Does not create index.html (agent/owner authors HTML per website-go-live.md).
 *
 * Usage:
 *   node scripts/publish-webpage.mjs <project-id> [--dry-run]
 *   node scripts/publish-webpage.mjs 0003 --rotate WIP-001.jpg --cw
 *   node scripts/publish-webpage.mjs 0003 --exif-orient
 *   node scripts/publish-webpage.mjs 0003 --rotate after.jpg --ccw --no-optimize
 *
 * Options:
 *   --rotate <file> --cw|--ccw|--180   Repeat for multiple images (before optimize)
 *   --exif-orient                      EXIF auto-orient all project images
 *   --no-optimize                      Skip optimize-project-images step
 *   --dry-run                          Rotate/optimize dry-run only; still validates
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { listProjectImages } from './lib/project-media.mjs';
import { resolveProjectDir, REPO_ROOT, projectIdFromDir } from './lib/resolve-project-dir.mjs';
import { autoOrientInPlace, parseRotatePreset, rotateImageInPlace } from './lib/rotate-image.mjs';
import { INDEX_JSON_PATHS } from './lib/update-project-path-refs.mjs';
import { validateProject } from './validate-publish.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(REPO_ROOT, 'scripts');

function parseArgs(argv) {
  const flags = {
    dryRun: false,
    exifOrient: false,
    optimize: true,
    rotations: [],
  };
  const positional = [];

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--exif-orient') flags.exifOrient = true;
    else if (a === '--no-optimize') flags.optimize = false;
    else if (a === '--rotate') {
      const file = argv[++i];
      const dirFlag = argv[++i];
      if (!file || !dirFlag?.startsWith('--')) {
        throw new Error('Use: --rotate <filename> --cw|--ccw|--180');
      }
      flags.rotations.push({ file, dirFlag });
    } else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else positional.push(a);
  }

  if (!positional[0]) {
    throw new Error(
      'Usage: node scripts/publish-webpage.mjs <project-id> [--rotate file --cw] [--exif-orient] [--dry-run] [--no-optimize]'
    );
  }
  return { projectArg: positional[0], flags };
}

function resolveImageFile(dir, name) {
  const direct = path.join(dir, name);
  if (fs.existsSync(direct)) return direct;
  const hit = listProjectImages(dir).find((n) => n.toLowerCase() === name.toLowerCase());
  if (hit) return path.join(dir, hit);
  throw new Error(`Image not found: ${name}`);
}

async function applyRotations(dir, flags) {
  if (!flags.rotations.length && !flags.exifOrient) return;

  console.log('\n--- Rotate images ---');
  for (const { file, dirFlag } of flags.rotations) {
    const degrees = parseRotatePreset(dirFlag);
    if (degrees == null) throw new Error(`Bad rotate flag after ${file}: ${dirFlag}`);
    const filePath = resolveImageFile(dir, file);
    const r = await rotateImageInPlace(filePath, degrees, { dryRun: flags.dryRun });
    console.log(
      `  ${path.basename(r.filePath)}: ${r.before.width}×${r.before.height} → ${r.after.width}×${r.after.height} (${dirFlag})`
    );
  }

  if (flags.exifOrient) {
    for (const name of listProjectImages(dir)) {
      const filePath = path.join(dir, name);
      const r = await autoOrientInPlace(filePath, { dryRun: flags.dryRun });
      if (r.skipped) {
        console.log(`  ${name}: already upright`);
      } else {
        console.log(
          `  ${name}: EXIF ${r.orientation} — ${r.before.width}×${r.before.height} → ${r.after.width}×${r.after.height}`
        );
      }
    }
  }
}

function runOptimize(projectId, dryRun) {
  console.log('\n--- Optimize images ---');
  const args = ['scripts/optimize-project-images.mjs', projectId];
  if (dryRun) args.push('--dry-run');
  const r = spawnSync(process.execPath, args, { cwd: REPO_ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function readJsonIfExists(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function printChecklist(dir, config, projectId) {
  const folder = path.basename(dir);
  const encodedFolder = encodeURIComponent(folder).replace(/%20/g, '%20');
  const storyPath = `/projects/${encodedFolder}/`;
  const canonical = `https://sptoydoctor.com.au${storyPath}`;

  const indexHtml = path.join(dir, 'index.html');
  const hasHtml = fs.existsSync(indexHtml);

  const indexChecks = INDEX_JSON_PATHS.map((p) => {
    const rows = readJsonIfExists(p);
    const hit = Array.isArray(rows) && rows.some((r) => r.id === projectId);
    return { path: path.relative(REPO_ROOT, p), hit };
  });

  const sitemapPath = path.join(REPO_ROOT, 'sitemap.xml');
  const sitemapText = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
  const inSitemap = sitemapText.includes(encodedFolder) || sitemapText.includes(folder);

  const webpageUrl = config.webpageUrl;

  console.log('\n--- Webpage go-live checklist ---');
  console.log(`  Project: ${folder} (${projectId})`);
  console.log(`  [${hasHtml ? 'x' : ' '}] projects/<folder>/index.html`);
  for (const { path: p, hit } of indexChecks) {
    console.log(`  [${hit ? 'x' : ' '}] ${p}`);
  }
  console.log(
    `  [${webpageUrl ? 'x' : ' '}] config.json webpageUrl${webpageUrl ? '' : ` → set: ${canonical}`}`
  );
  console.log(`  [${inSitemap ? 'x' : ' '}] sitemap.xml story URL`);
  console.log('\n  After HTML + index + sitemap: commit, push main (GitHub Pages).');
  console.log(`  Story URL: ${canonical}`);
}

async function main() {
  const { projectArg, flags } = parseArgs(process.argv);
  const dir = resolveProjectDir(projectArg);
  const projectId = projectIdFromDir(dir);
  const config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));

  console.log(`Webpage publish prep: ${path.basename(dir)}${flags.dryRun ? ' (dry-run)' : ''}`);

  await applyRotations(dir, flags);

  if (flags.optimize) {
    runOptimize(projectId, flags.dryRun);
  } else {
    console.log('\n--- Optimize images --- skipped (--no-optimize)');
  }

  console.log('\n--- Validate publish content ---');
  const result = validateProject(projectArg);
  for (const w of result.warnings || []) console.warn(`WARN: ${w}`);
  if (!result.ok) {
    for (const e of result.errors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }
  console.log('OK: publish content checks passed.');

  printChecklist(dir, config, projectId);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
