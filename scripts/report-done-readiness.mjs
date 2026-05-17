#!/usr/bin/env node
/**
 * Report which projects pass DONE readiness (for promote-to-DONE ordering).
 * Usage: node scripts/report-done-readiness.mjs [id …]
 *        node scripts/report-done-readiness.mjs --legacy-batch   # 0004–0015, 0093
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDoneReadiness } from './lib/project-readiness.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');
const LEGACY_BATCH = [
  '0004', '0005', '0006', '0007', '0008', '0009', '0010', '0011', '0012', '0013', '0014', '0015', '0093',
];

function parseArgs(argv) {
  if (argv.includes('--legacy-batch')) return LEGACY_BATCH;
  const ids = argv.slice(2).filter((a) => !a.startsWith('--'));
  return ids.length ? ids : null;
}

function scanIds(targetIds) {
  const folders = fs
    .readdirSync(PROJECTS_DIR)
    .filter((n) => /^\d{4} - /.test(n) && !n.startsWith('0000'))
    .sort();

  const rows = [];
  for (const folder of folders) {
    const id = folder.slice(0, 4);
    if (targetIds && !targetIds.includes(id)) continue;

    const dir = path.join(PROJECTS_DIR, folder);
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
    const { errors, images } = validateDoneReadiness(cfg, dir);
    const hasHtml = fs.existsSync(path.join(dir, 'index.html'));

    rows.push({
      id,
      folder,
      status: cfg.status || '—',
      imageCount: images?.length || 0,
      hasHtml,
      webpageUrl: Boolean(cfg.webpageUrl?.trim()),
      ready: errors.length === 0,
      blockers: errors,
    });
  }
  return rows;
}

function csvEscape(s) {
  const t = String(s ?? '');
  return t.includes(',') || t.includes('"') ? `"${t.replace(/"/g, '""')}"` : t;
}

function main() {
  const targetIds = parseArgs(process.argv);
  const rows = scanIds(targetIds);

  const ready = rows.filter((r) => r.ready);
  const notReady = rows.filter((r) => !r.ready);

  ready.sort((a, b) => a.id.localeCompare(b.id));
  notReady.sort((a, b) => {
    const score = (r) => r.blockers.length;
    return score(a) - score(b) || a.id.localeCompare(b.id);
  });

  const date = new Date().toISOString().slice(0, 10);
  const outDir = path.join(REPO_ROOT, 'docs/reports');
  fs.mkdirSync(outDir, { recursive: true });
  const mdPath = path.join(outDir, `done-readiness-${date}.md`);
  const csvPath = path.join(outDir, `done-readiness-${date}.csv`);

  const lines = [
    '# DONE readiness report',
    '',
    `Date: ${date}`,
    `Scope: ${targetIds ? targetIds.join(', ') : 'all projects'}`,
    '',
    'Run `node scripts/validate-done-readiness.mjs <id>` before setting **`status`: `"DONE"`**. Then `publish-webpage.mjs` → author/commit `index.html`.',
    '',
    `**Ready now:** ${ready.length} · **Blocked:** ${notReady.length}`,
    '',
    '## Promote to DONE first (ready now)',
    '',
    '| Priority | ID | Project | Images | HTML | Status |',
    '|----------|-----|---------|--------|------|--------|',
  ];

  let n = 1;
  for (const r of ready) {
    lines.push(
      `| ${n} | **${r.id}** | ${r.folder.replace(/^\d{4} - /, '')} | ${r.imageCount} | ${r.hasHtml ? 'yes' : '—'} | ${r.status} |`
    );
    n += 1;
  }
  if (!ready.length) lines.push('| — | — | *(none)* | — | — | — |');

  lines.push('', '## Not ready yet (fix blockers first)', '', '| ID | Status | Images | Blockers |', '|----|--------|--------|----------|');
  for (const r of notReady) {
    const brief = r.blockers.map((e) => e.replace(/\s+/g, ' ').slice(0, 80)).join('; ');
    lines.push(`| ${r.id} | ${r.status} | ${r.imageCount} | ${brief || '—'} |`);
  }

  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);

  const header = ['id', 'folder', 'status', 'ready', 'image_count', 'has_index_html', 'webpage_url', 'blocker_count', 'blockers'];
  const csvLines = [
    header.join(','),
    ...rows.map((r) =>
      header
        .map((h) => {
          if (h === 'folder') return csvEscape(r.folder);
          if (h === 'ready') return r.ready ? '1' : '0';
          if (h === 'image_count') return r.imageCount;
          if (h === 'has_index_html') return r.hasHtml ? '1' : '0';
          if (h === 'webpage_url') return r.webpageUrl ? '1' : '0';
          if (h === 'blocker_count') return r.blockers.length;
          if (h === 'blockers') return csvEscape(r.blockers.join(' | '));
          return csvEscape(r[h] ?? '');
        })
        .join(',')
    ),
  ];
  fs.writeFileSync(csvPath, `${csvLines.join('\n')}\n`);

  console.log(`Ready: ${ready.length} | Blocked: ${notReady.length}`);
  console.log(`Report: ${path.relative(REPO_ROOT, mdPath)}`);
  console.log(`CSV:    ${path.relative(REPO_ROOT, csvPath)}`);
  if (ready.length) {
    console.log('\nPromote DONE first:', ready.map((r) => r.id).join(', '));
  }
}

main();
