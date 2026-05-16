#!/usr/bin/env node
/**
 * Publish a repair project to Facebook, Instagram, and/or Threads (images only).
 *
 * Usage:
 *   node scripts/publish-social.mjs <project-id> --dry-run
 *   node scripts/publish-social.mjs <project-id> --target facebook|instagram|threads|all
 *   node scripts/publish-social.mjs <project-id> --target all --public-base-url https://example.com/path/to/images
 *   node scripts/publish-social.mjs <project-id> --target all --write-config
 *
 * Instagram & Threads need a public HTTPS image_url. Facebook uploads local files directly.
 * Use --public-base-url when images are already hosted (e.g. on your site).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProject } from './validate-publish.mjs';
import { loadEnv, requireEnv } from './lib/load-env.mjs';
import { buildCaption } from './lib/caption.mjs';
import { pickPrimaryImage, publicImageUrl } from './lib/project-media.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const TARGETS = ['facebook', 'instagram', 'threads', 'all'];
const URL_FIELDS = {
  facebook: 'facebookUrl',
  instagram: 'instagramUrl',
  threads: 'threadUrl',
};

function parseArgs(argv) {
  const positional = [];
  const flags = { dryRun: false, writeConfig: false, force: false, target: 'all', publicBaseUrl: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--write-config') flags.writeConfig = true;
    else if (a === '--force') flags.force = true;
    else if (a === '--target') flags.target = argv[++i];
    else if (a === '--public-base-url') flags.publicBaseUrl = argv[++i];
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else positional.push(a);
  }
  if (!positional[0]) {
    throw new Error(
      'Usage: node scripts/publish-social.mjs <project-id> [--dry-run] [--target facebook|instagram|threads|all] [--public-base-url URL] [--write-config] [--force]'
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

async function graphGet(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(u);
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(body.error?.message || `Graph GET failed: ${res.status}`);
  }
  return body;
}

async function graphPost(url, params, formData) {
  let res;
  if (formData) {
    for (const [k, v] of Object.entries(params)) formData.append(k, v);
    res = await fetch(url, { method: 'POST', body: formData });
  } else {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    res = await fetch(u, { method: 'POST' });
  }
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(body.error?.message || `Graph POST failed: ${res.status}`);
  }
  return body;
}

async function getPageAccessToken(graphVersion, userToken, pageId) {
  const data = await graphGet(`https://graph.facebook.com/${graphVersion}/me/accounts`, {
    access_token: userToken,
    fields: 'id,access_token',
  });
  const page = data.data?.find((p) => p.id === pageId);
  if (!page?.access_token) {
    throw new Error(`No Page access token for page id ${pageId}. Check token permissions.`);
  }
  return page.access_token;
}

async function publishFacebook({ graphVersion, pageId, pageToken, imagePath, caption }) {
  const fileBuf = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuf]);
  const form = new FormData();
  form.append('source', blob, path.basename(imagePath));
  form.append('message', caption);
  const body = await graphPost(
    `https://graph.facebook.com/${graphVersion}/${pageId}/photos`,
    { access_token: pageToken },
    form
  );
  const postId = body.post_id || body.id;
  if (!postId) throw new Error('Facebook response missing post id');
  return `https://www.facebook.com/${postId}`;
}

async function publishInstagram({ graphVersion, igUserId, userToken, imageUrl, caption }) {
  const container = await graphPost(
    `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
    {
      image_url: imageUrl,
      caption,
      access_token: userToken,
    }
  );
  const published = await graphPost(
    `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`,
    {
      creation_id: container.id,
      access_token: userToken,
    }
  );
  const media = await graphGet(
    `https://graph.facebook.com/${graphVersion}/${published.id}`,
    { fields: 'permalink', access_token: userToken }
  );
  if (!media.permalink) throw new Error('Instagram response missing permalink');
  return media.permalink;
}

async function publishThreads({ threadsUserId, threadsToken, imageUrl, caption }) {
  const container = await graphPost(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, {
    media_type: 'IMAGE',
    image_url: imageUrl,
    text: caption,
    access_token: threadsToken,
  });
  await sleep(35_000);
  const published = await graphPost(
    `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
    {
      creation_id: container.id,
      access_token: threadsToken,
    }
  );
  const media = await graphGet(`https://graph.threads.net/v1.0/${published.id}`, {
    fields: 'permalink',
    access_token: threadsToken,
  });
  if (!media.permalink) throw new Error('Threads response missing permalink');
  return media.permalink;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
  const caption = buildCaption(config);
  const imagePath = pickPrimaryImage(dir);
  const imageName = path.basename(imagePath);
  const targets = resolveTargets(flags.target);

  const existing = {};
  for (const t of targets) {
    const field = URL_FIELDS[t];
    if (config[field]) existing[t] = config[field];
  }

  console.log(`Project: ${projectFolderName}`);
  console.log(`Image: ${imageName}`);
  console.log(`Caption length: ${caption.length}`);
  console.log(`Targets: ${targets.join(', ')}`);
  if (flags.publicBaseUrl) console.log(`Public image base: ${flags.publicBaseUrl}`);

  for (const [t, url] of Object.entries(existing)) {
    if (!flags.force) {
      console.error(`SKIP: ${t} already has URL (use --force to repost): ${url}`);
      targets.splice(targets.indexOf(t), 1);
    }
  }

  const needsPublicUrl = targets.some((t) => t === 'instagram' || t === 'threads');
  if (needsPublicUrl && !flags.publicBaseUrl) {
    console.error(
      'Instagram and Threads require --public-base-url (HTTPS) pointing at the folder that contains the image file.'
    );
    console.error(
      `Example: --public-base-url https://sptoydoctor.com.au/projects/${encodeURIComponent(projectFolderName)}`
    );
    process.exit(1);
  }

  const publicImage =
    flags.publicBaseUrl && needsPublicUrl
      ? publicImageUrl(flags.publicBaseUrl, imageName)
      : null;

  if (flags.dryRun) {
    console.log('\n--- DRY RUN (no API calls) ---');
    console.log(caption);
    console.log(`\nLocal image: ${imagePath}`);
    if (publicImage) console.log(`Public image URL: ${publicImage}`);
    process.exit(0);
  }

  const env = loadEnv();
  const graphVersion = env.META_GRAPH_API_VERSION || 'v25.0';
  const results = {};

  if (targets.includes('facebook')) {
    requireEnv(env, ['META_ACCESS_TOKEN', 'META_PAGE_ID']);
    const pageToken =
      env.META_PAGE_ACCESS_TOKEN?.trim() ||
      (await getPageAccessToken(graphVersion, env.META_ACCESS_TOKEN, env.META_PAGE_ID));
    console.log('\nPublishing to Facebook…');
    results.facebookUrl = await publishFacebook({
      graphVersion,
      pageId: env.META_PAGE_ID,
      pageToken,
      imagePath,
      caption,
    });
    console.log(`Facebook: ${results.facebookUrl}`);
  }

  if (targets.includes('instagram')) {
    requireEnv(env, ['META_ACCESS_TOKEN', 'META_INSTAGRAM_USER_ID']);
    console.log('\nPublishing to Instagram…');
    results.instagramUrl = await publishInstagram({
      graphVersion,
      igUserId: env.META_INSTAGRAM_USER_ID,
      userToken: env.META_ACCESS_TOKEN,
      imageUrl: publicImage,
      caption,
    });
    console.log(`Instagram: ${results.instagramUrl}`);
  }

  if (targets.includes('threads')) {
    requireEnv(env, ['META_THREADS_ACCESS_TOKEN', 'META_THREADS_USER_ID']);
    console.log('\nPublishing to Threads…');
    results.threadUrl = await publishThreads({
      threadsUserId: env.META_THREADS_USER_ID,
      threadsToken: env.META_THREADS_ACCESS_TOKEN,
      imageUrl: publicImage,
      caption,
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
