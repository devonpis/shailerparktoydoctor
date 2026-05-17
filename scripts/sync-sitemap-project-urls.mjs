#!/usr/bin/env node
/**
 * Add project story URLs to sitemap.xml (idempotent).
 *
 * Usage:
 *   node scripts/sync-sitemap-project-urls.mjs <id> [id …]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveProjectDir, REPO_ROOT } from './lib/resolve-project-dir.mjs';
import { storyCanonicalUrl } from './lib/project-story-meta.mjs';

const SITEMAP = path.join(REPO_ROOT, 'sitemap.xml');

function main() {
  const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!ids.length) {
    console.error('Usage: node scripts/sync-sitemap-project-urls.mjs <id> [id …]');
    process.exit(1);
  }

  let xml = fs.readFileSync(SITEMAP, 'utf8');
  let added = 0;
  for (const id of ids) {
    const dir = resolveProjectDir(id);
    const folder = path.basename(dir);
    const loc = storyCanonicalUrl(folder);
    if (xml.includes(loc)) {
      console.log(`  exists: ${id}`);
      continue;
    }
    const block = `  <url>\n    <loc>${loc}</loc>\n  </url>\n`;
    xml = xml.replace('</urlset>', `${block}</urlset>`);
    added += 1;
    console.log(`  added: ${id} → ${loc}`);
  }
  if (added) fs.writeFileSync(SITEMAP, xml);
  console.log(`OK sitemap.xml (+${added} URL(s))`);
}

main();
