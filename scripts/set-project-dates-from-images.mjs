#!/usr/bin/env node
/**
 * T-00031 / BR-025 — Set startDate/endDate from oldest/newest repair image capture time.
 *
 * Usage:
 *   node scripts/set-project-dates-from-images.mjs [--dry-run]
 *   node scripts/set-project-dates-from-images.mjs --all
 *   node scripts/set-project-dates-from-images.mjs --id 0009
 *   node scripts/set-project-dates-from-images.mjs --force --id 0003
 *
 * Skips 0001–0003 and legacy site imports 0004–0014 unless --force.
 * Does not overwrite non-placeholder timesheet dates unless --force.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROTECTED_DATE_IDS,
  captureRangeFromDir,
  proposeDates,
} from './lib/project-dates-from-images.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const REPORT_DIR = path.join(__dirname, '..', 'docs', 'reports');

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const all = process.argv.includes('--all') || (!process.argv.includes('--id') && !dryRun);
  const idIdx = process.argv.indexOf('--id');
  const ids =
    idIdx >= 0
      ? process.argv.slice(idIdx + 1).filter((a) => !a.startsWith('--'))
      : null;
  return { dryRun, force, all, ids };
}

function listProjectIds() {
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((n) => /^\d{4} - /.test(n))
    .map((n) => n.slice(0, 4))
    .sort();
}

async function processProject(id, { dryRun, force }) {
  if (id === '0000') return { id, action: 'skip-template' };
  if (PROTECTED_DATE_IDS.has(id) && !force) {
    return { id, action: 'skip-protected' };
  }

  const prefix = `${id} - `;
  const folder = fs.readdirSync(PROJECTS_DIR).find((n) => n.startsWith(prefix));
  if (!folder) return { id, action: 'missing' };

  const dir = path.join(PROJECTS_DIR, folder);
  const configPath = path.join(dir, 'config.json');
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const range = await captureRangeFromDir(dir);
  const proposal = proposeDates(cfg, range, { force });

  if (proposal.action === 'update' && !dryRun) {
    cfg.startDate = proposal.startDate;
    cfg.endDate = proposal.endDate;
    fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`);
  }

  return {
    id,
    folder,
    name: cfg.projectName,
    ...proposal,
  };
}

function writeReport(results, dateLabel) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const mdPath = path.join(REPORT_DIR, `project-dates-from-images-${dateLabel}.md`);
  const csvPath = path.join(REPORT_DIR, `project-dates-from-images-${dateLabel}.csv`);

  const updated = results.filter((r) => r.action === 'update');
  const lines = [
    `# Project dates from images (T-00031)`,
    '',
    `Date: ${dateLabel}`,
    '',
    `**Updated:** ${updated.length} · **Skipped (trusted):** ${results.filter((r) => r.action === 'skip-trusted').length} · **No images:** ${results.filter((r) => r.action === 'no-images').length}`,
    '',
    '| ID | Action | Images | Current start → end | Proposed start → end |',
    '|----|--------|--------|---------------------|----------------------|',
  ];

  const csv = ['id,action,image_count,current_start,current_end,proposed_start,proposed_end,project_name\n'];

  for (const r of results) {
    if (r.action === 'skip-template' || r.action === 'missing') continue;
    const cur = r.current || { startDate: r.startDate, endDate: r.endDate };
    const img = r.range?.imageCount ?? 0;
    const curStr = cur.startDate && cur.endDate ? `${cur.startDate} → ${cur.endDate}` : '—';
    const nextStr =
      r.startDate && r.endDate && r.action !== 'no-images' ? `${r.startDate} → ${r.endDate}` : '—';
    lines.push(`| ${r.id} | ${r.action} | ${img} | ${curStr} | ${nextStr} |`);
    csv.push(
      `"${r.id}","${r.action}",${img},"${cur?.startDate || ''}","${cur?.endDate || ''}","${r.startDate || ''}","${r.endDate || ''}","${(r.name || '').replace(/"/g, '""')}"\n`
    );
  }

  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
  fs.writeFileSync(csvPath, csv.join(''));
  return { mdPath, csvPath };
}

async function main() {
  const { dryRun, force, ids } = parseArgs();
  const dateLabel = new Date().toISOString().slice(0, 10);
  const targetIds = ids || listProjectIds();

  console.log(`T-00031 — dates from images${dryRun ? ' (dry-run)' : ''}${force ? ' (force)' : ''}\n`);

  const results = [];
  for (const id of targetIds) {
    results.push(await processProject(id, { dryRun, force }));
  }

  const counts = {};
  for (const r of results) counts[r.action] = (counts[r.action] || 0) + 1;

  for (const r of results.filter((x) => x.action === 'update')) {
    const cur = r.current;
    console.log(
      `${r.id} ${dryRun ? '[dry-run] ' : ''}${cur.startDate}/${cur.endDate} → ${r.startDate}/${r.endDate} (${r.range.imageCount} img)`
    );
  }

  console.log('\nSummary:', counts);
  const { mdPath, csvPath } = writeReport(results, dateLabel);
  console.log(`Report: ${path.relative(process.cwd(), mdPath)}`);
  console.log(`CSV: ${path.relative(process.cwd(), csvPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
