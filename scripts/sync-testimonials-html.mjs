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
  loadTestimonialEntries,
  renderQuoteCard,
  TESTIMONIALS_HTML_PATH,
} from './lib/testimonials-html.mjs';

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
  const entries = loadTestimonialEntries();
  const projectCount = entries.filter((e) => e.config).length;
  const standaloneCount = entries.length - projectCount;
  const cards = entries.map((e) =>
    renderQuoteCard({
      review: e.review,
      config: e.config,
      dirName: e.dirName,
      hasIndex: e.hasIndex,
    })
  );

  const html = buildTestimonialsHtml({
    introLine: flags.intro,
    cardsHtml: cards.join('\n\n'),
  });

  if (flags.dryRun) {
    console.log(
      `Would write ${TESTIMONIALS_HTML_PATH} (${projectCount} project + ${standaloneCount} standalone cards, newest first)`
    );
    return;
  }

  fs.writeFileSync(TESTIMONIALS_HTML_PATH, html);
  console.log(
    `Wrote ${TESTIMONIALS_HTML_PATH} — ${projectCount} project review(s), ${standaloneCount} standalone (newest first)`
  );
}

main();
