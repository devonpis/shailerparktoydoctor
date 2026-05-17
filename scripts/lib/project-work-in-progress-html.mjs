/**
 * Story page “Work in progress” gallery: before → WIP-### → after (excludes hero.* only).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  listStoryGalleryImageNames,
  storyGalleryImageAlt,
} from './project-media.mjs';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function projectPathPrefix(folder) {
  return `/projects/${encodeURIComponent(folder)}`;
}

export function buildWorkInProgressSectionHtml(dir, folder) {
  const names = listStoryGalleryImageNames(dir);
  if (!names.length) return '';

  const prefix = projectPathPrefix(folder);
  const imgs = names
    .map(
      (name, i) => `          <img
            src="${prefix}/${encodeURIComponent(name)}"
            alt="${escapeHtml(storyGalleryImageAlt(name, i))}"
            loading="lazy"
          />`
    )
    .join('\n');

  return `      <section class="project-section">
        <h2 class="jw-heading-100">Work in progress</h2>
        <div class="project-wip-grid">
${imgs}
        </div>
      </section>
`;
}

const BEFORE_AFTER_SECTION_RE =
  /<section class="project-section">\s*<h2 class="jw-heading-100">Before &amp; after<\/h2>[\s\S]*?<\/section>\s*/g;
const WIP_SECTION_RE =
  /<section class="project-section">\s*<h2 class="jw-heading-100">Work in progress<\/h2>[\s\S]*?<\/section>\s*/g;

function stripLegacyGallerySections(html) {
  return html.replace(BEFORE_AFTER_SECTION_RE, '').replace(WIP_SECTION_RE, '');
}

function insertGalleryBlock(html, block) {
  if (!block) return stripLegacyGallerySections(html);

  const cleaned = stripLegacyGallerySections(html);
  const reviewEnd = cleaned.match(/<\/blockquote>\s*/);
  if (reviewEnd) {
    const idx = reviewEnd.index + reviewEnd[0].length;
    return `${cleaned.slice(0, idx)}\n${block}\n${cleaned.slice(idx)}`;
  }
  const leadEnd = cleaned.match(/<p class="project-lead text-lead">[\s\S]*?<\/p>\s*/);
  if (leadEnd) {
    const idx = leadEnd.index + leadEnd[0].length;
    return `${cleaned.slice(0, idx)}\n\n${block}\n${cleaned.slice(idx)}`;
  }
  const proseStart = cleaned.match(/\s*<section class="project-prose">/);
  if (proseStart) {
    const idx = proseStart.index;
    return `${cleaned.slice(0, idx)}\n${block}\n${cleaned.slice(idx)}`;
  }
  return cleaned;
}

/**
 * @returns {{ skipped: boolean, action: string, changed: boolean }}
 */
export function syncProjectWorkInProgressHtml(dir, folder, { dryRun = false } = {}) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    return { skipped: true, action: 'no index.html', changed: false };
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const block = buildWorkInProgressSectionHtml(dir, folder);
  const next = insertGalleryBlock(html, block);

  if (next === html) {
    return {
      skipped: false,
      action: block ? 'gallery already current' : 'no gallery images (hero only)',
      changed: false,
    };
  }

  const action = block
    ? 'updated Work in progress gallery'
    : 'removed empty / legacy gallery sections';

  if (!dryRun) fs.writeFileSync(htmlPath, next);
  return { skipped: false, action, changed: true };
}
