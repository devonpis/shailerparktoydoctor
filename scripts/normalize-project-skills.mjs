#!/usr/bin/env node
/**
 * Normalize config.json skills to plush | electronic | mechanical | paintjob.
 *
 * Usage: node scripts/normalize-project-skills.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeSkills } from './lib/normalize-skills.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

function main() {
  const dryRun = process.argv.includes('--dry-run');
  let updated = 0;

  for (const folder of fs.readdirSync(PROJECTS_DIR).sort()) {
    if (!/^\d{4} - /.test(folder)) continue;
    const configPath = path.join(PROJECTS_DIR, folder, 'config.json');
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const before = JSON.stringify(cfg.skills || []);
    const next = normalizeSkills(cfg.skills);
    const after = JSON.stringify(next);
    if (before === after) continue;

    if (!dryRun) {
      cfg.skills = next;
      fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`);
    }
    updated++;
    console.log(`${folder.slice(0, 4)}: ${before} → ${after}`);
  }

  console.log(`\n${dryRun ? 'Would update' : 'Updated'}: ${updated}`);
}

main();
