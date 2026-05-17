#!/usr/bin/env node
/**
 * Add or update projects-index.json entries for DONE projects.
 *
 * Usage:
 *   node scripts/sync-projects-gallery-index.mjs <id> [id …]
 *   node scripts/sync-projects-gallery-index.mjs --all
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveProjectDir, REPO_ROOT, PROJECTS_DIR, projectIdFromDir } from './lib/resolve-project-dir.mjs';
import { pickPrimaryImage } from './lib/project-media.mjs';
import { INDEX_JSON_PATHS } from './lib/update-project-path-refs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function listAllPublishedIds() {
  const ids = [];
  for (const name of fs.readdirSync(PROJECTS_DIR)) {
    if (!/^\d{4} - /.test(name) || name.startsWith('0000')) continue;
    const dir = path.join(PROJECTS_DIR, name);
    const configPath = path.join(dir, 'config.json');
    if (!fs.existsSync(configPath)) continue;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.status === 'DONE') ids.push(projectIdFromDir(dir));
  }
  return ids.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

function buildEntry(config, folder, dir, id) {
  let thumbName;
  try {
    thumbName = path.basename(pickPrimaryImage(dir));
  } catch {
    throw new Error(`No thumbnail image in ${folder}`);
  }
  const encoded = encodeURIComponent(folder);
  return {
    id,
    folder,
    projectName: config.projectName,
    title: config.title || config.projectName,
    tags: config.tags || [],
    skills: config.skills || [],
    thumbnail: `/projects/${encoded}/${encodeURIComponent(thumbName)}`,
    url: `/projects/${encoded}/`,
    endDate: config.endDate || '',
  };
}

function syncIndexFile(indexPath, entries) {
  let rows = [];
  if (fs.existsSync(indexPath)) {
    rows = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const e of entries) byId.set(e.id, e);
  const merged = [...byId.values()].sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
  fs.writeFileSync(indexPath, `${JSON.stringify(merged, null, 2)}\n`);
  return merged.length;
}

function main() {
  const argv = process.argv.slice(2);
  const all = argv.includes('--all');
  const ids = all ? listAllPublishedIds() : argv.filter((a) => !a.startsWith('--'));
  if (!ids.length) {
    console.error('Usage: node scripts/sync-projects-gallery-index.mjs <id> [id …] | --all');
    process.exit(1);
  }

  const entries = [];
  for (const id of ids) {
    const dir = resolveProjectDir(id);
    const projectId = projectIdFromDir(dir);
    const config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
    if (config.status !== 'DONE') {
      console.warn(`WARN ${projectId}: status is ${config.status}, not DONE`);
    }
    entries.push(buildEntry(config, path.basename(dir), dir, projectId));
    console.log(`  entry: ${projectId} ${config.projectName}`);
  }

  for (const p of INDEX_JSON_PATHS) {
    const count = syncIndexFile(p, entries);
    console.log(`OK ${path.relative(REPO_ROOT, p)} (${count} projects)`);
  }
}

main();
