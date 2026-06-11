/**
 * Bake “Toy Doctor” bold (matches js/brand-text.js) at HTML generation time.
 */

const PHRASE = 'Toy Doctor';

export function boldToyDoctorInText(text) {
  return String(text ?? '').split(PHRASE).join('<strong>Toy Doctor</strong>');
}

/** Bold phrase in text segments only — preserves existing tags (e.g. linkify <a>). */
export function boldToyDoctorInHtmlFragment(html) {
  return String(html ?? '')
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith('<') ? part : boldToyDoctorInText(part)))
    .join('');
}

/** Bold in <p>…</p> blocks inside a fragment (e.g. page-main inner HTML). */
export function bakeToyDoctorBoldInParagraphs(html) {
  return html.replace(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi, (full, attrs, inner) => {
    const bolded = boldToyDoctorInHtmlFragment(inner);
    return `<p${attrs || ''}>${bolded}</p>`;
  });
}
