import { LIMITS } from '../validate-publish.mjs';
import { buildHashtagLine } from './hashtag.mjs';

export function buildCaption(config, { includeHashtags = true } = {}) {
  const description = (config.description || '').trim();
  const parts = [description];
  if (includeHashtags) parts.push(buildHashtagLine(config.tags));
  const caption = parts.filter(Boolean).join('\n\n');
  if (caption.length > LIMITS.descriptionMaxChars) {
    throw new Error(
      `Caption is ${caption.length} chars (max ${LIMITS.descriptionMaxChars} for cross-platform).`
    );
  }
  return caption;
}
