/**
 * Sync <section class="project-prose"> on index.html from config (sanitized for public).
 */

import fs from 'node:fs';
import path from 'node:path';
import { boldToyDoctorInText } from './brand-text-html.mjs';
import { publicProseFromConfig } from './polish-metadata.mjs';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitParagraphs(text) {
  return String(text || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function paragraphBlock(paragraphs) {
  return paragraphs
    .map(
      (p) => `        <p>
          ${boldToyDoctorInText(escapeHtml(p))}
        </p>`
    )
    .join('\n');
}

function buildProseSectionHtml(config) {
  const { repairDetails, itemDetails } = publicProseFromConfig(config);
  const repairParas = splitParagraphs(repairDetails);
  const itemParas = splitParagraphs(itemDetails);

  if (!repairParas.length && !itemParas.length) return '';

  const itemBlock =
    itemParas.length > 0
      ? `        <h2 class="jw-heading-100">About this item</h2>
${paragraphBlock(itemParas)}`
      : '';

  return `      <section class="project-prose">
        <h2 class="jw-heading-100">The repair</h2>
${paragraphBlock(repairParas)}
${itemBlock}
      </section>
`;
}

const PROSE_SECTION_RE =
  /<section class="project-prose">[\s\S]*?<\/section>\s*/;

function proseSectionInSync(html, config) {
  const expected = buildProseSectionHtml(config);
  const m = html.match(PROSE_SECTION_RE);
  if (!expected && !m) return true;
  if (!expected || !m) return false;
  return m[0].replace(/\s+$/g, '') === expected.replace(/\s+$/g, '');
}

export function syncProjectStoryProseHtml(dir, config, { dryRun = false } = {}) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    return { skipped: true, action: 'no index.html', changed: false };
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const block = buildProseSectionHtml(config);

  if (proseSectionInSync(html, config)) {
    return {
      skipped: false,
      action: block ? 'prose already current' : 'no prose in config',
      changed: false,
    };
  }

  let next;
  if (PROSE_SECTION_RE.test(html)) {
    next = block ? html.replace(PROSE_SECTION_RE, block) : html.replace(PROSE_SECTION_RE, '');
  } else if (block) {
    const ctaRe = /(\s*<motion\.div class="projects-cta">|<div class="projects-cta">)/;
    const ctaMatch = html.match(ctaRe);
    if (ctaMatch) {
      const idx = ctaMatch.index;
      next = `${html.slice(0, idx)}\n${block}\n${html.slice(idx)}`;
    } else {
      next = html.replace(/(\s*<\/main>)/, `\n${block}$1`);
    }
  } else {
    next = html;
  }

  const action = block
    ? PROSE_SECTION_RE.test(html)
      ? 'updated project prose'
      : 'added project prose'
    : 'removed project prose';

  if (!dryRun && next !== html) fs.writeFileSync(htmlPath, next);
  return { skipped: false, action, changed: next !== html };
}

/** Write sanitized repairDetails/itemDetails back to config.json. */
export function sanitizeConfigProseInPlace(config) {
  const prose = publicProseFromConfig(config);
  let changed = false;
  if (prose.repairDetails !== (config.repairDetails || '').trim()) {
    config.repairDetails = prose.repairDetails || null;
    changed = true;
  }
  if (prose.itemDetails !== (config.itemDetails || '').trim()) {
    config.itemDetails = prose.itemDetails || null;
    changed = true;
  }
  return changed;
}
