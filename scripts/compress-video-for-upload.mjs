#!/usr/bin/env node
/**
 * Compress a large iMovie/export MP4 for YouTube upload.
 *
 * Usage:
 *   node scripts/compress-video-for-upload.mjs <input.mp4> [--bitrate 5M] [--output out.mp4]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const FFMPEG = process.env.FFMPEG || `${process.env.HOME}/.local/bin/ffmpeg`;
const FFPROBE = process.env.FFPROBE || `${process.env.HOME}/.local/bin/ffprobe`;

function parseArgs(argv) {
  const positional = [];
  let bitrate = '5M';
  let output = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bitrate' && argv[i + 1]) bitrate = argv[++i];
    else if (a === '--output' && argv[i + 1]) output = argv[++i];
    else if (!a.startsWith('-')) positional.push(a);
  }
  return { input: positional[0], bitrate, output };
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${cmd} failed (${r.status})`);
}

function probeSize(file) {
  return fs.statSync(file).size;
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function defaultOutput(input) {
  const dir = path.dirname(input);
  const ext = path.extname(input);
  const base = path.basename(input, ext);
  if (base.endsWith('-upload')) return path.join(dir, `${base}${ext}`);
  return path.join(dir, `${base}-upload${ext}`);
}

function main() {
  const { input, bitrate, output: outArg } = parseArgs(process.argv.slice(2));
  if (!input) {
    console.error('Usage: node scripts/compress-video-for-upload.mjs <input.mp4> [--bitrate 5M] [--output out.mp4]');
    process.exit(1);
  }
  if (!fs.existsSync(input)) {
    console.error(`Not found: ${input}`);
    process.exit(1);
  }

  const output = outArg || defaultOutput(input);
  const before = probeSize(input);

  console.log(`Input:  ${input} (${formatMb(before)})`);
  console.log(`Output: ${output}`);
  console.log(`Video:  h264_videotoolbox ${bitrate}, AAC 128k, faststart\n`);

  run(FFMPEG, [
    '-nostdin',
    '-y',
    '-hide_banner',
    '-i',
    input,
    '-c:v',
    'h264_videotoolbox',
    '-b:v',
    bitrate,
    '-profile:v',
    'high',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-ar',
    '48000',
    '-movflags',
    '+faststart',
    output,
  ]);

  const after = probeSize(output);
  const pct = before ? ((1 - after / before) * 100).toFixed(0) : '?';
  console.log(`\nDone: ${output} (${formatMb(after)}, ~${pct}% smaller)`);
}

main();
