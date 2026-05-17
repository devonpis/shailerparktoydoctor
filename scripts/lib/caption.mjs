import { buildHashtagLine } from './hashtag.mjs';

const DESCRIPTION_MAX_CHARS = 500;

/** Threads post text at publish time (stricter than config `description` max). */
export const THREADS_CAPTION_MAX = 100;

/** Short caption for Threads: no hashtags, no URLs, ≤ {@link THREADS_CAPTION_MAX} chars. */
export function summarizeForThreads(text, maxChars = THREADS_CAPTION_MAX) {
  let s = String(text || '')
    .trim()
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  if (s.length <= maxChars) return s;

  const budget = maxChars - 1;
  const cut = s.slice(0, budget);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > budget * 0.45) {
    return `${cut.slice(0, lastSpace).trim()}…`;
  }
  return `${cut.trim()}…`;
}

export function buildThreadsCaption(config) {
  return summarizeForThreads(config.description || '');
}

export function buildCaption(config, { includeHashtags = true } = {}) {
  const description = (config.description || '').trim();
  const parts = [description];
  if (includeHashtags) parts.push(buildHashtagLine(config.tags));
  const caption = parts.filter(Boolean).join('\n\n');
  if (caption.length > DESCRIPTION_MAX_CHARS) {
    throw new Error(
      `Caption is ${caption.length} chars (max ${DESCRIPTION_MAX_CHARS} for cross-platform).`
    );
  }
  return caption;
}
