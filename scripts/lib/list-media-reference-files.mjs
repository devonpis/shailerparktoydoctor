import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, PROJECTS_DIR } from './resolve-project-dir.mjs';

export const INDEX_JSON_PATHS = [
  path.join(REPO_ROOT, 'new/data/projects-index.json'),
  path.join(REPO_ROOT, 'data/projects-index.json'),
];

/** Files that may contain /projects/… image paths (home + gallery JSON + story HTML). */
export function listMediaReferenceFiles({ projectsDir = PROJECTS_DIR } = {}) {
  const files = new Set();

  for (const p of INDEX_JSON_PATHS) {
    if (fs.existsSync(p)) files.add(p);
  }

  for (const dir of fs.readdirSync(projectsDir)) {
    const html = path.join(projectsDir, dir, 'index.html');
    if (fs.existsSync(html)) files.add(html);
  }

  const newDir = path.join(REPO_ROOT, 'new');
  if (fs.existsSync(newDir)) {
    walkHtml(newDir, files);
  }

  return [...files].sort();
}

function walkHtml(dir, files) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walkHtml(full, files);
    else if (name.name.endsWith('.html')) files.add(full);
  }
}
