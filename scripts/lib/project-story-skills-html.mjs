/**
 * Bake #project-skills-root on story pages from config.json skills.
 */

import fs from 'node:fs';
import path from 'node:path';
import { buildProjectSkillsRootHtml } from './skill-badges-html.mjs';

// Match full #project-skills-root (optional nested .project-skills) — not the first inner </div>.
const SKILLS_ROOT_RE =
  /<div id="project-skills-root">\s*(?:<div class="project-skills"[\s\S]*?<\/div>\s*)?<\/div>/;

export function syncProjectStorySkillsHtml(dir, config, { dryRun = false } = {}) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    return { skipped: true, action: 'no index.html', changed: false };
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const block = buildProjectSkillsRootHtml(config.skills);
  if (!SKILLS_ROOT_RE.test(html)) {
    return { skipped: true, action: 'no #project-skills-root', changed: false };
  }

  const next = html.replace(SKILLS_ROOT_RE, block);
  if (next === html) {
    return { skipped: false, action: 'skills already current', changed: false };
  }

  let cleaned = next.replace(/\s*<script src="\/js\/project-page-skills\.js" defer><\/script>\n?/g, '\n');
  if (!dryRun) fs.writeFileSync(htmlPath, cleaned);
  return { skipped: false, action: 'updated project skills', changed: true };
}
