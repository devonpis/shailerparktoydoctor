#!/usr/bin/env node
/**
 * Apply normalizeProjectName to all projects/ folders (rename + config.projectName).
 * Usage: node scripts/normalize-project-names.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  folderLabelFromProjectName,
  normalizeProjectNameWithLegacyFixes,
} from './lib/normalize-project-name.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const dryRun = process.argv.includes('--dry-run');

/** Keep established folder labels; only normalize projectName in config. */
const FOLDER_RENAME_SKIP_IDS = new Set(['0001', '0002', '0003']);

for (const folder of fs.readdirSync(PROJECTS_DIR).sort()) {
  const m = folder.match(/^(\d{4}) - (.+)$/);
  if (!m || m[1] === '0000') continue;

  const id = m[1];
  const folderSuffix = m[2];
  const configPath = path.join(PROJECTS_DIR, folder, 'config.json');
  if (!fs.existsSync(configPath)) continue;

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const currentName = config.projectName || folderSuffix;

  const nextName = normalizeProjectNameWithLegacyFixes(currentName);
  const nextFolder = `${id} - ${folderLabelFromProjectName(nextName)}`;

  const nameChanged = currentName !== nextName;
  let folderChanged = folder !== nextFolder && /[^a-zA-Z0-9\s]/.test(folderSuffix);
  if (FOLDER_RENAME_SKIP_IDS.has(id)) folderChanged = false;

  if (!nameChanged && !folderChanged) continue;

  console.log(`${folder}:`);
  if (nameChanged) console.log(`  projectName: ${currentName} → ${nextName}`);
  if (folderChanged) console.log(`  folder: → ${nextFolder}`);

  if (!dryRun) {
    if (nameChanged) {
      config.projectName = nextName;
      fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    }
    if (folderChanged) {
      const from = path.join(PROJECTS_DIR, folder);
      const to = path.join(PROJECTS_DIR, nextFolder);
      if (fs.existsSync(to)) {
        console.error(`  skip rename — target exists: ${nextFolder}`);
      } else {
        fs.renameSync(from, to);
      }
    }
  }
}

console.log(dryRun ? '\nDry run only.' : '\nDone.');
