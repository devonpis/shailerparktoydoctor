#!/usr/bin/env node
/**
 * Bake “Toy Doctor” bold in project-lead + prose on story pages; strip brand-text.js.
 *
 * Usage:
 *   node scripts/sync-project-story-brand.mjs <id> [id …]
 *   node scripts/sync-project-story-brand.mjs --published
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectDir, PROJECTS_DIR, projectIdFromDir } from './lib/resolve-project-dir.mjs';
import { syncProjectGoogleReviewHtml } from './lib/project-google-review-html.mjs';
import { syncProjectStoryBrandHtml } from './lib/project-story-brand-html.mjs';
import { syncProjectStoryProseHtml } from './lib/project-story-prose-html.mjs';

function listPublishedIds() {
  const ids = [];
  for (const name of fs.readdirSync(PROJECTS_DIR)) {
    if (!/^\d{4} - /.test(name) || name.startsWith('0000')) continue;
    const dir = path.join(PROJECTS_DIR, name);
    if (!fs.existsSync(path.join(dir, 'index.html'))) continue;
    ids.push(projectIdFromDir(dir));
  }
  return ids.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

function parseArgs(argv) {
  const published = argv.includes('--published');
  const ids = published ? listPublishedIds() : argv.filter((a) => !a.startsWith('--'));
  if (!ids.length) {
    throw new Error(
      'Usage: node scripts/sync-project-story-brand.mjs <id> [id …] | --published'
    );
  }
  return ids;
}

function syncOne(id) {
  const dir = resolveProjectDir(id);
  const config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
  const lead = syncProjectStoryBrandHtml(dir, config, { dryRun: false });
  const prose = syncProjectStoryProseHtml(dir, config, { dryRun: false });
  const review = syncProjectGoogleReviewHtml(dir, config, { dryRun: false });
  const changed = lead.changed || prose.changed || review.changed;
  console.log(
    `  ${projectIdFromDir(dir)}: lead=${lead.action}, prose=${prose.action}, review=${review.action}${changed ? '' : ' (unchanged)'}`
  );
  return changed;
}

const ids = parseArgs(process.argv.slice(2));
let any = false;
for (const id of ids) {
  if (syncOne(id)) any = true;
}
console.log(any ? '\nOK — story brand bold synced' : '\nOK — already current');
