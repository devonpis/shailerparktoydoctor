#!/usr/bin/env node
/**
 * T-00039: Report project images that may need rotation (no writes).
 *
 * Usage:
 *   node scripts/report-project-image-orientation.mjs [--all] [--out path.csv]
 *   node scripts/report-project-image-orientation.mjs --vision   # needs OPENAI_API_KEY
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { listProjectImages } from './lib/project-media.mjs';
import { PROJECTS_DIR } from './lib/resolve-project-dir.mjs';
import { tryLoadEnv } from './lib/load-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const PRIMARY_STEMS = ['hero', 'before', 'after'];

function parseArgs(argv) {
  const flags = { vision: false, out: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--vision') flags.vision = true;
    else if (a === '--out') flags.out = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: node scripts/report-project-image-orientation.mjs [--vision] [--out report.csv]'
      );
      process.exit(0);
    }
  }
  if (!flags.out) {
    flags.out = path.join(
      REPO_ROOT,
      'docs/reports',
      `image-orientation-audit-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }
  return flags;
}

function stem(name) {
  return name.replace(/\.[^.]+$/, '').toLowerCase();
}

function isPrimary(name) {
  const s = stem(name);
  return PRIMARY_STEMS.some((p) => s === p || s.startsWith(p));
}

function heuristicFlag(width, height, name) {
  if (!width || !height) return '';
  const ratio = width / height;
  const s = stem(name);
  if (isPrimary(name) && ratio > 1.15) {
    return 'review_landscape_primary';
  }
  if (/^wip-\d+/.test(s) && ratio > 1.4) {
    return 'review_landscape_wip';
  }
  return '';
}

async function encodeVisionThumb(filePath) {
  const buf = await sharp(filePath)
    .rotate()
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return buf.toString('base64');
}

async function visionCheck(filePath, env) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const base = env.OPENAI_API_BASE?.trim() || 'https://api.openai.com/v1';
  const model = env.OPENAI_VISION_MODEL?.trim() || 'gpt-4o-mini';
  const b64 = await encodeVisionThumb(filePath);
  const name = path.basename(filePath);
  const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Toy repair photo "${name}". Upright for viewing? JSON only: {"ok":true} or {"ok":false,"rotate":"cw"|"ccw"|"180"}`,
            },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
          ],
        },
      ],
      max_tokens: 60,
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  return json ? JSON.parse(json) : { ok: true, raw: text };
}

function csvEscape(s) {
  const t = String(s ?? '');
  return t.includes(',') || t.includes('"') ? `"${t.replace(/"/g, '""')}"` : t;
}

async function main() {
  tryLoadEnv();
  const flags = parseArgs(process.argv);
  const env = process.env;
  const useVision = flags.vision && !!env.OPENAI_API_KEY?.trim();

  if (flags.vision && !useVision) {
    console.warn('WARN: --vision requested but OPENAI_API_KEY missing; heuristic + EXIF only.\n');
  }

  const dirs = fs
    .readdirSync(PROJECTS_DIR)
    .filter((n) => /^\d{4} - /.test(n) && !n.startsWith('0000'))
    .sort()
    .map((n) => ({ id: n.slice(0, 4), folder: n, path: path.join(PROJECTS_DIR, n) }));

  const rows = [];
  let n = 0;
  for (const { id, folder, path: dir } of dirs) {
    for (const name of listProjectImages(dir)) {
      n += 1;
      const filePath = path.join(dir, name);
      const meta = await sharp(filePath).metadata();
      const width = meta.width ?? 0;
      const height = meta.height ?? 0;
      const orientation = meta.orientation ?? 1;
      const exifNeedsFix = orientation !== 1;
      const heuristic = heuristicFlag(width, height, name);

      let visionOk = '';
      let visionRotate = '';
      let needsFix = exifNeedsFix ? 'exif' : heuristic ? 'heuristic' : '';

      if (useVision && !exifNeedsFix) {
        try {
          const v = await visionCheck(filePath, env);
          visionOk = v.ok === true ? 'yes' : 'no';
          visionRotate = v.rotate || '';
          if (v.ok === false && v.rotate) needsFix = 'vision';
          if (n % 25 === 0) process.stderr.write(`  vision ${n}…\n`);
        } catch (e) {
          visionOk = 'error';
          visionRotate = e.message.slice(0, 80);
        }
      }

      if (needsFix) {
        rows.push({
          id,
          folder,
          file: name,
          width,
          height,
          exif_orientation: orientation,
          needs_fix: needsFix,
          suggested_rotate:
            needsFix === 'vision'
              ? visionRotate === 'cw'
                ? '--cw'
                : visionRotate === 'ccw'
                  ? '--ccw'
                  : visionRotate === '180'
                    ? '--180'
                    : visionRotate
              : needsFix === 'exif'
                ? '--exif'
                : 'manual_review',
          vision_ok: visionOk,
          heuristic,
        });
      }
    }
  }

  const header = [
    'id',
    'folder',
    'file',
    'width',
    'height',
    'exif_orientation',
    'needs_fix',
    'suggested_rotate',
    'vision_ok',
    'heuristic',
  ];
  const lines = [
    header.join(','),
    ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(',')),
  ];
  fs.mkdirSync(path.dirname(flags.out), { recursive: true });
  fs.writeFileSync(flags.out, `${lines.join('\n')}\n`);

  const byType = { exif: 0, heuristic: 0, vision: 0 };
  for (const r of rows) byType[r.needs_fix] = (byType[r.needs_fix] || 0) + 1;

  console.log(`Scanned ${n} images in ${dirs.length} projects`);
  console.log(`Needs fix: ${rows.length} (EXIF ${byType.exif || 0}, heuristic ${byType.heuristic || 0}, vision ${byType.vision || 0})`);
  console.log(`Report: ${path.relative(REPO_ROOT, flags.out)}`);
  if (!useVision && rows.some((r) => r.heuristic)) {
    console.log('\nHeuristic flags are review hints only (landscape primary shots).');
    console.log('Run with OPENAI_API_KEY and --vision for automated upright check.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
