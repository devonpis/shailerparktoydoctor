/**
 * Inject site-notice-banner.js on public HTML pages (idempotent).
 */

export const SITE_NOTICE_SCRIPT_TAG =
  '<script src="/js/site-notice-banner.js" defer></script>';

const SITE_NOTICE_SCRIPT_RE =
  /\s*<script src="\/js\/site-notice-banner\.js" defer><\/script>\n?/;

export function refreshSiteNoticeScriptInHtml(html) {
  let next = html.replace(SITE_NOTICE_SCRIPT_RE, '\n');
  if (next.includes('/js/site-notice-banner.js')) return html;

  if (!/<\/body>/i.test(next)) return html;

  return next.replace(/<\/body>/i, `    ${SITE_NOTICE_SCRIPT_TAG}\n  </body>`);
}
