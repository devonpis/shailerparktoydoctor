/**
 * Canonical repair skills (BR-028; matches new/js/skills.js).
 * Only: needlework | electronic | mechanical | paintjob
 *
 * @see docs/project-skills.md
 */

export const CANONICAL_SKILL_IDS = ['needlework', 'electronic', 'mechanical', 'paintjob'];

/** Display order on site badges. */
export const SKILL_SORT_ORDER = CANONICAL_SKILL_IDS;

const TO_CANONICAL = {
  needlework: 'needlework',
  plush: 'needlework',
  electronic: 'electronic',
  electronics: 'electronic',
  electrical: 'electronic',
  mechanical: 'mechanical',
  paint: 'paintjob',
  paintjob: 'paintjob',
  painting: 'paintjob',
  sewing: 'needlework',
  restuffing: 'needlework',
  cleaning: 'needlework',
  textile: 'needlework',
  'fabric repair': 'needlework',
  'joint replacement': 'needlework',
  soldering: 'electronic',
  battery: 'electronic',
  'figure repair': 'paintjob',
  gluing: 'paintjob',
  glue: 'paintjob',
  restoration: 'paintjob',
  adhesive: 'paintjob',
  structural: 'paintjob',
  'stain removal': 'paintjob',
};

/**
 * Map legacy / granular skill strings to one or more canonical IDs.
 * @param {string[]} skills
 * @returns {string[]}
 */
export function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  const set = new Set();
  for (const raw of skills) {
    const key = String(raw || '').trim().toLowerCase();
    if (!key) continue;
    const mapped = TO_CANONICAL[key];
    if (mapped) set.add(mapped);
    else if (CANONICAL_SKILL_IDS.includes(key)) set.add(key);
  }
  return SKILL_SORT_ORDER.filter((id) => set.has(id));
}

export function skillLabelPhrase(skills = []) {
  const labels = {
    needlework: 'needlework and fabric repair',
    electronic: 'electronics',
    mechanical: 'mechanical work',
    paintjob: 'paint and finish',
  };
  const list = normalizeSkills(skills);
  if (!list.length) return 'repair';
  if (list.length === 1) return labels[list[0]] || list[0];
  if (list.length === 2) return `${labels[list[0]]} and ${labels[list[1]]}`;
  return list.map((id) => labels[id] || id).slice(0, -1).join(', ') + ', and ' + labels[list[list.length - 1]];
}
