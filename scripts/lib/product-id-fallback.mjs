/**
 * Heuristics: project names that need Lens / web-search fallback (T-00030).
 */

export const PRODUCT_ID_SKIP_IDS = new Set(['0000', '0001', '0002', '0003']);

/** Lowercase patterns — if projectName matches, flag for fallback. */
export const GENERIC_NAME_PATTERNS = [
  /^anime\b/i,
  /^tan plush\b/i,
  /^tan teddy\b/i,
  /^vintage tan teddy\b/i,
  /^yellow teddy\b/i,
  /^teddy bear$/i,
  /^dog$/i,
  /^panda plush$/i,
  /^atomizer$/i,
  /^intake\b/i,
  /^companion cat$/i,
  /^singing bear$/i,
  /^kiddie katch/i,
  /^times sq tower$/i,
  /^plush kangaroo$/i,
  /^husky plush dog$/i,
  /^floppy dog plush$/i,
  /^brown sherpa teddy bear$/i,
  /^curly teddy pink ribbon$/i,
  /^shaggy bunny plush$/i,
  /^vintage rabbit plushie$/i,
];

export function needsProductIdFallback(projectName) {
  const n = (projectName || '').trim();
  if (!n) return true;
  return GENERIC_NAME_PATTERNS.some((re) => re.test(n));
}

/** Build Google Lens upload-by-URL link. */
export function googleLensUrl(imageHttpsUrl) {
  return `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageHttpsUrl)}`;
}

/** Build Google Images reverse-search link. */
export function googleImageSearchUrl(imageHttpsUrl) {
  return `https://www.google.com/searchbyimage?image_url=${encodeURIComponent(imageHttpsUrl)}`;
}
