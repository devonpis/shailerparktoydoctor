#!/usr/bin/env node
/**
 * T-00016 — Promote new/ preview site to production root paths.
 *
 * Usage:
 *   node scripts/cutover-promote-new-to-root.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const NEW_DIR = path.join(REPO_ROOT, 'new');
const ARCHIVE_DIR = path.join(REPO_ROOT, 'legacy/website-pre-2026');

const LEGACY_ROOT_FILES = ['index.html', 'contact.html', 'reviews.html', 'index_bk.html'];

const COPY_MAP = [
  ['index.html', 'index.html'],
  ['contact.html', 'contact.html'],
  ['testimonials.html', 'testimonials.html'],
  ['projects/index.html', 'projects/index.html'],
  ['css/site.css', 'css/site.css'],
  ['css/toydoctor.css', 'css/toydoctor.css'],
  ['data/projects-index.json', 'data/projects-index.json'],
];

const PATH_REPLACEMENTS = [
  ['/data/projects-index.json', '/data/projects-index.json'],
  ['/includes/', '/includes/'],
  ['/css/', '/css/'],
  ['/js/', '/js/'],
  ['/testimonials.html', '/testimonials.html'],
  ['/contact.html', '/contact.html'],
  ['/projects/', '/projects/'],
  ['/', '/'],
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest, dryRun) {
  ensureDir(path.dirname(dest));
  if (dryRun) {
    console.log(`  copy ${path.relative(REPO_ROOT, src)} → ${path.relative(REPO_ROOT, dest)}`);
    return;
  }
  fs.copyFileSync(src, dest);
}

function copyTree(srcDir, destDir, dryRun) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  for (const name of fs.readdirSync(srcDir)) {
    const src = path.join(srcDir, name);
    const dest = path.join(destDir, name);
    if (fs.statSync(src).isDirectory()) copyTree(src, dest, dryRun);
    else copyFile(src, dest, dryRun);
  }
}

function replacePreviewPaths(text) {
  let out = text;
  for (const [from, to] of PATH_REPLACEMENTS) {
    out = out.split(from).join(to);
  }
  return out;
}

function stripNoindex(html) {
  return html.replace(/\s*<meta name="robots" content="noindex, nofollow"\s*\/?>\s*/gi, '\n');
}

function addHomeCanonical(html) {
  if (/<link rel="canonical"/i.test(html)) return html;
  return html.replace(
    /<meta name="viewport"[^>]*\/?>/i,
    (m) => `${m}\n    <link rel="canonical" href="https://sptoydoctor.com.au/" />`
  );
}

function patchTextFile(filePath, { dryRun, stripRobots = false, homeCanonical = false } = {}) {
  let text = fs.readFileSync(filePath, 'utf8');
  const next = replacePreviewPaths(stripRobots ? stripNoindex(homeCanonical ? addHomeCanonical(text) : text) : text);
  if (next === text) return false;
  if (!dryRun) fs.writeFileSync(filePath, next);
  return true;
}

function collectPatchFiles() {
  const files = new Set();
  const roots = [
    path.join(REPO_ROOT, 'index.html'),
    path.join(REPO_ROOT, 'contact.html'),
    path.join(REPO_ROOT, 'testimonials.html'),
    path.join(REPO_ROOT, 'projects/index.html'),
    path.join(REPO_ROOT, 'js'),
    path.join(REPO_ROOT, 'includes'),
    path.join(REPO_ROOT, 'css'),
    path.join(REPO_ROOT, 'data/projects-index.json'),
    path.join(REPO_ROOT, 'projects'),
    path.join(REPO_ROOT, 'scripts'),
    path.join(REPO_ROOT, '.cursor/rules'),
  ];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    if (fs.statSync(root).isFile()) {
      files.add(root);
      continue;
    }
    walk(root, files);
  }
  return [...files].filter((f) => {
    if (f.includes(`${path.sep}legacy${path.sep}`)) return false;
    if (f.includes(`${path.sep}node_modules${path.sep}`)) return false;
    return /\.(html|js|mjs|json|mdc|md|py)$/.test(f);
  });
}

function walk(dir, files) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name === 'legacy' || name.name === 'new' || name.name === 'node_modules') continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, files);
    else files.add(full);
  }
}

function writeSitemap(dryRun) {
  const indexPath = path.join(REPO_ROOT, 'data/projects-index.json');
  const rows = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const urls = [
    'https://sptoydoctor.com.au/',
    'https://sptoydoctor.com.au/projects/',
    'https://sptoydoctor.com.au/testimonials.html',
    'https://sptoydoctor.com.au/contact.html',
    ...rows.map((r) => `https://sptoydoctor.com.au${r.url}`),
  ];
  const unique = [...new Set(urls)];
  const body = unique.map((loc) => `  <url>\n    <loc>${loc}</loc>\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  if (dryRun) {
    console.log(`  sitemap.xml (${unique.length} URLs)`);
    return;
  }
  fs.writeFileSync(path.join(REPO_ROOT, 'sitemap.xml'), xml);
}

function writeRobots(dryRun) {
  const text = `User-agent: *
Allow: /

Sitemap: https://sptoydoctor.com.au/sitemap.xml
`;
  if (dryRun) {
    console.log('  robots.txt (removed Disallow /)');
    return;
  }
  fs.writeFileSync(path.join(REPO_ROOT, 'robots.txt'), text);
}

function removeNewDir(dryRun) {
  if (!fs.existsSync(NEW_DIR)) return;
  if (dryRun) {
    console.log('  remove new/');
    return;
  }
  fs.rmSync(NEW_DIR, { recursive: true, force: true });
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!fs.existsSync(NEW_DIR)) {
    console.error('new/ not found — already cut over?');
    process.exit(1);
  }

  console.log(dryRun ? '[dry-run] T-00016 cutover' : 'T-00016 cutover: promote new/ → root');

  console.log('\n--- Archive legacy root pages ---');
  if (!dryRun) ensureDir(ARCHIVE_DIR);
  for (const name of LEGACY_ROOT_FILES) {
    const src = path.join(REPO_ROOT, name);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(ARCHIVE_DIR, name);
    if (dryRun) console.log(`  archive ${name}`);
    else {
      fs.renameSync(src, dest);
      console.log(`  archived ${name}`);
    }
  }
  const legacyCss = path.join(REPO_ROOT, 'css/style.css');
  if (fs.existsSync(legacyCss)) {
    const dest = path.join(ARCHIVE_DIR, 'css-style.css');
    if (dryRun) console.log('  archive css/style.css');
    else {
      ensureDir(path.dirname(dest));
      fs.renameSync(legacyCss, dest);
      console.log('  archived css/style.css');
    }
  }

  console.log('\n--- Copy new/ → root ---');
  for (const [relFrom, relTo] of COPY_MAP) {
    copyFile(path.join(NEW_DIR, relFrom), path.join(REPO_ROOT, relTo), dryRun);
  }
  copyTree(path.join(NEW_DIR, 'js'), path.join(REPO_ROOT, 'js'), dryRun);
  copyTree(path.join(NEW_DIR, 'includes'), path.join(REPO_ROOT, 'includes'), dryRun);

  console.log('\n--- Strip noindex on marketing pages ---');
  for (const rel of ['index.html', 'contact.html', 'testimonials.html', 'projects/index.html']) {
    const p = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(p)) continue;
    if (dryRun) console.log(`  noindex off: ${rel}`);
    else {
      let html = fs.readFileSync(p, 'utf8');
      html = stripNoindex(html);
      if (rel === 'index.html') html = addHomeCanonical(html);
      html = replacePreviewPaths(html);
      fs.writeFileSync(p, html);
      console.log(`  patched ${rel}`);
    }
  }

  console.log('\n--- Replace / paths repo-wide ---');
  let patched = 0;
  for (const file of collectPatchFiles()) {
    const stripRobots = false;
    if (patchTextFile(file, { dryRun, stripRobots })) {
      patched += 1;
      if (patched <= 30 || dryRun) console.log(`  ${path.relative(REPO_ROOT, file)}`);
    }
  }
  console.log(`  ${patched} file(s) updated`);

  console.log('\n--- robots.txt + sitemap.xml ---');
  writeRobots(dryRun);
  writeSitemap(dryRun);

  console.log('\n--- Remove new/ ---');
  removeNewDir(dryRun);

  console.log(dryRun ? '\n[dry-run] done' : '\nCutover complete.');
}

main();
