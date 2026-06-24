#!/usr/bin/env node
/**
 * Add site-notice-banner.js before </body> on public HTML (idempotent).
 *
 *   node scripts/inject-site-notice.mjs [--dry-run]
 *
 * Notice copy: data/site-notice.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { refreshSiteNoticeScriptInHtml } from './lib/site-notice.mjs';
import { listSiteChromePages } from './lib/site-chrome-html.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const dryRun = process.argv.includes('--dry-run');
let updated = 0;
let skipped = 0;

for (const filePath of listSiteChromePages()) {
  const rel = path.relative(REPO_ROOT, filePath);
  const before = fs.readFileSync(filePath, 'utf8');
  const after = refreshSiteNoticeScriptInHtml(before);
  if (after === before) {
    skipped += 1;
    continue;
  }
  if (!dryRun) fs.writeFileSync(filePath, after);
  console.log(dryRun ? `[dry-run] would update: ${rel}` : `Updated: ${rel}`);
  updated += 1;
}

console.log(
  `\n${dryRun ? 'Would update' : 'Updated'} ${updated} file(s); skipped ${skipped} (already had script).`
);
