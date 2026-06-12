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

/** True when GA4 should load (production site only — not localhost / npm start). */
export function isGaProductionHost(hostname) {
  return /^(www\.)?sptoydoctor\.com\.au$/i.test(String(hostname || '').trim());
}

/** Head markup (4-space indent) for static HTML pages. */
export function googleAnalyticsHeadMarkup(measurementId = getGa4MeasurementId()) {
  return `    <!-- Google tag (gtag.js) — loads on sptoydoctor.com.au only -->
    <script>
      (function () {
        var h = location.hostname;
        if (!/^(www\\.)?sptoydoctor\\.com\\.au$/i.test(h)) return;
        var id = '${measurementId}';
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
        document.head.appendChild(s);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', id);
      })();
    </script>`;
}

export function hasGoogleAnalytics(html) {
  return (
    /googletagmanager\.com\/gtag\/js/i.test(html) ||
    /<!-- Google tag \(gtag\.js\)/i.test(html)
  );
}

const GA_BLOCK_RE =
  /    <!-- Google tag \(gtag\.js\)[^]*?<script>[\s\S]*?gtag\('config', '[^']+'\);\s*<\/script>/;

/** Replace existing GA block or insert after charset meta. */
export function refreshGoogleAnalyticsInHtml(html, measurementId = getGa4MeasurementId()) {
  const snippet = googleAnalyticsHeadMarkup(measurementId);
  if (GA_BLOCK_RE.test(html)) {
    const next = html.replace(GA_BLOCK_RE, snippet);
    if (next !== html) return next;
  }
  if (hasGoogleAnalytics(html)) return html;
  const afterCharset = /(<meta\s+charset="utf-8"\s*\/?>)/i;
  if (afterCharset.test(html)) {
    return html.replace(afterCharset, `$1\n${snippet}`);
  }
  return html.replace(/<head>/i, `<head>\n${snippet}`);
}

/** @deprecated use refreshGoogleAnalyticsInHtml */
export function ensureGoogleAnalyticsInHtml(html) {
  return refreshGoogleAnalyticsInHtml(html);
}
