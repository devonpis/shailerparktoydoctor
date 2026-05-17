/**
 * Home page patient-story highlights — shared by sync-home-highlights.mjs and home-patient-stories.js logic.
 */

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, PROJECTS_DIR, resolveProjectDir, projectIdFromDir } from './resolve-project-dir.mjs';
import { normalizeSkills } from './normalize-skills.mjs';

export const TILE_COUNT = 6;
export const HOME_INDEX_PATH = path.join(REPO_ROOT, 'new/index.html');
export const HIGHLIGHTS_START = '<!-- sync-home-highlights:start';
export const HIGHLIGHTS_END = '<!-- sync-home-highlights:end -->';

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

const PROJECTS_INDEX_PATH = path.join(REPO_ROOT, 'new/data/projects-index.json');

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

export function linkifyDescription(text) {
  const safe = escapeHtml(text || '').replace(/\n/g, ' ');
  return safe.replace(
    /(https?:\/\/[^\s<]+?)(?=[\s.,;:!?"')\]}]*(?:\s|$|<))/gi,
    (url) =>
      `<a href="${escapeAttr(url)}" rel="noopener noreferrer" target="_blank">${url}</a>`
  );
}

export function readImportance(config) {
  const v = config?.importance;
  return v !== undefined && v !== null ? v : null;
}

export function hasImportance(importance) {
  return typeof importance === 'number' && !Number.isNaN(importance);
}

export function compareHighlights(a, b) {
  if (b.importance !== a.importance) return b.importance - a.importance;
  const da = a.endDate || '';
  const db = b.endDate || '';
  if (db !== da) return db.localeCompare(da);
  return (a.id || '').localeCompare(b.id || '');
}

export function overlayBadgesHtml(skills) {
  const list = normalizeSkills(skills);
  if (!list.length) return '';
  const items = list
    .map((id) => {
      const emoji = SKILL_EMOJI[id] || '';
      const label = SKILL_LABELS[id] || id;
      return `<span class="skill-badge skill-badge--icon-only skill-badge--${id}" title="${escapeHtml(label)}"><span class="skill-icon skill-icon--emoji" aria-hidden="true">${emoji}</span></span>`;
    })
    .join('');
  return `<div class="skill-badges skill-badges--overlay">${items}</div>`;
}

export function loadProjectsIndex() {
  if (!fs.existsSync(PROJECTS_INDEX_PATH)) {
    throw new Error(`Missing ${PROJECTS_INDEX_PATH}`);
  }
  return JSON.parse(fs.readFileSync(PROJECTS_INDEX_PATH, 'utf8'));
}

export function loadProjectConfig(dir) {
  const configPath = path.join(dir, 'config.json');
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/** Merge gallery index row with on-disk config (importance, description, skills). */
export function enrichProjectRow(row) {
  const folder = row.folder;
  if (!folder) return { ...row, storyDescription: '', importance: null, skills: [] };
  const dir = path.join(PROJECTS_DIR, folder);
  const config = loadProjectConfig(dir);
  const skills = normalizeSkills(config.skills || row.skills || []);
  return {
    ...row,
    skills,
    storyDescription: config.description || '',
    importance: readImportance(config),
  };
}

export function selectHighlights(enrichedRows) {
  return enrichedRows.filter((p) => hasImportance(p.importance)).sort(compareHighlights);
}

export function renderLeadStoryBlock(project, description) {
  const name = escapeHtml(project.projectName || project.title || 'Project');
  const img = escapeHtml(project.thumbnail || '');
  const url = escapeHtml(project.url || '#');
  const body = linkifyDescription(description);
  const badges = overlayBadgesHtml(project.skills);
  return `
      <div class="jw-element-imagetext-text patient-story patient-story--lead">
        <div class="patient-stories">
          <div class="patient-stories__media">
            <img src="${img}" alt="${name}" loading="lazy" />
            ${badges}
          </div>
        </div>
        <h3 class="patient-story__title project-subtitle"><a href="${url}">${name}</a></h3>
        <p>${body}</p>
        <p><a href="${url}">Read the full repair story →</a></p>
      </div>`;
}

export function renderTileCard(project) {
  const name = escapeHtml(project.projectName || project.title || 'Project');
  const img = escapeHtml(project.thumbnail || '');
  const url = escapeHtml(project.url || '#');
  const badges = overlayBadgesHtml(project.skills);
  return `
      <a href="${url}" class="project-card">
        <div class="project-card__media">
          <img src="${img}" alt="${name}" loading="lazy" />
          ${badges}
        </div>
        <div class="project-card__body">
          <h3 class="project-card__title" title="${name}">${name}</h3>
        </div>
      </a>`;
}

export function renderTilePlaceholder(n) {
  return `
      <div class="project-card project-card--placeholder" aria-hidden="true">
        <div class="project-card__img-placeholder">Coming soon</div>
        <div class="project-card__body">
          <h3 class="project-card__title">Repair highlight ${n}</h3>
        </div>
      </div>`;
}

export function renderHighlightsInnerHtml(highlights) {
  if (!highlights.length) {
    return `
      <p>Repair stories will appear here when projects have an <code>importance</code> set in their config.</p>`;
  }

  const lead = highlights[0];
  const tileProjects = highlights.slice(1, 1 + TILE_COUNT);
  const leadHtml = renderLeadStoryBlock(lead, lead.storyDescription || '');
  const tileHtml = Array.from({ length: TILE_COUNT }, (_, i) => {
    const project = tileProjects[i];
    return project ? renderTileCard(project) : renderTilePlaceholder(i + 2);
  }).join('');

  const rankNote = highlights
    .slice(0, 1 + TILE_COUNT)
    .map((p, i) => `${i + 1}. ${p.id} (${p.importance})`)
    .join('; ');

  return `
      ${HIGHLIGHTS_START} — ${rankNote} -->
      <div class="patient-stories-layout">
${leadHtml}
        <hr class="patient-stories-divider" />
        <div class="highlight-tiles">${tileHtml}
        </div>
      </div>
      ${HIGHLIGHTS_END}`;
}

export function buildHighlightsFromDisk() {
  const rows = loadProjectsIndex().map(enrichProjectRow);
  const highlights = selectHighlights(rows);
  return { highlights, html: renderHighlightsInnerHtml(highlights) };
}

export function formatHighlightsList(highlights) {
  if (!highlights.length) return 'No projects with numeric importance.';
  const lines = highlights.slice(0, 1 + TILE_COUNT).map((p, i) => {
    const slot = i === 0 ? 'lead (full width)' : `tile ${i}`;
    return `  ${slot.padEnd(18)} ${p.id}  importance=${p.importance}  ${p.projectName || p.title}`;
  });
  const extra = highlights.length > 1 + TILE_COUNT
    ? [`  (not shown)       ${highlights.slice(1 + TILE_COUNT).map((p) => `${p.id}(${p.importance})`).join(', ')}`]
    : [];
  return ['Home highlight ranking:', ...lines, ...extra].join('\n');
}

export function setProjectImportance(projectId, value) {
  const dir = resolveProjectDir(projectId);
  const configPath = path.join(dir, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const id = projectIdFromDir(dir);
  if (value === null) {
    config.importance = null;
  } else if (!hasImportance(value)) {
    throw new Error(`importance must be a number for ${id}, got: ${value}`);
  } else {
    config.importance = value;
  }
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return { id, dir, config };
}

export function patchHomeIndex(innerHtml) {
  const page = fs.readFileSync(HOME_INDEX_PATH, 'utf8');
  const rootRe =
    /(<div id="patient-stories-root"[^>]*>)([\s\S]*?)(<\/div>\s*\n\s*<div class="projects-cta">)/;
  const m = page.match(rootRe);
  if (!m) {
    throw new Error(`Could not find #patient-stories-root in ${HOME_INDEX_PATH}`);
  }

  const replacement = `${m[1]}${innerHtml}\n      ${m[3]}`;
  if (replacement === m[0]) return false;
  const next = page.replace(m[0], replacement);
  if (next === page) return false;
  fs.writeFileSync(HOME_INDEX_PATH, next);
  return true;
}
