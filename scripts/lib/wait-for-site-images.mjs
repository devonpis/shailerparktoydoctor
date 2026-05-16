import { listProjectImages, publicImageUrl } from './project-media.mjs';
import { projectSiteImageUrl } from './site-image-url.mjs';

const DEFAULT_INTERVAL_MS = 5_000;
const DEFAULT_MAX_WAIT_MS = 300_000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** HEAD with GET fallback (some hosts reject HEAD). */
export async function isUrlReachable(url) {
  let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  if (res.status === 405 || res.status === 501) {
    res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { Range: 'bytes=0-0' },
    });
  }
  return res.ok;
}

export function projectImagePublicUrls({
  dir,
  projectFolderName,
  siteBaseUrl,
  publicBaseUrl,
  useSite,
}) {
  const names = listProjectImages(dir);
  if (!names.length) {
    throw new Error(`No project images to check in ${projectFolderName}.`);
  }
  return names.map((name) => {
    const url = useSite
      ? projectSiteImageUrl(siteBaseUrl, projectFolderName, name)
      : publicImageUrl(publicBaseUrl, name);
    return { name, url };
  });
}

/**
 * Poll until every project image URL returns OK, or maxWaitMs elapses.
 * @param {number} maxWaitSeconds — 0 uses DEFAULT_MAX_WAIT_MS
 */
export async function waitForProjectImagesOnSite({
  dir,
  projectFolderName,
  siteBaseUrl,
  publicBaseUrl,
  useSite,
  maxWaitSeconds = 0,
  intervalMs = DEFAULT_INTERVAL_MS,
}) {
  const entries = projectImagePublicUrls({
    dir,
    projectFolderName,
    siteBaseUrl,
    publicBaseUrl,
    useSite,
  });
  const maxWaitMs = maxWaitSeconds > 0 ? maxWaitSeconds * 1000 : DEFAULT_MAX_WAIT_MS;
  const started = Date.now();
  let attempt = 0;

  console.log(
    `Waiting for ${entries.length} image(s) on site (poll every ${intervalMs / 1000}s, max ${maxWaitMs / 1000}s)…`
  );

  let lastPending = entries.map((e) => e.name);

  while (Date.now() - started < maxWaitMs) {
    attempt += 1;
    const pending = [];
    for (const { name, url } of entries) {
      if (await isUrlReachable(url)) continue;
      pending.push(name);
    }
    lastPending = pending;
    if (pending.length === 0) {
      console.log(`All ${entries.length} image(s) reachable on site.`);
      return entries;
    }
    const elapsed = Math.round((Date.now() - started) / 1000);
    console.log(
      `Attempt ${attempt} (${elapsed}s): still waiting for ${pending.join(', ')} — push main / check Pages deploy?`
    );
    await sleep(intervalMs);
  }

  throw new Error(
    `Timed out after ${maxWaitMs / 1000}s — still missing: ${lastPending.join(', ')}. Example URL: ${entries[0].url}`
  );
}
