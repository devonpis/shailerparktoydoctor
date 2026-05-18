#!/usr/bin/env node
/**
 * Refresh itemDetails: remove resale/value tone; sync catalog → project configs.
 *
 *   node scripts/refresh-item-details-tone.mjs [--dry-run]
 *   node scripts/refresh-item-details-tone.mjs --catalog-only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEM_DETAILS_BY_ID } from './lib/item-details-catalog.mjs';
import { toneDownItemDetails, toneDownParagraph, paragraphHasValueTone } from './lib/item-details-tone.mjs';
import { formatItemDetails, stripItemDetailsFooter } from './lib/item-details-budget.mjs';
import { pickItemDetailsTier } from './lib/polish-metadata.mjs';
import { listProjectImages } from './lib/project-media.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const CATALOG_PATH = path.join(__dirname, 'lib', 'item-details-catalog.mjs');
const SKIP_IDS = new Set(['0000']);

function parseArgs() {
  return {
    dryRun: process.argv.includes('--dry-run'),
    catalogOnly: process.argv.includes('--catalog-only'),
  };
}

function toneCatalogEntries() {
  const next = {};
  let changed = 0;
  for (const [id, paras] of Object.entries(ITEM_DETAILS_BY_ID)) {
    const fixed = paras.map((p, i) =>
      toneDownParagraph(p, { isSecond: i > 0, firstParagraph: paras[0] })
    );
    if (JSON.stringify(fixed) !== JSON.stringify(paras)) changed++;
    next[id] = fixed;
  }
  return { next, changed };
}

function writeCatalogFile(next) {
  const lines = ['export const ITEM_DETAILS_BY_ID = {'];
  for (const id of Object.keys(next).sort()) {
    lines.push(`  '${id}': [`);
    for (const p of next[id]) {
      lines.push(`    ${JSON.stringify(p)},`);
    }
    lines.push('  ],');
  }
  lines.push('};', '');
  fs.writeFileSync(CATALOG_PATH, `${lines.join('\n')}\n`);
}

function refreshProjects(tonedCatalog, dryRun) {
  const updated = [];
  for (const name of fs.readdirSync(PROJECTS_DIR).sort()) {
    if (!/^\d{4} - /.test(name)) continue;
    const id = name.slice(0, 4);
    if (SKIP_IDS.has(id)) continue;

    const dir = path.join(PROJECTS_DIR, name);
    const configPath = path.join(dir, 'config.json');
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const imgs = listProjectImages(dir);
    const existing = stripItemDetailsFooter(cfg.itemDetails || '');

    let next;
    if (imgs.length === 0) {
      next = null;
    } else if (tonedCatalog[id]?.length) {
      next = formatItemDetails(tonedCatalog[id], pickItemDetailsTier(dir, cfg));
    } else if (existing) {
      next = toneDownItemDetails(existing);
    } else {
      continue;
    }

    const normA = (cfg.itemDetails ?? '').trim();
    const normB = (next ?? '').trim();
    if (normA === normB) continue;

    if (!dryRun) {
      cfg.itemDetails = next;
      fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`);
    }
    updated.push({
      id,
      name: cfg.projectName,
      hadValue: paragraphHasValueTone(existing),
    });
  }
  return updated;
}

function main() {
  const { dryRun, catalogOnly } = parseArgs();
  const { next: tonedCatalog, changed: catalogChanged } = toneCatalogEntries();

  if (!dryRun) writeCatalogFile(tonedCatalog);
  else console.log('(dry-run: catalog not written)');
  console.log(`Catalog: ${catalogChanged} entries would change`);

  if (catalogOnly) return;

  const updated = refreshProjects(tonedCatalog, dryRun);
  console.log(`${dryRun ? 'Would update' : 'Updated'} ${updated.length} project config(s)`);
  for (const u of updated) {
    console.log(`  ${u.id} ${u.name}${u.hadValue ? ' (had value tone)' : ''}`);
  }
}

main();
