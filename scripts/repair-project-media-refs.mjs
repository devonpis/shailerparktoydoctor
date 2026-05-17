#!/usr/bin/env node
/**
 * Fix stale /projects/… image paths after renames (e.g. .jpg → .jpeg).
 * Refreshes gallery JSON thumbnails from disk; patches story HTML src paths.
 *
 * Usage:
 *   node scripts/repair-project-media-refs.mjs
 *   node scripts/repair-project-media-refs.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listMediaReferenceFiles } from './lib/list-media-reference-files.mjs';
import { INDEX_JSON_PATHS } from './lib/list-media-reference-files.mjs';
import { listProjectImages, pickPrimaryImage } from './lib/project-media.mjs';
import { REPO_ROOT, PROJECTS_DIR } from './lib/resolve-project-dir.mjs';

function parseArgs(argv) {
  return { dryRun: argv.includes('--dry-run') };
}

/** In text, replace hero.jpg etc. with .jpeg when the jpeg file exists on disk. */
function repairProjectUrlsInText(text, projectsDir) {
  let out = text;
  let changed = false;

  const re = /\/projects\/([^"'?#]+)\/(before|after|hero|WIP-\d{3})\.jpg/gi;
  out = out.replace(re, (match, encodedFolder, stem) => {
    const folder = decodeURIComponent(encodedFolder);
    const dir = path.join(projectsDir, folder);
    const jpegName = `${stem}.jpeg`;
    if (fs.existsSync(path.join(dir, jpegName))) {
      changed = true;
      return `/projects/${encodedFolder}/${jpegName}`;
    }
    return match;
  });

  return { text: out, changed };
}

function refreshGalleryIndex(dryRun) {
  const rowsByPath = new Map();
  for (const indexPath of INDEX_JSON_PATHS) {
    if (!fs.existsSync(indexPath)) continue;
    rowsByPath.set(indexPath, JSON.parse(fs.readFileSync(indexPath, 'utf8')));
  }

  let thumbUpdates = 0;
  for (const rows of rowsByPath.values()) {
    for (const row of rows) {
      const dir = path.join(PROJECTS_DIR, row.folder);
      if (!fs.existsSync(dir)) continue;
      let thumbName;
      try {
        thumbName = path.basename(pickPrimaryImage(dir));
      } catch {
        continue;
      }
      const encoded = encodeURIComponent(row.folder);
      const next = `/projects/${encoded}/${encodeURIComponent(thumbName)}`;
      if (row.thumbnail !== next) {
        row.thumbnail = next;
        thumbUpdates += 1;
      }
    }
  }

  if (!dryRun && thumbUpdates) {
    for (const [indexPath, rows] of rowsByPath) {
      fs.writeFileSync(indexPath, `${JSON.stringify(rows, null, 2)}\n`);
    }
  }
  return thumbUpdates;
}

function main() {
  const { dryRun } = parseArgs(process.argv);
  let filePatches = 0;
  let urlPatches = 0;

  for (const filePath of listMediaReferenceFiles()) {
    const before = fs.readFileSync(filePath, 'utf8');
    const { text, changed } = repairProjectUrlsInText(before, PROJECTS_DIR);
    if (changed) {
      urlPatches += 1;
      if (!dryRun) fs.writeFileSync(filePath, text);
      console.log(`${dryRun ? '[dry-run] ' : ''}patched: ${path.relative(REPO_ROOT, filePath)}`);
    }
  }

  const thumbUpdates = refreshGalleryIndex(dryRun);
  if (thumbUpdates) {
    console.log(
      `${dryRun ? '[dry-run] ' : ''}gallery thumbnails refreshed: ${thumbUpdates} row(s) in projects-index.json`
    );
    filePatches += 1;
  }

  if (!urlPatches && !thumbUpdates) {
    console.log('OK: no stale /projects/… .jpg paths found; gallery thumbnails match disk.');
  } else {
    console.log(
      dryRun
        ? `\nDry run: ${urlPatches} file(s) would patch URLs; ${thumbUpdates} thumbnail(s) would refresh.`
        : `\nDone: patched ${urlPatches} file(s); refreshed ${thumbUpdates} gallery thumbnail(s).`
    );
    console.log('Home (/new/) and projects gallery load images from projects-index.json.');
  }
}

main();
