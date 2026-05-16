#!/usr/bin/env node
/**
 * Publish a repair project to Facebook, Instagram, and/or Threads (images only).
 *
 * Default: carousel of all project images (before → WIP-### → hero → after).
 * Use --image after (etc.) for a single-image post.
 *
 * Usage:
 *   node scripts/publish-social.mjs <project-id> --dry-run
 *   node scripts/publish-social.mjs <project-id> --target all --use-site --wait-for-site
 *   node scripts/publish-social.mjs <project-id> --target instagram --use-site --image after
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProject } from './validate-publish.mjs';
import { loadEnv, requireEnv } from './lib/load-env.mjs';
import { buildCaption } from './lib/caption.mjs';
import {
  listPublishImagePaths,
  pickImage,
  publicImageUrl,
} from './lib/project-media.mjs';
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
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
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
      'Usage: node scripts/publish-social.mjs <project-id> [--dry-run] [--target …] [--use-site] [--wait-for-site [maxSeconds]] [--image after|hero|before] [--public-base-url URL] [--write-config] [--force]'
    );
  }
  if (!TARGETS.includes(flags.target)) {
    throw new Error(`--target must be one of: ${TARGETS.join(', ')}`);
  }
  return { projectArg: positional[0], flags };
}

function resolveTargets(target) {
  if (target === 'all') return ['facebook', 'instagram', 'threads'];
  return [target];
}

function resolveImagePaths(dir, imageStem) {
  if (imageStem != null) return [pickImage(dir, imageStem)];
  const all = listPublishImagePaths(dir);
  if (!all.length) {
    throw new Error('No project images found (before, after, hero, or WIP-###).');
  }
  return all;
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
  const validation = validateProject(projectArg);
  if (!validation.ok) {
    for (const e of validation.errors) console.error(`FAIL: ${e}`);
    process.exit(1);
  }

  const { dir, config } = validation;
  const configPath = path.join(dir, 'config.json');
  const projectFolderName = path.basename(dir);
  const imagePaths = resolveImagePaths(dir, flags.imageStem);
  const caption = buildCaption(config);
  const threadsCaption = buildCaption(config, { includeHashtags: false });
  let targets = resolveTargets(flags.target);

  let env = {};
  try {
    env = loadEnv();
  } catch {
    /* optional until live publish */
  }
  const publicBaseUrl = resolvePublicBaseUrl(flags, env, projectFolderName);
  const siteBase = env.SITE_BASE_URL?.trim() || DEFAULT_SITE_BASE_URL;

  const existing = {};
  for (const t of targets) {
    const field = URL_FIELDS[t];
    if (config[field]) existing[t] = config[field];
  }

  console.log(`Project: ${projectFolderName}`);
  console.log(
    `Images (${imagePaths.length}): ${imagePaths.map((p) => path.basename(p)).join(', ')}`
  );
  console.log(`Caption length: ${caption.length} (Threads without hashtags: ${threadsCaption.length})`);
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
    console.log('\nThreads text (no hashtags):');
    console.log(threadsCaption);
    console.log(`\nLocal images:\n${imagePaths.map((p) => `  ${p}`).join('\n')}`);
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
    console.log(`\nPublishing to Threads (${publicImageUrls.length} image(s), no hashtags)…`);
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
