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

## Related

- [`README.md`](../README.md) — project management, image filenames  
- [`docs/meta-local-api-setup.md`](meta-local-api-setup.md) — API tokens  
- `scripts/validate-publish.mjs` — automated checks
