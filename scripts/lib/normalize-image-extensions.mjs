import { ensureAcceptableProjectImages } from './project-image-extensions.mjs';

/** @deprecated Use ensureAcceptableProjectImages */
export function canonicalJpegFileName(name) {
  return name.replace(/\.jpe?g$/i, '.jpeg');
}

/** Plan and apply .jpg → .jpeg; validate only .png / .jpeg allowed. */
export function normalizeProjectImageExtensions(dir, { dryRun = false } = {}) {
  return ensureAcceptableProjectImages(dir, { dryRun });
}
