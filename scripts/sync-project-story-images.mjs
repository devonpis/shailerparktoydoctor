#!/usr/bin/env node
/**
 * Update story index.html image refs from files on disk only (no rename / optimize / normalize).
 *
 * Usage:
 *   node scripts/sync-project-story-images.mjs <project-id> [id …]
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveProjectDir, projectIdFromDir, REPO_ROOT } from './lib/resolve-project-dir.mjs';
import { syncProjectWorkInProgressHtml } from './lib/project-work-in-progress-html.mjs';
import { updateProjectStoryMeta } from './lib/project-story-meta.mjs';
import { listProjectImages } from './lib/project-media.mjs';
import { readImportance, hasImportance } from './lib/home-highlights.mjs';
import {
  buildHighlightsFromDisk,
  patchHomeIndex,
  formatHighlightsList,
} from './lib/home-highlights.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const ids = [];
  let dryRun = false;
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') dryRun = true;
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else ids.push(a);
  }
  if (!ids.length) {
    throw new Error('Usage: node scripts/sync-project-story-images.mjs <project-id> [id …] [--dry-run]');
  }
  return { ids, dryRun };
}

function syncOne(projectId, dryRun) {
  const dir = resolveProjectDir(projectId);
  const id = projectIdFromDir(dir);
  const folder = path.basename(dir);
  const configPath = path.join(dir, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const images = listProjectImages(dir);

  console.log(`\n${id} — ${folder}`);
  console.log(`  images on disk: ${images.join(', ') || '(none)'}`);

  const wip = syncProjectWorkInProgressHtml(dir, folder, { dryRun });
  console.log(`  WIP gallery: ${wip.changed ? wip.action : wip.action}`);

  const meta = updateProjectStoryMeta(dir, config, { dryRun });
  if (meta.skipped) console.log(`  meta: skipped (${meta.reason})`);
  else console.log(`  hero/OG: ${meta.changed ? meta.meta.heroImageName : 'already current'}`);

  const onHomePage = hasImportance(readImportance(config));
  return { id, wip, meta, onHomePage };
}

function syncGalleryIndex(projectId, dryRun) {
  if (dryRun) {
    console.log(`  gallery index: [dry-run] would sync ${projectId}`);
    return;
  }
  const r = spawnSync(
    process.execPath,
    [path.join('scripts', 'sync-projects-gallery-index.mjs'), projectId],
    { cwd: REPO_ROOT, stdio: 'inherit' }
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function refreshHomeHighlights(dryRun) {
  const { highlights, html } = buildHighlightsFromDisk();
  console.log('\n--- Home highlights (baked index.html) ---');
  console.log(formatHighlightsList(highlights));
  if (dryRun) {
    console.log('[dry-run] would rebuild index.html #patient-stories-root');
    return;
  }
  if (patchHomeIndex(html)) {
    console.log('  OK: updated home highlight section');
  } else {
    console.log('  OK: home highlights already current');
  }
}

function main() {
  const { ids, dryRun } = parseArgs(process.argv);
  if (dryRun) console.log('[dry-run] no files written');
  let refreshHome = false;
  for (const id of ids) {
    const r = syncOne(id, dryRun);
    if (r.onHomePage) {
      refreshHome = true;
      syncGalleryIndex(id, dryRun);
    }
  }
  if (refreshHome) refreshHomeHighlights(dryRun);
}

main();
