/**
 * Bake site header/footer from includes/ into static HTML (no client fetch).
 */

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, PROJECTS_DIR } from './resolve-project-dir.mjs';

const INCLUDES_DIR = path.join(REPO_ROOT, 'includes');
const HEADER_INCLUDE = path.join(INCLUDES_DIR, 'site-header.html');
const FOOTER_INCLUDE = path.join(INCLUDES_DIR, 'site-footer.html');
const SOCIAL_INCLUDE = path.join(INCLUDES_DIR, 'social-icons.html');

export const CHROME_HEADER_START = '<!-- sync-site-chrome:header -->';
export const CHROME_HEADER_END = '<!-- /sync-site-chrome:header -->';
export const CHROME_FOOTER_START = '<!-- sync-site-chrome:footer -->';
export const CHROME_FOOTER_END = '<!-- /sync-site-chrome:footer -->';

function indentBlock(text, extraSpaces) {
  const pad = ' '.repeat(extraSpaces);
  return text
    .split('\n')
    .map((line) => (line.length ? `${pad}${line}` : line))
    .join('\n');
}

function inlineSocialSlots(fragment, socialHtml) {
  const indented = socialHtml
    .split('\n')
    .map((line) => (line.length ? `      ${line}` : line))
    .join('\n');
  return fragment.replace(/<div data-social-slot><\/div>/g, indented);
}

/** Match js/site-chrome.js markCurrent(). */
export function markNav(html, activePage) {
  if (!activePage) return html;
  return html.replace(
    /<li class="jw-menu-item(?: jw-menu-is-active)?">\s*(<a class="jw-menu-link"[^>]*data-nav="([^"]+)"[^>]*>)/g,
    (_full, anchorOpen, navId) => {
      const isActive = navId === activePage;
      const liClass = isActive ? 'jw-menu-item jw-menu-is-active' : 'jw-menu-item';
      let anchor = anchorOpen.replace(/\s*aria-current="page"/g, '');
      if (isActive && !anchor.includes('aria-current')) {
        anchor = anchor.replace(/>$/, ' aria-current="page">');
      }
      return `<li class="${liClass}">\n            ${anchor}`;
    }
  );
}

export function readActivePage(html) {
  const m = html.match(/<body[^>]*\sdata-active-page="([^"]*)"/i);
  return m ? m[1] : 'home';
}

export function buildSiteChrome(activePage) {
  const headerRaw = fs.readFileSync(HEADER_INCLUDE, 'utf8').trimEnd();
  const footerRaw = fs.readFileSync(FOOTER_INCLUDE, 'utf8').trimEnd();
  const social = fs.readFileSync(SOCIAL_INCLUDE, 'utf8').trim();

  const headerInner = indentBlock(
    markNav(inlineSocialSlots(headerRaw, social), activePage),
    2
  );
  const footerInner = indentBlock(
    markNav(inlineSocialSlots(footerRaw, social), activePage),
    2
  );

  const headerBlock = `    ${CHROME_HEADER_START}
    <div id="site-header">
${headerInner}
    </div>
    ${CHROME_HEADER_END}`;

  const footerBlock = `    ${CHROME_FOOTER_START}
    <div id="site-footer">
${footerInner}
    </div>
    ${CHROME_FOOTER_END}`;

  return { headerBlock, footerBlock };
}

export function patchSiteChromeInHtml(html, activePage) {
  const { headerBlock, footerBlock } = buildSiteChrome(activePage);
  const combined = `${headerBlock}\n\n${footerBlock}`;

  const chromeRe = new RegExp(
    `${CHROME_HEADER_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${CHROME_FOOTER_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
  );

  let next = html;
  if (chromeRe.test(html)) {
    next = html.replace(chromeRe, combined);
  } else {
    next = next.replace(/<div id="site-header"><\/div>\s*\n?/, `${headerBlock}\n\n`);
    next = next.replace(/<div id="site-footer"><\/div>\s*\n?/, `${footerBlock}\n\n`);
  }

  next = next.replace(/\s*<script src="\/js\/site-chrome\.js" defer><\/script>\n?/g, '\n');
  return next;
}

export function listSiteChromePages() {
  const pages = [
    path.join(REPO_ROOT, 'index.html'),
    path.join(REPO_ROOT, 'contact.html'),
    path.join(REPO_ROOT, 'testimonials.html'),
    path.join(REPO_ROOT, 'projects/index.html'),
  ];
  for (const name of fs.readdirSync(PROJECTS_DIR)) {
    if (!/^\d{4} - /.test(name)) continue;
    const story = path.join(PROJECTS_DIR, name, 'index.html');
    if (fs.existsSync(story)) pages.push(story);
  }
  return pages;
}

export function syncSiteChromePage(filePath, { dryRun = false } = {}) {
  const html = fs.readFileSync(filePath, 'utf8');
  const activePage = readActivePage(html);
  const next = patchSiteChromeInHtml(html, activePage);
  if (next === html) return { changed: false, activePage };
  if (!dryRun) fs.writeFileSync(filePath, next);
  return { changed: true, activePage };
}

export function syncAllSiteChrome({ dryRun = false } = {}) {
  const results = [];
  for (const filePath of listSiteChromePages()) {
    const r = syncSiteChromePage(filePath, { dryRun });
    if (r.changed) results.push(filePath);
  }
  return results;
}
