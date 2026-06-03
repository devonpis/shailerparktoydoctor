#!/usr/bin/env node
/**
 * Rebuild testimonials.html from project googleReview fields + standalone list.
 *
 * Usage:
 *   node scripts/sync-testimonials-html.mjs [--dry-run]
 *   node scripts/sync-testimonials-html.mjs --intro "Custom intro line."
 */

import fs from 'node:fs';
import {
  buildTestimonialsHtml,
  buildTestimonialsIntroLine,
  dedupeReviewEntries,
  loadProjectReviews,
  loadStandaloneReviews,
  renderQuoteCard,
  TESTIMONIALS_HTML_PATH,
} from './lib/testimonials-html.mjs';
import { reviewFingerprint } from './lib/google-review.mjs';

function parseArgs(argv) {
  const flags = { dryRun: false, intro: buildTestimonialsIntroLine() };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--intro' && argv[i + 1]) {
      flags.intro = argv[++i];
    } else throw new Error(`Unknown arg: ${a}`);
  }
  return flags;
}

function main() {
  const flags = parseArgs(process.argv);
  const projectEntries = loadProjectReviews();
  const standaloneRaw = loadStandaloneReviews();
  const standaloneEntries = dedupeReviewEntries(
    standaloneRaw.map((review) => ({ review }))
  );
  const pageFingerprints = new Set();
  const projectCards = [];
  for (const e of projectEntries) {
    const fp = reviewFingerprint(e.review);
    if (fp) pageFingerprints.add(fp);
    projectCards.push(
      renderQuoteCard({
        review: e.review,
        config: e.config,
        dirName: e.dirName,
        hasIndex: e.hasIndex,
      })
    );
  }
  const standaloneCards = [];
  for (const e of standaloneEntries) {
    const fp = reviewFingerprint(e.review);
    if (fp && pageFingerprints.has(fp)) continue;
    if (fp) pageFingerprints.add(fp);
    standaloneCards.push(renderQuoteCard({ review: e.review }));
  }

  const cards = [...projectCards, ...standaloneCards];

  const html = buildTestimonialsHtml({
    introLine: flags.intro,
    cardsHtml: cards.join('\n\n'),
  });

  if (flags.dryRun) {
    console.log(
      `Would write ${TESTIMONIALS_HTML_PATH} (${projectCards.length} project + ${standaloneCards.length} standalone cards)`
    );
    return;
  }

  fs.writeFileSync(TESTIMONIALS_HTML_PATH, html);
  console.log(
    `Wrote ${TESTIMONIALS_HTML_PATH} — ${projectCards.length} project review(s), ${standaloneCards.length} standalone`
  );
}

main();
