#!/usr/bin/env node
/**
 * Validate a repair project before publish (social or webpage).
 * Usage: node scripts/validate-publish.mjs <project-folder-or-id>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHashtagLine } from './lib/hashtag.mjs';
import { buildThreadsCaption, THREADS_CAPTION_MAX } from './lib/caption.mjs';
import { SOCIAL_CAROUSEL_MAX } from './lib/project-media.mjs';
import {
  assertStatusDone,
  validateDoneReadiness,
  validateStoryPagePublished,
} from './lib/project-readiness.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

export const LIMITS = {
  descriptionMaxChars: 500,
  titleMaxChars: 500,
  tagsMin: 1,
  tagsMax: 30,
  tagMaxChars: 50,
};

const IMAGE_RE = /^(before|after|hero|WIP-\d{3})\.(jpe?g|png)$/i;
const VIDEO_RE = /\.(mp4|mov|webm|m4v)$/i;

function resolveProjectDir(arg) {
  if (!arg) {
    throw new Error('Usage: node scripts/validate-publish.mjs <project-folder-or-id>');
  }
  if (path.isAbsolute(arg) && fs.existsSync(arg)) {
    return arg;
  }
  const underProjects = path.join(PROJECTS_DIR, arg);
  if (fs.existsSync(underProjects)) {
    return underProjects;
  }
  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  const padded = /^\d+$/.test(arg) ? arg.padStart(4, '0') : arg;
  const match = entries.find(
    (e) =>
      e.isDirectory() &&
      (e.name === arg ||
        e.name.startsWith(`${arg} -`) ||
        e.name.startsWith(`${padded} -`))
  );
  if (match) return path.join(PROJECTS_DIR, match.name);
  throw new Error(`Project not found: ${arg}`);
}

function listMediaFiles(dir) {
  const names = fs.readdirSync(dir);
  const images = names.filter((n) => IMAGE_RE.test(n));
  const videos = names.filter((n) => VIDEO_RE.test(n));
  return { images, videos };
}

function validateConfig(config, dir) {
  const errors = [];
  const warnings = [];

  errors.push(...assertStatusDone(config));

  const { errors: readinessErrors, images } = validateDoneReadiness(config, dir);
  errors.push(...readinessErrors);

  const title = typeof config.title === 'string' ? config.title.trim() : '';
  if (title.length > LIMITS.titleMaxChars) {
    errors.push(`title exceeds ${LIMITS.titleMaxChars} characters (${title.length}).`);
  }

  const description = typeof config.description === 'string' ? config.description.trim() : '';
  if (description.length > LIMITS.descriptionMaxChars) {
    errors.push(
      `description exceeds ${LIMITS.descriptionMaxChars} characters (${description.length}) — Threads limit for shared captions.`
    );
  }

  if (!Array.isArray(config.tags) || config.tags.length < LIMITS.tagsMin) {
    errors.push(`tags must be a non-empty array (min ${LIMITS.tagsMin}, max ${LIMITS.tagsMax}).`);
  } else {
    if (config.tags.length > LIMITS.tagsMax) {
      errors.push(`tags has ${config.tags.length} items; max ${LIMITS.tagsMax} (Instagram).`);
    }
    for (let i = 0; i < config.tags.length; i++) {
      const t = config.tags[i];
      if (typeof t !== 'string' || !t.trim()) {
        errors.push(`tags[${i}] must be a non-empty string.`);
      } else if (t.includes('#')) {
        warnings.push(`tags[${i}] contains "#" — store tags without # in config.`);
      } else if (t.trim().length > LIMITS.tagMaxChars) {
        errors.push(`tags[${i}] exceeds ${LIMITS.tagMaxChars} characters.`);
      }
    }
  }

  const { videos } = listMediaFiles(dir);
  const imageList = images?.length ? images : listMediaFiles(dir).images;
  if (imageList.length > SOCIAL_CAROUSEL_MAX) {
    warnings.push(
      `Folder has ${imageList.length} images; social carousel uses at most ${SOCIAL_CAROUSEL_MAX} (hero → before → after → WIP). Webpage gallery is unlimited.`
    );
  }

  if (videos.length > 0 && imageList.length === 0) {
    warnings.push('Video present without still images — social carousel may be video-only when supported.');
  }

  const hashtagPreview = buildHashtagLine(config.tags);
  const captionWithTags = [description, hashtagPreview].filter(Boolean).join('\n\n');
  if (captionWithTags.length > LIMITS.descriptionMaxChars) {
    errors.push(
      `description + hashtags would be ${captionWithTags.length} characters; max ${LIMITS.descriptionMaxChars} for cross-platform social.`
    );
  }

  const threadsCaption = description ? buildThreadsCaption(config) : '';
  if (threadsCaption.length > THREADS_CAPTION_MAX) {
    errors.push(
      `Threads caption is ${threadsCaption.length} characters; max ${THREADS_CAPTION_MAX} (no hashtags).`
    );
  } else if (
    description &&
    (description.length > THREADS_CAPTION_MAX || threadsCaption.endsWith('…'))
  ) {
    warnings.push(
      `Threads will use a shortened caption (${threadsCaption.length}/${THREADS_CAPTION_MAX} chars, no hashtags, URLs stripped).`
    );
  }

  return { errors, warnings, images: imageList, videos, captionWithTags, threadsCaption };
}

/** Social publish: DONE + presentable content + index.html + webpageUrl. */
export function validateSocialProject(projectArg) {
  const base = validateProject(projectArg);
  if (!base.config) return base;
  const extra = validateStoryPagePublished(base.config, base.dir);
  const errors = [...base.errors, ...extra];
  return { ...base, ok: errors.length === 0, errors };
}

export function validateProject(projectArg) {
  const dir = resolveProjectDir(projectArg);
  const configPath = path.join(dir, 'config.json');
  if (!fs.existsSync(configPath)) {
    return { ok: false, dir, errors: ['config.json missing.'], warnings: [] };
  }
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    return { ok: false, dir, errors: [`config.json invalid JSON: ${e.message}`], warnings: [] };
  }
  const { errors, warnings, images, videos, captionWithTags, threadsCaption } = validateConfig(
    config,
    dir
  );
  return {
    ok: errors.length === 0,
    dir,
    config,
    errors,
    warnings,
    images,
    videos,
    captionWithTags,
    threadsCaption,
    limits: LIMITS,
  };
}

function main() {
  const arg = process.argv[2];
  let result;
  try {
    result = validateProject(arg);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  const name = path.basename(result.dir);
  console.log(`Project: ${name}`);
  console.log(
    `Limits: caption/title ≤${LIMITS.descriptionMaxChars} chars; tags ${LIMITS.tagsMin}–${LIMITS.tagsMax}`
  );
  if (result.images?.length) console.log(`Images: ${result.images.join(', ')}`);
  if (result.videos?.length) console.log(`Videos: ${result.videos.join(', ')}`);

  for (const w of result.warnings) console.warn(`WARN: ${w}`);
  for (const e of result.errors) console.error(`FAIL: ${e}`);

  if (result.ok) {
    console.log('OK: publish content checks passed.');
    if (result.captionWithTags) {
      console.log(
        `Caption+tags length: ${result.captionWithTags.length}/${LIMITS.descriptionMaxChars}`
      );
    }
    if (result.threadsCaption != null) {
      console.log(`Threads caption: ${result.threadsCaption.length}/${THREADS_CAPTION_MAX} (no hashtags)`);
    }
    process.exit(0);
  }
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
