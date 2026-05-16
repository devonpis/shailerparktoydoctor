/** Build a single hashtag from a config tag (no # in JSON). Strips spaces, hyphens, and other punctuation. */
export function tagToHashtag(tag) {
  const body = String(tag)
    .trim()
    .replace(/^#+/, '')
    .replace(/[\s\-–—_'’`.]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
  return body ? `#${body}` : '';
}

export function buildHashtagLine(tags) {
  return (Array.isArray(tags) ? tags : [])
    .map(tagToHashtag)
    .filter(Boolean)
    .join(' ');
}
