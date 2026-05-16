# Publish content guards

Checks run **before** any social or webpage publish preview (see [`.cursor/rules/publish-content-guards.mdc`](../.cursor/rules/publish-content-guards.mdc)). Validate locally:

```bash
node scripts/validate-publish.mjs projects/0001\ -\ Saielle\ of\ the\ Willow\ Tree
# or by id prefix:
node scripts/validate-publish.mjs 0001
```

---

## Required in `projects/<id>/config.json`

| Field | Webpage | Social (FB / IG / Threads) |
|-------|---------|----------------------------|
| `status` | `"DONE"` | `"DONE"` |
| `title` | non-empty | non-empty |
| `description` | non-empty | non-empty (this is the post/caption body) |
| `tags` | non-empty array | non-empty array |
| Media | ≥1 image **or** video file in folder | same |

**Media files** (in the project folder): `before.*`, `after.*`, `hero.*`, `WIP-*.*`, or `*.mp4` / `*.mov` / `*.webm`.

---

## Unified limits (lowest common denominator)

When one caption is reused across **Facebook, Instagram, and Threads**, this repo enforces the **strictest** platform limits:

| Limit | Value | Why |
|-------|-------|-----|
| **Caption / `description` length** | **500** characters | [Threads posts](https://developers.facebook.com/docs/threads/posts) — text posts are capped at **500** characters. Instagram allows [2,200](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/) on the `caption` field; Facebook Page `message` has no documented API cap, but we still cap at **500** for one shared caption. |
| **`title` length** | **500** characters | Same ceiling so title + body never assume a longer Threads field. |
| **Tag count** | **1–30** tags | Instagram allows up to **30 hashtags** per caption ([platform guidance](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/)). Threads has no separate hashtag count — hashtags are plain text inside the **500** characters. Facebook has no hashtag count in the API; we use **30** everywhere for consistency. |
| **Each tag** | **1–50** characters, no `#` in JSON | Stored in `tags` as plain strings (e.g. `"Figure restoration"`). Agents/scripts may prefix `#` when building captions. |

**Emoji / UTF-8:** Threads counts some characters by UTF-8 byte length in edge cases; staying under **500** characters is the safe rule.

---

## Do `tags` work on all three platforms?

| Platform | How `tags` are used |
|----------|---------------------|
| **Instagram** | Append as **hashtags** in the **caption** (with `description`). Max **30** hashtags. |
| **Threads** | Append as hashtags in the **text** field (same string as caption). All text must fit in **500** characters total. |
| **Facebook** | Append as hashtags in the Page post **message** (same caption string). No separate tags API field. |
| **Webpage** | Use `tags` for labels/SEO/filtering on the repair page (not necessarily `#` prefixed). |

There is **no** single Meta API field that accepts `tags: []` for all three; this repo’s `tags` array is the **source of truth** you merge into caption/message at publish time.

---

## Building the social caption (agent convention)

1. Start with `description` (must be ≤500 chars after any edits).
2. Optionally append hashtags from `tags` (e.g. `#FigureRestoration` — normalize spaces).
3. Verify **final** string length ≤ **500** before posting to any social channel.

If hashtags would push the caption over 500 characters, **shorten `description` or reduce tags** before publish.

---

## Video on Facebook, Instagram, and Threads

**Short answer:** All three support **video via API**, but **not** with one identical upload path. Our validator only checks that a video **file exists** in the project folder (`.mp4`, `.mov`, `.webm`, `.m4v`); a future publish script must use the right API per platform.

| Platform | Video via API? | How it works (summary) |
|----------|----------------|-------------------------|
| **Facebook Page** | Yes | [Video API](https://developers.facebook.com/docs/video-api/guides/publishing/) — resumable upload, then `POST /{page-id}/videos` (or related Page video endpoints). Needs Page token + `pages_manage_posts`-style permissions. |
| **Instagram** | Yes | [Content publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing) — container with `media_type=VIDEO` or `REELS` + **`video_url` on a public HTTPS server** (Meta fetches the URL). Async processing; check container `status_code` before publish. Reels ≠ feed video (different `media_type`). |
| **Threads** | Yes | [Threads posts](https://developers.facebook.com/docs/threads/posts) — `media_type=VIDEO` + **`video_url` on a public server**, then `threads_publish`. Wait ~**30 seconds** (or poll container status) before publishing. |

### Important differences (not “one file, three posts” automatically)

1. **Public URL** — Instagram and Threads require the video at a **publicly reachable URL** at publish time; a file only in `projects/…/` is not enough until something hosts it (e.g. your site, S3, or temporary upload).
2. **Facebook** — Uses **upload session / file handle** flow, not the same `video_url` pattern as IG/Threads.
3. **Specs** — Each platform has codec, duration, aspect ratio, and size limits (Threads documents [video specs](https://developers.facebook.com/docs/threads/posts#media-specifications) e.g. max width 1920px, aspect ratio 0.01:1–10:1, **9:16 recommended**). One export may fail on one platform if it does not meet that platform’s rules.
4. **Permissions** — e.g. `instagram_content_publish`, `threads_content_publish`, Page video permissions — must be granted on your **sptoydoctor** app and token.
5. **YouTube** — Not part of this trio; you already treat **`youtubeUrl` / `youtubeShortUrl`** as **manual** upload in `config.json`.

### Practical guidance for this repo

| Goal | Approach |
|------|----------|
| **Photo repair posts** (your usual flow) | Use **images** (`before`, `after`, `hero`, `WIP-*`); works on all three with image APIs. |
| **Same video on FB + IG + Threads** | Plan **three API calls** (or a script with three code paths), **host video publicly** for IG/Threads, and **validate specs** (often encode once to MP4, 9:16 or safe aspect, within size limits). |
| **Validation only** | `validate-publish.mjs` accepts **images OR video** so a video-only project can pass guards; it does **not** verify codecs, duration, or public URL. |

---

## Related

- [`README.md`](../README.md) — project management, image filenames  
- [`docs/meta-local-api-setup.md`](meta-local-api-setup.md) — API tokens  
- `scripts/validate-publish.mjs` — automated checks
