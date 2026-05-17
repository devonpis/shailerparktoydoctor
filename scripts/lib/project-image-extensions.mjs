import fs from 'node:fs';
import path from 'node:path';
import { listProjectImages } from './project-media.mjs';
import { updateProjectPathReferences } from './update-project-path-refs.mjs';

/** Canonical repair filenames: before/after/hero/WIP-### with .jpeg or .png only. */
export const CANONICAL_IMAGE_RE = /^(before|after|hero|WIP-\d{3})\.(jpe?g|png)$/i;

const CANONICAL_STEM_RE = /^(before|after|hero|WIP-\d{3})$/i;

export function isAcceptableImageExt(ext) {
  const e = String(ext || '').toLowerCase().replace(/^\./, '');
  return e === 'jpeg' || e === 'jpg' || e === 'png';
}

export function canonicalImageFileName(name) {
  if (/\.jpe?g$/i.test(name)) return name.replace(/\.jpe?g$/i, '.jpeg');
  return name;
}

/**
 * Enforce .jpeg (not .jpg) and only .png / .jpeg for canonical repair images.
 * Returns renames applied (jpg→jpeg) and errors for disallowed types.
 */
export function ensureAcceptableProjectImages(dir, { dryRun = false } = {}) {
  const renames = [];
  const errors = [];
  const label = path.basename(dir);

  for (const name of fs.readdirSync(dir)) {
    const stem = path.basename(name, path.extname(name));
    if (!CANONICAL_STEM_RE.test(stem)) continue;

    const ext = path.extname(name).toLowerCase();
    if (ext === '.webp' || ext === '.gif') {
      errors.push(
        `${label}: ${name} — use .jpeg or .png for repair images (run optimize to convert, or remove file)`
      );
      continue;
    }
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      errors.push(`${label}: ${name} — extension must be .jpeg or .png`);
      continue;
    }
    if (ext === '.jpg') {
      const newName = canonicalImageFileName(name);
      if (fs.existsSync(path.join(dir, newName))) {
        errors.push(`${label}: cannot rename ${name} → ${newName} (target exists)`);
        continue;
      }
      renames.push({ oldName: name, newName });
    }
  }

  if (errors.length) return { renames, errors, updatedFiles: [] };

  if (!dryRun) {
    for (const { oldName, newName } of renames) {
      fs.renameSync(path.join(dir, oldName), path.join(dir, newName));
    }
  }

  let updatedFiles = [];
  if (!dryRun && renames.length) {
    updatedFiles = updateProjectPathReferences(renames);
  }

  return { renames, errors, updatedFiles };
}

/** Gate for publish: normalize jpg→jpeg; block webp/gif on canonical names. */
export function validateAcceptableProjectImages(dir) {
  const { errors } = ensureAcceptableProjectImages(dir, { dryRun: false });
  return errors;
}
