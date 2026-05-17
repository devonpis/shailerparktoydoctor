#!/usr/bin/env node
/**
 * Merge partial authorName (+ profileUrl) from data/google-review-author-names.json into configs.
 * Names in that file must already be partial (e.g. Howard C.) — never full surnames.
 * Run before apply-google-review --sync-all when names were stripped from configs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS_DIR, projectIdFromDir } from './lib/resolve-project-dir.mjs';
import { googleReviewForConfig, normalizeGoogleReview } from './lib/google-review.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const NAMES_PATH = path.join(REPO_ROOT, 'data/google-review-author-names.json');
const STANDALONE_PATH = path.join(REPO_ROOT, 'data/testimonials-standalone.json');

function main() {
  const data = JSON.parse(fs.readFileSync(NAMES_PATH, 'utf8'));
  let projects = 0;

  for (const name of fs.readdirSync(PROJECTS_DIR)) {
    if (!/^\d{4} - /.test(name)) continue;
    const id = projectIdFromDir(path.join(PROJECTS_DIR, name));
    const author = data[id];
    if (!author?.authorName) continue;

    const configPath = path.join(PROJECTS_DIR, name, 'config.json');
    if (!fs.existsSync(configPath)) continue;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const review = normalizeGoogleReview(config.googleReview);
    if (!review) continue;

    config.googleReview = googleReviewForConfig({
      ...review,
      authorName: author.authorName,
      profileUrl: author.profileUrl ?? review.profileUrl,
    });
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    console.log(`  ${id} — ${author.authorName}`);
    projects += 1;
  }

  const standaloneList = data.standalone;
  if (Array.isArray(standaloneList) && fs.existsSync(STANDALONE_PATH)) {
    const current = JSON.parse(fs.readFileSync(STANDALONE_PATH, 'utf8'));
    const list = Array.isArray(current) ? current : current.reviews;
    for (const entry of list) {
      const review = normalizeGoogleReview(entry);
      if (!review) continue;
      const patch = standaloneList.find(
        (p) => p.profileUrl && review.profileUrl && p.profileUrl === review.profileUrl
      );
      if (!patch) continue;
      Object.assign(entry, googleReviewForConfig({ ...review, ...patch }));
    }
    fs.writeFileSync(STANDALONE_PATH, `${JSON.stringify(list, null, 2)}\n`);
    console.log(`  standalone — ${standaloneList.length} review(s)`);
  }

  console.log(`\nRestored author names on ${projects} project(s).`);
}

main();
