#!/usr/bin/env node
/**
 * Polish stub/generic config fields: description, repairDetails, itemDetails.
 * itemDetails → null when the project folder has no repair images.
 *
 * Usage:
 *   node scripts/polish-project-metadata.mjs [--dry-run]
 *   node scripts/polish-project-metadata.mjs --id 0088
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listProjectImages } from './lib/project-media.mjs';
import {
  polishDescription,
  resolveItemDetails,
  META_FOOTER_RE,
} from './lib/polish-metadata.mjs';
import { needsItemDetails, stripItemDetailsFooter } from './lib/item-details-budget.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const SKIP_IDS = new Set(['0000']);

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const idIdx = process.argv.indexOf('--id');
  const ids = idIdx >= 0 ? [process.argv[idIdx + 1]] : null;
  return { dryRun, ids };
}

function processProject(id, { dryRun }) {
  const prefix = `${id} - `;
  const folder = fs.readdirSync(PROJECTS_DIR).find((n) => n.startsWith(prefix));
  if (!folder) return { id, status: 'missing' };

  const dir = path.join(PROJECTS_DIR, folder);
  const configPath = path.join(dir, 'config.json');
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (SKIP_IDS.has(id)) return { id, status: 'skip-template' };

  const hasPhotos = listProjectImages(dir).length > 0;
  const changes = [];

  const nextDesc = polishDescription(cfg);
  if (nextDesc && nextDesc !== cfg.description) {
    changes.push('description');
    cfg.description = nextDesc;
  }

  // repairDetails: managed by apply-repair-details-policy.mjs (keep 0001–0003, legacy 0004–0015, else null)

  let nextItem = hasPhotos
    ? resolveItemDetails(id, cfg, dir, { force: needsItemDetails(cfg.itemDetails) })
    : null;
  if (hasPhotos && cfg.itemDetails && META_FOOTER_RE.test(cfg.itemDetails)) {
    const stripped = stripItemDetailsFooter(cfg.itemDetails);
    if (stripped.length >= 80) nextItem = stripped;
  }
  const itemChanged = String(cfg.itemDetails ?? '') !== String(nextItem ?? '');

  if (itemChanged) {
    changes.push('itemDetails');
    cfg.itemDetails = nextItem;
  }

  if (!dryRun && changes.length) {
    fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`);
  }

  return {
    id,
    status: changes.length ? (dryRun ? 'dry-run' : 'updated') : 'unchanged',
    hasPhotos,
    changes,
    name: cfg.projectName,
  };
}

function main() {
  const { dryRun, ids } = parseArgs();
  const allIds =
    ids ||
    fs
      .readdirSync(PROJECTS_DIR)
      .filter((n) => /^\d{4} - /.test(n))
      .map((n) => n.slice(0, 4))
      .sort();

  const results = allIds.map((id) => processProject(id, { dryRun }));
  const updated = results.filter((r) => r.status === 'updated' || r.status === 'dry-run');
  const nullItems = updated.filter((r) => r.changes?.includes('itemDetails') && !r.hasPhotos);

  console.log(`${dryRun ? 'Would update' : 'Updated'}: ${updated.length} projects`);
  console.log(`itemDetails → null (no photos): ${nullItems.length}`);
  for (const r of updated) {
    console.log(`  ${r.id} ${r.name}: ${r.changes.join(', ')}${r.hasPhotos ? '' : ' [no photos]'}`);
  }
}

main();
