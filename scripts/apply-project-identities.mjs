#!/usr/bin/env node
/**
 * T-00030: Apply product identities (rename folder + update config.json).
 * All projects except 0000 template, 0001, 0002, 0003 Donald Duck.
 *
 * Usage: node scripts/apply-project-identities.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { folderLabelFromProjectName } from './lib/normalize-project-name.mjs';
import { T30_IDENTITIES, T30_SKIP_IDS } from './lib/t30-project-identities.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const dryRun = process.argv.includes('--dry-run');

function findFolderById(id) {
  const prefix = `${id} - `;
  const hit = fs.readdirSync(PROJECTS_DIR).find((n) => n.startsWith(prefix));
  return hit ? path.join(PROJECTS_DIR, hit) : null;
}

const log = [];
const seen = new Set();
for (const spec of T30_IDENTITIES) {
  if (T30_SKIP_IDS.has(spec.id)) continue;
  if (seen.has(spec.id)) continue;
  seen.add(spec.id);
  const dir = findFolderById(spec.id);
  if (!dir) {
    console.warn(`Skip ${spec.id}: folder not found`);
    continue;
  }
  const oldFolder = path.basename(dir);
  const configPath = path.join(dir, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const nextFolder = `${spec.id} - ${folderLabelFromProjectName(spec.projectName)}`;

  log.push({ id: spec.id, from: oldFolder, to: nextFolder, projectName: spec.projectName });

  console.log(`${oldFolder} → ${nextFolder}`);
  console.log(`  projectName: ${config.projectName} → ${spec.projectName}`);

  if (dryRun) continue;

  config.projectName = spec.projectName;
  config.description = spec.description;
  config.skills = spec.skills;
  config.tags = spec.tags;
  config.repairDetails = spec.repairDetails;
  const stubItem =
    !config.itemDetails ||
    /USB folder|Scaffolded|pending copy/i.test(config.itemDetails);
  if (stubItem && !config.itemDetails?.includes('Timesheet import')) {
    config.itemDetails = `Repair photos in repo. Product identified T-00030 — ${new Date().toISOString().slice(0, 10)}.`;
  } else if (!config.itemDetails?.includes('T-00030')) {
    config.itemDetails = `${config.itemDetails}\n\nPhoto/product ID T-00030 — ${new Date().toISOString().slice(0, 10)}.`;
  }

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  if (oldFolder !== nextFolder) {
    const target = path.join(PROJECTS_DIR, nextFolder);
    if (fs.existsSync(target)) {
      console.error(`  ERROR: target exists: ${nextFolder}`);
    } else {
      fs.renameSync(dir, target);
    }
  }
}

const reportPath = path.join(__dirname, '..', 'docs/reports/t30-project-identities-2026-05-17.md');
const lines = [
  '# T-00030 project identities applied',
  '',
  `Date: ${new Date().toISOString().slice(0, 10)}`,
  '',
  '| ID | Old folder | New folder | projectName |',
  '|----|------------|------------|-------------|',
  ...log.map((r) => `| ${r.id} | ${r.from} | ${r.to} | ${r.projectName} |`),
];
if (!dryRun) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
  console.log(`\nReport: ${reportPath}`);
}
console.log(dryRun ? '\nDry run only.' : '\nDone.');
