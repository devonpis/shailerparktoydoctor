import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '../../data/site-analytics.json');

let cachedId;

export function getGa4MeasurementId() {
  if (cachedId) return cachedId;
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const id = String(raw.ga4MeasurementId || '').trim();
  if (!/^G-[A-Z0-9]+$/i.test(id)) {
    throw new Error(`Invalid ga4MeasurementId in ${CONFIG_PATH}`);
  }
  cachedId = id;
  return id;
}

/** Head markup (4-space indent) for static HTML pages. */
export function googleAnalyticsHeadMarkup(measurementId = getGa4MeasurementId()) {
  return `    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    </script>`;
}

export function hasGoogleAnalytics(html) {
  return /googletagmanager\.com\/gtag\/js/i.test(html);
}

/** Insert GA4 after charset meta; no-op if tag already present. */
export function ensureGoogleAnalyticsInHtml(html) {
  if (hasGoogleAnalytics(html)) return html;
  const snippet = googleAnalyticsHeadMarkup();
  const afterCharset = /(<meta\s+charset="utf-8"\s*\/?>)/i;
  if (afterCharset.test(html)) {
    return html.replace(afterCharset, `$1\n${snippet}`);
  }
  return html.replace(/<head>/i, `<head>\n${snippet}`);
}
