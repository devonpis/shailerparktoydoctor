#!/usr/bin/env node
/**
 * T-00039: Analyze and fix project image orientation.
 *
 * 1. EXIF auto-orient (sharp .rotate()) for tagged images
 * 2. Optional vision pass for images still needing review (OPENAI_API_KEY)
 *
 * Usage:
 *   node scripts/fix-project-image-orientation.mjs --all [--dry-run]
 *   node scripts/fix-project-image-orientation.mjs 0001 0003
 *   node scripts/fix-project-image-orientation.mjs --all --exif-only
 *   node scripts/fix-project-image-orientation.mjs --all --vision [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { listProjectImages } from './lib/project-media.mjs';
import { PROJECTS_DIR, resolveProjectDir } from './lib/resolve-project-dir.mjs';
import { autoOrientInPlace, rotateImageInPlace, ROTATE_PRESETS } from './lib/rotate-image.mjs';
import { tryLoadEnv } from './lib/load-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const flags = {
    dryRun: false,
    all: false,
    exifOnly: false,
    vision: false,
    targets: [],
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--exif-only') flags.exifOnly = true;
    else if (a === '--vision') flags.vision = true;
    else if (!a.startsWith('--')) flags.targets.push(a);
  }
  if (!flags.all && !flags.targets.length) {
    throw new Error(
      'Usage: node scripts/fix-project-image-orientation.mjs --all | <id>… [--exif-only] [--vision] [--dry-run]'
    );
  }
  return flags;
}

function listProjectDirs(targets, all) {
  if (all) {
    return fs
      .readdirSync(PROJECTS_DIR)
      .filter((n) => /^\d{4} - /.test(n) && !n.startsWith('0000'))
      .map((n) => path.join(PROJECTS_DIR, n));
  }
  return targets.map((t) => resolveProjectDir(t));
}

async function analyzeExif(filePath) {
  const meta = await sharp(filePath).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    orientation: meta.orientation ?? 1,
  };
}

async function encodeVisionThumb(filePath) {
  const buf = await sharp(filePath)
    .rotate()
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return buf.toString('base64');
}

async function visionOrientation(filePath, env) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const base = env.OPENAI_API_BASE?.trim() || 'https://api.openai.com/v1';
  const model = env.OPENAI_VISION_MODEL?.trim() || 'gpt-4o-mini';
  if (!apiKey) throw new Error('OPENAI_API_KEY required for --vision');

  const b64 = await encodeVisionThumb(filePath);
  const name = path.basename(filePath);
  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `This is a photo for a toy repair website ("${name}"). Is it upright for normal viewing (subject right-side up, not sideways or upside-down)? Reply JSON only: {"ok":true} or {"ok":false,"rotate":"cw"|"ccw"|"180"} where rotate is the correction to apply to the file as stored.`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${b64}` },
          },
        ],
      },
    ],
    max_tokens: 80,
  };

  const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Vision API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return { ok: true, raw: text };
  return JSON.parse(json);
}

function rotateFromVisionHint(hint) {
  const h = String(hint || '').toLowerCase();
  if (h === 'cw') return ROTATE_PRESETS.cw;
  if (h === 'ccw') return ROTATE_PRESETS.ccw;
  if (h === '180') return ROTATE_PRESETS['180'];
  return null;
}

async function processProject(dir, flags, env) {
  const label = path.basename(dir);
  const names = listProjectImages(dir);
  if (!names.length) return { label, exif: 0, vision: 0, skipped: 0 };

  let exifFixed = 0;
  let visionFixed = 0;
  let skipped = 0;

  console.log(`\n${label} (${names.length} images)`);

  for (const name of names) {
    const filePath = path.join(dir, name);
    const before = await analyzeExif(filePath);

    if (before.orientation !== 1 && before.orientation !== undefined) {
      const r = await autoOrientInPlace(filePath, { dryRun: flags.dryRun });
      if (!r.skipped) {
        exifFixed += 1;
        console.log(
          `  ${flags.dryRun ? '[dry-run] ' : ''}EXIF ${name}: orient ${before.orientation} → upright`
        );
      }
      continue;
    }

    if (flags.exifOnly || !flags.vision) {
      skipped += 1;
      continue;
    }

    try {
      const v = await visionOrientation(filePath, env);
      if (v.ok === true) {
        skipped += 1;
        continue;
      }
      const deg = rotateFromVisionHint(v.rotate);
      if (deg == null) {
        console.log(`  ? ${name}: vision unsure ${JSON.stringify(v)}`);
        skipped += 1;
        continue;
      }
      const flag = deg === ROTATE_PRESETS.cw ? '--cw' : deg === ROTATE_PRESETS.ccw ? '--ccw' : '--180';
      if (flags.dryRun) {
        console.log(`  [dry-run] vision ${name}: needs ${flag}`);
        visionFixed += 1;
      } else {
        const r = await rotateImageInPlace(filePath, deg);
        visionFixed += 1;
        console.log(
          `  vision ${name}: ${flag} — ${r.before.width}×${r.before.height} → ${r.after.width}×${r.after.height}`
        );
      }
    } catch (e) {
      console.warn(`  vision ${name}: ${e.message}`);
      skipped += 1;
    }
  }

  return { label, exif: exifFixed, vision: visionFixed, skipped };
}

async function main() {
  tryLoadEnv();
  const flags = parseArgs(process.argv);
  const env = process.env;
  if (flags.vision && !env.OPENAI_API_KEY?.trim()) {
    console.error('--vision requires OPENAI_API_KEY in .env');
    process.exit(1);
  }

  const dirs = listProjectDirs(flags.targets, flags.all);
  console.log(
    `Orientation fix: ${dirs.length} project(s); exif=${!flags.vision || true}; vision=${flags.vision}; dry-run=${flags.dryRun}`
  );

  let totalExif = 0;
  let totalVision = 0;
  for (const dir of dirs) {
    const r = await processProject(dir, flags, env);
    totalExif += r.exif;
    totalVision += r.vision;
  }

  console.log(
    `\nDone: EXIF ${totalExif} fixed${flags.dryRun ? ' (dry-run)' : ''}; vision ${totalVision}${flags.exifOnly ? '; vision skipped (--exif-only)' : ''}.`
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
