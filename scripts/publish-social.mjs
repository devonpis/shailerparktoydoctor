#!/usr/bin/env node
/**
 * Publish a repair project to Facebook, Instagram, and/or Threads (images only).
 *
 * Default: carousel in social order hero → after → before → WIP-### (webpage HTML uses before → WIP → after in the gallery).
 * Use --image after (etc.) for a single-image post.
 *
 * Usage:
 *   node scripts/publish-social.mjs <project-id> --dry-run
 *   node scripts/publish-social.mjs <project-id> --target all --use-site --wait-for-site
 *   node scripts/publish-social.mjs <project-id> --target instagram --use-site --image after
 *   node scripts/publish-social.mjs <project-id> --dry-run --pick-images vision
 *
 * When a folder has more than 10 images, --pick-images auto (default) uses OpenAI vision
 * if OPENAI_API_KEY is set, else local heuristic scoring; use --pick-images rules to skip.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSocialProject } from './validate-publish.mjs';
import { loadEnv, requireEnv, tryLoadEnv } from './lib/load-env.mjs';
import {
  buildCaption,
  buildCaptionFromBody,
  buildThreadsCaption,
  buildThreadsCaptionFromBody,
  pickSocialTags,
  SOCIAL_HASHTAG_MAX,
  THREADS_CAPTION_MAX,
  rewriteForThreads,
} from './lib/caption.mjs';
import { buildHashtagLine } from './lib/hashtag.mjs';
import { pickImage, publicImageUrl, SOCIAL_CAROUSEL_MAX } from './lib/project-media.mjs';
import { selectImagesForSocialPublish } from './lib/select-social-images.mjs';
import {
  DEFAULT_SITE_BASE_URL,
  projectSitePublicBase,
  projectSiteImageUrl,
} from './lib/site-image-url.mjs';
import {
  isUrlReachable,
  waitForProjectImagesOnSite,
} from './lib/wait-for-site-images.mjs';
import {
  publishFacebook,
  publishInstagram,
  publishThreads,
} from './lib/social-publish.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGETS = ['facebook', 'instagram', 'threads', 'all'];
const PICK_MODES = ['auto', 'vision', 'heuristic', 'rules'];
const URL_FIELDS = {
  facebook: 'facebookUrl',
  instagram: 'instagramUrl',
  threads: 'threadUrl',
};

function parseArgs(argv) {
  const positional = [];
  const flags = {
    dryRun: false,
    writeConfig: false,
    force: false,
    target: 'all',
    publicBaseUrl: null,
    useSite: false,
    waitForSite: 0,
    imageStem: null,
    pickImages: 'auto',
    captionFile: null,
    threadsCaptionFile: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--caption-file') flags.captionFile = argv[++i];
    else if (a === '--threads-caption-file') flags.threadsCaptionFile = argv[++i];
    else if (a === '--no-ai') flags.pickImages = 'rules';
    else if (a === '--pick-images') flags.pickImages = argv[++i];
    else if (a === '--write-config') flags.writeConfig = true;
    else if (a === '--force') flags.force = true;
    else if (a === '--use-site') flags.useSite = true;
    else if (a === '--wait-for-site') {
      const next = argv[i + 1];
      flags.waitForSite = next && /^\d+$/.test(next) ? Number(argv[++i]) : 300;
    } else if (a === '--target') flags.target = argv[++i];
    else if (a === '--image') flags.imageStem = argv[++i];
    else if (a === '--public-base-url') flags.publicBaseUrl = argv[++i];
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else positional.push(a);
  }
  if (!positional[0]) {
    throw new Error(
      'Usage: node scripts/publish-social.mjs <project-id> [--dry-run] [--caption-file <path>] [--threads-caption-file <path>] [--target …] [--use-site] [--wait-for-site [maxSeconds]] [--image after|hero|before] [--pick-images auto|vision|heuristic|rules] [--no-ai] [--public-base-url URL] [--write-config] [--force]'
    );
  }
  if (!TARGETS.includes(flags.target)) {
    throw new Error(`--target must be one of: ${TARGETS.join(', ')}`);
  }
  if (!PICK_MODES.includes(flags.pickImages)) {
    throw new Error(`--pick-images must be one of: ${PICK_MODES.join(', ')}`);
  }
  return { projectArg: positional[0], flags };
}

function resolveTargets(target) {
  if (target === 'all') return ['facebook', 'instagram', 'threads'];
  return [target];
}

async function resolveImagesForPublish(dir, config, imageStem, pickMode, env) {
  if (imageStem != null) {
    return {
      included: [pickImage(dir, imageStem)],
      omitted: [],
      method: 'single',
      summary: null,
      notes: {},
    };
  }
  return selectImagesForSocialPublish(dir, config, { pickMode, env });
}

async function getPageAccessToken(graphVersion, userToken, pageId) {
  const u = new URL(`https://graph.facebook.com/${graphVersion}/me/accounts`);
  u.searchParams.set('access_token', userToken);
  u.searchParams.set('fields', 'id,access_token');
  const res = await fetch(u);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to load Page tokens');
  }
  const page = data.data?.find((p) => p.id === pageId);
  if (!page?.access_token) {
    throw new Error(`No Page access token for page id ${pageId}. Check token permissions.`);
  }
  return page.access_token;
}

function resolvePublicBaseUrl(flags, env, projectFolderName) {
  if (flags.publicBaseUrl) return flags.publicBaseUrl;
  if (flags.useSite) {
    const siteBase = env?.SITE_BASE_URL?.trim() || DEFAULT_SITE_BASE_URL;
    return projectSitePublicBase(siteBase, projectFolderName);
  }
  return null;
}

function resolvePublicImageUrls({ imagePaths, flags, siteBase, projectFolderName, publicBaseUrl }) {
  return imagePaths.map((imagePath) => {
    const imageName = path.basename(imagePath);
    if (flags.useSite) {
      return projectSiteImageUrl(siteBase, projectFolderName, imageName);
    }
    return publicImageUrl(publicBaseUrl, imageName);
  });
}

function writeConfigUrls(configPath, config, urls) {
  for (const [field, value] of Object.entries(urls)) {
    config[field] = value;
  }
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

async function main() {
  const { projectArg, flags } = parseArgs(process.argv);
  const validation = validateSocialProject(projectArg);
  if (!validation.ok) {
    console.error('\n--- Social publish blocked ---');
    for (const e of validation.errors) console.error(`FAIL: ${e}`);
    process.exit(1);
  }

  const { dir, config } = validation;
  const configPath = path.join(dir, 'config.json');
  const projectFolderName = path.basename(dir);
  let env = tryLoadEnv();
  const pickResult = await resolveImagesForPublish(
    dir,
    config,
    flags.imageStem,
    flags.pickImages,
    env
  );
  const {
    included: imagePaths,
    omitted: omittedImages,
    method: pickMethod,
    summary: pickSummary,
    notes: pickNotes,
  } = pickResult;
  const captionSource = flags.captionFile ? 'override (--caption-file)' : 'config.json description';
  const threadsSource = flags.threadsCaptionFile
    ? 'override (--threads-caption-file)'
    : flags.captionFile
      ? 'rewrite from caption-file'
      : 'config.json description';
  const caption = flags.captionFile
    ? buildCaptionFromBody(fs.readFileSync(flags.captionFile, 'utf8'), config)
    : buildCaption(config);
  const threadsCaption = flags.threadsCaptionFile
    ? buildThreadsCaptionFromBody(fs.readFileSync(flags.threadsCaptionFile, 'utf8'))
    : flags.captionFile
      ? rewriteForThreads(fs.readFileSync(flags.captionFile, 'utf8'))
      : buildThreadsCaption(config);
  const { picked: socialTags, omitted: socialTagsOmitted } = pickSocialTags(config.tags, config);
  let targets = resolveTargets(flags.target);

  const publicBaseUrl = resolvePublicBaseUrl(flags, env, projectFolderName);
  const siteBase = env.SITE_BASE_URL?.trim() || DEFAULT_SITE_BASE_URL;

  const existing = {};
  for (const t of targets) {
    const field = URL_FIELDS[t];
    if (config[field]) existing[t] = config[field];
  }

  console.log(`Project: ${projectFolderName}`);
  const includedNames = imagePaths.map((p) => path.basename(p)).join(', ');
  if (flags.imageStem != null) {
    console.log(`Images (1, --image ${flags.imageStem}): ${includedNames}`);
  } else {
    const total = imagePaths.length + omittedImages.length;
    console.log(
      `Images for social (${imagePaths.length}/${total}, max ${SOCIAL_CAROUSEL_MAX}): ${includedNames}`
    );
    console.log('Carousel order: hero → after → before → WIP-###');
    if (pickMethod && pickMethod !== 'all' && pickMethod !== 'single') {
      console.log(`Selection method: ${pickMethod}`);
    }
    if (pickSummary) console.log(`Selection: ${pickSummary}`);
    if (omittedImages.length) {
      console.log(
        `Omitted (${omittedImages.length}): ${omittedImages.map((p) => path.basename(p)).join(', ')}`
      );
      const withNotes = omittedImages.filter((p) => pickNotes?.[path.basename(p)]);
      if (withNotes.length) {
        for (const p of withNotes) {
          console.log(`  - ${path.basename(p)}: ${pickNotes[path.basename(p)]}`);
        }
      }
    }
  }
  console.log(`Caption source (FB/IG): ${captionSource}`);
  console.log(`Threads source: ${threadsSource}`);
  console.log(
    `Caption length: ${caption.length} (Threads ≤${THREADS_CAPTION_MAX}, no hashtags: ${threadsCaption.length})`
  );
  console.log(
    `Social hashtags (${socialTags.length}/${SOCIAL_HASHTAG_MAX} FB/IG): ${buildHashtagLine(socialTags) || '(none)'}`
  );
  if (socialTagsOmitted.length) {
    console.log(`Tags on story page only (not social): ${socialTagsOmitted.join(', ')}`);
  }
  console.log(`Targets: ${targets.join(', ')}`);
  if (publicBaseUrl) console.log(`Public image base: ${publicBaseUrl}`);

  for (const [t, url] of Object.entries(existing)) {
    if (!flags.force) {
      console.error(`SKIP: ${t} already has URL (use --force to repost): ${url}`);
      targets = targets.filter((x) => x !== t);
    }
  }

  const needsPublicUrl = targets.some((t) => t === 'instagram' || t === 'threads');
  if (needsPublicUrl && !publicBaseUrl) {
    console.error(
      'Instagram and Threads need --use-site (after push to main) or --public-base-url.'
    );
    process.exit(1);
  }

  const publicImageUrls =
    needsPublicUrl &&
    resolvePublicImageUrls({
      imagePaths,
      flags,
      siteBase,
      projectFolderName,
      publicBaseUrl,
    });

  if (flags.dryRun) {
    console.log('\n--- DRY RUN (no API calls) ---');
    console.log(caption);
    console.log(`\nThreads text (≤${THREADS_CAPTION_MAX} chars, no hashtags):`);
    console.log(threadsCaption);
    console.log(`\nIncluded (${imagePaths.length}):\n${imagePaths.map((p) => `  ${path.basename(p)}`).join('\n')}`);
    if (pickMethod && pickMethod !== 'all' && pickMethod !== 'single') {
      console.log(`\nSelection method: ${pickMethod}`);
    }
    if (pickSummary) console.log(`Selection: ${pickSummary}`);
    if (omittedImages.length) {
      console.log(`\nOmitted (${omittedImages.length}):`);
      for (const p of omittedImages) {
        const base = path.basename(p);
        const note = pickNotes?.[base];
        console.log(note ? `  ${base} — ${note}` : `  ${base}`);
      }
    }
    if (publicImageUrls?.length) {
      console.log(`\nPublic URLs:\n${publicImageUrls.map((u) => `  ${u}`).join('\n')}`);
    }
    process.exit(0);
  }

  if (needsPublicUrl && publicBaseUrl) {
    if (flags.waitForSite > 0) {
      await waitForProjectImagesOnSite({
        dir,
        projectFolderName,
        siteBaseUrl: siteBase,
        publicBaseUrl,
        useSite: flags.useSite,
        maxWaitSeconds: flags.waitForSite,
      });
    } else {
      for (const url of publicImageUrls) {
        const ok = await isUrlReachable(url);
        if (!ok) {
          throw new Error(
            `Image not reachable: ${url}\nPush to main and use --wait-for-site.`
          );
        }
      }
    }
  }

  env = loadEnv();
  const graphVersion = env.META_GRAPH_API_VERSION || 'v25.0';
  const results = {};

  if (targets.includes('facebook')) {
    requireEnv(env, ['META_ACCESS_TOKEN', 'META_PAGE_ID']);
    const pageToken =
      env.META_PAGE_ACCESS_TOKEN?.trim() ||
      (await getPageAccessToken(graphVersion, env.META_ACCESS_TOKEN, env.META_PAGE_ID));
    console.log(`\nPublishing to Facebook (${imagePaths.length} image(s))…`);
    results.facebookUrl = await publishFacebook({
      graphVersion,
      pageId: env.META_PAGE_ID,
      pageToken,
      imagePaths,
      caption,
    });
    console.log(`Facebook: ${results.facebookUrl}`);
  }

  if (targets.includes('instagram')) {
    requireEnv(env, ['META_ACCESS_TOKEN', 'META_INSTAGRAM_USER_ID']);
    console.log(`\nPublishing to Instagram (${publicImageUrls.length} image(s))…`);
    results.instagramUrl = await publishInstagram({
      graphVersion,
      igUserId: env.META_INSTAGRAM_USER_ID,
      userToken: env.META_ACCESS_TOKEN,
      imageUrls: publicImageUrls,
      caption,
    });
    console.log(`Instagram: ${results.instagramUrl}`);
  }

  if (targets.includes('threads')) {
    requireEnv(env, ['META_THREADS_ACCESS_TOKEN', 'META_THREADS_USER_ID']);
    console.log(
      `\nPublishing to Threads (${publicImageUrls.length} image(s), ≤${THREADS_CAPTION_MAX} chars, no hashtags)…`
    );
    results.threadUrl = await publishThreads({
      threadsUserId: env.META_THREADS_USER_ID,
      threadsToken: env.META_THREADS_ACCESS_TOKEN,
      imageUrls: publicImageUrls,
      caption: threadsCaption,
    });
    console.log(`Threads: ${results.threadUrl}`);
  }

  if (flags.writeConfig && Object.keys(results).length) {
    writeConfigUrls(configPath, config, results);
    console.log(`\nUpdated ${configPath}`);
  } else if (Object.keys(results).length) {
    console.log('\nPermalinks (add to config.json or re-run with --write-config):');
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
