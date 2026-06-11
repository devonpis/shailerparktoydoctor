#!/usr/bin/env node
/**
 * Bake header + footer from includes/ into all public HTML pages.
 *
 * Usage:
 *   node scripts/sync-site-chrome.mjs [--dry-run]
 *   node scripts/sync-site-chrome.mjs index.html contact.html
 *
 * Edit includes/site-header.html, site-footer.html, or social-icons.html, then run this.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listSiteChromePages,
  syncAllSiteChrome,
  syncSiteChromePage,
} from './lib/site-chrome-html.mjs';
import { REPO_ROOT } from './lib/resolve-project-dir.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const paths = argv.slice(2).filter((a) => !a.startsWith('--'));
  return { dryRun, paths };
}

function main() {
  const { dryRun, paths } = parseArgs(process.argv);

  if (paths.length) {
    let n = 0;
    for (const rel of paths) {
      const filePath = path.isAbsolute(rel) ? rel : path.join(REPO_ROOT, rel);
      const { changed, activePage } = syncSiteChromePage(filePath, { dryRun });
      if (changed) {
        n += 1;
        console.log(`${dryRun ? '[dry-run] ' : ''}OK ${path.relative(REPO_ROOT, filePath)} (${activePage})`);
      } else {
        console.log(`  unchanged: ${path.relative(REPO_ROOT, filePath)}`);
      }
    }
    console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${n} page(s).`);
    return;
  }

  const total = listSiteChromePages().length;
  const changed = syncAllSiteChrome({ dryRun });
  for (const filePath of changed) {
    console.log(`${dryRun ? '[dry-run] ' : ''}OK ${path.relative(REPO_ROOT, filePath)}`);
  }
  console.log(
    `\n${dryRun ? 'Would update' : 'Updated'} ${changed.length}/${total} page(s) — header/footer are static HTML.`
  );
}

main();
