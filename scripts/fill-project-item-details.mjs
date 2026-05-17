#!/usr/bin/env node
/**
 * Fill stub itemDetails from catalog, trimmed to Donald-derived char budgets.
 *
 * Reference 0003 Donald Duck: paragraphs ~375 / 294 / 330 (total ~1003).
 * Tiers: standard 2×≤300, full 3×≤400. No photos → null (use polish-project-metadata.mjs).
 *
 * Usage:
 *   node scripts/fill-project-item-details.mjs [--dry-run]
 *   node scripts/fill-project-item-details.mjs --report
 *   node scripts/fill-project-item-details.mjs --id 0088
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listProjectImages } from './lib/project-media.mjs';
import {
  REFERENCE_DONALD_DUCK,
  ITEM_DETAILS_TIERS,
  needsItemDetails,
  stripItemDetailsFooter,
  itemDetailsCharReport,
} from './lib/item-details-budget.mjs';
import { resolveItemDetails } from './lib/polish-metadata.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const SKIP_IDS = new Set(['0000']);

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const reportOnly = process.argv.includes('--report');
  const idIdx = process.argv.indexOf('--id');
  const ids = idIdx >= 0 ? [process.argv[idIdx + 1]] : null;
  return { dryRun, force, reportOnly, ids };
}

function processProject(id, { dryRun, force }) {
  const prefix = `${id} - `;
  const folder = fs.readdirSync(PROJECTS_DIR).find((n) => n.startsWith(prefix));
  if (!folder) return { id, status: 'missing' };

  const dir = path.join(PROJECTS_DIR, folder);
  const configPath = path.join(dir, 'config.json');
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const existing = cfg.itemDetails || '';

  if (SKIP_IDS.has(id)) return { id, status: 'skip-template' };

  const imgs = listProjectImages(dir);
  const next = resolveItemDetails(id, cfg, dir, { force: force || needsItemDetails(existing) });
  const changed =
    (existing == null && next != null) ||
    (existing != null && next == null) ||
    stripItemDetailsFooter(existing) !== (next || '');

  if (!force && !needsItemDetails(existing) && !changed) {
    return { id, status: 'skip-ok', report: itemDetailsCharReport(existing || '') };
  }

  const report = next ? itemDetailsCharReport(next) : { total: 0, tier: 'null' };

  if (!dryRun && changed) {
    cfg.itemDetails = next;
    fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`);
  }

  return {
    id,
    status: changed ? (dryRun ? 'dry-run' : 'updated') : 'unchanged',
    name: cfg.projectName,
    report,
    noPhotos: imgs.length === 0,
  };
}

function printBudgetHelp() {
  console.log('itemDetails char budgets (from 0003 Donald Duck):');
  console.log(`  reference paragraphs: ${REFERENCE_DONALD_DUCK.paragraphLengths.join(' / ')}`);
  console.log(`  reference total: ${REFERENCE_DONALD_DUCK.total}`);
  console.log('  tiers:', JSON.stringify(ITEM_DETAILS_TIERS, null, 2));
}

function main() {
  const { dryRun, force, reportOnly, ids } = parseArgs();
  printBudgetHelp();
  console.log('');

  const allIds = ids || fs.readdirSync(PROJECTS_DIR)
    .filter((n) => /^\d{4} - /.test(n))
    .map((n) => n.slice(0, 4))
    .sort();

  const results = [];
  for (const id of allIds) {
    results.push(processProject(id, { dryRun: dryRun || reportOnly, force }));
  }

  const updated = results.filter((r) => r.status === 'updated' || r.status === 'dry-run');
  const skipped = results.filter((r) => r.status === 'skip-ok');
  const noCat = results.filter((r) => r.status === 'no-catalog');

  if (reportOnly) {
    console.log('ID\tstatus\ttier\ttotal\tpara lengths');
    for (const r of results) {
      if (r.report) {
        console.log(
          `${r.id}\t${r.status}\t${r.report.tier}\t${r.report.total}\t${r.report.paragraphLengths.join(',')}`
        );
      } else {
        console.log(`${r.id}\t${r.status}`);
      }
    }
    return;
  }

  console.log(`${dryRun ? 'Would update' : 'Updated'}: ${updated.length}`);
  console.log(`Already OK: ${skipped.length}`);
  if (noCat.length) console.log(`Missing catalog: ${noCat.map((r) => r.id).join(', ')}`);

  for (const r of updated) {
    console.log(
      `  ${r.id} ${r.name} [${r.tier}] → ${r.report.total} chars (${r.report.paragraphLengths.join('/')})`
    );
  }
}

main();
