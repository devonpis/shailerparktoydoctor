#!/usr/bin/env node
/**
 * Bake skill badges into story pages (#project-skills-root).
 *
 * Usage:
 *   node scripts/sync-project-story-skills.mjs <id> [id …]
 *   node scripts/sync-project-story-skills.mjs --published
 */

import fs from 'node:fs';
import path from 'node:path';
import { syncProjectStorySkillsHtml } from './lib/project-story-skills-html.mjs';
import { patchHomeDoctorSkills } from './lib/skill-badges-html.mjs';
import { REPO_ROOT, PROJECTS_DIR, resolveProjectDir } from './lib/resolve-project-dir.mjs';

const HOME_INDEX = path.join(REPO_ROOT, 'index.html');

function listPublishedStoryDirs() {
  const dirs = [];
  for (const name of fs.readdirSync(PROJECTS_DIR)) {
    if (!/^\d{4} - /.test(name) || name.startsWith('0000')) continue;
    const dir = path.join(PROJECTS_DIR, name);
    if (fs.existsSync(path.join(dir, 'index.html'))) dirs.push(dir);
  }
  return dirs;
}

function parseArgs(argv) {
  const published = argv.includes('--published');
  const ids = argv.slice(2).filter((a) => !a.startsWith('--'));
  return { published, ids };
}

function syncHomeDoctors() {
  if (!fs.existsSync(HOME_INDEX)) return false;
  const html = fs.readFileSync(HOME_INDEX, 'utf8');
  let next = patchHomeDoctorSkills(html);
  next = next.replace(/\s*<script src="\/js\/home-doctors-skills\.js" defer><\/script>\n?/g, '\n');
  if (next === html) return false;
  fs.writeFileSync(HOME_INDEX, next);
  return true;
}

function main() {
  const { published, ids } = parseArgs(process.argv);
  const targets = published
    ? listPublishedStoryDirs()
    : ids.map((id) => resolveProjectDir(id));

  if (!targets.length && !published) {
    console.error('Usage: node scripts/sync-project-story-skills.mjs <id> [id …] | --published');
    process.exit(1);
  }

  let n = 0;
  for (const dir of targets) {
    const config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
    const r = syncProjectStorySkillsHtml(dir, config);
    if (r.changed) {
      n += 1;
      console.log(`  OK ${path.basename(dir)}`);
    }
  }

  if (syncHomeDoctors()) {
    console.log('  OK index.html (Our Doctors badges)');
  }

  console.log(`\nDone: ${n} story page(s) updated.`);
}

main();
