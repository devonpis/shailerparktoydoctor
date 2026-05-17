import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, PROJECTS_DIR } from './resolve-project-dir.mjs';
import {
  escapeHtml,
  formatReviewerDisplayName,
  normalizeGoogleReview,
  repairLinkLabel,
  repairPageHrefSync,
  reviewFingerprint,
} from './google-review.mjs';

function unescapeHtml(s) {
  return String(s ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Reviews already rendered on testimonials.html (for skip-if-captured checks). */
export function parseTestimonialsPageReviews(html) {
  if (!html || typeof html !== 'string') return [];
  const reviews = [];
  const parts = html.split('<article class="quote-card">');
  for (let i = 1; i < parts.length; i += 1) {
    const block = parts[i].split('</article>')[0];
    const quoteMatch = block.match(/<p class="stars"[^>]*>[\s\S]*?<\/p>\s*<p>\s*([\s\S]*?)\s*<\/p>/);
    if (!quoteMatch) continue;
    const quote = unescapeHtml(quoteMatch[1].replace(/\s+/g, ' ').trim());
    const review = normalizeGoogleReview({ quote });
    if (review) reviews.push(review);
  }
  return reviews;
}

export function loadTestimonialsPageReviews() {
  if (!fs.existsSync(TESTIMONIALS_HTML_PATH)) return [];
  return parseTestimonialsPageReviews(fs.readFileSync(TESTIMONIALS_HTML_PATH, 'utf8'));
}

export function loadTestimonialsPageFingerprintSet() {
  const set = new Set();
  for (const review of loadTestimonialsPageReviews()) {
    const fp = reviewFingerprint(review);
    if (fp) set.add(fp);
  }
  return set;
}

export function isReviewCapturedOnTestimonialsPage(review) {
  const fp = reviewFingerprint(review);
  if (!fp) return false;
  return loadTestimonialsPageFingerprintSet().has(fp);
}

/** Drop later entries that repeat the same review (project + standalone merge). */
export function dedupeReviewEntries(entries) {
  const seen = new Set();
  const out = [];
  for (const entry of entries) {
    const fp = reviewFingerprint(entry.review);
    if (!fp || seen.has(fp)) continue;
    seen.add(fp);
    out.push(entry);
  }
  return out;
}

export const TESTIMONIALS_HTML_PATH = path.join(REPO_ROOT, 'testimonials.html');
export const STANDALONE_REVIEWS_PATH = path.join(REPO_ROOT, 'data/testimonials-standalone.json');

const MAPS_LISTING_URL = 'https://maps.app.goo.gl/Yx6zSEhhyDuv6geB8';

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function loadStandaloneReviews() {
  const data = readJson(STANDALONE_REVIEWS_PATH);
  if (!data) return [];
  const list = Array.isArray(data) ? data : data.reviews;
  if (!Array.isArray(list)) return [];
  return list.map((r) => normalizeGoogleReview(r)).filter(Boolean);
}

export function loadProjectReviews() {
  const entries = [];
  for (const dirName of fs.readdirSync(PROJECTS_DIR)) {
    if (!/^\d{4} - /.test(dirName) || dirName.startsWith('0000')) continue;
    const configPath = path.join(PROJECTS_DIR, dirName, 'config.json');
    if (!fs.existsSync(configPath)) continue;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const review = normalizeGoogleReview(config.googleReview);
    if (!review || review.featuredOnTestimonials === false) continue;
    const hasIndex = fs.existsSync(path.join(PROJECTS_DIR, dirName, 'index.html'));
    entries.push({
      review,
      config,
      projectId: dirName.slice(0, 4),
      dirName,
      hasIndex,
      sortKey: review.featuredOrder ?? Number(dirName.slice(0, 4)),
    });
  }
  entries.sort((a, b) => b.sortKey - a.sortKey);
  return dedupeReviewEntries(entries);
}

function renderQuoteCardAuthor(review) {
  const display = formatReviewerDisplayName(review.authorName);
  if (!display) return '';
  return `        <p class="quote-card__attribution">— ${escapeHtml(display)}</p>\n`;
}

export function renderQuoteCard({ review, config, dirName, hasIndex }) {
  const repairHref = config && dirName ? repairPageHrefSync(config, dirName, hasIndex) : null;
  const repairBlock = repairHref
    ? `        <p class="quote-card__repair">
          <a href="${escapeHtml(repairHref)}">Repair: ${escapeHtml(repairLinkLabel(config))}</a>
        </p>\n`
    : '';

  return `      <article class="quote-card">
        <p class="stars" aria-hidden="true">★★★★★</p>
        <p>
          ${escapeHtml(review.quote)}
        </p>
${repairBlock}${renderQuoteCardAuthor(review)}      </article>`;
}

export function buildTestimonialsHtml({ introLine, cardsHtml }) {
  return `<!DOCTYPE html>
<html lang="en-AU">
  <head>
    <meta charset="utf-8" />
    <title>Testimonials — Shailer Park Toy Doctor</title>
    <meta name="description" content="32 five-star Google reviews for Shailer Park Toy Doctor." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Lobster&family=Nunito:wght@400;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/css/site.css" />
  </head>
  <body data-active-page="testimonials">
    <div id="site-header"></div>

    <main class="page-main">
      <h1>What our customers say</h1>
      <p>${escapeHtml(introLine)}</p>
      <p>
        <a href="${MAPS_LISTING_URL}" rel="noopener noreferrer" target="_blank"
          ><strong>Read all reviews on Google Maps →</strong></a
        >
      </p>

      <div class="testimonials-reviews">
${cardsHtml}
      </div>
    </main>

    <div id="site-footer"></div>

    <script src="/js/brand-text.js" defer></script>
    <script src="/js/site-chrome.js" defer></script>
  </body>
</html>
`;
}
