#!/usr/bin/env node
/**
 * Curate home page patient-story highlights via config.json `importance`, then bake HTML into index.html.
 *
 * Higher importance ranks higher. #1 = full-width lead story; #2–#7 = six tile slots.
 *
 * Usage:
 *   node scripts/sync-home-highlights.mjs [--dry-run] [--list]
 *   node scripts/sync-home-highlights.mjs --set 0003=3 0088=2
 *   node scripts/sync-home-highlights.mjs --clear 0001
 *
 * `--set` accepts id=value or id:value. Use `--clear` to set importance to null (removes from highlights).
 * After any --set/--clear, the home page HTML is regenerated. With no flags, rebuilds from current configs.
 */

import {
  buildHighlightsFromDisk,
  formatHighlightsList,
  patchHomeIndex,
  setProjectImportance,
  loadProjectsIndex,
} from './lib/home-highlights.mjs';
import { resolveProjectDir } from './lib/resolve-project-dir.mjs';

function parseSetArg(raw) {
  const m = String(raw).match(/^(\d{1,4})[=:](-?\d+(?:\.\d+)?)$/);
  if (!m) throw new Error(`Expected projectId=number, got: ${raw}`);
  return { id: m[1].padStart(4, '0'), value: Number(m[2]) };
}

function parseArgs(argv) {
  const flags = { dryRun: false, list: false, sets: [], clears: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--list') flags.list = true;
    else if (a === '--set') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        flags.sets.push(parseSetArg(argv[++i]));
      }
    } else if (a === '--clear') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        const id = argv[++i].padStart(4, '0');
        flags.clears.push(id);
      }
    } else throw new Error(`Unknown arg: ${a} (see script header for usage)`);
  }
  return flags;
}

function warnIfNotInGallery(id) {
  const rows = loadProjectsIndex();
  if (!rows.some((r) => r.id === id)) {
    console.warn(`  WARN: ${id} is not in data/projects-index.json — story may not be published yet`);
  }
}

function warnIfNotDone(config, id) {
  if (config.status !== 'DONE') {
    console.warn(`  WARN: ${id} status is ${config.status ?? '?'} (highlights work best when DONE + in gallery index)`);
  }
}

function applyConfigUpdates(flags) {
  for (const id of flags.clears) {
    const { config } = setProjectImportance(id, null);
    console.log(`  ${id}: importance cleared`);
    warnIfNotInGallery(id);
    warnIfNotDone(config, id);
  }
  for (const { id, value } of flags.sets) {
    resolveProjectDir(id);
    const { config } = setProjectImportance(id, value);
    console.log(`  ${id}: importance → ${value}`);
    warnIfNotInGallery(id);
    warnIfNotDone(config, id);
  }
}

function main() {
  const flags = parseArgs(process.argv);

  if (flags.sets.length || flags.clears.length) {
    console.log('Updating project config importance…');
    if (flags.dryRun) {
      for (const id of flags.clears) console.log(`  [dry-run] would clear ${id}`);
      for (const { id, value } of flags.sets) console.log(`  [dry-run] would set ${id}=${value}`);
    } else {
      applyConfigUpdates(flags);
    }
  }

  const { highlights, html } = buildHighlightsFromDisk();
  console.log(formatHighlightsList(highlights));

  if (flags.list) return;

  if (flags.dryRun) {
    console.log('\n[dry-run] would update index.html #patient-stories-root');
    return;
  }

  const changed = patchHomeIndex(html);
  if (changed) console.log('\nWrote index.html — patient stories highlight section');
  else console.log('\nindex.html highlights already current');
}

main();
