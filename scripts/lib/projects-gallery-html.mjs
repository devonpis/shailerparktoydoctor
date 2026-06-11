/**
 * Pre-rendered /projects/ gallery tiles (filtering stays client-side in projects-gallery.js).
 */

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './resolve-project-dir.mjs';
import { normalizeSkills } from './normalize-skills.mjs';
import { buildTileImgTagForUrl } from './project-tile-image.mjs';

export const PROJECTS_GALLERY_PATH = path.join(REPO_ROOT, 'projects/index.html');
export const PROJECTS_INDEX_PATH = path.join(REPO_ROOT, 'data/projects-index.json');
export const GALLERY_SYNC_START = '<!-- sync-projects-gallery:start -->';
export const GALLERY_SYNC_END = '<!-- sync-projects-gallery:end -->';

const SKILL_EMOJI = {
  needlework: '🧸',
  electronic: '⚡',
  mechanical: '🔧',
  paintjob: '🖌️',
};

const SKILL_LABELS = {
  needlework: 'Needlework',
  electronic: 'Electronic',
  mechanical: 'Mechanical',
  paintjob: 'Paint',
};

const SKILL_IDS = ['needlework', 'electronic', 'mechanical', 'paintjob'];

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

/** Match js/projects-gallery.js — endDate as AU long date. */
export function formatAuDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function skillIconHtml(skillId) {
  const emoji = SKILL_EMOJI[skillId];
  if (!emoji) return '';
  return `<span class="skill-icon skill-icon--emoji" aria-hidden="true">${emoji}</span>`;
}

function overlayBadgesHtml(skills) {
  const list = normalizeSkills(skills);
  if (!list.length) return '';
  const items = list
    .map(
      (id) =>
        `<span class="skill-badge skill-badge--icon-only skill-badge--${id}" title="${escapeHtml(SKILL_LABELS[id] || id)}">${skillIconHtml(id)}</span>`
    )
    .join('');
  return `<div class="skill-badges skill-badges--overlay">${items}</div>`;
}

/** Match js/skills.js filterBarHtml — default activeSkill = 'all'. */
function filterBarHtml(activeSkill = 'all') {
  const active = activeSkill || 'all';
  const allBtn = `<button type="button" class="skill-filter skill-filter--all${active === 'all' ? ' is-active' : ''}" data-skill="all" aria-pressed="${active === 'all'}">All</button>`;
  const skillBtns = SKILL_IDS.map((id) => {
    const on = active === id;
    return `<button type="button" class="skill-filter skill-filter--${id}${on ? ' is-active' : ''}" data-skill="${id}" aria-pressed="${on}">${skillIconHtml(id)}<span>${SKILL_LABELS[id]}</span></button>`;
  }).join('');
  return `<div class="skill-filters" role="group" aria-label="Filter by skill">${allBtn}${skillBtns}</div>`;
}

/** Latest repair date first; tie-break by project id descending. */
export function sortEntriesLatestFirst(entries) {
  return [...entries].sort((a, b) => {
    const dateCmp = (b.endDate || '').localeCompare(a.endDate || '');
    if (dateCmp !== 0) return dateCmp;
    return String(b.id || b.folder || '').localeCompare(String(a.id || a.folder || ''), undefined, {
      numeric: true,
    });
  });
}

export async function buildGalleryCardHtml(entry) {
  const skills = normalizeSkills(entry.skills || []);
  const name = escapeHtml(entry.projectName || entry.title || 'Project');
  const thumb = entry.thumbnail || '';
  const url = escapeHtml(entry.url || '#');
  const dateLabel = formatAuDate(entry.endDate);
  const date = dateLabel
    ? `          <p class="project-card__meta project-card__date">${escapeHtml(dateLabel)}</p>\n`
    : '';
  const badges = overlayBadgesHtml(skills);
  const skillAttr = escapeAttr(skills.join(' '));
  const imgTag = await buildTileImgTagForUrl(thumb, name);
  return `      <a href="${url}" class="project-card" data-skills="${skillAttr}">
        <div class="project-card__media">
          ${imgTag}
          ${badges}
        </div>
        <div class="project-card__body">
          <h2 class="project-card__title" title="${name}">${name}</h2>
${date}          <p class="project-card__cta">Read full story →</p>
        </div>
      </a>`;
}

export async function renderGalleryBlock(entries) {
  const sorted = sortEntriesLatestFirst(entries);
  const cards = (await Promise.all(sorted.map(buildGalleryCardHtml))).join('\n');
  return `${GALLERY_SYNC_START}
      <div class="gallery-toolbar">
        ${filterBarHtml('all')}
      </div>
      <div id="gallery-grid" class="project-grid">
${cards}
      </div>
      <p id="gallery-empty" class="gallery-empty" hidden>No projects match this skill.</p>
      ${GALLERY_SYNC_END}`;
}

export function loadProjectsIndexRows() {
  if (!fs.existsSync(PROJECTS_INDEX_PATH)) {
    throw new Error(`Missing ${PROJECTS_INDEX_PATH}`);
  }
  return JSON.parse(fs.readFileSync(PROJECTS_INDEX_PATH, 'utf8'));
}

export function patchProjectsGalleryHtml(innerBlock) {
  let page = fs.readFileSync(PROJECTS_GALLERY_PATH, 'utf8');
  const blockRe = new RegExp(
    `${GALLERY_SYNC_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${GALLERY_SYNC_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
  );
  if (!blockRe.test(page)) {
    throw new Error(
      `Could not find gallery sync markers in ${PROJECTS_GALLERY_PATH}. Add ${GALLERY_SYNC_START} … ${GALLERY_SYNC_END} inside #projects-root.`
    );
  }
  let next = page.replace(blockRe, innerBlock);
  next = next.replace(/\s*<script src="\/js\/brand-text\.js" defer><\/script>\n?/g, '\n');
  if (next === page) return false;
  fs.writeFileSync(PROJECTS_GALLERY_PATH, next);
  return true;
}

/** Rebuild pre-rendered tiles in projects/index.html from data/projects-index.json. */
export async function syncProjectsGalleryHtml({ dryRun = false } = {}) {
  const entries = loadProjectsIndexRows();
  const innerBlock = await renderGalleryBlock(entries);
  if (dryRun) {
    return { count: entries.length, dryRun: true };
  }
  const changed = patchProjectsGalleryHtml(innerBlock);
  return { count: entries.length, changed };
}
