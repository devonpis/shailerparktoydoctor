/**
 * Heuristics: which projects need title/description review (BR-029).
 * Excludes publish-ready copy (e.g. 0002, 0003).
 */

/** Fully excluded — both fields already owner/agent story quality. */
export const EXCLUDE_FROM_REVIEW_IDS = new Set(['0002', '0003']);

/** Description OK; may still need title review. */
export const EXCLUDE_DESCRIPTION_ONLY_IDS = new Set(['0001']);

const POLISHED_DESC_RE =
  /^[^—\n]{2,100} — (plush|electronic|mechanical|paintjob|plush and|electronics|mechanical work|figure repair|intake|assessed)/i;

export function isGenericDescription(description) {
  const t = (description || '').trim();
  if (!t) return true;
  if (/^repair -/i.test(t)) return true;
  if (/^intake —/i.test(t)) return true;
  if (/^non-repairable/i.test(t)) return true;
  if (POLISHED_DESC_RE.test(t) && t.length < 160) return true;
  if (/ — .+ and .+ and .+\.$/.test(t)) return true; // triple skill phrase from polish
  return false;
}

export function isProperDescription(description) {
  const t = (description || '').trim();
  if (!t || isGenericDescription(t)) return false;
  if (/https?:\/\//.test(t)) return true;
  if (/[🛠🦆🕷▶️✨🧚]/.test(t)) return true;
  if (t.length >= 140 && /[.!?]/.test(t) && !POLISHED_DESC_RE.test(t)) return true;
  return false;
}

export function isGenericTitle(title, projectName) {
  const t = (title || '').trim();
  if (!t) return true;
  if (t === projectName) return true;
  return false;
}

export function isProperTitle(title, projectName) {
  const t = (title || '').trim();
  if (!t || isGenericTitle(t, projectName)) return false;
  if (t.length >= 18 && (/—|–/.test(t) || / - /.test(t))) return true;
  if (t.length >= 24 && t !== projectName) return true;
  return false;
}

export function reviewFlags(id, cfg) {
  if (EXCLUDE_FROM_REVIEW_IDS.has(id)) {
    return { inScope: false, reason: 'excluded — publish-ready description and title' };
  }
  const descOk =
    EXCLUDE_DESCRIPTION_ONLY_IDS.has(id) || isProperDescription(cfg.description);
  const titleOk = isProperTitle(cfg.title, cfg.projectName);
  const needsDescription = !descOk;
  const needsTitle = !titleOk;
  if (!needsDescription && !needsTitle) {
    return { inScope: false, reason: 'already proper title and description' };
  }
  return {
    inScope: true,
    needsDescription,
    needsTitle,
    reason: [
      needsDescription && 'description',
      needsTitle && 'title',
    ]
      .filter(Boolean)
      .join(' + '),
  };
}
