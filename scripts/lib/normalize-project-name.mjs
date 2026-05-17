/**
 * Normalize project display / folder names for import and folders:
 * parentheticals, quantity "x N" + plurals, job suffixes, then strip special characters.
 */

function pluralizeWord(word, count) {
  if (count <= 1) return word;
  const w = word.toLowerCase();
  if (/^(friends|figures|rabbits|dolls|trucks|buses|geese|sheep|fish|deer|moose|series|media|goods)$/i.test(w)) {
    return word;
  }
  if (/s$|x$|z$|ch$|sh$/i.test(w) && !/ss$/i.test(w)) return word;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  if (/fe$/i.test(word)) return `${word.slice(0, -2)}ves`;
  if (/f$/i.test(word)) return `${word.slice(0, -1)}ves`;
  if (/o$/i.test(word)) return `${word}es`;
  return `${word}s`;
}

function pluralizeLastWord(phrase, count) {
  if (count <= 1) return phrase;
  const parts = phrase.trim().split(/\s+/);
  if (!parts.length) return phrase;
  const last = parts.length - 1;
  parts[last] = pluralizeWord(parts[last], count);
  return parts.join(' ');
}

/** Timesheet job-type tails (drop after hyphens are spaced). */
const JOB_TAIL_RE = /\s+(repair|cleaning|modifying|restoratiion|restoration)\s*$/i;

function stripHyphensAndJobSuffixes(name) {
  let s = name
    .replace(/\//g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  s = s.replace(JOB_TAIL_RE, '').trim();
  return s;
}

/** Keep letters, numbers, spaces only; expand & to "and". */
export function stripSpecialChars(name) {
  return String(name || '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} name
 * @returns {string}
 */
export function normalizeProjectName(name) {
  let s = String(name || '').trim();
  let count = null;

  const lead = s.match(/^(\d+)\s*x\s+(.+)$/i);
  if (lead) {
    count = Number(lead[1]);
    s = lead[2].trim();
  }

  const trail = s.match(/^(.+?)\s+x\s*(\d+)\s*$/i);
  if (trail) {
    count = Number(trail[2]);
    s = trail[1].trim();
  }

  s = s.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

  if (count != null && count > 1) {
    s = pluralizeLastWord(s, count);
  }

  s = stripHyphensAndJobSuffixes(s);
  s = stripSpecialChars(s);

  return s;
}

/** Folder-safe label (no id prefix). */
export function folderLabelFromProjectName(name) {
  return normalizeProjectName(name).slice(0, 80);
}

/** Names already stripped of "x N" but still singular — timesheet import follow-up. */
const LEGACY_PLURAL_FIX = new Map([
  ['pokemon pet', 'Pokemon pets'],
  ['phone and mic toy', 'Phone and Mic toys'],
]);

export function normalizeProjectNameWithLegacyFixes(name) {
  const normalized = normalizeProjectName(name);
  const key = normalized.toLowerCase();
  return LEGACY_PLURAL_FIX.get(key) ?? normalized;
}

