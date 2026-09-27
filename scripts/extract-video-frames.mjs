#!/usr/bin/env node
/**
 * Extract stills from a repair video; auto-crop letterbox/pillarbox black bars.
 *
 * Usage:
 *   node scripts/extract-video-frames.mjs <video.mp4> <outDir> [--at 2:before,620:after,...]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const FFMPEG = process.env.FFMPEG || `${process.env.HOME}/.local/bin/ffmpeg`;

function run(cmd, args, quiet = false) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: quiet ? 'pipe' : 'inherit',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(`${cmd} failed: ${r.stderr || r.stdout || r.status}`);
  }
  return quiet ? `${r.stderr || ''}${r.stdout || ''}` : r.stdout || '';
}

function detectCrop(video, sec) {
  const log = run(
    FFMPEG,
    [
      '-nostdin',
      '-ss',
      String(sec),
      '-i',
      video,
      '-frames:v',
      '30',
      '-vf',
      'cropdetect=limit=16:round=2:reset=0',
      '-f',
      'null',
      '-',
    ],
    true,
  );
  const lines = log.split('\n');
  let crop = '';
  for (const line of lines) {
    const m = line.match(/crop=([0-9:]+)/);
    if (m) crop = m[1];
  }
  return crop;
}

function parsePairs(argv) {
  const pairs = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--at' && argv[i + 1]) {
      for (const part of argv[++i].split(',')) {
        const [sec, name] = part.trim().split(':');
        if (sec && name) pairs.push({ sec: parseFloat(sec), name });
      }
    }
  }
  return pairs;
}

function main() {
  const args = process.argv.slice(2);
  const video = args[0];
  const outDir = args[1];
  const pairs = parsePairs(args.slice(2));
  if (!video || !outDir || !pairs.length) {
    console.error(
      'Usage: node scripts/extract-video-frames.mjs <video> <outDir> --at 2:before,620:after',
    );
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  for (const { sec, name } of pairs) {
    const crop = detectCrop(video, sec);
    const vf = crop ? `crop=${crop}` : 'null';
    const out = path.join(outDir, `${name}.jpeg`);
    console.log(`\n${name} @ ${sec}s  crop=${crop || 'none'}`);
    run(FFMPEG, [
      '-nostdin',
      '-y',
      '-ss',
      String(sec),
      '-i',
      video,
      '-frames:v',
      '1',
      '-vf',
      vf,
      '-q:v',
      '2',
      out,
    ]);
  }
  console.log(`\nWrote ${pairs.length} images → ${outDir}`);
}

main();
