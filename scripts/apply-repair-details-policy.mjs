#!/usr/bin/env node
/**
 * repairDetails policy:
 *   - Keep 0001, 0002, 0003 as-is
 *   - Restore legacy homepage copy for 0004–0015
 *   - Set null for all other projects
 *
 * Usage: node scripts/apply-repair-details-policy.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEGACY_SITE_REPAIR_DETAILS,
  REPAIR_DETAILS_KEEP_IDS,
} from './lib/legacy-site-repair-details.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const SKIP_IDS = new Set(['0000']);

function processProject(id, { dryRun }) {
  if (SKIP_IDS.has(id)) return { id, status: 'skip-template' };
  const folder = fs.readdirSync(PROJECTS_DIR).find((n) => n.startsWith(`${id} - `));
  if (!folder) return { id, status: 'missing' };

  const configPath = path.join(PROJECTS_DIR, folder, 'config.json');
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (REPAIR_DETAILS_KEEP_IDS.has(id)) {
    return { id, status: 'keep', name: cfg.projectName };
  }

  let next;
  if (LEGACY_SITE_REPAIR_DETAILS[id]) {
    next = LEGACY_SITE_REPAIR_DETAILS[id];
  } else {
    next = null;
  }

  const changed = String(cfg.repairDetails ?? '') !== String(next ?? '');
  if (!dryRun && changed) {
    cfg.repairDetails = next;
    fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`);
  }

  return {
    id,
    status: changed ? (dryRun ? 'dry-run' : 'updated') : 'unchanged',
    action: REPAIR_DETAILS_KEEP_IDS.has(id)
      ? 'keep'
      : LEGACY_SITE_REPAIR_DETAILS[id]
        ? 'legacy'
        : 'null',
    name: cfg.projectName,
  };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const ids = fs
    .readdirSync(PROJECTS_DIR)
    .filter((n) => /^\d{4} - /.test(n))
    .map((n) => n.slice(0, 4))
    .sort();

  const results = ids.map((id) => processProject(id, { dryRun }));
  const updated = results.filter((r) => r.status === 'updated' || r.status === 'dry-run');

  console.log(`${dryRun ? 'Would update' : 'Updated'}: ${updated.length}`);
  console.log(
    `  keep 0001–0003: ${results.filter((r) => r.action === 'keep').length}`
  );
  console.log(
    `  legacy 0004–0015: ${results.filter((r) => r.action === 'legacy' && r.status !== 'unchanged').length} changed`
  );
  console.log(
    `  null others: ${results.filter((r) => r.action === 'null' && (r.status === 'updated' || r.status === 'dry-run')).length}`
  );

  for (const r of updated) {
    console.log(`  ${r.id} ${r.name} → ${r.action}`);
  }
}

main();
