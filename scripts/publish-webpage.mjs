#!/usr/bin/env node
/**
 * Webpage publish prep: DONE gate → images → orientation check → validate → SEO meta → checklist.
 * Requires status "DONE". Does not create index.html from scratch; syncs meta when index.html exists.
 *
 * Usage:
 *   node scripts/publish-webpage.mjs <project-id> [--dry-run]
 *   node scripts/publish-webpage.mjs 0003 --rotate WIP-001.jpg --cw
 *   node scripts/publish-webpage.mjs 0003 --no-optimize
 *
 * Options:
 *   --rotate <file> --cw|--ccw|--180   Passed to optimizer (same encode pass as resize)
 *   --no-exif-orient                   Skip EXIF bake (default: on)
 *   --exif-orient                      Same as default (compatibility)
 *   --no-optimize                      Skip image processing step
 *   --no-meta                          Skip SEO meta sync on index.html
 *   --dry-run                          Dry-run process + validate; still validates
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveProjectDir, REPO_ROOT, projectIdFromDir } from './lib/resolve-project-dir.mjs';
import { scanProjectOrientation } from './lib/project-image-orientation.mjs';
import { updateProjectStoryMeta } from './lib/project-story-meta.mjs';
import { validateWebpagePublishGate } from './lib/project-readiness.mjs';
import { INDEX_JSON_PATHS } from './lib/update-project-path-refs.mjs';
import { validateProject } from './validate-publish.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const flags = {
    dryRun: false,
    exifOrient: true,
    optimize: true,
    updateMeta: true,
    rotations: [],
  };
  const positional = [];

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--exif-orient') flags.exifOrient = true;
    else if (a === '--no-exif-orient') flags.exifOrient = false;
    else if (a === '--no-optimize') flags.optimize = false;
    else if (a === '--no-meta') flags.updateMeta = false;
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
      'Usage: node scripts/publish-webpage.mjs <project-id> [--rotate file --cw] [--no-exif-orient] [--dry-run] [--no-optimize]'
    );
  }
  return { projectArg: positional[0], flags };
}

function runProcessImages(projectId, flags) {
  console.log('\n--- Process images (orient + optimize, one encode per file) ---');
  const args = ['scripts/optimize-project-images.mjs', projectId];
  if (flags.dryRun) args.push('--dry-run');
  if (flags.exifOrient) args.push('--exif-orient');
  for (const { file, dirFlag } of flags.rotations) {
    args.push('--rotate', file, dirFlag);
  }
  const r = spawnSync(process.execPath, args, { cwd: REPO_ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function runMetaUpdate(dir, config, flags) {
  console.log('\n--- SEO meta (index.html) ---');
  if (!flags.updateMeta) {
    console.log('  skipped (--no-meta)');
    return config;
  }
  const r = updateProjectStoryMeta(dir, config, { dryRun: flags.dryRun });
  if (r.skipped) {
    console.log(`  skipped (${r.reason}) — create index.html from template, then re-run`);
    return config;
  }
  if (flags.dryRun) {
    console.log(`  [dry-run] would update: ${r.meta.pageTitle}`);
    console.log(`  description: ${r.meta.metaDescription}`);
    if (r.meta.ogImageUrl) console.log(`  og:image: ${r.meta.ogImageName}`);
    return config;
  }
  if (r.changed) console.log('  OK: title, description, canonical, Open Graph, hero image');
  else console.log('  OK: meta already current');
  if (r.webpageUrlSet) {
    console.log(`  set config.json webpageUrl → ${r.meta.canonical}`);
    return JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
  }
  return config;
}

async function runOrientationCheck(dir) {
  console.log('\n--- Orientation check ---');
  const warnings = await scanProjectOrientation(dir);
  const exif = warnings.filter((w) => w.type === 'exif');
  const heuristic = warnings.filter((w) => w.type === 'heuristic');

  if (!warnings.length) {
    console.log('  OK: no EXIF issues; no review hints on primary images.');
    return;
  }

  for (const w of exif) console.warn(`  WARN: ${w.message}`);
  for (const w of heuristic) console.log(`  hint: ${w.message}`);

  if (heuristic.length) {
    console.log(
      '  Landscape hints are not auto-rotated — confirm visually or use --rotate <file> --cw|--ccw|--180'
    );
  }
  if (exif.length) {
    console.log('  Re-run publish with EXIF orient enabled, or: optimize-project-images.mjs --exif-orient');
  }
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
  let config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));

  console.log(`Webpage publish prep: ${path.basename(dir)}${flags.dryRun ? ' (dry-run)' : ''}`);

  const gateErrors = validateWebpagePublishGate(config, dir);
  if (gateErrors.length) {
    console.error('\n--- Webpage publish blocked ---');
    for (const e of gateErrors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }

  if (flags.optimize) {
    runProcessImages(projectId, flags);
  } else {
    console.log('\n--- Process images --- skipped (--no-optimize)');
    if (flags.rotations.length || flags.exifOrient) {
      console.warn(
        'WARN: --rotate / EXIF orient skipped with --no-optimize. Use optimize-project-images.mjs or rotate-project-image.mjs.'
      );
    }
  }

  await runOrientationCheck(dir);

  console.log('\n--- Validate publish content ---');
  const result = validateProject(projectArg);
  for (const w of result.warnings || []) console.warn(`WARN: ${w}`);
  if (!result.ok) {
    for (const e of result.errors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }
  console.log('OK: publish content checks passed.');

  config = runMetaUpdate(dir, config, flags);

  printChecklist(dir, config, projectId);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
