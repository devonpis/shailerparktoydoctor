import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, PROJECTS_DIR } from './resolve-project-dir.mjs';
import { INDEX_JSON_PATHS, listMediaReferenceFiles } from './list-media-reference-files.mjs';

export { INDEX_JSON_PATHS };

/** Replace image filenames in story HTML, projects-index.json (home + /new/projects/ gallery). */
export function updateProjectPathReferences(renames, { projectsDir = PROJECTS_DIR } = {}) {
  const files = listMediaReferenceFiles({ projectsDir });

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
