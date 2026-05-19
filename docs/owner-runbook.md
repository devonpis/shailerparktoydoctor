# Owner runbook — on-demand repairs & publish

One-page reference for day-to-day work. Agents follow the same steps; publishing always needs an **explicit** command and your **yes** after preview.

**Full detail:** [`README.md`](../README.md) · [`publish-content-guards.md`](publish-content-guards.md) · [`website-go-live.md`](website-go-live.md) · Meta tokens: [`meta-local-api-setup.md`](meta-local-api-setup.md)

---

## 1. New or in-progress repair

| Step | You / agent |
|------|-------------|
| Folder | `projects/<id> - <name>/` — copy from [`0000 - template`](../projects/0000%20-%20template/) |
| Images | `before`, `after`, `hero`, `WIP-001` … next to `config.json` |
| Config | Fill `projectName`, `title`, `description`, `tags`, `skills`, optional `itemDetails` / `repairDetails` |
| Status | Keep **`WIP`** until the story is ready |

**Batch metadata:** paste or edit copy in chat / `config.json` — no CSV import pipeline for now.

---

## 2. Ready for the public site

```bash
node scripts/validate-done-readiness.mjs <id>
```

Fix anything reported, then set **`status`: `"DONE"`** (you only — or `node scripts/set-project-status.mjs <id> --status DONE` after readiness passes).

**Say in chat:** `publish <id> to webpage` → preview → **yes** → agent runs:

```bash
node scripts/publish-webpage.mjs <id>
# optional: --rotate <file> --cw|--ccw|--180  or  --exif-orient
node scripts/sync-projects-gallery-index.mjs <id>
node scripts/sync-sitemap-project-urls.mjs <id>
```

Then **commit & push** `main` (GitHub Pages → [sptoydoctor.com.au](https://sptoydoctor.com.au/)).

---

## 3. Social (after webpage is live)

Requires **`DONE`**, story on site, and **`webpageUrl`** set. Non-null `facebookUrl` / `instagramUrl` / `threadUrl` = already posted — don’t repost without saying so.

**Say in chat:** `publish <id> to social media` (or `… and webpage` if both) → preview → **yes**.

```bash
node scripts/validate-publish.mjs <id>
git push   # site images must be live first
node scripts/publish-social.mjs <id> --use-site --wait-for-site --dry-run   # preview
node scripts/publish-social.mjs <id> --use-site --wait-for-site --write-config   # after confirm
```

- **FB/IG caption:** `description` + **3** hashtags (picked from `tags`).
- **Threads:** short rewrite of `description` (≤200 chars, no hashtags).
- **Carousel:** up to **10** images, order **hero → after → before → WIP** (webpage gallery order is different — that’s OK).

---

## 4. You renamed images on disk

Do **not** run `normalize-project-media-names.mjs` unless you explicitly want auto-renames.

```bash
node scripts/sync-project-story-images.mjs <id>
node scripts/sync-projects-gallery-index.mjs <id>
# if on home highlights:
node scripts/sync-home-highlights.mjs
```

---

## 5. Other quick commands

| Need | Command |
|------|---------|
| Check publish copy | `node scripts/validate-publish.mjs <id>` |
| Optimize photos | `node scripts/optimize-project-images.mjs <id>` |
| Google review | Paste in chat: `add google review to <id>` — or `node scripts/apply-google-review.mjs <id> …` |
| Metadata gaps CSV | `node scripts/export-project-metadata-gaps.mjs` |
| Rotate one file | `node scripts/rotate-project-image.mjs <id> <file> --cw` |
| Social dry-run only | `node scripts/publish-social.mjs <id> --dry-run` |

---

## 6. Explicit publish phrases (agents)

These **start** a publish workflow; casual “it’s ready” does **not**.

- `publish 0039 to webpage`
- `publish 0039 to social media`
- `publish 0039 to social media and webpage`

Agent shows a **preview** (status, URLs, caption length, hashtags, images) and waits for **yes** before go-live.

---

## 7. Engineering mode (May 2026+)

Core tooling is **stable**. New work is **on-demand**: you update projects; you trigger publish. Optional smoke tests: `npm test`.
