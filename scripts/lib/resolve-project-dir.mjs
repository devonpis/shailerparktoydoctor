import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../..');
export const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

/** Resolve `0003`, folder name, or absolute path to project directory. */
export function resolveProjectDir(arg, projectsDir = PROJECTS_DIR) {
  if (!arg) {
    throw new Error('Project id or folder required');
  }
  if (path.isAbsolute(arg) && fs.existsSync(arg)) {
    return arg;
  }
  const underProjects = path.join(projectsDir, arg);
  if (fs.existsSync(underProjects)) {
    return underProjects;
  }
  const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  const padded = /^\d+$/.test(arg) ? arg.padStart(4, '0') : arg;
  const match = entries.find(
    (e) =>
      e.isDirectory() &&
      (e.name === arg || e.name.startsWith(`${arg} -`) || e.name.startsWith(`${padded} -`))
  );
  if (match) return path.join(projectsDir, match.name);
  throw new Error(`Project not found: ${arg}`);
}

export function projectIdFromDir(dir) {
  return path.basename(dir).slice(0, 4);
}
