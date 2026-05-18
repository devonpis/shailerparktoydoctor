import { buildHashtagLine } from './hashtag.mjs';
import { pickSocialTags, SOCIAL_HASHTAG_MAX } from './social-tags.mjs';

export { SOCIAL_HASHTAG_MAX, pickSocialTags };
import {
  THREADS_CAPTION_MAX,
  cleanThreadsSource,
  rewriteForThreads,
} from './threads-caption-rewrite.mjs';

const DESCRIPTION_MAX_CHARS = 500;

export { THREADS_CAPTION_MAX, cleanThreadsSource, rewriteForThreads };

/** @deprecated Use rewriteForThreads */
export const summarizeForThreads = rewriteForThreads;

/** Threads post text: rewritten summary of `description` (≤200 chars, no hashtags). */
export function buildThreadsCaption(config) {
  return rewriteForThreads(config.description || '');
}

export function buildCaption(config, { includeHashtags = true } = {}) {
  const description = (config.description || '').trim();
  const parts = [description];
  if (includeHashtags) {
    const { picked } = pickSocialTags(config.tags, config);
    parts.push(buildHashtagLine(picked));
  }
  const caption = parts.filter(Boolean).join('\n\n');
  if (caption.length > DESCRIPTION_MAX_CHARS) {
    throw new Error(
      `Caption is ${caption.length} chars (max ${DESCRIPTION_MAX_CHARS} for cross-platform).`
    );
  }
  return caption;
}
