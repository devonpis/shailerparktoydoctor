#!/usr/bin/env node
/**
 * T-00034: Report projects needing title/description review from images + itemDetails + repairDetails.
 *
 * Usage: node scripts/report-title-description-review.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listProjectImages } from './lib/project-media.mjs';
import { reviewFlags, EXCLUDE_FROM_REVIEW_IDS } from './lib/title-description-quality.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const date = new Date().toISOString().slice(0, 10);

function scan() {
  const inScope = [];
  const excluded = [];

  for (const folder of fs.readdirSync(PROJECTS_DIR).sort()) {
    if (!/^\d{4} - /.test(folder)) continue;
    const id = folder.slice(0, 4);
    if (id === '0000') continue;

    const cfgPath = path.join(PROJECTS_DIR, folder, 'config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const flags = reviewFlags(id, cfg);
    const imgs = listProjectImages(path.join(PROJECTS_DIR, folder));

    const row = {
      id,
      folder,
      projectName: cfg.projectName,
      imageCount: imgs.length,
      hasItemDetails: Boolean(cfg.itemDetails?.trim()),
      hasRepairDetails: Boolean(cfg.repairDetails?.trim()),
      title: cfg.title || '',
      description: (cfg.description || '').slice(0, 120),
      ...flags,
    };

    if (flags.inScope) inScope.push(row);
    else excluded.push(row);
  }

  return { inScope, excluded, date };
}

function writeReport({ inScope, excluded, date }) {
  const outDir = path.join(__dirname, '..', 'docs/reports');
  fs.mkdirSync(outDir, { recursive: true });
  const mdPath = path.join(outDir, `title-description-review-${date}.md`);
  const csvPath = path.join(outDir, `title-description-review-${date}.csv`);

  const lines = [
    '# Title & description review report (T-00034)',
    '',
    `Date: ${date}`,
    '',
    'Draft **`title`** (≤500 chars, headline) and **`description`** (≤500 chars, social/lead) from **photos**, **`itemDetails`**, and **`repairDetails`** when present.',
    '',
    `**Excluded (publish-ready):** ${[...EXCLUDE_FROM_REVIEW_IDS].join(', ')}.`,
    '',
    `**${inScope.length}** project(s) in scope.`,
    '',
    '| ID | Needs | Photos | itemDetails | repairDetails | projectName |',
    '|----|-------|--------|-------------|---------------|-------------|',
  ];

  for (const r of inScope) {
    lines.push(
      `| ${r.id} | ${r.reason} | ${r.imageCount} | ${r.hasItemDetails ? 'yes' : '—'} | ${r.hasRepairDetails ? 'yes' : '—'} | ${r.projectName} |`
    );
  }

  lines.push('', '## Excluded (no review needed)', '');
  for (const r of excluded) {
    lines.push(`- **${r.id}** — ${r.reason}`);
  }

  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);

  const csv = [
    'id,folder,needs,image_count,has_item_details,has_repair_details,current_title,current_description_preview\n',
    ...inScope.map((r) =>
      [
        r.id,
        `"${r.folder.replace(/"/g, '""')}"`,
        `"${r.reason.replace(/"/g, '""')}"`,
        r.imageCount,
        r.hasItemDetails ? 1 : 0,
        r.hasRepairDetails ? 1 : 0,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${r.description.replace(/"/g, '""')}"`,
      ].join(',')
    ),
  ];
  fs.writeFileSync(csvPath, csv.join('\n'));

  console.log(`Report: ${mdPath}`);
  console.log(`CSV:    ${csvPath}`);
  console.log(`In scope: ${inScope.length} | Excluded: ${excluded.length}`);
}

writeReport(scan());
