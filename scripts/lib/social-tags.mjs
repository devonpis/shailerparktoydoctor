/**
 * Social publish uses at most SOCIAL_HASHTAG_MAX hashtags on Facebook and Instagram.
 * config.json may list more tags for the repair page and gallery search.
 */

export const SOCIAL_HASHTAG_MAX = 3;

/** Lower priority when choosing three for FB/IG (story page still shows all tags). */
const GENERIC_SOCIAL_TAGS = new Set(
  [
    'plush',
    'toy',
    'toys',
    'vintage',
    'repair',
    'restoration',
    'interactive',
    'figure',
    'figurine',
    'doll',
    'display',
    'prop',
    'collectible',
    'animatronic',
    'electronics',
    'electronic',
    'mechanical',
    'needlework',
    'cleaning',
    '1990s',
    '2000s',
  ].map((s) => s.toLowerCase())
);

function normalizeTagKey(tag) {
  return String(tag)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');
}

function isGenericTag(tag) {
  const key = normalizeTagKey(tag).replace(/\s+/g, '');
  if (GENERIC_SOCIAL_TAGS.has(key)) return true;
  const words = normalizeTagKey(tag).split(/\s+/).filter(Boolean);
  return words.length === 1 && GENERIC_SOCIAL_TAGS.has(words[0]);
}

/**
 * Score tags for social: prefer product/character/brand names over generic labels.
 * @param {string} tag
 * @param {{ projectName?: string, title?: string }} context
 */
export function scoreTagForSocial(tag, context = {}) {
  const raw = String(tag).trim();
  if (!raw) return -Infinity;
  const hay = `${context.projectName || ''} ${context.title || ''}`.toLowerCase();
  const key = normalizeTagKey(raw);
  let score = 0;

  const words = key.split(/\s+/).filter((w) => w.length > 2);
  for (const w of words) {
    if (hay.includes(w)) score += 12;
  }

  if (/\d/.test(raw)) score += 4;
  if (raw.length > 12) score += 3;
  else if (raw.length > 6) score += 1;

  if (isGenericTag(raw)) score -= 8;

  return score;
}

/**
 * Pick up to SOCIAL_HASHTAG_MAX tags for FB/IG. Preserves original order among winners.
 * @param {string[]} tags
 * @param {{ projectName?: string, title?: string }} [config]
 * @returns {{ picked: string[], omitted: string[] }}
 */
export function pickSocialTags(tags, config = {}) {
  const all = (Array.isArray(tags) ? tags : []).map((t) => String(t).trim()).filter(Boolean);
  if (all.length <= SOCIAL_HASHTAG_MAX) {
    return { picked: all, omitted: [] };
  }

  const ranked = all.map((tag, index) => ({
    tag,
    index,
    score: scoreTagForSocial(tag, config),
  }));
  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  const winners = ranked.slice(0, SOCIAL_HASHTAG_MAX).sort((a, b) => a.index - b.index);
  const pickedSet = new Set(winners.map((w) => w.tag));
  const picked = winners.map((w) => w.tag);
  const omitted = all.filter((t) => !pickedSet.has(t));
  return { picked, omitted };
}
