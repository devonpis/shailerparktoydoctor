#!/usr/bin/env node
/**
 * Add or update projects-index.json entries for DONE projects.
 *
 * Usage:
 *   node scripts/sync-projects-gallery-index.mjs <id> [id …]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveProjectDir, REPO_ROOT, projectIdFromDir } from './lib/resolve-project-dir.mjs';
import { listProjectImages } from './lib/project-media.mjs';
import { INDEX_JSON_PATHS } from './lib/update-project-path-refs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function pickThumbnailName(dir) {
  const names = listProjectImages(dir);
  for (const stem of ['hero', 'after', 'before']) {
    const hit = names.find((n) => n.toLowerCase().startsWith(stem));
    if (hit) return hit;
  }
  return names.filter((n) => /^wip-/i.test(n)).sort()[0] || null;
}

function buildEntry(config, folder, dir, id) {
  const thumbName = pickThumbnailName(dir);
  if (!thumbName) throw new Error(`No thumbnail image in ${folder}`);
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
  const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!ids.length) {
    console.error('Usage: node scripts/sync-projects-gallery-index.mjs <id> [id …]');
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
