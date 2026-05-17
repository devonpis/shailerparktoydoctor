#!/usr/bin/env node
/**
 * T-00025: Scaffold projects/ from a timesheet-style CSV (merge continuation rows).
 * Usage: node scripts/scaffold-projects-from-csv.mjs <file.csv> [--dry-run] [--force-existing]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');
const TEMPLATE_PATH = path.join(PROJECTS_DIR, '0000 - template/config.json');

const PROTECTED_IDS = new Set(['0001', '0002', '0003']);

function parseArgs(argv) {
  const csvPath = argv.find((a) => !a.startsWith('--'));
  const dryRun = argv.includes('--dry-run');
  const forceExisting = argv.includes('--force-existing');
  if (!csvPath) {
    console.error(
      'Usage: node scripts/scaffold-projects-from-csv.mjs <file.csv> [--dry-run] [--force-existing]'
    );
    process.exit(1);
  }
  return { csvPath: path.resolve(csvPath), dryRun, forceExisting };
}

/** Minimal RFC-style CSV parse (quoted fields, commas). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

function normalizeHeader(h) {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 5); i += 1) {
    const joined = rows[i].join(' ').toLowerCase();
    if (joined.includes('order name') && joined.includes('receive')) {
      return i;
    }
  }
  return -1;
}

function buildColumnMap(headerRow) {
  const map = {};
  headerRow.forEach((h, i) => {
    const key = normalizeHeader(h);
    if (key.includes('receive')) map.receiveDate = i;
    else if (key.includes('order name')) map.orderName = i;
    else if (key.includes('job description')) map.jobDescription = i;
    else if (key === 'task') map.task = i;
    else if (key.includes('time') && key.includes('hr')) map.timeHr = i;
    else if (key.includes('time') && key.includes('min')) map.timeMin = i;
    else if (key.includes('date start')) map.dateStart = i;
    else if (key.includes('date end')) map.dateEnd = i;
    else if (key.includes('material')) map.materialCost = i;
    else if (key === 'income') map.income = i;
    else if (key === 'profit') map.profit = i;
  });
  return map;
}

function cell(row, col) {
  if (col === undefined || col < 0) return '';
  return (row[col] ?? '').trim();
}

function isClientNoteRow(orderName) {
  if (!orderName) return true;
  if (/@|email/i.test(orderName)) return true;
  if (/:\s*(\d{4}|email)/i.test(orderName)) return true;
  if (/\b0\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/.test(orderName)) return true;
  if (/^\d[\d\s]{7,}$/.test(orderName.replace(/\s/g, ''))) return true;
  if (/^[\w\s]+-\s*0\d/.test(orderName)) return true;
  return false;
}

function parseFlexibleDate(raw) {
  const s = String(raw || '').trim();
  if (!s || /^tbd|aborted|quote/i.test(s)) return null;
  const slash = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slash) {
    let [, a, b, y] = slash;
    y = y.length === 2 ? `20${y}` : y;
    const d1 = Number(a);
    const d2 = Number(b);
    let day = d1;
    let month = d2;
    if (d1 > 12 && d2 <= 12) {
      day = d2;
      month = d1;
    } else if (d2 > 12 && d1 <= 12) {
      day = d1;
      month = d2;
    }
    return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const digits = s.replace(/\D/g, '');
  if (digits.length === 7 || digits.length === 8) {
    const d = digits.length === 7 ? `0${digits}` : digits;
    const day = d.slice(0, 2);
    const month = d.slice(2, 4);
    const year = d.slice(4);
    return `${year}-${month}-${day}`;
  }
  return null;
}

function normalizeKey(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Multi-item batch parent (Mattel dolls, Pokemon x 2, Tonka x 3, etc.). */
function isMultiItemParentName(name) {
  const n = name.toLowerCase();
  return (
    /\bdolls?\b/.test(n) ||
    /\bx\s*\d+\b/.test(n) ||
    /\bfigures\b.*\bx\s*\d+/i.test(n) ||
    /&\s*friends/i.test(n) ||
    /\d+\s*x\s+/i.test(n)
  );
}

function isSubPartName(name) {
  return /^doll\s*\d+$/i.test(name.trim());
}

function isQuoteLine(jobDesc, task) {
  const s = `${jobDesc} ${task}`.toLowerCase();
  return s.includes('quote');
}

function headerRowHasRepair(row, cols) {
  const task = cell(row, cols.task).toLowerCase();
  const mins = minutesFromRow(row, cols);
  return mins > 0 && task && !task.includes('communication') && !task.includes('sourcing');
}

function parentHeaderIsBillingOnly(order) {
  if (order.headerHadRepair) return false;
  if (!order.lines.length) return true;
  return order.lines.every((l) => {
    const t = (l.task || '').toLowerCase();
    return t.includes('communication') || t === '(no task)';
  });
}

/** Hybrid (C): attach undated sub-toy rows to the open receive-date batch when appropriate. */
function shouldAttachSubItem(parent, subName, subRow, cols) {
  if (!parent?.receiveDate) return false;
  if (isClientNoteRow(subName)) return false;

  if (isSubPartName(subName)) return true;
  if (isMultiItemParentName(parent.orderName)) return true;

  const subJob = cell(subRow, cols.jobDescription);
  const subTask = cell(subRow, cols.task);
  if (isQuoteLine(subJob, subTask) && !isSubPartName(subName)) return false;

  if (parent.headerHadRepair && !isMultiItemParentName(parent.orderName)) return false;

  const subHasWork =
    minutesFromRow(subRow, cols) > 0 ||
    (subTask && !subTask.toLowerCase().includes('communication'));
  if (parentHeaderIsBillingOnly(parent) && subHasWork) return true;

  return false;
}

function ensureSubItem(order, name) {
  if (!order.subItems) order.subItems = [];
  let sub = order.subItems.find((s) => normalizeKey(s.orderName) === normalizeKey(name));
  if (!sub) {
    sub = { orderName: name, jobDescription: '', lines: [] };
    order.subItems.push(sub);
  }
  return sub;
}

function folderNameFromOrder(orderName) {
  return orderName
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*$/g, '')
    .trim()
    .slice(0, 80);
}

function listExistingProjects() {
  const entries = [];
  if (!fs.existsSync(PROJECTS_DIR)) return entries;
  for (const name of fs.readdirSync(PROJECTS_DIR)) {
    const m = name.match(/^(\d{4}) - (.+)$/);
    if (!m) continue;
    const configPath = path.join(PROJECTS_DIR, name, 'config.json');
    let projectName = m[2];
    if (fs.existsSync(configPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (cfg.projectName) projectName = cfg.projectName;
      } catch {
        /* ignore */
      }
    }
    entries.push({
      id: m[1],
      folder: name,
      projectName,
      key: normalizeKey(projectName),
      folderKey: normalizeKey(m[2]),
    });
  }
  return entries;
}

function nextProjectId(existing) {
  let max = 0;
  for (const e of existing) {
    const n = Number(e.id, 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return String(max + 1).padStart(4, '0');
}

function findExactMatch(orderName, existing) {
  const key = normalizeKey(orderName);
  if (!key) return null;
  return existing.find((e) => e.key === key || e.folderKey === key) || null;
}

function findNearMatch(orderName, existing) {
  const key = normalizeKey(orderName);
  if (!key) return null;
  if (findExactMatch(orderName, existing)) return null;
  return (
    existing.find((e) => {
      const ek = e.key;
      if (ek.length < 4) return false;
      return key.includes(ek) || ek.includes(key);
    }) || null
  );
}

function findReplicationOverview(planned, skipped, existing, mergeLog, bundleLog) {
  const repoDupes = new Map();
  for (const e of existing) {
    const k = e.key;
    if (!repoDupes.has(k)) repoDupes.set(k, []);
    repoDupes.get(k).push(e.folder);
  }
  const repoDuplicateFolders = [...repoDupes.entries()].filter(([, folders]) => folders.length > 1);

  const idCollisions = new Map();
  for (const e of existing) {
    if (e.id === '0000') continue;
    if (!idCollisions.has(e.id)) idCollisions.set(e.id, []);
    idCollisions.get(e.id).push(e.folder);
  }
  const repoIdDuplicates = [...idCollisions.entries()].filter(([, folders]) => folders.length > 1);

  const csvKeyCounts = new Map();
  for (const p of planned) {
    const k = normalizeKey(p.order.orderName);
    csvKeyCounts.set(k, (csvKeyCounts.get(k) || 0) + 1);
  }
  const csvDupesInPlan = [...csvKeyCounts.entries()].filter(([, n]) => n > 1);

  const exactSkipped = skipped.filter((s) => s.match);
  const nearMatches = [];
  for (const p of planned) {
    const near = findNearMatch(p.order.orderName, existing);
    if (near) nearMatches.push({ csv: p.order.orderName, folder: near.folder, id: near.id });
  }
  const newProjects = planned.filter((p) => !p.existingMatch);

  return {
    repoDuplicateFolders,
    repoIdDuplicates,
    csvDupesInPlan,
    exactSkipped,
    nearMatches,
    newProjects,
    mergeLog,
    bundleLog,
  };
}

function printReplicationOverview(overview) {
  console.log('--- Replication overview ---\n');

  if (overview.bundleLog.length) {
    console.log(`Bundled sub-rows (${overview.bundleLog.length}):`);
    overview.bundleLog.forEach((m) => console.log(`  ${m}`));
    console.log('');
  }

  if (overview.mergeLog.length) {
    console.log(`CSV duplicate names merged (${overview.mergeLog.length}):`);
    overview.mergeLog.forEach((m) => console.log(`  ${m}`));
    console.log('');
  }

  if (overview.repoIdDuplicates.length) {
    console.log(`Repo: duplicate project IDs (${overview.repoIdDuplicates.length}) — resolve before import:`);
    overview.repoIdDuplicates.forEach(([id, folders]) => {
      console.log(`  ${id} → ${folders.join(' | ')}`);
    });
    console.log('');
  }

  if (overview.repoDuplicateFolders.length) {
    console.log(`Repo: same normalized name in multiple folders (${overview.repoDuplicateFolders.length}):`);
    overview.repoDuplicateFolders.forEach(([key, folders]) => {
      console.log(`  "${key}" → ${folders.join(', ')}`);
    });
    console.log('');
  }

  if (overview.exactSkipped.length) {
    console.log(`Skip — exact name match in repo (${overview.exactSkipped.length}):`);
    overview.exactSkipped.forEach((s) => {
      console.log(`  CSV "${s.order}" → ${s.match.folder} (${s.match.id})`);
    });
    console.log('');
  }

  if (overview.nearMatches.length) {
    console.log(`Near matches — review before import (${overview.nearMatches.length}):`);
    overview.nearMatches.forEach((n) => {
      console.log(`  CSV "${n.csv}" ≈ ${n.folder} (${n.id})`);
    });
    console.log('');
  }

  if (overview.csvDupesInPlan.length) {
    console.log('Warning: duplicate normalized names in import plan:');
    overview.csvDupesInPlan.forEach(([key, n]) => console.log(`  "${key}" × ${n}`));
    console.log('');
  }

  console.log(`New folders to create: ${overview.newProjects.length}`);
  console.log(`Updates (with --force-existing): ${overview.planned?.length - overview.newProjects.length || 0}`);
}

function minutesFromRow(row, cols) {
  const hr = Number(cell(row, cols.timeHr)) || 0;
  const min = Number(cell(row, cols.timeMin)) || 0;
  return hr * 60 + min;
}

function appendLineToOrder(order, row, cols) {
  const task = cell(row, cols.task);
  const jobDesc = cell(row, cols.jobDescription);
  const line = {
    task: task || '(no task)',
    jobDescription: jobDesc,
    minutes: minutesFromRow(row, cols),
    dateStart: cell(row, cols.dateStart),
    dateEnd: cell(row, cols.dateEnd),
  };
  order.lines.push(line);

  const ds = parseFlexibleDate(line.dateStart);
  const de = parseFlexibleDate(line.dateEnd);
  if (ds && (!order.dateStart || ds < order.dateStart)) order.dateStart = ds;
  if (de && (!order.dateEnd || de > order.dateEnd)) order.dateEnd = de;

  const inc = cell(row, cols.income);
  if (inc) order.income = inc;
  const mat = cell(row, cols.materialCost);
  if (mat) order.materialCost = mat;
  const prof = cell(row, cols.profit);
  if (prof) order.profit = prof;
  if (jobDesc && !order.jobDescription) order.jobDescription = jobDesc;
}

function parseOrders(rows, cols) {
  const orders = [];
  let current = null;
  const bundleLog = [];

  const startOrder = (row, { receiveDateOverride } = {}) => {
    const orderName = cell(row, cols.orderName);
    const receiveDate = receiveDateOverride ?? cell(row, cols.receiveDate);
    if (!orderName || isClientNoteRow(orderName)) return null;
    return {
      receiveDate,
      orderName,
      jobDescription: cell(row, cols.jobDescription),
      headerHadRepair: headerRowHasRepair(row, cols),
      lines: [],
      subItems: [],
      dateStart: null,
      dateEnd: null,
      income: '',
      materialCost: '',
      profit: '',
      notes: [],
    };
  };

  for (const row of rows) {
    const receiveDate = cell(row, cols.receiveDate);
    const orderName = cell(row, cols.orderName);
    const task = cell(row, cols.task);
    const jobDesc = cell(row, cols.jobDescription);

    if (isClientNoteRow(orderName) && !receiveDate) {
      continue;
    }

    if (receiveDate) {
      const o = startOrder(row);
      if (o) {
        current = o;
        orders.push(current);
        appendLineToOrder(current, row, cols);
      }
      continue;
    }

    if (orderName && !isClientNoteRow(orderName)) {
      const looksLikeSubJob =
        task || jobDesc || cell(row, cols.timeHr) || cell(row, cols.timeMin);

      if (current && shouldAttachSubItem(current, orderName, row, cols)) {
        const sub = ensureSubItem(current, orderName);
        if (jobDesc) sub.jobDescription = jobDesc;
        if (looksLikeSubJob) appendLineToOrder(sub, row, cols);
        else sub.lines.push({ task: '(listed)', jobDescription: '', minutes: 0, dateStart: '', dateEnd: '' });
        bundleLog.push(`Bundled "${orderName}" → "${current.orderName}"`);
        continue;
      }

      if (!current || looksLikeSubJob) {
        const o = startOrder(row, {
          receiveDateOverride: current?.receiveDate || '',
        });
        if (o) {
          current = o;
          orders.push(current);
          if (looksLikeSubJob) appendLineToOrder(current, row, cols);
        }
      } else {
        current.notes.push(`Also: ${orderName}`);
      }
      continue;
    }

    if (!current) continue;
    appendLineToOrder(current, row, cols);
  }

  return { orders, bundleLog };
}

function mergeDuplicateOrders(orders) {
  const byKey = new Map();
  const merged = [];
  const mergeLog = [];

  for (const o of orders) {
    const key = normalizeKey(o.orderName);
    if (!key) continue;
    if (byKey.has(key)) {
      const prev = byKey.get(key);
      prev.lines.push(...o.lines);
      if (o.jobDescription && !prev.jobDescription) prev.jobDescription = o.jobDescription;
      if (o.dateStart && (!prev.dateStart || o.dateStart < prev.dateStart)) prev.dateStart = o.dateStart;
      if (o.dateEnd && (!prev.dateEnd || o.dateEnd > prev.dateEnd)) prev.dateEnd = o.dateEnd;
      if (o.income) prev.income = o.income;
      prev.notes.push(...o.notes.filter((n) => !isClientNoteRow(n)), `Merged duplicate row: ${o.orderName}`);
      mergeLog.push(`Merged "${o.orderName}" into "${prev.orderName}"`);
    } else {
      byKey.set(key, o);
      merged.push(o);
    }
  }
  return { merged, mergeLog };
}

function formatLineBullet(line) {
  const hrs = line.minutes ? `${(line.minutes / 60).toFixed(2)}h` : '';
  const range = [line.dateStart, line.dateEnd].filter(Boolean).join(' → ');
  return `- ${line.task}${line.jobDescription ? ` (${line.jobDescription})` : ''}${hrs ? ` — ${hrs}` : ''}${range ? ` — ${range}` : ''}`;
}

function buildRepairDetails(order) {
  const parts = [];
  if (order.jobDescription) parts.push(order.jobDescription);
  for (const line of order.lines) parts.push(formatLineBullet(line));
  if (order.subItems?.length) {
    parts.push('', 'Sub-items:');
    for (const sub of order.subItems) {
      parts.push('', `### ${sub.orderName}`);
      if (sub.jobDescription) parts.push(sub.jobDescription);
      for (const line of sub.lines) parts.push(formatLineBullet(line));
    }
  }
  const safeNotes = order.notes.filter((n) => n && !isClientNoteRow(n));
  if (safeNotes.length) parts.push('', 'Notes:', ...safeNotes.map((n) => `- ${n}`));
  if (order.income || order.materialCost) {
    parts.push(
      '',
      `Timesheet: income ${order.income || '—'}, materials ${order.materialCost || '—'}, profit ${order.profit || '—'}`
    );
  }
  parts.push('', `Imported from timesheet CSV — ${new Date().toISOString().slice(0, 10)}.`);
  return parts.join('\n');
}

function buildDescription(order) {
  const base = order.jobDescription || order.orderName;
  const text = base.slice(0, 400);
  return text.length > 497 ? `${text.slice(0, 497)}…` : text;
}

function writeConfig(dir, payload) {
  const template = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
  const config = {
    ...template,
    isTemplate: false,
    projectName: payload.projectName,
    title: payload.title || '',
    startDate: payload.startDate || template.startDate,
    endDate: payload.endDate || payload.startDate || template.endDate,
    status: 'WIP',
    webpageUrl: null,
    facebookUrl: null,
    instagramUrl: null,
    threadUrl: null,
    youtubeUrl: null,
    youtubeShortUrl: null,
    tags: payload.tags || [],
    skills: payload.skills || [],
    description: payload.description || '',
    itemDetails: payload.itemDetails || '',
    repairDetails: payload.repairDetails || '',
    googleReview: null,
  };
  fs.writeFileSync(path.join(dir, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);
}

function main() {
  const { csvPath, dryRun, forceExisting } = parseArgs(process.argv.slice(2));
  const text = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(text);
  const headerIdx = findHeaderRow(rows);
  if (headerIdx < 0) {
    console.error('Could not find header row (Receive Date / Order name).');
    process.exit(1);
  }
  const cols = buildColumnMap(rows[headerIdx]);
  const dataRows = rows.slice(headerIdx + 1);
  const { orders, bundleLog } = parseOrders(dataRows, cols);
  const { merged, mergeLog } = mergeDuplicateOrders(orders);

  const existing = listExistingProjects();
  let nextId = nextProjectId(existing);
  const planned = [];
  const skipped = [];

  for (const order of merged) {
    const match = findExactMatch(order.orderName, existing);
    const folderLabel = folderNameFromOrder(order.orderName);
    if (!folderLabel) continue;

    if (match && !forceExisting) {
      skipped.push({ order: order.orderName, reason: `exists as ${match.folder}`, match });
      continue;
    }
    if (match && PROTECTED_IDS.has(match.id) && forceExisting) {
      skipped.push({ order: order.orderName, reason: `protected id ${match.id}`, match });
      continue;
    }

    const id = match && forceExisting ? match.id : nextId;
    if (!match) {
      nextId = String(Number(nextId, 10) + 1).padStart(4, '0');
    }
    const dirName = `${id} - ${folderLabel}`;
    const receiveIso = parseFlexibleDate(order.receiveDate);

    planned.push({
      dirName,
      id,
      order,
      payload: {
        projectName: order.orderName,
        title: '',
        startDate: order.dateStart || receiveIso,
        endDate: order.dateEnd || order.dateStart || receiveIso,
        description: buildDescription(order),
        itemDetails: `Timesheet import (job metadata only; no client contact stored). Receive date: ${order.receiveDate || '—'}.`,
        repairDetails: buildRepairDetails(order),
        tags: [],
        skills: [],
      },
      existingMatch: match,
    });
  }

  const overview = findReplicationOverview(planned, skipped, existing, mergeLog, bundleLog);
  overview.planned = planned;

  console.log(`CSV: ${csvPath}`);
  console.log(
    `Parsed ${orders.length} order group(s), ${merged.length} after name-merge (hybrid batch grouping).\n`
  );

  printReplicationOverview(overview);

  const toCreate = planned.filter((p) => !p.existingMatch || forceExisting);
  console.log(`${dryRun ? 'Would write' : 'Write'} ${toCreate.length} project config(s):`);
  toCreate.forEach((p) => {
    const subs = p.order.subItems?.length ? ` [+${p.order.subItems.length} sub-item(s)]` : '';
    const tag = p.existingMatch && forceExisting ? ' (update)' : '';
    console.log(`  ${p.dirName}${subs}${tag}`);
  });

  if (dryRun) return;

  for (const p of planned) {
    const dir = path.join(PROJECTS_DIR, p.dirName);
    if (p.existingMatch && !forceExisting) continue;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    writeConfig(dir, p.payload);
    console.log(`Wrote: ${p.dirName}/config.json`);
  }
  console.log(`\nDone. ${planned.length} folder(s). Review status, dates, and copy before publish.`);
}

main();
