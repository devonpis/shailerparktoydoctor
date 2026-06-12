/**
 * Normalise googleReview on project config.json and build testimonial cards.
 * authorName is always stored and shown as first name + last initial (e.g. Howard C.) — never full surname in repo.
 */

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** True when name is already partial (e.g. "Howard C." or single "Lindy"). */
export function isPartialReviewerName(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length <= 1) return true;
  const last = parts[parts.length - 1];
  return /^[A-Za-z]\.?$/.test(last);
}

/** "Howard Chung" → "Howard C."; already-partial names unchanged (period normalized). */
export function formatReviewerDisplayName(name) {
  const raw = String(name ?? '').trim();
  if (!raw) return null;
  if (isPartialReviewerName(raw)) {
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0];
    const first = parts[0];
    const initial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${first} ${initial}.`;
  }
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  if (!lastInitial) return first;
  return `${first} ${lastInitial}.`;
}

/** Canonical authorName for config.json (partial only). */
export function authorNameForConfig(name) {
  return formatReviewerDisplayName(name);
}

/** Story / card attribution: "— Howard C." or "Google review" when no name. */
export function reviewerAttributionLine(review) {
  const display = formatReviewerDisplayName(
    normalizeGoogleReview(review)?.authorName ?? review?.authorName ?? review?.author
  );
  return display ? `— ${display}` : 'Google review';
}

/** Accept legacy (author/text/authorName); authorName normalized to partial. */
export function normalizeGoogleReview(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const quote = (raw.quote ?? raw.text ?? '').trim();
  if (!quote) return null;
  const rawAuthor = (raw.authorName ?? raw.author ?? '').trim() || null;
  const authorName = rawAuthor ? formatReviewerDisplayName(rawAuthor) : null;
  return {
    quote,
    authorName,
    profileUrl: (raw.profileUrl ?? '').trim() || null,
    featuredOnTestimonials: raw.featuredOnTestimonials !== false,
    featuredOrder: typeof raw.featuredOrder === 'number' ? raw.featuredOrder : null,
  };
}

/** Config shape — authorName is partial only (e.g. Howard C.). */
export function googleReviewForConfig(review) {
  if (!review) return null;
  const n = normalizeGoogleReview(review);
  if (!n) return null;
  return {
    quote: n.quote,
    ...(n.authorName ? { authorName: n.authorName } : {}),
    ...(n.profileUrl ? { profileUrl: n.profileUrl } : {}),
    featuredOnTestimonials: n.featuredOnTestimonials,
    ...(n.featuredOrder != null ? { featuredOrder: n.featuredOrder } : {}),
  };
}

/** Site-root path for testimonial “Repair: …” link (not a full https URL). */
export function repairPageHrefSync(config, projectDirName, hasIndexHtml) {
  if (config.webpageUrl) {
    try {
      const pathname = new URL(config.webpageUrl).pathname;
      return pathname.endsWith('/') ? pathname : `${pathname}/`;
    } catch {
      /* fall through */
    }
  }
  if (!hasIndexHtml) return null;
  return `/projects/${encodeURIComponent(projectDirName)}/`;
}

export function repairLinkLabel(config) {
  const title = (config.title || config.projectName || '').trim();
  return title || 'View this repair';
}

/** Collapse whitespace and case for stable duplicate checks. */
export function normalizeReviewKey(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/['']/g, "'");
}

/**
 * Stable id for “same review” — profile URL + quote when available, else quote only.
 */
export function reviewFingerprint(review) {
  const n = normalizeGoogleReview(review);
  if (!n) return null;
  const quoteKey = normalizeReviewKey(n.quote);
  const profile = (n.profileUrl ?? '').trim().toLowerCase();
  if (profile) return `profile:${profile}|quote:${quoteKey}`;
  return `quote:${quoteKey}`;
}

export function reviewFingerprintsMatch(a, b) {
  const fa = reviewFingerprint(a);
  const fb = reviewFingerprint(b);
  return fa != null && fa === fb;
}
