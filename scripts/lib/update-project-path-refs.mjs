import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, PROJECTS_DIR } from './resolve-project-dir.mjs';

export const INDEX_JSON_PATHS = [
  path.join(REPO_ROOT, 'new/data/projects-index.json'),
  path.join(REPO_ROOT, 'data/projects-index.json'),
];

/** Replace image filenames in project index.html and projects-index.json files. */
export function updateProjectPathReferences(renames, { projectsDir = PROJECTS_DIR } = {}) {
  const files = [];
  for (const dir of fs.readdirSync(projectsDir)) {
    const html = path.join(projectsDir, dir, 'index.html');
    if (fs.existsSync(html)) files.push(html);
  }
  for (const p of INDEX_JSON_PATHS) {
    if (fs.existsSync(p)) files.push(p);
  }

  const updated = [];
  for (const filePath of files) {
    let text = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const { oldName, newName } of renames) {
      if (oldName === newName) continue;
      if (text.includes(oldName)) {
        text = text.split(oldName).join(newName);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, text);
      updated.push(path.relative(REPO_ROOT, filePath));
    }
  }
  return updated;
}
