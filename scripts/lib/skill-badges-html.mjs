/**
 * Server-side skill badges (matches js/skills.js markup).
 */

import { normalizeSkills } from './normalize-skills.mjs';

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

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function skillIconHtml(skillId) {
  const emoji = SKILL_EMOJI[skillId];
  if (!emoji) return '';
  return `<span class="skill-icon skill-icon--emoji" aria-hidden="true">${emoji}</span>`;
}

export function overlayBadgesHtml(skills) {
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

/** Story page tag row — emoji + label. */
export function detailBadgesHtml(skills) {
  const list = normalizeSkills(skills);
  if (!list.length) return '';
  const items = list
    .map(
      (id) =>
        `<span class="skill-badge skill-badge--detail skill-badge--${id}">${skillIconHtml(id)}<span class="skill-badge__label">${escapeHtml(SKILL_LABELS[id] || id)}</span></span>`
    )
    .join('');
  return `<div class="project-skills" aria-label="Repair skills">${items}</div>`;
}

/** Home “Our Doctors” cards. */
export function doctorBadgesHtml(skills) {
  const list = normalizeSkills(skills);
  if (!list.length) return '';
  const items = list
    .map(
      (id) =>
        `<span class="skill-badge skill-badge--detail skill-badge--${id}">${skillIconHtml(id)}<span class="skill-badge__label">${escapeHtml(SKILL_LABELS[id] || id)}</span></span>`
    )
    .join('');
  return `<div class="doctor-skills" aria-label="Specialties">${items}</div>`;
}

export function buildProjectSkillsRootHtml(skills) {
  const badges = detailBadgesHtml(skills);
  if (!badges) return '<div id="project-skills-root"></div>';
  return `<div id="project-skills-root">\n        ${badges}\n      </div>`;
}

/** Replace empty data-doctor-skills spans on home page. */
export function patchHomeDoctorSkills(html) {
  return html.replace(/<span data-doctor-skills="([^"]+)"><\/span>/g, (_m, raw) => {
    const skill = String(raw || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return doctorBadgesHtml(skill);
  });
}
