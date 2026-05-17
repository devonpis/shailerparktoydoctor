#!/usr/bin/env node
/**
 * T-00028: Ingest repair photos from USB (or folder path).
 *
 * Usage:
 *   node scripts/ingest-usb-photos.mjs <usb-path> [--apply] [--overwrite]
 *   node scripts/ingest-usb-photos.mjs <usb-path> --scaffold-new
 *
 * Default: dry-run only. Writes report to docs/reports/usb-ingest-dry-run-<date>.{md,csv}
 * --apply: copy after owner review. --overwrite: replace before/after/hero slots.
 * --scaffold-new: create 0078–0090 from USB uncaptured folders (config only).
 * Root loose files on USB are ignored.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { folderLabelFromProjectName, normalizeProjectName } from './lib/normalize-project-name.mjs';
import {
  USB_FOLDER_TO_PROJECT_DIR,
  USB_NESTED_TO_PROJECT_DIR,
} from './lib/usb-folder-map.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');
const TEMPLATE_PATH = path.join(PROJECTS_DIR, '0000 - template/config.json');
const REPORTS_DIR = path.join(REPO_ROOT, 'docs/reports');

const IMG_RE = /\.(jpe?g|png|heic|webp|gif)$/i;
const ROOT_SKIP_RE = /^(IMG_|before\d*\.)/i;

const NEW_USB_FOLDERS = [
  { id: '0078', usb: 'Godfy', name: 'Godfy' },
  { id: '0079', usb: 'Brown_ribbon_dog', name: 'Brown ribbon dog' },
  { id: '0080', usb: 'Capybara_Plush', name: 'Capybara Plush' },
  { id: '0081', usb: 'Dog', name: 'Dog' },
  { id: '0082', usb: 'Elephant_Towel', name: 'Elephant Towel' },
  { id: '0083', usb: 'PJ_Teddy', name: 'PJ Teddy' },
  { id: '0084', usb: 'Paddington_Bear', name: 'Paddington Bear' },
  { id: '0085', usb: 'Panda', name: 'Panda' },
  { id: '0086', usb: 'Tumbling_tiger', name: 'Tumbling tiger' },
  { id: '0087', usb: 'Yellow_teddy', name: 'Yellow teddy' },
  { id: '0088', usb: 'anime_figure', name: 'anime figure' },
  { id: '0089', usb: 'pink_ribbon_bear', name: 'pink ribbon bear' },
  { id: '0090', usb: 'polar_bear', name: 'polar bear' },
  { id: '0091', usb: 'Woody_2', name: 'Woody 2' },
  { id: '0092', usb: 'Woody_n_Buzz', name: 'Woody n Buzz' },
];

function parseArgs(argv) {
  const flags = {
    apply: false,
    overwrite: false,
    scaffoldNew: false,
    usbPath: null,
  };
  for (const a of argv) {
    if (a === '--apply') flags.apply = true;
    else if (a === '--overwrite') flags.overwrite = true;
    else if (a === '--scaffold-new') flags.scaffoldNew = true;
    else if (!a.startsWith('--')) flags.usbPath = path.resolve(a);
  }
  if (!flags.usbPath) {
    console.error(
      'Usage: node scripts/ingest-usb-photos.mjs <usb-path> [--apply] [--overwrite] [--scaffold-new]'
    );
    process.exit(1);
  }
  return flags;
}

function parseImgFilenameDate(name) {
  const m = name.match(/IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/i);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])));
}

async function getCaptureTime(absPath, name) {
  const fromName = parseImgFilenameDate(name);
  if (fromName && !Number.isNaN(fromName.getTime())) return fromName;
  try {
    const meta = await sharp(absPath).metadata();
    if (meta.exif) {
      const buf = meta.exif;
      const text = buf.toString('latin1');
      const dm = text.match(/(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
      if (dm) {
        const d = new Date(
          Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(dm[4]), Number(dm[5]), Number(dm[6]))
        );
        if (!Number.isNaN(d.getTime())) return d;
      }
    }
  } catch {
    /* fall through */
  }
  return fs.statSync(absPath).mtime;
}

function roleHintFromName(name) {
  const base = path.basename(name, path.extname(name)).toLowerCase();
  if (base === 'hero' || base.startsWith('hero')) return 'hero';
  if (base === 'before' || /^before\d*$/.test(base)) return 'before';
  if (base === 'after' || /^after\d*$/.test(base)) return 'after';
  if (/^wip/.test(base)) return 'wip';
  return null;
}

function destExt(srcName) {
  const ext = path.extname(srcName).slice(1).toLowerCase();
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  return ext || 'jpeg';
}

function listUsbFolderImages(usbRoot, folderName) {
  const dir = path.join(usbRoot, folderName);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  function walk(d, rel) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      const r = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(p, r);
      else if (IMG_RE.test(ent.name)) out.push({ rel: r, abs: p, name: ent.name });
    }
  }
  walk(dir, '');
  return out;
}

function existingMedia(projDir) {
  if (!fs.existsSync(projDir)) return [];
  return fs.readdirSync(projDir).filter((f) => IMG_RE.test(f) || /^WIP-\d{3}\./i.test(f));
}

function nextWipNumber(existing, planned) {
  const nums = [...existing, ...planned]
    .map((f) => f.match(/^WIP-(\d{3})/i)?.[1])
    .filter(Boolean)
    .map(Number);
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return String(n).padStart(3, '0');
}

function resolveProjectDir(usbFolder, relInsideFolder) {
  const rel = relInsideFolder.replace(/\\/g, '/');
  const nestedKeys = Object.keys(USB_NESTED_TO_PROJECT_DIR)
    .filter((k) => k.startsWith(`${usbFolder}/`))
    .sort((a, b) => b.length - a.length);
  for (const key of nestedKeys) {
    const suffix = key.slice(usbFolder.length + 1);
    if (rel === suffix || rel.startsWith(`${suffix}/`)) {
      return USB_NESTED_TO_PROJECT_DIR[key];
    }
  }
  return USB_FOLDER_TO_PROJECT_DIR[usbFolder] || null;
}

async function planProjectGroup(usbFolder, projectDir, files, overwrite) {
  const projPath = path.join(PROJECTS_DIR, projectDir);
  const withMeta = await Promise.all(
    files.map(async (f) => ({
      ...f,
      capture: await getCaptureTime(f.abs, f.name),
      roleHint: roleHintFromName(f.name),
    }))
  );
  withMeta.sort((a, b) => a.capture - b.capture);

  const existing = existingMedia(projPath);
  const plannedNames = [];
  const plans = [];
  const slots = { before: null, after: null, hero: null };

  const assignSlot = (role, file) => {
    const ext = destExt(file.name);
    const dest = `${role}.${ext}`;
    const has = existing.some((e) => e.toLowerCase() === dest.toLowerCase()) || plannedNames.includes(dest);
    if (has && !overwrite) {
      const wip = `WIP-${nextWipNumber(existing, plannedNames)}.${ext}`;
      plannedNames.push(wip);
      plans.push({
        srcRel: file.srcRel,
        abs: file.abs,
        captureISO: file.capture.toISOString(),
        role: `${role} (slot taken → WIP)`,
        dest,
        destResolved: wip,
        projectDir,
      });
      return;
    }
    if (has && overwrite) {
      slots[role] = dest;
    } else if (!slots[role]) {
      slots[role] = dest;
    }
    plannedNames.push(dest);
    plans.push({
      srcRel: file.srcRel,
      abs: file.abs,
      captureISO: file.capture.toISOString(),
      role,
      dest,
      destResolved: dest,
      projectDir,
    });
  };

  const beforeQueue = withMeta.filter((f) => f.roleHint === 'before');
  const afterQueue = withMeta.filter((f) => f.roleHint === 'after');
  const heroQueue = withMeta.filter((f) => f.roleHint === 'hero');
  const rest = withMeta.filter((f) => !f.roleHint || f.roleHint === 'wip');

  if (beforeQueue.length) {
    assignSlot('before', beforeQueue[0]);
    for (let i = 1; i < beforeQueue.length; i += 1) {
      const file = beforeQueue[i];
      const ext = destExt(file.name);
      const wip = `WIP-${nextWipNumber(existing, plannedNames)}.${ext}`;
      plannedNames.push(wip);
      plans.push({
        srcRel: file.srcRel,
        abs: file.abs,
        captureISO: file.capture.toISOString(),
        role: 'before (extra)',
        dest: wip,
        destResolved: wip,
        projectDir,
      });
    }
  }

  if (afterQueue.length) {
    assignSlot('after', afterQueue[0]);
    for (let i = 1; i < afterQueue.length; i += 1) {
      const file = afterQueue[i];
      const ext = destExt(file.name);
      const wip = `WIP-${nextWipNumber(existing, plannedNames)}.${ext}`;
      plannedNames.push(wip);
      plans.push({
        srcRel: file.srcRel,
        abs: file.abs,
        captureISO: file.capture.toISOString(),
        role: 'after (extra)',
        dest: wip,
        destResolved: wip,
        projectDir,
      });
    }
  }

  for (const file of heroQueue) assignSlot('hero', file);

  for (const file of rest) {
    const ext = destExt(file.name);
    const wip = `WIP-${nextWipNumber(existing, plannedNames)}.${ext}`;
    plannedNames.push(wip);
    plans.push({
      srcRel: file.srcRel,
      abs: file.abs,
      captureISO: file.capture.toISOString(),
      role: 'wip',
      dest: wip,
      destResolved: wip,
      projectDir,
    });
  }

  return plans;
}

/**
 * Assign destination filenames for one top-level USB folder (may split nested paths).
 */
async function planFolder(usbRoot, folderName, overwrite) {
  if (!USB_FOLDER_TO_PROJECT_DIR[folderName] && !Object.keys(USB_NESTED_TO_PROJECT_DIR).some((k) => k.startsWith(`${folderName}/`))) {
    return { error: `No USB map for folder: ${folderName}`, plans: [] };
  }
  const files = listUsbFolderImages(usbRoot, folderName);
  const byProject = new Map();
  for (const f of files) {
    const projectDir = resolveProjectDir(folderName, f.rel);
    if (!projectDir) continue;
    const srcRel = `${folderName}/${f.rel}`;
    const entry = { ...f, srcRel };
    if (!byProject.has(projectDir)) byProject.set(projectDir, []);
    byProject.get(projectDir).push(entry);
  }
  const plans = [];
  for (const [projectDir, group] of byProject) {
    plans.push(...(await planProjectGroup(folderName, projectDir, group, overwrite)));
  }
  return { error: null, plans };
}

function isoDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function writeConfig(dir, payload) {
  const template = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
  const config = {
    ...template,
    isTemplate: false,
    projectName: payload.projectName,
    title: '',
    startDate: payload.startDate,
    endDate: payload.endDate,
    status: 'WIP',
    webpageUrl: null,
    facebookUrl: null,
    instagramUrl: null,
    threadUrl: null,
    youtubeUrl: null,
    youtubeShortUrl: null,
    tags: [],
    skills: [],
    description: payload.description || '',
    itemDetails: payload.itemDetails || '',
    repairDetails: payload.repairDetails,
    googleReview: null,
  };
  fs.writeFileSync(path.join(dir, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);
}

async function scaffoldUncapturedProjects(usbRoot) {
  const created = [];
  for (const spec of NEW_USB_FOLDERS) {
    const label = folderLabelFromProjectName(spec.name);
    const dirName = `${spec.id} - ${label}`;
    const dir = path.join(PROJECTS_DIR, dirName);
    if (fs.existsSync(dir)) {
      console.log(`Skip scaffold (exists): ${dirName}`);
      continue;
    }
    const imgs = listUsbFolderImages(usbRoot, spec.usb);
    const times = await Promise.all(imgs.map((f) => getCaptureTime(f.abs, f.name)));
    times.sort((a, b) => a - b);
    const start = times[0] ? isoDateOnly(times[0]) : new Date().toISOString().slice(0, 10);
    const end = times[times.length - 1] ? isoDateOnly(times[times.length - 1]) : start;
    fs.mkdirSync(dir, { recursive: true });
    writeConfig(dir, {
      projectName: normalizeProjectName(spec.name),
      startDate: start,
      endDate: end,
      description: 'Repair project (USB ingest — not in timesheet CSV).',
      itemDetails: `USB folder: ${spec.usb}. Scaffolded ${new Date().toISOString().slice(0, 10)}.`,
      repairDetails: `Scaffolded for USB ingest (not in timesheet CSV). Photos pending copy from USB.\n\nSee T-00028 / T-00030 for rename and product details.`,
    });
    USB_FOLDER_TO_PROJECT_DIR[spec.usb] = dirName;
    created.push(dirName);
    console.log(`Scaffolded: ${dirName} (${imgs.length} images on USB)`);
  }
  return created;
}

function writeReport(allPlans, usbPath, apply, overwrite) {
  const date = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const mdPath = path.join(REPORTS_DIR, `usb-ingest-dry-run-${date}.md`);
  const csvPath = path.join(REPORTS_DIR, `usb-ingest-dry-run-${date}.csv`);

  const lines = [
    `# USB ingest dry-run (${date})`,
    '',
    `- **USB:** \`${usbPath}\``,
    `- **Mode:** ${apply ? 'APPLY (copy)' : 'dry-run (no copy)'}`,
    `- **Overwrite** before/after/hero: ${overwrite}`,
    `- **Root loose files:** ignored`,
    `- **Total files:** ${allPlans.length}`,
    '',
    'Reply **`apply`** in Agent chat to run with `--apply`. Optimize with T-00027 before git commit of images.',
    '',
    '| USB source | Capture (UTC) | Project | Role | Destination |',
    '|------------|---------------|---------|------|-------------|',
  ];
  const csv = ['usb_source,capture_utc,project_dir,role,destination\n'];
  for (const p of allPlans) {
    lines.push(
      `| \`${p.srcRel}\` | ${p.captureISO.slice(0, 19)} | ${p.projectDir} | ${p.role} | \`${p.destResolved}\` |`
    );
    csv.push(
      `"${p.srcRel}","${p.captureISO}","${p.projectDir}","${p.role}","${p.destResolved}"\n`
    );
  }
  fs.writeFileSync(mdPath, lines.join('\n'));
  fs.writeFileSync(csvPath, csv.join(''));
  console.log(`Report: ${mdPath}`);
  console.log(`CSV:    ${csvPath}`);
  return { mdPath, csvPath };
}

function applyCopy(plans, overwrite) {
  let copied = 0;
  for (const p of plans) {
    const destDir = path.join(PROJECTS_DIR, p.projectDir);
    const destPath = path.join(destDir, p.destResolved);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    if (fs.existsSync(destPath) && !overwrite && !/^WIP-/i.test(p.destResolved)) {
      console.warn(`Skip (exists): ${destPath}`);
      continue;
    }
    fs.copyFileSync(p.abs, destPath);
    copied += 1;
  }
  console.log(`Copied ${copied} file(s).`);
}

async function main() {
  const { usbPath, apply, overwrite, scaffoldNew } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(usbPath)) {
    console.error(`USB path not found: ${usbPath}`);
    process.exit(1);
  }

  if (scaffoldNew) {
    await scaffoldUncapturedProjects(usbPath);
  }

  const entries = fs.readdirSync(usbPath, { withFileTypes: true });
  const folders = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const unmapped = folders.filter((f) => !USB_FOLDER_TO_PROJECT_DIR[f]);
  if (unmapped.length) {
    console.warn('Unmapped USB folders:', unmapped.join(', '));
  }

  const allPlans = [];
  for (const folder of folders) {
    const { error, plans } = await planFolder(usbPath, folder, overwrite);
    if (error) console.warn(error);
    else allPlans.push(...plans);
  }

  writeReport(allPlans, usbPath, apply, overwrite);

  if (apply) {
    applyCopy(allPlans, overwrite);
  } else {
    console.log(`Dry-run: ${allPlans.length} file(s) planned. Use --apply to copy.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
