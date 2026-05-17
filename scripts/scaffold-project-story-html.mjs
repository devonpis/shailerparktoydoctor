#!/usr/bin/env node
/**
 * Generate projects/<folder>/index.html from config.json + images.
 * Writes index.html with SEO meta from config.json + images; sets webpageUrl when empty.
 * publish-webpage.mjs re-syncs meta after image changes (or scaffolds index.html if missing).
 *
 * Usage:
 *   node scripts/scaffold-project-story-html.mjs <project-id> [id …] [--force]
 *   node scripts/scaffold-project-story-html.mjs --published [--force]
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectDir, PROJECTS_DIR, projectIdFromDir } from './lib/resolve-project-dir.mjs';
import { listProjectImages } from './lib/project-media.mjs';
import {
  buildStoryMeta,
  pickStoryHeroImageName,
  updateProjectStoryMeta,
} from './lib/project-story-meta.mjs';

function listPublishedIds() {
  const ids = [];
  for (const name of fs.readdirSync(PROJECTS_DIR)) {
    if (!/^\d{4} - /.test(name) || name.startsWith('0000')) continue;
    const dir = path.join(PROJECTS_DIR, name);
    if (!fs.existsSync(path.join(dir, 'index.html'))) continue;
    ids.push(projectIdFromDir(dir));
  }
  return ids.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

function parseArgs(argv) {
  const flags = { force: false, published: false };
  const ids = [];
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--force') flags.force = true;
    else if (a === '--published') flags.published = true;
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else ids.push(a);
  }
  const resolved = flags.published ? listPublishedIds() : ids;
  if (!resolved.length) {
    throw new Error(
      'Usage: node scripts/scaffold-project-story-html.mjs <id> [id …] [--force] | --published [--force]'
    );
  }
  return { ids: resolved, flags };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTagLabel(tag) {
  const t = String(tag).trim();
  if (!t) return t;
  if (/[A-Z][a-z]/.test(t) && !/^[a-z]+$/.test(t)) return t;
  return t
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAuDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function splitParagraphs(text) {
  return String(text || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function listWipImageNames(dir) {
  return listProjectImages(dir)
    .filter((n) => /^wip-/i.test(n))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function findImageByStem(dir, stem) {
  return listProjectImages(dir).find((n) => n.toLowerCase().startsWith(stem.toLowerCase())) || null;
}

function buildBeforeAfterSection(dir, prefix, heroName) {
  const heroLower = (heroName || '').toLowerCase();
  const items = [];
  const before = findImageByStem(dir, 'before');
  const after = findImageByStem(dir, 'after');
  if (before && before.toLowerCase() !== heroLower) {
    items.push({ name: before, label: 'Before' });
  }
  if (after && after.toLowerCase() !== heroLower) {
    items.push({ name: after, label: 'After' });
  }
  if (!items.length) return '';

  const gridClass =
    items.length === 1 ? 'project-before-after project-before-after--single' : 'project-before-after';
  const figures = items
    .map(
      (item) => `          <figure class="project-before-after__item">
            <img
              src="${prefix}/${encodeURIComponent(item.name)}"
              alt="${escapeHtml(item.label)} — repair"
              loading="lazy"
            />
            <figcaption>${escapeHtml(item.label)}</figcaption>
          </figure>`
    )
    .join('\n');

  return `
      <section class="project-section">
        <h2 class="jw-heading-100">Before &amp; after</h2>
        <div class="${gridClass}">
${figures}
        </div>
      </section>`;
}

function youtubeEmbedId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
    if (u.searchParams.has('v')) return u.searchParams.get('v');
    const m = u.pathname.match(/\/(?:embed|shorts|v)\/([^/?]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function projectPathPrefix(folder) {
  return `/projects/${encodeURIComponent(folder)}`;
}

function paragraphBlock(paragraphs) {
  return paragraphs
    .map(
      (p) => `        <p>
          ${escapeHtml(p)}
        </p>`
    )
    .join('\n');
}

function buildVideoIframe(id, subtitle, label) {
  return `          <div class="project-video">
            <div class="project-video__embed">
              <iframe
                src="https://www.youtube-nocookie.com/embed/${escapeHtml(id)}"
                title="${escapeHtml(subtitle)} — ${label}"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>`;
}

function buildHtml(config, folder, dir) {
  const meta = buildStoryMeta(config, folder, dir);
  const prefix = projectPathPrefix(folder);
  const heroName = pickStoryHeroImageName(dir);
  if (!heroName) throw new Error('No hero/after/before/WIP image found');

  const heroSrc = `${prefix}/${encodeURIComponent(heroName)}`;
  const beforeAfterSection = buildBeforeAfterSection(dir, prefix, heroName);
  const wipNames = listWipImageNames(dir);
  const tags = (config.tags || []).map(formatTagLabel).filter(Boolean);
  const headline = (config.title || config.projectName || folder).trim();
  const subtitle = (config.projectName || folder).trim();
  const lead = (config.description || '').trim();
  const dateAu = formatAuDate(config.endDate);
  const tagLis = tags.map((t) => `          <li class="project-tag">${escapeHtml(t)}</li>`).join('\n');

  let wipSection = '';
  if (wipNames.length) {
    const imgs = wipNames
      .map(
        (name, i) => `          <img
            src="${prefix}/${encodeURIComponent(name)}"
            alt="Repair in progress ${i + 1}"
            loading="lazy"
          />`
      )
      .join('\n');
    wipSection = `
      <section class="project-section">
        <h2 class="jw-heading-100">Work in progress</h2>
        <div class="project-wip-grid">
${imgs}
        </div>
      </section>`;
  }

  let videoSection = '';
  const ytMain = youtubeEmbedId(config.youtubeUrl);
  const ytShort = youtubeEmbedId(config.youtubeShortUrl);
  if (ytMain || ytShort) {
    const blocks = [];
    if (ytMain) blocks.push(buildVideoIframe(ytMain, subtitle, 'full video'));
    if (ytShort) blocks.push(buildVideoIframe(ytShort, subtitle, 'short'));
    videoSection = `
      <section class="project-section">
        <h2 class="jw-heading-100">Videos</h2>
        <div class="project-videos">
${blocks.join('\n')}
        </div>
      </section>`;
  }

  const review = config.googleReview;
  let reviewBlock = '';
  if (review?.quote) {
    reviewBlock = `
      <blockquote class="project-review">
        <p>“${escapeHtml(review.quote)}”</p>
        <footer>— ${escapeHtml(review.authorName || 'Customer')}</footer>
      </blockquote>`;
  }

  const repairParas = splitParagraphs(config.repairDetails);
  const itemParas = splitParagraphs(config.itemDetails);
  const itemBlock =
    itemParas.length > 0
      ? `        <h2 class="jw-heading-100">About this item</h2>
${paragraphBlock(itemParas)}`
      : '';

  return `<!DOCTYPE html>
<html lang="en-AU">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(meta.pageTitle)}</title>
    <meta name="description" content="${escapeHtml(meta.metaDescription)}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="canonical" href="${escapeHtml(meta.canonical)}" />
    <meta property="og:title" content="${escapeHtml(meta.ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(meta.ogDescription)}" />
    <meta property="og:image" content="${escapeHtml(meta.ogImageUrl || '')}" />
    <meta property="og:url" content="${escapeHtml(meta.ogUrl)}" />
    <meta property="og:type" content="article" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Lobster&family=Nunito:wght@400;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/new/css/site.css" />
  </head>
  <body data-active-page="projects" data-project-folder="${escapeHtml(folder)}">
    <div id="site-header"></div>

    <main class="page-main">
      <p class="project-back">
        <a href="/new/projects/">← All projects</a>
      </p>

      <div class="project-hero">
        <img
          src="${heroSrc}"
          alt="${escapeHtml(meta.heroAlt)}"
          width="1000"
          height="667"
        />
      </div>

      <h1>${escapeHtml(headline)}</h1>
      <h3 class="project-subtitle">${escapeHtml(subtitle)}</h3>
      <div class="project-tag-row">
        <div id="project-skills-root"></div>
        <ul class="project-tags">
${tagLis}
        </ul>
      </div>

      <p class="project-meta">${escapeHtml(dateAu)}</p>
      <p class="project-lead text-lead">
        ${escapeHtml(lead)}
      </p>
${reviewBlock}${beforeAfterSection}${wipSection}${videoSection}
      <section class="project-prose">
        <h2 class="jw-heading-100">The repair</h2>
${paragraphBlock(repairParas)}
${itemBlock}
      </section>

      <div class="projects-cta">
        <a class="cta-button" href="/new/contact.html">Send photos for a quote</a>
      </div>
    </main>

    <div id="site-footer"></div>

    <script src="/new/js/brand-text.js" defer></script>
    <script src="/new/js/site-chrome.js" defer></script>
    <script src="/new/js/skills.js" defer></script>
    <script src="/new/js/project-page-skills.js" defer></script>
  </body>
</html>
`;
}

function scaffoldOne(projectArg, flags) {
  const dir = resolveProjectDir(projectArg);
  const folder = path.basename(dir);
  const htmlPath = path.join(dir, 'index.html');
  if (fs.existsSync(htmlPath) && !flags.force) {
    console.log(`SKIP ${folder}: index.html exists (use --force)`);
    return false;
  }
  let config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
  const html = buildHtml(config, folder, dir);
  fs.writeFileSync(htmlPath, html);
  const metaResult = updateProjectStoryMeta(dir, config);
  if (metaResult.webpageUrlSet) {
    config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
    console.log(`  SEO: webpageUrl → ${metaResult.meta.canonical}`);
  } else if (metaResult.changed) {
    console.log('  SEO: synced head tags and hero from disk');
  }
  console.log(`OK ${folder}: wrote index.html`);
  return true;
}

function main() {
  const { ids, flags } = parseArgs(process.argv);
  let n = 0;
  for (const id of ids) {
    if (scaffoldOne(id, flags)) n += 1;
  }
  console.log(
    `\nScaffolded ${n} story page(s) with SEO meta. Run publish-webpage.mjs for images, validate, and gallery index.`
  );
}

main();
