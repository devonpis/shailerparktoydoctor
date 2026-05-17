import fs from 'node:fs';
import path from 'node:path';
import { SOCIAL_CAROUSEL_MAX } from './project-media.mjs';

export { SOCIAL_CAROUSEL_MAX as MAX_CAROUSEL_ITEMS };

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForIgContainer(graphVersion, containerId, userToken, label) {
  const started = Date.now();
  const maxMs = 180_000;
  while (Date.now() - started < maxMs) {
    const data = await graphGet(`https://graph.facebook.com/${graphVersion}/${containerId}`, {
      fields: 'status_code,status',
      access_token: userToken,
    });
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') {
      throw new Error(`Instagram container failed (${label}): ${data.status || data.status_code}`);
    }
    await sleep(3_000);
  }
  throw new Error(`Instagram container timed out (${label}): ${containerId}`);
}

function capCarouselItems(imagePaths) {
  if (imagePaths.length <= SOCIAL_CAROUSEL_MAX) return imagePaths;
  console.warn(
    `Carousel capped at ${SOCIAL_CAROUSEL_MAX} images (had ${imagePaths.length}); use selectImagesForSocial() upstream.`
  );
  return imagePaths.slice(0, SOCIAL_CAROUSEL_MAX);
}

async function uploadFacebookUnpublishedPhoto({ graphVersion, pageId, pageToken, imagePath }) {
  const fileBuf = fs.readFileSync(imagePath);
  const form = new FormData();
  form.append('source', new Blob([fileBuf]), path.basename(imagePath));
  form.append('published', 'false');
  form.append('access_token', pageToken);
  const body = await graphPost(
    `https://graph.facebook.com/${graphVersion}/${pageId}/photos`,
    {},
    form
  );
  if (!body.id) throw new Error('Facebook photo upload missing id');
  return body.id;
}

export async function publishFacebook({
  graphVersion,
  pageId,
  pageToken,
  imagePaths,
  caption,
}) {
  const paths = capCarouselItems(imagePaths);
  if (paths.length === 1) {
    const fileBuf = fs.readFileSync(paths[0]);
    const form = new FormData();
    form.append('source', new Blob([fileBuf]), path.basename(paths[0]));
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

  const mediaFbids = [];
  for (const imagePath of paths) {
    mediaFbids.push(
      await uploadFacebookUnpublishedPhoto({ graphVersion, pageId, pageToken, imagePath })
    );
  }
  const form = new FormData();
  form.append('message', caption);
  form.append('access_token', pageToken);
  mediaFbids.forEach((id, i) => {
    form.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id }));
  });
  const body = await graphPost(
    `https://graph.facebook.com/${graphVersion}/${pageId}/feed`,
    {},
    form
  );
  const postId = body.id;
  if (!postId) throw new Error('Facebook feed post missing id');
  return `https://www.facebook.com/${postId}`;
}

export async function publishInstagram({
  graphVersion,
  igUserId,
  userToken,
  imageUrls,
  caption,
}) {
  const urls = capCarouselItems(imageUrls);
  if (urls.length === 1) {
    const container = await graphPost(
      `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
      { image_url: urls[0], caption, access_token: userToken }
    );
    const published = await graphPost(
      `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`,
      { creation_id: container.id, access_token: userToken }
    );
    const media = await graphGet(
      `https://graph.facebook.com/${graphVersion}/${published.id}`,
      { fields: 'permalink', access_token: userToken }
    );
    if (!media.permalink) throw new Error('Instagram response missing permalink');
    return media.permalink;
  }

  const childIds = [];
  for (let i = 0; i < urls.length; i++) {
    const imageUrl = urls[i];
    const child = await graphPost(
      `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
      {
        image_url: imageUrl,
        is_carousel_item: 'true',
        access_token: userToken,
      }
    );
    await waitForIgContainer(graphVersion, child.id, userToken, `slide ${i + 1}`);
    childIds.push(child.id);
  }
  const parent = await graphPost(
    `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
    {
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      caption,
      access_token: userToken,
    }
  );
  const published = await graphPost(
    `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`,
    { creation_id: parent.id, access_token: userToken }
  );
  const media = await graphGet(
    `https://graph.facebook.com/${graphVersion}/${published.id}`,
    { fields: 'permalink', access_token: userToken }
  );
  if (!media.permalink) throw new Error('Instagram response missing permalink');
  return media.permalink;
}

export async function publishThreads({
  threadsUserId,
  threadsToken,
  imageUrls,
  caption,
}) {
  const urls = capCarouselItems(imageUrls);
  if (urls.length === 1) {
    const container = await graphPost(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, {
      media_type: 'IMAGE',
      image_url: urls[0],
      text: caption,
      access_token: threadsToken,
    });
    await sleep(35_000);
    const published = await graphPost(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
      { creation_id: container.id, access_token: threadsToken }
    );
    const media = await graphGet(`https://graph.threads.net/v1.0/${published.id}`, {
      fields: 'permalink',
      access_token: threadsToken,
    });
    if (!media.permalink) throw new Error('Threads response missing permalink');
    return media.permalink;
  }

  const childIds = [];
  for (const imageUrl of urls) {
    const child = await graphPost(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, {
      media_type: 'IMAGE',
      image_url: imageUrl,
      is_carousel_item: 'true',
      access_token: threadsToken,
    });
    childIds.push(child.id);
    await sleep(2_000);
  }
  const parent = await graphPost(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    text: caption,
    access_token: threadsToken,
  });
  await sleep(35_000);
  const published = await graphPost(
    `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
    { creation_id: parent.id, access_token: threadsToken }
  );
  const media = await graphGet(`https://graph.threads.net/v1.0/${published.id}`, {
    fields: 'permalink',
    access_token: threadsToken,
  });
  if (!media.permalink) throw new Error('Threads response missing permalink');
  return media.permalink;
}
