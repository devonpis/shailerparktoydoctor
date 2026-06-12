#!/usr/bin/env node
/**
 * Insert GA4 gtag into <head> of public HTML (idempotent).
 *
 *   node scripts/inject-google-analytics.mjs [--dry-run]
 *
 * Skips legacy/ and template example. ID: data/site-analytics.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { refreshGoogleAnalyticsInHtml } from './lib/google-analytics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const ROOT_MARKETING = [
  'index.html',
  'contact.html',
  'testimonials.html',
  'projects/index.html',
];

function collectStoryHtmlPaths() {
  const projectsDir = path.join(REPO_ROOT, 'projects');
  return fs
    .readdirSync(projectsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{4} - /.test(e.name))
    .map((e) => path.join(projectsDir, e.name, 'index.html'))
    .filter((p) => fs.existsSync(p));
}

function collectPaths() {
  return [
    ...ROOT_MARKETING.map((p) => path.join(REPO_ROOT, p)),
    ...collectStoryHtmlPaths(),
  ];
}

const dryRun = process.argv.includes('--dry-run');
let updated = 0;
let skipped = 0;

for (const filePath of collectPaths()) {
  const rel = path.relative(REPO_ROOT, filePath);
  const before = fs.readFileSync(filePath, 'utf8');
  const after = refreshGoogleAnalyticsInHtml(before);
  if (after === before) {
    skipped += 1;
    continue;
  }
  if (!dryRun) fs.writeFileSync(filePath, after);
  console.log(dryRun ? `[dry-run] would update: ${rel}` : `Updated: ${rel}`);
  updated += 1;
}

console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${updated} file(s); skipped ${skipped} (already had tag).`);
