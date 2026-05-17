/**
 * itemDetails length budgets — derived from reference project 0003 (Donald Duck).
 *
 * Donald Duck (0003): 3 paragraphs, lengths 375 / 294 / 330 (total 1003).
 * Venom (0002): 1 paragraph, 414 chars.
 *
 * Tiers for generated copy:
 *   short    — 1 × ≤200 chars (no photos / intake only)
 *   standard — 2 × ≤300 chars (~600 total)
 *   full     — 3 × ≤400 chars (~1000 total, Donald-style)
 */

export const REFERENCE_DONALD_DUCK = {
  projectId: '0003',
  paragraphLengths: [375, 294, 330],
  total: 1003,
};

export const ITEM_DETAILS_TIERS = {
  short: { paragraphs: 1, maxPerParagraph: 200, maxTotal: 200 },
  standard: { paragraphs: 2, maxPerParagraph: 300, maxTotal: 600 },
  full: { paragraphs: 3, maxPerParagraph: 400, maxTotal: 1000 },
};

const FOOTER_RE = /\n\n(?:Photo\/product ID T-00030|Item details —).*$/s;

export function stripItemDetailsFooter(text) {
  return (text || '').replace(FOOTER_RE, '').trim();
}

export function needsItemDetails(itemDetails) {
  const body = stripItemDetailsFooter(itemDetails);
  if (!body) return true;
  if (/^Timesheet import/i.test(body)) return true;
  if (/^Repair photos in repo/i.test(body)) return true;
  return body.length < 150;
}

/** Trim paragraphs to tier limits; drop empty trailing paras. */
export function applyTier(paragraphs, tier = 'standard') {
  const spec = ITEM_DETAILS_TIERS[tier] || ITEM_DETAILS_TIERS.standard;
  const out = [];
  let total = 0;
  for (let i = 0; i < spec.paragraphs && i < paragraphs.length; i++) {
    let p = (paragraphs[i] || '').trim();
    if (!p) continue;
    if (p.length > spec.maxPerParagraph) {
      p = `${p.slice(0, spec.maxPerParagraph - 1).trim()}…`;
    }
    if (total + p.length > spec.maxTotal) {
      const room = spec.maxTotal - total;
      if (room < 80) break;
      p = `${p.slice(0, room - 1).trim()}…`;
    }
    out.push(p);
    total += p.length;
  }
  return out;
}

export function formatItemDetails(paragraphs, tier = 'standard') {
  return applyTier(paragraphs, tier).join('\n\n');
}

export function itemDetailsCharReport(text) {
  const body = stripItemDetailsFooter(text);
  const paras = body.split(/\n\n+/).filter(Boolean);
  return {
    total: body.length,
    paragraphs: paras.length,
    paragraphLengths: paras.map((p) => p.length),
    tier:
      body.length <= ITEM_DETAILS_TIERS.short.maxTotal
        ? 'short'
        : body.length <= ITEM_DETAILS_TIERS.standard.maxTotal
          ? 'standard'
          : 'full',
  };
}
