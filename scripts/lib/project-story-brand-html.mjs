/**
 * Bake “Toy Doctor” bold in story page lead + strip brand-text.js.
 */

import fs from 'node:fs';
import path from 'node:path';
import { boldToyDoctorInText } from './brand-text-html.mjs';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const LEAD_RE = /<p class="project-lead text-lead">[\s\S]*?<\/p>/;
const BRAND_SCRIPT_RE = /\s*<script src="\/js\/brand-text\.js" defer><\/script>\n?/g;

export function buildProjectLeadHtml(description) {
  const bolded = boldToyDoctorInText(escapeHtml(String(description || '').trim()));
  return `      <p class="project-lead text-lead">
        ${bolded}
      </p>`;
}

export function stripBrandTextScript(html) {
  return html.replace(BRAND_SCRIPT_RE, '\n');
}

export function syncProjectStoryBrandHtml(dir, config, { dryRun = false } = {}) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    return { skipped: true, action: 'no index.html', changed: false };
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  if (!LEAD_RE.test(html)) {
    return { skipped: true, action: 'no project-lead', changed: false };
  }

  const lead = buildProjectLeadHtml(config.description);
  const normalize = (s) => String(s).replace(/\s+/g, ' ').trim();
  let next = html;
  const currentLead = html.match(LEAD_RE)?.[0] ?? '';
  if (normalize(currentLead) !== normalize(lead)) {
    next = html.replace(LEAD_RE, lead);
  }
  next = stripBrandTextScript(next);
  if (next === html) {
    return { skipped: false, action: 'lead bold already current', changed: false };
  }
  if (!dryRun) fs.writeFileSync(htmlPath, next);
  return { skipped: false, action: 'project-lead bold + brand script', changed: true };
}
