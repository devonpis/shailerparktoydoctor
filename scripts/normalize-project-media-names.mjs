#!/usr/bin/env node
/**
 * Rename loose project images to before / after / hero / WIP-### by capture time.
 * Keeps existing canonical names when they already occupy a slot.
 *
 * WARNING: Do NOT use after the owner manually renamed files in a project folder.
 * For that, run sync-project-story-images.mjs (HTML only, no file moves).
 *
 * Usage:
 *   node scripts/normalize-project-media-names.mjs 0004 0005 [--dry-run]
 *   node scripts/normalize-project-media-names.mjs --range 4 15 [--dry-run]
 *
 * Default: before / after / WIP-### by capture time — no auto hero.
 * Use --hero only when the owner wants one loose photo promoted to hero.jpeg.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getImageCaptureTime } from './lib/image-capture-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

const CANON_RE = /^(before|after|hero|WIP-\d{3})\.(jpe?g|png|webp|gif)$/i;
const IMG_EXT_RE = /\.(jpe?g|png|webp|gif)$/i;

function parseArgs(argv) {
  const flags = { dryRun: false, range: null, ids: [], assignHero: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--hero') flags.assignHero = true;
    else if (a === '--range') {
      flags.range = [Number(argv[++i]), Number(argv[++i])];
    } else if (!a.startsWith('--')) {
      flags.ids.push(a.replace(/\D/g, '').padStart(4, '0').slice(-4));
    }
  }
  return flags;
}

function projectDir(id) {
  const prefix = `${id} - `;
  const name = fs.readdirSync(PROJECTS_DIR).find((n) => n.startsWith(prefix));
  if (!name) throw new Error(`No project folder for ${id}`);
  return path.join(PROJECTS_DIR, name);
}

function destExt(name) {
  const ext = path.extname(name).slice(1).toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  return ext || 'jpeg';
}

function roleHint(base) {
  const b = path.basename(base, path.extname(base)).toLowerCase();
  if (b === 'hero' || b.startsWith('hero')) return 'hero';
  if (b === 'before' || /^before\d*$/.test(b)) return 'before';
  if (b === 'after' || /^after\d*$/.test(b)) return 'after';
  if (/^wip/.test(b)) return 'wip';
  if (b.includes('before') || b.includes('vintage')) return 'before';
  if (b.includes('open') || b.includes('inside')) return 'wip';
  return 'wip';
}

function isLegacyHeroPng(name, nonLegacyCount) {
  return name.toLowerCase() === 'hero.png' && nonLegacyCount > 0;
}

async function planProject(dir, { assignHero = false } = {}) {
  const files = fs
    .readdirSync(dir)
    .filter((n) => IMG_EXT_RE.test(n) && n !== 'config.json');

  const withMeta = await Promise.all(
    files.map(async (name) => ({
      name,
      abs: path.join(dir, name),
      capture: await getImageCaptureTime(path.join(dir, name), name),
      hint: roleHint(name),
      canonical: CANON_RE.test(name),
    }))
  );

  const nonLegacy = withMeta.filter((f) => !isLegacyHeroPng(f.name, withMeta.length - 1));
  const slots = { before: null, after: null, hero: null };
  const wipPool = [];

  for (const f of withMeta) {
    if (isLegacyHeroPng(f.name, nonLegacy.length)) {
      wipPool.push({ ...f, hint: 'wip' });
      continue;
    }
    const stem = f.name.replace(/\.[^.]+$/, '').toLowerCase();
    if (f.canonical && ['before', 'after', 'hero'].includes(stem)) {
      if (!slots[stem]) slots[stem] = f;
      else wipPool.push({ ...f, hint: 'wip' });
    } else if (f.canonical && /^wip-\d{3}$/i.test(stem)) {
      wipPool.push({ ...f, hint: 'wip' });
    } else {
      wipPool.push(f);
    }
  }

  wipPool.sort((a, b) => a.capture - b.capture);

  for (const f of wipPool.filter((x) => x.hint === 'before')) {
    if (!slots.before) {
      slots.before = f;
    }
  }
  for (const f of wipPool.filter((x) => x.hint === 'after')) {
    if (!slots.after) {
      slots.after = f;
    }
  }
  for (const f of wipPool.filter((x) => x.hint === 'hero')) {
    if (!slots.hero) {
      slots.hero = f;
    }
  }

  const remaining = wipPool.filter(
    (f) => f !== slots.before && f !== slots.after && f !== slots.hero
  );

  if (!slots.before && remaining.length) {
    slots.before = remaining.shift();
  }
  if (!slots.after && remaining.length) {
    slots.after = remaining.pop();
  }
  if (assignHero && !slots.hero && remaining.length) {
    const heroCand = remaining.find((f) => f.hint === 'hero');
    if (heroCand) {
      slots.hero = heroCand;
      remaining.splice(remaining.indexOf(heroCand), 1);
    } else if (remaining.length === 1) {
      slots.hero = remaining.shift();
    } else if (remaining.length > 1) {
      slots.hero = remaining[Math.floor(remaining.length / 2)];
      remaining.splice(remaining.indexOf(slots.hero), 1);
    }
  }

  remaining.sort((a, b) => a.capture - b.capture);
  const wipOrdered = remaining;

  const plans = [];
  const assign = (file, destStem) => {
    if (!file) return;
    const dest = `${destStem}.${destExt(file.name)}`;
    const stem = file.name.replace(/\.[^.]+$/, '').toLowerCase();
    const ext = path.extname(file.name).toLowerCase();
    if (file.name === dest) return;
    if (
      stem === destStem &&
      (ext === `.${destExt(file.name)}` || (destExt(file.name) === 'jpeg' && (ext === '.jpg' || ext === '.jpeg')))
    ) {
      return;
    }
    plans.push({ from: file.name, to: dest });
  };

  assign(slots.before, 'before');
  assign(slots.after, 'after');
  assign(slots.hero, 'hero');
  wipOrdered.forEach((f, i) => {
    assign(f, `WIP-${String(i + 1).padStart(3, '0')}`);
  });

  return plans;
}

function applyPlans(dir, plans, dryRun) {
  if (!plans.length) return;
  const label = path.basename(dir);
  console.log(`\n${label}`);
  for (const p of plans) console.log(`  ${p.from} → ${p.to}`);

  if (dryRun) return;

  const tmp = plans.map((p, i) => ({
    from: path.join(dir, p.from),
    tmp: path.join(dir, `.__rename-${i}__`),
    to: path.join(dir, p.to),
  }));
  for (const t of tmp) fs.renameSync(t.from, t.tmp);
  for (const t of tmp) fs.renameSync(t.tmp, t.to);
}

async function main() {
  const { dryRun, range, ids, assignHero } = parseArgs(process.argv);
  let targetIds = ids;
  if (range) {
    const [lo, hi] = range;
    targetIds = [];
    for (let n = lo; n <= hi; n += 1) {
      targetIds.push(String(n).padStart(4, '0'));
    }
  }
  if (!targetIds.length) {
    console.error('Provide project ids or --range LO HI');
    process.exit(1);
  }

  for (const id of targetIds) {
    const dir = projectDir(id);
    const plans = await planProject(dir, { assignHero });
    applyPlans(dir, plans, dryRun);
  }
  if (dryRun) console.log('\n(dry run — no files changed)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
