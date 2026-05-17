#!/usr/bin/env node
/**
 * T-00030 fallback: list projects that need Lens / web search for product ID.
 *
 * Usage: node scripts/report-product-id-fallback.mjs [--output docs/reports/product-id-fallback-DATE.md]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listProjectImages, pickPrimaryImage } from './lib/project-media.mjs';
import { projectSiteImageUrl, DEFAULT_SITE_BASE_URL } from './lib/site-image-url.mjs';
import {
  PRODUCT_ID_SKIP_IDS,
  needsProductIdFallback,
  googleLensUrl,
  googleImageSearchUrl,
} from './lib/product-id-fallback.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');
const date = new Date().toISOString().slice(0, 10);

function parseArgs() {
  const outIdx = process.argv.indexOf('--output');
  const outPath =
    outIdx >= 0
      ? path.resolve(process.argv[outIdx + 1])
      : path.join(REPO_ROOT, 'docs/reports', `product-id-fallback-${date}.md`);
  return { outPath, csvPath: outPath.replace(/\.md$/, '.csv') };
}

function suggestQuery(projectName, folder) {
  return `${projectName || folder} toy repair figure plush`.replace(/\s+/g, ' ').trim();
}

function scan() {
  const rows = [];
  for (const folder of fs.readdirSync(PROJECTS_DIR).sort()) {
    const m = folder.match(/^(\d{4}) - (.+)$/);
    if (!m || PRODUCT_ID_SKIP_IDS.has(m[1])) continue;
    const id = m[1];
    const dir = path.join(PROJECTS_DIR, folder);
    const cfgPath = path.join(dir, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const name = cfg.projectName || m[2];
    const imgs = listProjectImages(dir);
    const needs = needsProductIdFallback(name);
    if (!needs && imgs.length) continue;

    let lensUrl = '';
    let imageFile = '';
    let siteUrl = '';
    if (imgs.length) {
      try {
        const primary = path.basename(pickPrimaryImage(dir));
        imageFile = primary;
        siteUrl = projectSiteImageUrl(DEFAULT_SITE_BASE_URL, folder, primary);
        lensUrl = googleLensUrl(siteUrl);
      } catch {
        imageFile = imgs[0] || '';
        if (imageFile) {
          siteUrl = projectSiteImageUrl(DEFAULT_SITE_BASE_URL, folder, imageFile);
          lensUrl = googleLensUrl(siteUrl);
        }
      }
    }

    rows.push({
      id,
      folder,
      projectName: name,
      imageCount: imgs.length,
      imageFile,
      siteUrl,
      lensUrl,
      googleImageUrl: siteUrl ? googleImageSearchUrl(siteUrl) : '',
      suggestedQuery: suggestQuery(name, m[2]),
      noPhotos: imgs.length === 0,
    });
  }
  return rows;
}

function writeReport(rows, { outPath, csvPath }) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const lines = [
    '# Product ID fallback report (Lens / web search)',
    '',
    `Date: ${date}`,
    '',
    'Open **Lens URL** in a browser (image must load at **Site URL** on sptoydoctor.com.au).',
    'See [`docs/product-identification.md`](../product-identification.md).',
    '',
    `**${rows.length}** project(s) flagged.`,
    '',
    '| ID | projectName | Photos | Best image | Lens |',
    '|----|-------------|--------|------------|------|',
  ];
  for (const r of rows) {
    const lens = r.lensUrl ? `[Lens](${r.lensUrl})` : '—';
    lines.push(
      `| ${r.id} | ${r.projectName} | ${r.imageCount} | ${r.imageFile || '—'} | ${lens} |`
    );
  }
  lines.push('', '## Details', '');
  for (const r of rows) {
    lines.push(`### ${r.id} — ${r.projectName}`, '');
    lines.push(`- Folder: \`${r.folder}\``);
    if (r.noPhotos) lines.push('- **No photos** — timesheet name only; use Lens when images exist.');
    if (r.siteUrl) lines.push(`- Site URL: ${r.siteUrl}`);
    if (r.lensUrl) lines.push(`- Lens: ${r.lensUrl}`);
    if (r.googleImageUrl) lines.push(`- Google Images: ${r.googleImageUrl}`);
    lines.push(`- Web search query: \`${r.suggestedQuery}\``);
    lines.push('');
  }
  fs.writeFileSync(outPath, `${lines.join('\n')}\n`);

  const csv = [
    'id,folder,projectName,image_count,image_file,site_url,lens_url,suggested_query\n',
    ...rows.map((r) =>
      [
        r.id,
        `"${r.folder.replace(/"/g, '""')}"`,
        `"${r.projectName.replace(/"/g, '""')}"`,
        r.imageCount,
        r.imageFile,
        r.siteUrl,
        r.lensUrl,
        `"${r.suggestedQuery.replace(/"/g, '""')}"`,
      ].join(',')
    ),
  ];
  fs.writeFileSync(csvPath, csv.join('\n'));
  console.log(`Report: ${outPath}`);
  console.log(`CSV:    ${csvPath}`);
  console.log(`Flagged: ${rows.length}`);
}

const { outPath, csvPath } = parseArgs();
writeReport(scan(), { outPath, csvPath });
