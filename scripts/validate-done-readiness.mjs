#!/usr/bin/env node
/**
 * Check whether a project is ready for status "DONE" (content + media + skills).
 * Does not change config — human or set-project-status.mjs sets status after this passes.
 *
 * Usage:
 *   node scripts/validate-done-readiness.mjs <project-id>
 */

import fs from 'node:fs';
import path from 'node:path';
import { validateDoneReadiness } from './lib/project-readiness.mjs';
import { resolveProjectDir, projectIdFromDir } from './lib/resolve-project-dir.mjs';

function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/validate-done-readiness.mjs <project-id>');
    process.exit(2);
  }

  const dir = resolveProjectDir(arg);
  const projectId = projectIdFromDir(dir);
  const config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));

  const { errors, images } = validateDoneReadiness(config, dir);

  console.log(`Project: ${path.basename(dir)} (${projectId})`);
  if (images?.length) console.log(`Images: ${images.join(', ')}`);
  console.log(`Status: ${JSON.stringify(config.status)} (this script does not change status)`);

  if (errors.length) {
    for (const e of errors) console.error(`FAIL: ${e}`);
    console.error('\nFix the items above, then set status to "DONE" in config.json.');
    console.error('Or: node scripts/set-project-status.mjs <id> --status DONE');
    process.exit(1);
  }

  console.log('OK: ready to set status to DONE (content, skills, and images).');
  if (config.status !== 'DONE') {
    console.log('Next: set "status": "DONE" in config.json or run set-project-status.mjs.');
  }
}

main();
