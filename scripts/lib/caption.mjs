import { LIMITS } from '../validate-publish.mjs';

export function buildCaption(config) {
  const description = (config.description || '').trim();
  const tags = Array.isArray(config.tags) ? config.tags : [];
  const hashtagLine = tags
    .map((t) => `#${String(t).trim().replace(/\s+/g, '')}`)
    .filter(Boolean)
    .join(' ');
  const caption = [description, hashtagLine].filter(Boolean).join('\n\n');
  if (caption.length > LIMITS.descriptionMaxChars) {
    throw new Error(
      `Caption is ${caption.length} chars (max ${LIMITS.descriptionMaxChars} for cross-platform).`
    );
  }
  return caption;
}
