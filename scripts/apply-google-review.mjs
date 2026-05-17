#!/usr/bin/env node
/**
 * Apply a Google review to a project (config + story review block + testimonials page).
 *
 * Usage:
 *   node scripts/apply-google-review.mjs <project-id> --author "Full Name" --quote "Review text…"
 *     [--profile-url URL] [--no-featured] [--no-scaffold] [--no-testimonials]
 *     (--author accepts a pasted full name; only first + last initial is saved, e.g. Howard C.)
 *
 *   node scripts/apply-google-review.mjs <project-id> --from-config
 *     (sync story review block + testimonials from existing googleReview)
 *
 *   node scripts/apply-google-review.mjs --sync-all
 *     (all projects with googleReview + standalone; scaffold published pages)
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveProjectDir, PROJECTS_DIR, projectIdFromDir } from './lib/resolve-project-dir.mjs';
import { googleReviewForConfig, normalizeGoogleReview } from './lib/google-review.mjs';
import { isReviewCapturedOnTestimonialsPage } from './lib/testimonials-html.mjs';
import { syncProjectGoogleReviewHtml } from './lib/project-google-review-html.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const flags = {
    author: null,
    quote: null,
    profileUrl: null,
    noFeatured: false,
    noScaffold: false,
    noTestimonials: false,
    fromConfig: false,
    syncAll: false,
    force: false,
  };
  const ids = [];
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--author' && argv[i + 1]) flags.author = argv[++i];
    else if (a === '--quote' && argv[i + 1]) flags.quote = argv[++i];
    else if (a === '--profile-url' && argv[i + 1]) flags.profileUrl = argv[++i];
    else if (a === '--no-featured') flags.noFeatured = true;
    else if (a === '--no-scaffold') flags.noScaffold = true;
    else if (a === '--no-testimonials') flags.noTestimonials = true;
    else if (a === '--from-config') flags.fromConfig = true;
    else if (a === '--sync-all') flags.syncAll = true;
    else if (a === '--force') flags.force = true;
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else ids.push(a);
  }
  return { flags, ids };
}

function runNode(script, args) {
  const r = spawnSync(process.execPath, [path.join('scripts', script), ...args], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function writeConfigReview(projectDir, review) {
  const configPath = path.join(projectDir, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.googleReview = googleReviewForConfig(review);
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  const display = review.authorName ? ` (${review.authorName})` : '';
  console.log(`  config.json — googleReview saved${display}`);
}

function syncStoryReviewIfPublished(dir, config) {
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log(`  skip story review — no index.html`);
    return;
  }
  const r = syncProjectGoogleReviewHtml(dir, config, { dryRun: false });
  if (r.skipped) console.log(`  ${r.action}`);
  else if (r.changed) console.log(`  index.html — ${r.action}`);
  else console.log(`  index.html — ${r.action}`);
}

function applyOne(projectId, flags, reviewOverride = null) {
  const dir = resolveProjectDir(projectId);
  const configPath = path.join(dir, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  let review = reviewOverride;
  if (!review) {
    if (flags.fromConfig) {
      review = normalizeGoogleReview(config.googleReview);
      if (!review) throw new Error(`${projectId}: no googleReview in config`);
    } else {
      if (!flags.quote) throw new Error('--quote is required');
      review = normalizeGoogleReview({
        quote: flags.quote,
        authorName: flags.author,
        profileUrl: flags.profileUrl,
        featuredOnTestimonials: !flags.noFeatured,
      });
    }
  }

  if (!flags.syncAll && !flags.force && isReviewCapturedOnTestimonialsPage(review)) {
    console.log(
      `\n${path.basename(dir)}\n  skip — review already on testimonials page`
    );
    return { skipped: true };
  }

  console.log(`\n${path.basename(dir)}`);
  writeConfigReview(dir, review);
  const updatedConfig = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
  if (!flags.noScaffold) syncStoryReviewIfPublished(dir, updatedConfig);
  return { skipped: false };
}

function listProjectsWithReviews() {
  const ids = [];
  for (const name of fs.readdirSync(PROJECTS_DIR)) {
    if (!/^\d{4} - /.test(name) || name.startsWith('0000')) continue;
    const configPath = path.join(PROJECTS_DIR, name, 'config.json');
    if (!fs.existsSync(configPath)) continue;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (normalizeGoogleReview(config.googleReview)) ids.push(projectIdFromDir(path.join(PROJECTS_DIR, name)));
  }
  return ids.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

function main() {
  const { flags, ids } = parseArgs(process.argv);

  if (flags.syncAll) {
    const all = listProjectsWithReviews();
    console.log(`Sync-all: ${all.length} project(s) with googleReview`);
    for (const id of all) {
      applyOne(id, { ...flags, fromConfig: true, noTestimonials: true, force: true });
    }
    if (!flags.noTestimonials) runNode('sync-testimonials-html.mjs', []);
    return;
  }

  if (!ids.length) {
    throw new Error(
      'Usage: node scripts/apply-google-review.mjs <id> --author "…" --quote "…" [--profile-url …] [options] | <id> --from-config | --sync-all'
    );
  }

  let applied = 0;
  let skipped = 0;
  for (const id of ids) {
    const result = applyOne(id, flags);
    if (result?.skipped) skipped += 1;
    else applied += 1;
  }

  if (!flags.noTestimonials) runNode('sync-testimonials-html.mjs', []);
  if (skipped > 0) {
    console.log(`\nDone — applied ${applied}, skipped ${skipped} (already on testimonials page). Use --force to re-apply.`);
  }
}

main();
