/**
 * Insert or update <blockquote class="project-review"> on project index.html from config.googleReview.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  escapeHtml,
  normalizeGoogleReview,
  normalizeReviewKey,
  reviewFingerprintsMatch,
  reviewerAttributionLine,
} from './google-review.mjs';

const REVIEW_BLOCK_RE = /\s*<blockquote class="project-review">[\s\S]*?<\/blockquote>\s*/;

function unescapeHtml(s) {
  return String(s ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function renderProjectReviewBlock(review) {
  const n = normalizeGoogleReview(review);
  if (!n) return '';
  return [
    '      <blockquote class="project-review">',
    `        <p>“${escapeHtml(n.quote)}”</p>`,
    `        <footer>${escapeHtml(reviewerAttributionLine(review))}</footer>`,
    '      </blockquote>',
    '',
  ].join('\n');
}

function footerAttributionText(inner) {
  const footerMatch = inner.match(/<footer>([\s\S]*?)<\/footer>/);
  if (!footerMatch) return '';
  return unescapeHtml(footerMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
}

export function projectReviewAttributionInSync(html, configReview) {
  const m = html.match(/<blockquote class="project-review">([\s\S]*?)<\/blockquote>/);
  if (!m) return true;
  const expected = reviewerAttributionLine(configReview);
  return normalizeReviewKey(footerAttributionText(m[1])) === normalizeReviewKey(expected);
}

export function parseProjectReviewFromHtml(html) {
  const m = html.match(/<blockquote class="project-review">([\s\S]*?)<\/blockquote>/);
  if (!m) return null;
  const inner = m[1];
  const quoteMatch = inner.match(/<p>\s*[“"]?([\s\S]*?)[”"]?\s*<\/p>/);
  if (!quoteMatch) return null;
  const quote = unescapeHtml(quoteMatch[1].replace(/\s+/g, ' ').trim());
  if (!inner.match(/<footer>[\s\S]*?<\/footer>/)) return null;
  return normalizeGoogleReview({ quote });
}

export function projectStoryReviewStatus(html, config) {
  const configReview = normalizeGoogleReview(config.googleReview);
  const htmlReview = parseProjectReviewFromHtml(html);
  if (!configReview) {
    return {
      needsSync: Boolean(htmlReview),
      configReview: null,
      htmlReview,
      inSync: !htmlReview,
    };
  }
  if (!htmlReview) {
    return { needsSync: true, configReview, htmlReview: null, inSync: false };
  }
  const quoteMatch = reviewFingerprintsMatch(configReview, htmlReview);
  const attributionMatch = projectReviewAttributionInSync(html, configReview);
  const layoutMatch = /      <blockquote class="project-review">\n        <p>[\s\S]*?<\/blockquote>/.test(
    html
  );
  const inSync = quoteMatch && attributionMatch && layoutMatch;
  return { needsSync: !inSync, configReview, htmlReview, inSync };
}

function applyReviewToHtml(html, block) {
  if (REVIEW_BLOCK_RE.test(html)) {
    if (!block) return html.replace(REVIEW_BLOCK_RE, '\n');
    return html.replace(REVIEW_BLOCK_RE, `\n\n${block}`);
  }
  if (!block) return html;
  const leadRe = /(<p class="project-lead text-lead">[\s\S]*?<\/p>)\s*/;
  if (leadRe.test(html)) {
    return html.replace(leadRe, `$1\n\n${block}`);
  }
  return html.replace(/(\s*)(<section class="project-prose">)/, `\n\n${block}$1$2`);
}

/**
 * @returns {{ skipped: boolean, action: string, changed: boolean }}
 */
export function syncProjectGoogleReviewHtml(dir, config, { dryRun = false } = {}) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    return { skipped: true, action: 'no index.html', changed: false };
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const status = projectStoryReviewStatus(html, config);
  const block = renderProjectReviewBlock(config.googleReview);

  if (!status.needsSync) {
    return {
      skipped: false,
      action: status.configReview ? 'googleReview already on story page' : 'no googleReview',
      changed: false,
    };
  }

  if (!block && !status.htmlReview) {
    return { skipped: false, action: 'no googleReview', changed: false };
  }

  const next = applyReviewToHtml(html, block);
  const action = block
    ? status.htmlReview
      ? 'updated project-review block'
      : 'added project-review block'
    : 'removed project-review block';

  if (!dryRun && next !== html) {
    fs.writeFileSync(htmlPath, next);
  }

  return { skipped: false, action, changed: next !== html };
}
