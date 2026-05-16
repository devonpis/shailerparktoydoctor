#!/usr/bin/env node
/**
 * Delete published social posts recorded in project config.json.
 * Usage: node scripts/delete-social.mjs <project-id> [--target facebook|instagram|threads|all]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProject } from './validate-publish.mjs';
import { loadEnv, requireEnv } from './lib/load-env.mjs';

const URL_FIELDS = {
  facebook: 'facebookUrl',
  instagram: 'instagramUrl',
  threads: 'threadUrl',
};

async function graphDelete(url, token) {
  const u = new URL(url);
  u.searchParams.set('access_token', token);
  const res = await fetch(u, { method: 'DELETE' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    throw new Error(body.error?.message || `DELETE failed: ${res.status}`);
  }
  return body;
}

async function getPageAccessToken(graphVersion, userToken, pageId) {
  const u = new URL(`https://graph.facebook.com/${graphVersion}/me/accounts`);
  u.searchParams.set('access_token', userToken);
  u.searchParams.set('fields', 'id,access_token');
  const res = await fetch(u);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || 'Page token lookup failed');
  const page = data.data?.find((p) => p.id === pageId);
  if (!page?.access_token) throw new Error(`No Page token for ${pageId}`);
  return page.access_token;
}

function facebookPostIdFromUrl(url) {
  const m = url.match(/facebook\.com\/(?:share\/p\/|[^/]+\/posts\/|)([\w-]+)/i);
  if (m) return m[1];
  const parts = url.replace(/\/$/, '').split('/');
  return parts.at(-1);
}

function instagramShortcodeFromUrl(url) {
  const m = url.match(/instagram\.com\/p\/([^/]+)/i);
  return m?.[1];
}

function threadsMediaIdFromUrl(url) {
  const m = url.match(/threads\.(?:com|net)\/@[^/]+\/post\/([^/?]+)/i);
  return m?.[1];
}

async function findInstagramMediaId(graphVersion, igUserId, userToken, permalink) {
  const shortcode = instagramShortcodeFromUrl(permalink);
  const normalized = permalink.replace(/\/$/, '');
  let after;
  for (let page = 0; page < 20; page++) {
    const u = new URL(`https://graph.facebook.com/${graphVersion}/${igUserId}/media`);
    u.searchParams.set('fields', 'id,permalink,shortcode');
    u.searchParams.set('limit', '50');
    u.searchParams.set('access_token', userToken);
    if (after) u.searchParams.set('after', after);
    const res = await fetch(u);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'IG media list failed');
    for (const item of data.data || []) {
      if (item.permalink?.replace(/\/$/, '') === normalized) return item.id;
      if (shortcode && item.shortcode === shortcode) return item.id;
    }
    after = data.paging?.cursors?.after;
    if (!after) break;
  }
  throw new Error(`Instagram media not found for ${permalink}`);
}

async function findThreadsMediaId(threadsUserId, threadsToken, permalink) {
  const shortId = threadsMediaIdFromUrl(permalink);
  const u = new URL(`https://graph.threads.net/v1.0/${threadsUserId}/threads`);
  u.searchParams.set('fields', 'id,permalink');
  u.searchParams.set('limit', '50');
  u.searchParams.set('access_token', threadsToken);
  const res = await fetch(u);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || 'Threads list failed');
  for (const item of data.data || []) {
    if (item.permalink?.replace(/\/$/, '') === permalink.replace(/\/$/, '')) return item.id;
    if (shortId && item.permalink?.includes(shortId)) return item.id;
  }
  throw new Error(`Threads post not found for ${permalink}`);
}

async function deleteFacebook(graphVersion, pageToken, url) {
  const postId = facebookPostIdFromUrl(url);
  if (!postId) throw new Error(`Could not parse Facebook post id from ${url}`);
  await graphDelete(`https://graph.facebook.com/${graphVersion}/${postId}`, pageToken);
  console.log(`Deleted Facebook post ${postId}`);
}

async function deleteInstagram(graphVersion, igUserId, userToken, url) {
  const mediaId = await findInstagramMediaId(graphVersion, igUserId, userToken, url);
  await graphDelete(`https://graph.facebook.com/${graphVersion}/${mediaId}`, userToken);
  console.log(`Deleted Instagram media ${mediaId}`);
}

async function deleteThreads(threadsUserId, threadsToken, url) {
  const mediaId = await findThreadsMediaId(threadsUserId, threadsToken, url);
  await graphDelete(`https://graph.threads.net/v1.0/${mediaId}`, threadsToken);
  console.log(`Deleted Threads post ${mediaId}`);
}

function parseArgs(argv) {
  const positional = [];
  let target = 'all';
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--target') target = argv[++i];
    else positional.push(argv[i]);
  }
  if (!positional[0]) throw new Error('Usage: node scripts/delete-social.mjs <project-id> [--target all|facebook|instagram|threads]');
  return { projectArg: positional[0], target };
}

async function main() {
  const { projectArg, target } = parseArgs(process.argv);
  const validation = validateProject(projectArg);
  const { dir, config } = validation;
  const configPath = path.join(dir, 'config.json');
  const targets = target === 'all' ? ['facebook', 'instagram', 'threads'] : [target];
  const env = loadEnv();
  const graphVersion = env.META_GRAPH_API_VERSION || 'v25.0';

  for (const t of targets) {
    const field = URL_FIELDS[t];
    const url = config[field];
    if (!url) {
      console.log(`Skip ${t}: no URL in config`);
      continue;
    }
    try {
      if (t === 'facebook') {
        requireEnv(env, ['META_ACCESS_TOKEN', 'META_PAGE_ID']);
        const pageToken =
          env.META_PAGE_ACCESS_TOKEN?.trim() ||
          (await getPageAccessToken(graphVersion, env.META_ACCESS_TOKEN, env.META_PAGE_ID));
        await deleteFacebook(graphVersion, pageToken, url);
      } else if (t === 'instagram') {
        requireEnv(env, ['META_ACCESS_TOKEN', 'META_INSTAGRAM_USER_ID']);
        await deleteInstagram(graphVersion, env.META_INSTAGRAM_USER_ID, env.META_ACCESS_TOKEN, url);
      } else if (t === 'threads') {
        requireEnv(env, ['META_THREADS_ACCESS_TOKEN', 'META_THREADS_USER_ID']);
        await deleteThreads(
          env.META_THREADS_USER_ID,
          env.META_THREADS_ACCESS_TOKEN,
          url
        );
      }
      config[field] = null;
    } catch (e) {
      console.error(`FAIL ${t}: ${e.message}`);
      process.exitCode = 1;
    }
  }

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Updated ${configPath} (cleared deleted channel URLs)`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
