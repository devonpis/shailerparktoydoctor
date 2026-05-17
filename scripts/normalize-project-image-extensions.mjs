#!/usr/bin/env node
/**
 * Rename canonical project images from .jpg to .jpeg and update HTML/gallery refs.
 *
 * Usage:
 *   node scripts/normalize-project-image-extensions.mjs --all
 *   node scripts/normalize-project-image-extensions.mjs 0007 0008 [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalizeProjectImageExtensions } from './lib/normalize-image-extensions.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(path.resolve(__dirname, '..'), 'projects');

function parseArgs(argv) {
  const flags = { dryRun: false, all: false, ids: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--all') flags.all = true;
    else if (!a.startsWith('--')) flags.ids.push(a);
  }
  return flags;
}

function listDirs(flags) {
  if (flags.all) {
    return fs
      .readdirSync(PROJECTS_DIR)
      .filter((n) => /^\d{4} - /.test(n) && n !== '0000 - template')
      .map((n) => path.join(PROJECTS_DIR, n));
  }
  const dirs = [];
  for (const id of flags.ids) {
    const padded = id.replace(/\D/g, '').padStart(4, '0').slice(-4);
    const match = fs.readdirSync(PROJECTS_DIR).find((n) => n.startsWith(`${padded} -`));
    if (!match) throw new Error(`No project folder for ${id}`);
    dirs.push(path.join(PROJECTS_DIR, match));
  }
  return dirs;
}

function main() {
  const flags = parseArgs(process.argv);
  if (!flags.all && !flags.ids.length) {
    console.error('Usage: node scripts/normalize-project-image-extensions.mjs --all | <id> […] [--dry-run]');
    process.exit(1);
  }

  let total = 0;
  for (const dir of listDirs(flags)) {
    const { renames, updatedFiles } = normalizeProjectImageExtensions(dir, { dryRun: flags.dryRun });
    total += renames.length;
    for (const f of updatedFiles) console.log(`  updated refs: ${f}`);
  }

  if (!flags.dryRun) {
    console.log('\n--- Repair home / gallery / story refs ---');
    const r = spawnSync(process.execPath, ['scripts/repair-project-media-refs.mjs'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }

  console.log(
    flags.dryRun
      ? `\nDry run: ${total} rename(s) would run.`
      : `\nDone: ${total} file(s) renamed to .jpeg.`
  );
}

main();
