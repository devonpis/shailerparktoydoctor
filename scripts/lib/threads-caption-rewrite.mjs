/** Threads post text: rewrite `description` to fit; never end with "…" truncation. */

export const THREADS_CAPTION_MAX = 200;

export function cleanThreadsSource(text) {
  return String(text || '')
    .trim()
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return parts?.map((s) => s.trim()).filter(Boolean) || [text];
}

/** Fit one clause at a word boundary; complete sentence (period if missing). */
function fitClause(text, maxChars) {
  let s = text.trim();
  if (s.length <= maxChars) return s;

  const cut = s.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  s = (lastSpace > maxChars * 0.45 ? cut.slice(0, lastSpace) : cut).trim();
  for (const sep of [' — ', '. ', ', ']) {
    const idx = s.lastIndexOf(sep);
    if (idx > maxChars * 0.45) {
      s = s.slice(0, idx).trim();
      break;
    }
  }
  s = s.replace(/[,;:]\s*$/, '').replace(/\s+and\s*$/i, '').trim();
  if (s && !/[.!?]$/.test(s)) s += '.';
  return s;
}

/**
 * Rewrite description for Threads: pack sentences, prefer hook + outcome, no ellipsis.
 */
export function rewriteForThreads(text, maxChars = THREADS_CAPTION_MAX) {
  const s = cleanThreadsSource(text);
  if (!s) return '';
  if (s.length <= maxChars) return s;

  const sentences = splitSentences(s);

  let packed = '';
  let stoppedAt = 0;
  for (let i = 0; i < sentences.length; i++) {
    const sent = sentences[i];
    const next = packed ? `${packed} ${sent}` : sent;
    if (next.length <= maxChars) {
      packed = next;
      stoppedAt = i + 1;
      continue;
    }
    if (!packed) {
      const dashParts = sent.split(/\s*[—–]\s+/);
      if (dashParts[0].length <= maxChars && dashParts[0].length >= 40) {
        return fitClause(dashParts[0], maxChars);
      }
      return fitClause(sent, maxChars);
    }
    stoppedAt = i;
    break;
  }
  if (packed) {
    const tail = sentences[stoppedAt];
    if (tail) {
      let tailText = tail.replace(/^We\s+/i, '');
      if (tailText) tailText = tailText.charAt(0).toUpperCase() + tailText.slice(1);
      const combo = `${packed.replace(/[.!?]+$/, '')}. ${tailText}`;
      if (combo.length <= maxChars) return combo;
      const prefix = `${packed.replace(/[.!?]+$/, '')}. `;
      const room = maxChars - prefix.length;
      if (room > 35) {
        const shortTail = fitClause(tailText, room);
        const trimmed = `${prefix}${shortTail}`.trim();
        if (trimmed.length <= maxChars && !trimmed.endsWith('…')) return trimmed;
      }
    }
    return packed;
  }

  const withoutWe = sentences
    .map((sent, i) => (i > 0 ? sent.replace(/^We\s+/i, '') : sent))
    .join(' ');
  if (withoutWe.length <= maxChars) return withoutWe;

  const hook = sentences[0] || s;
  const outcome = sentences.find(
    (sent, i) => i > 0 && /\b(fixed|repaired|replaced|restored|working|back|again|now)\b/i.test(sent)
  );
  if (outcome && outcome !== hook) {
    const combo = `${hook.replace(/[.!?]+$/, '')}. ${outcome.replace(/^We\s+/i, '')}`;
    if (combo.length <= maxChars) return combo;
    const shortHook = fitClause(hook, Math.min(maxChars - 20, 120));
    const room = maxChars - shortHook.length - 1;
    if (room > 30) {
      const tail = fitClause(outcome.replace(/^We\s+/i, ''), room);
      const joined = `${shortHook.replace(/[.!?]+$/, '')}. ${tail}`;
      if (joined.length <= maxChars) return joined;
    }
  }

  return fitClause(hook, maxChars);
}
