#!/usr/bin/env node
/**
 * Rebake the home page "Repairs We Do" table from data/projects-index.json.
 * Also runs automatically at the end of sync-projects-gallery-index.mjs.
 *
 * Usage:
 *   node scripts/sync-home-repair-types.mjs
 *
 * Repair types and example projects live in scripts/lib/home-repair-types.mjs.
 */

import { patchHomeRepairTypes } from './lib/home-repair-types.mjs';
import { REPO_ROOT } from './lib/resolve-project-dir.mjs';

const { changed, total } = patchHomeRepairTypes(REPO_ROOT);
console.log(`${changed ? 'OK' : 'OK (unchanged)'} index.html repair types table (${total} projects)`);
