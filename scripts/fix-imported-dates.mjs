#!/usr/bin/env node
/**
 * Repair startDate/endDate in project configs where month/day were swapped (month > 12).
 * Usage: node scripts/fix-imported-dates.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
function repairSwappedIsoDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const [, y, a, b] = m;
  const month = Number(a);
  const day = Number(b);
  if (month > 12 && day >= 1 && day <= 12) {
    return `${y}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
  }
  return iso;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const dryRun = process.argv.includes('--dry-run');

let fixed = 0;

for (const folder of fs.readdirSync(PROJECTS_DIR)) {
  const configPath = path.join(PROJECTS_DIR, folder, 'config.json');
  if (!fs.existsSync(configPath)) continue;
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw);
  let changed = false;
  for (const key of ['startDate', 'endDate']) {
    const v = config[key];
    if (!v) continue;
    const repaired = repairSwappedIsoDate(v);
    if (repaired !== v) {
      console.log(`${folder}: ${key} ${v} → ${repaired}`);
      config[key] = repaired;
      changed = true;
    }
  }
  if (changed) {
    fixed += 1;
    if (!dryRun) {
      fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    }
  }
}

console.log(dryRun ? `Would fix ${fixed} config(s).` : `Fixed ${fixed} config(s).`);
