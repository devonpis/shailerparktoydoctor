#!/usr/bin/env node
/**
 * Set project status only when readiness rules pass (for DONE).
 *
 * Usage:
 *   node scripts/set-project-status.mjs <project-id> --status DONE
 *   node scripts/set-project-status.mjs <project-id> --status WIP
 *   node scripts/set-project-status.mjs <project-id> --status DONE --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { validateDoneReadiness } from './lib/project-readiness.mjs';
import { resolveProjectDir, projectIdFromDir } from './lib/resolve-project-dir.mjs';

const ALLOWED = new Set(['WIP', 'DONE']);

function parseArgs(argv) {
  const flags = { dryRun: false, status: null };
  const positional = [];
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--status') flags.status = argv[++i];
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else positional.push(a);
  }
  if (!positional[0] || !flags.status) {
    throw new Error(
      'Usage: node scripts/set-project-status.mjs <project-id> --status DONE|WIP [--dry-run]'
    );
  }
  if (!ALLOWED.has(flags.status)) {
    throw new Error(`--status must be one of: ${[...ALLOWED].join(', ')}`);
  }
  return { projectArg: positional[0], flags };
}

function main() {
  const { projectArg, flags } = parseArgs(process.argv);
  const dir = resolveProjectDir(projectArg);
  const projectId = projectIdFromDir(dir);
  const configPath = path.join(dir, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (flags.status === 'DONE') {
    const { errors, images } = validateDoneReadiness(config, dir);
    console.log(`Project: ${path.basename(dir)} (${projectId})`);
    if (images?.length) console.log(`Images: ${images.join(', ')}`);
    if (errors.length) {
      for (const e of errors) console.error(`FAIL: ${e}`);
      console.error('\nCannot set DONE until readiness checks pass.');
      console.error('Run: node scripts/validate-done-readiness.mjs', projectId);
      process.exit(1);
    }
    console.log('OK: DONE readiness checks passed.');
  }

  if (config.status === flags.status) {
    console.log(`Status already "${flags.status}" — no change.`);
    return;
  }

  if (flags.dryRun) {
    console.log(`[dry-run] would set status: ${JSON.stringify(config.status)} → ${JSON.stringify(flags.status)}`);
    return;
  }

  config.status = flags.status;
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Updated status → ${flags.status}`);
}

main();
