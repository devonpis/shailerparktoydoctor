# Publish content guards

Checks run **before** any social or webpage publish preview (see [`.cursor/rules/publish-content-guards.mdc`](../.cursor/rules/publish-content-guards.mdc)). Validate locally:

```bash
node scripts/validate-publish.mjs projects/0001\ -\ Saielle\ of\ the\ Willow\ Tree
# or by id prefix:
node scripts/validate-publish.mjs 0001
```

---

## Publish gates (order)

| Step | Gate | Script |
|------|------|--------|
| 1 | **DONE readiness** — presentable copy + images + skills (set status only after this passes) | `node scripts/validate-done-readiness.mjs <id>` or `node scripts/set-project-status.mjs <id> --status DONE` |
| 2 | **Webpage publish** — `status` must be `"DONE"` | `node scripts/publish-webpage.mjs <id>` |
| 3 | **Social publish** — `DONE` + `index.html` + `webpageUrl` | `node scripts/publish-social.mjs <id>` |

### Agent flow for social (preview before every post)

1. `validate-publish.mjs <id>`
2. **`publish-social.mjs <id> --dry-run --target all --use-site`** — show full output in chat (FB/IG caption, Threads text, images).
3. **Wait for owner yes** (or caption-file edits). Never skip this step for “publish oldest to social” / “publish to media”.
4. `publish-social.mjs <id> --use-site --wait-for-site --write-config` (plus `--caption-file` if they revised wording).

**Oldest eligible project:** `endDate` ascending (not project id); must have live `webpageUrl` and null social URL fields.

---

## Required in `projects/<id>/config.json`

| Field | DONE readiness | Webpage | Social |
|-------|----------------|---------|--------|
| `status` | Set to `"DONE"` only after readiness script passes | `"DONE"` | `"DONE"` |
| `projectName` | presentable name | (in readiness) | same |
| `title` | presentable headline (not name-only) | same | same |
| `description` | presentable lead (not skill stub) | same | same |
| `itemDetails` | ≥150 chars, real product copy (features/history/origin — **no** resale or market-pricing tone; see [`scripts/lib/item-details-tone.mjs`](../scripts/lib/item-details-tone.mjs)) | same | same |
| `repairDetails` | ≥2 paragraphs, no legacy/debug stub | same | same |
| `skills` | non-empty; `needlework`, `electronic`, `mechanical`, `paintjob` | same | same |
| `tags` | — | non-empty array | non-empty array |
| Media | ≥1 image | same | same |
| `index.html` | — | optional for prep script | **required** |
| `webpageUrl` | — | set by publish prep / manually | **required** (https) |

**Media files** (in the project folder): `before.*`, `after.*`, `hero.*`, `WIP-*.*`, or `*.mp4` / `*.mov` / `*.webm`.

---

## Unified limits (lowest common denominator)

When one caption is reused across **Facebook, Instagram, and Threads**, this repo enforces the **strictest** platform limits:

| Limit | Value | Why |
|-------|-------|-----|
| **Caption / `description` length** | **500** characters | [Threads posts](https://developers.facebook.com/docs/threads/posts) — text posts are capped at **500** characters. Instagram allows [2,200](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/) on the `caption` field; Facebook Page `message` has no documented API cap, but we still cap at **500** for one shared caption. |
| **`title` length** | **500** characters | Same ceiling so title + body never assume a longer Threads field. |
| **`tags` in config** | **1–30** strings | Full list for repair page chips and gallery search. |
| **Social hashtags (FB/IG)** | **3** max | [`scripts/lib/social-tags.mjs`](../scripts/lib/social-tags.mjs) picks three via `pickSocialTags()` — product/character/brand over generic labels (`plush`, `vintage`, `repair`, …). |
| **Each tag** | **1–50** characters, no `#` in JSON | Stored in `tags` as plain strings (e.g. `"Figure restoration"`). Agents/scripts may prefix `#` when building captions. |

**Emoji / UTF-8:** Threads counts some characters by UTF-8 byte length in edge cases; staying under **500** characters is the safe rule.

### Threads-only text at publish time

Facebook and Instagram use the full caption: **`description` + up to 3 social hashtags** (≤500 chars total).

**Threads** uses a **separate** short text built by [`scripts/lib/caption.mjs`](../scripts/lib/caption.mjs) (`buildThreadsCaption`):

| Rule | Value |
|------|--------|
| **Max length** | **200** characters (rewritten from `description`) |
| **Hashtags** | **None** — do not append `tags` on Threads |
| **URLs** | Stripped from the Threads text (links stay in FB/IG caption) |
| **Long copy** | **Rewritten** in [`scripts/lib/threads-caption-rewrite.mjs`](../scripts/lib/threads-caption-rewrite.mjs) — packs full sentences or hook + repair outcome; **not** truncated with `…` |

Preview and `publish-social.mjs` show both strings on dry-run. `validate-publish.mjs` warns when the source `description` is longer than 200 chars after URL stripping (Threads text will be rewritten).

---

## Image order: social vs webpage (different on purpose)

| Channel | Order | Do not mix |
|---------|--------|------------|
| **Webpage / HTML** | WIP gallery on story page: **before → WIP-### → after** (excludes `hero.*`). Page hero, gallery tile, OG: **hero → after → WIP-001 → before**. | [`listStoryGalleryImageNames()`](../scripts/lib/project-media.mjs), `publish-webpage.mjs`, `sync-project-story-images.mjs` — **unchanged** |
| **Social carousel** | **hero → after → before → WIP-###** | [`listPublishImagePaths()`](../scripts/lib/project-media.mjs) — **social publish only** |

Social order is for Meta carousels (lead with the showcase shot). Webpage order keeps a classic repair narrative in the gallery. Agents must **not** reorder webpage HTML to match social.

---

## Social carousel: image count and priority

| Item | Value |
|------|-------|
| **Max images** | **10** per post (`SOCIAL_CAROUSEL_MAX` in [`scripts/lib/project-media.mjs`](../scripts/lib/project-media.mjs)) |
| **Webpage** | Unlimited — story `index.html` can show every image (webpage order above, not social order) |
| **Selection** (when folder has &gt; 10) | Keep **hero**, **after**, **before** (each if present), then **WIP-001**, **WIP-002**, … until the cap; **drop highest-numbered WIP** first |
| **Carousel display order** | **hero → after → before → WIP-###** (numeric WIP order). Same order when all images fit within the cap. |
| **Single-image post** | `publish-social.mjs --image after` (or `hero` / `before`) — bypasses the cap |
| **Preview / dry-run** | Lists **included** vs **omitted** filenames when truncation applies |
| **Smart pick (&gt; 10)** | Default **`--pick-images auto`**: **OpenAI vision** if `OPENAI_API_KEY` in `.env`, else **local heuristic** (sharp clarity/size/role). Override: `--pick-images vision`, `heuristic`, or `rules` / `--no-ai` |

Implemented in [`scripts/lib/select-social-images.mjs`](../scripts/lib/select-social-images.mjs); rule fallback in `selectImagesForSocial()`. `validate-publish.mjs` warns when the folder has more than 10 images.

```bash
node scripts/publish-social.mjs 0027 --dry-run              # auto pick when >10
node scripts/publish-social.mjs 0027 --dry-run --pick-images vision
node scripts/publish-social.mjs 0027 --dry-run --no-ai      # rules only
```

---

## Do `tags` work on all three platforms?

| Platform | How `tags` are used |
|----------|---------------------|
| **Repair page** | All entries in `config.json` `tags` (chips / filter). |
| **Instagram** | **`description` + 3 social hashtags** in the caption (picked by `pickSocialTags`). |
| **Threads** | **No hashtags.** Short text only (≤**200** chars, rewritten from `description` — see above). |
| **Facebook** | Same as Instagram — **3** hashtags in the Page post **message**. |

There is **no** single Meta API field that accepts `tags: []` for all three. **`config.tags`** is the source of truth for the site; **social publish** uses only the top **three** for FB/IG.

### How the three social tags are chosen

Facebook and Instagram captions use **`description` + at most 3 hashtags** — never all tags from `config.json` when there are more than three.

When `config.tags` has more than three strings, `pickSocialTags()` scores each tag and keeps the **three most appropriate** for social (agent judgement encoded in scoring):

1. **Higher** if words overlap `projectName` or `title` (e.g. `Mattel`, `Pikachu`, `Megazord`).
2. **Higher** for longer, specific labels (character lines, model names).
3. **Lower** for generic repair/plush vocabulary (`plush`, `vintage`, `repair`, `interactive`, `doll`, …).
4. **Tie-break:** keep original order among the top three scores.

`validate-publish.mjs` and `publish-social.mjs` **warn/preview** which tags are picked vs story-page-only.

---

## Building the social caption (agent convention)

1. Start with `description` (must be ≤500 chars after any edits).
2. Append **three** social hashtags from `pickSocialTags(config.tags)` (not the full array).
3. Verify **final** string length ≤ **500** before posting to any social channel.

If hashtags would push the caption over 500 characters, **shorten the social post body** before publish (you cannot add a fourth social hashtag).

### Social post text preview (owner may revise message only)

Before live publish, show the **full FB/IG caption** and **Threads text** in chat. The owner can rewrite tone (e.g. first-person “we”, owner satisfaction) **without** changing `config.json` `description` / `repairDetails` / `itemDetails` unless they ask.

After approval:

```bash
node scripts/publish-social.mjs <id> --caption-file path/to/fb-ig-body.txt \
  [--threads-caption-file path/to/threads.txt] \
  --use-site --wait-for-site --write-config
```

- **`--caption-file`** — FB/IG body only; script appends up to 3 hashtags from `config.tags`.
- **`--threads-caption-file`** — optional; if omitted and `--caption-file` is set, Threads uses `rewriteForThreads()` on that body.

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

## Instagram / Threads: host images on the live site first

Meta fetches **`image_url` over HTTPS**. This repo serves project media from the **same GitHub Pages site** as the main pages:

| Step | Action |
|------|--------|
| 1 | Add/update images under `projects/<id> - <name>/` and push **`main`**. |
| 2 | Publish with `node scripts/publish-social.mjs <id> --use-site --wait-for-site` — polls until **all** project images are reachable on the site (5s interval, 5 min default timeout). |
| 3 | Optional: `--image after` for which file to post; `--wait-for-site 600` for a longer timeout. |

Public URL pattern: `https://sptoydoctor.com.au/projects/{encoded-folder}/{file}` — see [`github-pages-deploy.md`](github-pages-deploy.md).

**Facebook** can still use the local file upload path (no site URL required).

---

## Related

- [`README.md`](../README.md) — project management, image filenames  
- [`docs/meta-local-api-setup.md`](meta-local-api-setup.md) — API tokens  
- [`docs/github-pages-deploy.md`](github-pages-deploy.md) — push → live URLs  
- `scripts/validate-publish.mjs` — automated checks  
- `scripts/publish-social.mjs` — `--use-site`, `--wait-for-site`
