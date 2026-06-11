#!/usr/bin/env node
/**
 * Webpage publish prep: DONE gate → images → orientation check → validate → SEO meta → checklist.
 * Requires status "DONE". Scaffolds index.html when missing; always syncs SEO meta when index.html exists.
 * Canonical images (before/after/hero/WIP-###) must be .jpeg or .png; .jpg is renamed to .jpeg before processing.
 *
 * Usage:
 *   node scripts/publish-webpage.mjs <project-id> [--dry-run]
 *   node scripts/publish-webpage.mjs 0003 --rotate WIP-001.jpg --cw
 *   node scripts/publish-webpage.mjs 0003 --no-optimize
 *
 * Owner manually renamed images → sync-project-story-images.mjs (not normalize-project-media-names.mjs).
 *
 * Options:
 *   --rotate <file> --cw|--ccw|--180   Passed to optimizer (same encode pass as resize)
 *   --no-exif-orient                   Skip EXIF bake (default: on)
 *   --exif-orient                      Same as default (compatibility)
 *   --no-optimize                      Skip image processing step
 *   --no-meta                          Skip SEO meta sync on index.html
 *   --no-testimonials                  Skip testimonials.html rebuild (googleReview repair link)
 *   --no-story-review                  Skip googleReview block sync on index.html
 *   --dry-run                          Dry-run process + validate; still validates
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveProjectDir, REPO_ROOT, projectIdFromDir } from './lib/resolve-project-dir.mjs';
import { scanProjectOrientation } from './lib/project-image-orientation.mjs';
import { updateProjectStoryMeta } from './lib/project-story-meta.mjs';
import { ensureAcceptableProjectImages } from './lib/project-image-extensions.mjs';
import { validateWebpagePublishGate } from './lib/project-readiness.mjs';
import {
  normalizeGoogleReview,
  repairLinkLabel,
  repairPageHrefSync,
} from './lib/google-review.mjs';
import {
  projectStoryReviewStatus,
  syncProjectGoogleReviewHtml,
} from './lib/project-google-review-html.mjs';
import { syncProjectWorkInProgressHtml } from './lib/project-work-in-progress-html.mjs';
import {
  sanitizeConfigProseInPlace,
  syncProjectStoryProseHtml,
} from './lib/project-story-prose-html.mjs';
import { syncProjectStorySkillsHtml } from './lib/project-story-skills-html.mjs';
import { syncProjectStoryBrandHtml } from './lib/project-story-brand-html.mjs';
import { INDEX_JSON_PATHS } from './lib/update-project-path-refs.mjs';
import { validateProject } from './validate-publish.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const flags = {
    dryRun: false,
    exifOrient: true,
    optimize: true,
    updateMeta: true,
    syncTestimonials: true,
    syncStoryReview: true,
    rotations: [],
  };
  const positional = [];

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--exif-orient') flags.exifOrient = true;
    else if (a === '--no-exif-orient') flags.exifOrient = false;
    else if (a === '--no-optimize') flags.optimize = false;
    else if (a === '--no-meta') flags.updateMeta = false;
    else if (a === '--no-testimonials') flags.syncTestimonials = false;
    else if (a === '--no-story-review') flags.syncStoryReview = false;
    else if (a === '--rotate') {
      const file = argv[++i];
      const dirFlag = argv[++i];
      if (!file || !dirFlag?.startsWith('--')) {
        throw new Error('Use: --rotate <filename> --cw|--ccw|--180');
      }
      flags.rotations.push({ file, dirFlag });
    } else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else positional.push(a);
  }

  if (!positional[0]) {
    throw new Error(
      'Usage: node scripts/publish-webpage.mjs <project-id> [--rotate file --cw] [--no-exif-orient] [--dry-run] [--no-optimize]'
    );
  }
  return { projectArg: positional[0], flags };
}

function runProcessImages(projectId, flags) {
  console.log('\n--- Process images (orient + optimize, one encode per file) ---');
  const args = ['scripts/optimize-project-images.mjs', projectId];
  if (flags.dryRun) args.push('--dry-run');
  if (flags.exifOrient) args.push('--exif-orient');
  for (const { file, dirFlag } of flags.rotations) {
    args.push('--rotate', file, dirFlag);
  }
  const r = spawnSync(process.execPath, args, { cwd: REPO_ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function runScaffoldIfNeeded(dir, projectId, flags) {
  const htmlPath = path.join(dir, 'index.html');
  if (fs.existsSync(htmlPath)) return;
  console.log('\n--- Scaffold index.html (config + images + SEO meta) ---');
  if (flags.dryRun) {
    console.log(`  [dry-run] would run: scaffold-project-story-html.mjs ${projectId}`);
    return;
  }
  const r = spawnSync(process.execPath, ['scripts/scaffold-project-story-html.mjs', projectId], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function runMetaUpdate(dir, config, flags) {
  console.log('\n--- SEO meta (index.html) ---');
  if (!flags.updateMeta) {
    console.log('  skipped (--no-meta)');
    return config;
  }
  const r = updateProjectStoryMeta(dir, config, { dryRun: flags.dryRun });
  if (r.skipped) {
    console.log(`  skipped (${r.reason}) — create index.html from template, then re-run`);
    return config;
  }
  if (flags.dryRun) {
    console.log(`  [dry-run] would update: ${r.meta.pageTitle}`);
    console.log(`  description: ${r.meta.metaDescription}`);
    if (r.meta.ogImageUrl) console.log(`  og:image: ${r.meta.ogImageName}`);
    return config;
  }
  if (r.changed) console.log('  OK: title, description, canonical, Open Graph, hero image');
  else console.log('  OK: meta already current');
  if (r.webpageUrlSet) {
    console.log(`  set config.json webpageUrl → ${r.meta.canonical}`);
    return JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
  }
  return config;
}

function runEnsureImageExtensions(dir, flags) {
  console.log('\n--- Image extensions (.jpeg / .png only) ---');
  const r = ensureAcceptableProjectImages(dir, { dryRun: flags.dryRun });
  if (r.errors.length) {
    for (const e of r.errors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }
  if (r.renames.length) {
    for (const { oldName, newName } of r.renames) {
      console.log(`  ${flags.dryRun ? '[dry-run] ' : ''}${oldName} → ${newName}`);
    }
    for (const f of r.updatedFiles || []) console.log(`  updated refs: ${f}`);
  } else {
    console.log('  OK: extensions acceptable');
  }
}

async function runOrientationCheck(dir) {
  console.log('\n--- Orientation check ---');
  const warnings = await scanProjectOrientation(dir);
  const exif = warnings.filter((w) => w.type === 'exif');
  const heuristic = warnings.filter((w) => w.type === 'heuristic');

  if (!warnings.length) {
    console.log('  OK: no EXIF issues; no review hints on primary images.');
    return;
  }

  for (const w of exif) console.warn(`  WARN: ${w.message}`);
  for (const w of heuristic) console.log(`  hint: ${w.message}`);

  if (heuristic.length) {
    console.log(
      '  Landscape hints are not auto-rotated — confirm visually or use --rotate <file> --cw|--ccw|--180'
    );
  }
  if (exif.length) {
    console.log('  Re-run publish with EXIF orient enabled, or: optimize-project-images.mjs --exif-orient');
  }
}

function readJsonIfExists(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function testimonialsRepairStatus(dir, config) {
  const review = normalizeGoogleReview(config.googleReview);
  if (!review || review.featuredOnTestimonials === false) {
    return { applicable: false, hasRepairLink: false };
  }
  const hasHtml = fs.existsSync(path.join(dir, 'index.html'));
  const href = repairPageHrefSync(config, path.basename(dir), hasHtml);
  return {
    applicable: true,
    hasRepairLink: Boolean(href),
    label: href ? repairLinkLabel(config) : null,
  };
}

function runSanitizeConfigProse(dir, config, flags) {
  if (flags.dryRun) return config;
  const next = { ...config };
  if (sanitizeConfigProseInPlace(next)) {
    fs.writeFileSync(path.join(dir, 'config.json'), `${JSON.stringify(next, null, 2)}\n`);
    console.log('  OK: removed internal notes from repairDetails/itemDetails in config.json');
    return next;
  }
  return config;
}

function runSyncStoryProse(dir, config, flags) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) return;

  console.log('\n--- Story page prose (repair + about) ---');
  if (flags.dryRun) {
    console.log('  [dry-run] would sync project-prose from config (internal notes stripped)');
    return;
  }
  const r = syncProjectStoryProseHtml(dir, config, { dryRun: false });
  if (r.skipped) console.log(`  skipped (${r.action})`);
  else if (r.changed) console.log(`  OK: ${r.action}`);
  else console.log(`  OK: ${r.action}`);
}

function runSyncStoryBrand(dir, config, flags) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) return;

  console.log('\n--- Story page brand bold (project-lead) ---');
  if (flags.dryRun) {
    console.log('  [dry-run] would bake Toy Doctor bold in project-lead');
    return;
  }
  const r = syncProjectStoryBrandHtml(dir, config, { dryRun: false });
  if (r.skipped) console.log(`  skipped (${r.action})`);
  else if (r.changed) console.log(`  OK: ${r.action}`);
  else console.log(`  OK: ${r.action}`);
}

function runSyncStorySkills(dir, config, flags) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) return;

  console.log('\n--- Story page skill badges ---');
  if (flags.dryRun) {
    console.log('  [dry-run] would sync #project-skills-root from config');
    return;
  }
  const r = syncProjectStorySkillsHtml(dir, config, { dryRun: false });
  if (r.skipped) console.log(`  skipped (${r.action})`);
  else if (r.changed) console.log(`  OK: ${r.action}`);
  else console.log(`  OK: ${r.action}`);
}

function runSyncWorkInProgressGallery(dir, config, flags) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) return;

  console.log('\n--- Story page Work in progress gallery ---');
  if (flags.dryRun) {
    console.log('  [dry-run] would sync before → WIP → after gallery (excludes hero.*)');
    return;
  }
  const folder = path.basename(dir);
  const r = syncProjectWorkInProgressHtml(dir, folder, { dryRun: false });
  if (r.skipped) console.log(`  skipped (${r.action})`);
  else if (r.changed) console.log(`  OK: ${r.action}`);
  else console.log(`  OK: ${r.action}`);
}

function runSyncStoryGoogleReview(dir, config, flags) {
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) return;

  if (!flags.syncStoryReview) {
    console.log('\n--- Story page googleReview --- skipped (--no-story-review)');
    return;
  }

  const review = normalizeGoogleReview(config.googleReview);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const status = projectStoryReviewStatus(html, config);

  if (!review && !status.htmlReview) {
    console.log(
      '\n--- Story page googleReview --- skipped (no googleReview in config — use apply-google-review.mjs)'
    );
    return;
  }

  console.log('\n--- Story page googleReview ---');
  if (flags.dryRun) {
    const would = status.needsSync
      ? review
        ? status.htmlReview
          ? 'update project-review block'
          : 'add project-review block'
        : 'remove project-review block'
      : 'already current';
    console.log(`  [dry-run] ${would}`);
    return;
  }

  const r = syncProjectGoogleReviewHtml(dir, config, { dryRun: false });
  if (r.skipped) console.log(`  skipped (${r.action})`);
  else if (r.changed) console.log(`  OK: ${r.action}`);
  else console.log(`  OK: ${r.action}`);
}

function runSyncTestimonialsIfNeeded(dir, config, flags) {
  const status = testimonialsRepairStatus(dir, config);
  if (!status.applicable) {
    console.log(
      '\n--- Testimonials page --- skipped (no googleReview in config — use apply-google-review.mjs, then re-run publish or sync-testimonials-html.mjs)'
    );
    return;
  }

  if (!flags.syncTestimonials) {
    console.log('\n--- Testimonials page --- skipped (--no-testimonials)');
    return;
  }

  if (!status.hasRepairLink) {
    console.log(
      '\n--- Testimonials page --- skipped (googleReview present; repair link needs index.html or webpageUrl)'
    );
    return;
  }

  console.log(
    `\n--- Testimonials page (Repair: ${status.label}) ---`
  );
  if (flags.dryRun) {
    console.log('  [dry-run] would run: sync-testimonials-html.mjs');
    return;
  }
  const r = spawnSync(process.execPath, ['scripts/sync-testimonials-html.mjs'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function printChecklist(dir, config, projectId) {
  const folder = path.basename(dir);
  const encodedFolder = encodeURIComponent(folder).replace(/%20/g, '%20');
  const storyPath = `/projects/${encodedFolder}/`;
  const canonical = `https://sptoydoctor.com.au${storyPath}`;

  const indexHtml = path.join(dir, 'index.html');
  const hasHtml = fs.existsSync(indexHtml);

  const indexChecks = INDEX_JSON_PATHS.map((p) => {
    const rows = readJsonIfExists(p);
    const hit = Array.isArray(rows) && rows.some((r) => r.id === projectId);
    return { path: path.relative(REPO_ROOT, p), hit };
  });

  const sitemapPath = path.join(REPO_ROOT, 'sitemap.xml');
  const sitemapText = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
  const inSitemap = sitemapText.includes(encodedFolder) || sitemapText.includes(folder);

  const webpageUrl = config.webpageUrl;
  const testimonial = testimonialsRepairStatus(dir, config);
  let storyReviewOk = true;
  if (hasHtml && normalizeGoogleReview(config.googleReview)) {
    const html = fs.readFileSync(indexHtml, 'utf8');
    storyReviewOk = projectStoryReviewStatus(html, config).inSync;
  }

  console.log('\n--- Webpage go-live checklist ---');
  console.log(`  Project: ${folder} (${projectId})`);
  console.log(`  [${hasHtml ? 'x' : ' '}] projects/<folder>/index.html`);
  if (hasHtml && normalizeGoogleReview(config.googleReview)) {
    console.log(
      `  [${storyReviewOk ? 'x' : ' '}] index.html — googleReview block`
    );
  }
  for (const { path: p, hit } of indexChecks) {
    console.log(`  [${hit ? 'x' : ' '}] ${p}`);
  }
  console.log(
    `  [${webpageUrl ? 'x' : ' '}] config.json webpageUrl${webpageUrl ? '' : ` → set: ${canonical}`}`
  );
  console.log(`  [${inSitemap ? 'x' : ' '}] sitemap.xml story URL`);
  if (testimonial.applicable) {
    console.log(
      `  [${testimonial.hasRepairLink ? 'x' : ' '}] testimonials.html — Repair link${testimonial.hasRepairLink ? '' : ' (needs index.html + webpageUrl)'}`
    );
  } else if (hasHtml) {
    console.log(
      '  [ ] googleReview + testimonials — not set (apply-google-review.mjs → story block + testimonials.html)'
    );
  }
  console.log('\n  After HTML + index + sitemap: commit, push main (GitHub Pages).');
  console.log(`  Story URL: ${canonical}`);
}

async function main() {
  const { projectArg, flags } = parseArgs(process.argv);
  const dir = resolveProjectDir(projectArg);
  const projectId = projectIdFromDir(dir);
  let config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));

  console.log(`Webpage publish prep: ${path.basename(dir)}${flags.dryRun ? ' (dry-run)' : ''}`);

  const gateErrors = validateWebpagePublishGate(config, dir);
  if (gateErrors.length) {
    console.error('\n--- Webpage publish blocked ---');
    for (const e of gateErrors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }

  runEnsureImageExtensions(dir, flags);

  if (flags.optimize) {
    runProcessImages(projectId, flags);
  } else {
    console.log('\n--- Process images --- skipped (--no-optimize)');
    if (flags.rotations.length || flags.exifOrient) {
      console.warn(
        'WARN: --rotate / EXIF orient skipped with --no-optimize. Use optimize-project-images.mjs or rotate-project-image.mjs.'
      );
    }
  }

  await runOrientationCheck(dir);

  console.log('\n--- Validate publish content ---');
  const result = validateProject(projectArg);
  for (const w of result.warnings || []) console.warn(`WARN: ${w}`);
  if (!result.ok) {
    for (const e of result.errors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }
  console.log('OK: publish content checks passed.');

  runScaffoldIfNeeded(dir, projectId, flags);
  config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
  config = runMetaUpdate(dir, config, flags);

  if (!flags.dryRun && flags.optimize) {
    const r = spawnSync(process.execPath, ['scripts/repair-project-media-refs.mjs'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }

  config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
  config = runSanitizeConfigProse(dir, config, flags);
  runSyncWorkInProgressGallery(dir, config, flags);
  runSyncStoryGoogleReview(dir, config, flags);
  runSyncStoryProse(dir, config, flags);
  runSyncStoryBrand(dir, config, flags);
  runSyncStorySkills(dir, config, flags);
  runSyncTestimonialsIfNeeded(dir, config, flags);

  printChecklist(dir, config, projectId);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
