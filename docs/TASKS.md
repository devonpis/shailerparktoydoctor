# Task list

Work is **driven by this backlog**. Each task maps to [`SD.md`](SD.md) requirements (`BR-xxx`).

**Task IDs:** `T-` plus **five digits**, zero-padded (e.g. `T-00001`, `T-00042`).

**Statuses:** `Todo` · `In progress` · `Done` · `Blocked`

When a task is **Done**, mark it here in the same change set as the implementation (or immediately after), so the list stays truthful.

---

## Summary

| ID | Status | Title | Requirement |
|----|--------|-------|-------------|
| T-00001 | Done | PM system: SD, tasks, agent rules | BR-008 |
| T-00002 | Done | Document GitHub Pages deploy + static site publish path | BR-001, BR-011 |
| T-00005 | Done | Meta local API: token & `.env` setup guide (FB / IG / Threads) | BR-007, BR-010 |
| T-00006 | Done | Publish content guards (validation script, limits, rules) | BR-005, BR-012 |
| T-00007 | Done | Local publish script (Facebook, Instagram, Threads) | BR-001, BR-010, BR-012, BR-013 |
| T-00008 | Done | Collect business info doc for future web content / SEO | BR-014 |
| T-00009 | In progress | Website rebuild — analysis & direction (discuss before build) | BR-006, BR-015 |
| T-00010 | Done | New project + end-to-end publish validation | BR-013, BR-016 |
| T-00011 | Todo | Extract legacy site repairs into `projects/` | BR-017 |

---

## T-00001 — PM system: SD, tasks, agent rules

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-008 |
| **Outcome** | `docs/SD.md`, `docs/TASKS.md`, task-driven Cursor rule, README links. Commits use five-digit task IDs (e.g. `T-00001`) in messages. |

---

## T-00002 — GitHub Actions deploy

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-001, BR-011 |
| **Outcome** | [`docs/github-pages-deploy.md`](github-pages-deploy.md) — Pages from `main`, workflow `pages-build-deployment`, custom domain `sptoydoctor.com.au`. |

---

## T-00005 — Meta local API: token & `.env` setup

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-007, BR-010 |
| **Outcome** | [`docs/meta-local-api-setup.md`](meta-local-api-setup.md), root [`.env.example`](../.env.example), `.env` entries in [`.gitignore`](../.gitignore). |

---

## T-00006 — Publish content guards

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-005, BR-012 |
| **Outcome** | [`docs/publish-content-guards.md`](publish-content-guards.md), `scripts/validate-publish.mjs`, `.cursor/rules/publish-content-guards.mdc`, `title` in project config template. |

---

## T-00007 — Local publish script

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-001, BR-010, BR-012, BR-013 |
| **Outcome** | [`scripts/publish-social.mjs`](../scripts/publish-social.mjs) + libs (`load-env`, `caption`, `project-media`, `site-image-url`, `wait-for-site-images`). Validates first; Facebook local upload; IG/Threads via `--use-site` + `--wait-for-site` (poll all project images); `--dry-run`, `--write-config`, `--force`, `--image`. Documented in README, [`publish-content-guards.md`](publish-content-guards.md), [`github-pages-deploy.md`](github-pages-deploy.md). |
| **Out of scope (deferred)** | Video to social; automated webpage deploy. |
| **Depends on** | Tokens in `.env`; explicit `publish <id> to …` + preview + confirm in chat before running without `--dry-run`. |

---

## T-00008 — Collect business info doc

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-014 |
| **Outcome** | [`docs/business-info.md`](business-info.md) — services, contact, enquiry flow, service area, Maps/reviews, personas, operations guidance; hours by appointment; ABN TBA; Dr. Hobby image deferred. |

---

## T-00009 — Website rebuild (analysis & direction)

| Field | Value |
|-------|-------|
| **Status** | In progress |
| **Requirements** | BR-006, BR-015 |
| **Outcome** | [`docs/website-rebuild-analysis.md`](website-rebuild-analysis.md) — current state, options A/B/C, SEO/visual questions. |
| **Next** | Discuss direction in chat; agree brief; **no HTML** until owner approves build. |
| **Related** | T-00007 (publish script), T-00008 (business-info) |

---

## T-00010 — New project + end-to-end publish validation

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-013, BR-016 |
| **Outcome** | **0003** Illco Donald Duck: `validate-publish` OK; push → site images; live publish to FB/IG/Threads with 6-image carousel, YouTube links in caption, `itemDetails`/`repairDetails`; permalinks in `config.json`. **0002** Venom config prepared (WIP, client approval pending). Script hardening: carousel publish, safe hashtags, `delete-social.mjs`, IG container polling, Threads caption without hashtags. IG delete via API needs `instagram_manage_contents` (documented); old 0003 single-image post removed manually. |
| **Depends on** | T-00007 (script), `.env` tokens, owner content and approval for go-live. |

---

## T-00011 — Extract legacy site repairs into `projects/`

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-017 |
| **Goal** | Backfill `projects/` from content already on the live homepage ([`index.html`](../index.html)), without changing HTML unless owner later requests it. |
| **Source** | **Full stories** (h3 + image + paragraph): Rocky Balboa, Vintage Giant Smurf, Childhood Toy Train, Teddy Bear with Love. **Gallery** (“Other Patients”): dog, duggee, guitar, lightsaber, stormtrooper, vintage bear, Tomy car (×2), Anpanman reading pen — shorter captions only. |
| **Scope** | For each repair: create `projects/0004 - …` (next free id); copy/link images from `images/` into folder (`hero` or `after` + optional `before` if added later); draft `config.json` (`title`, `description` ≤500 for social, `itemDetails` / `repairDetails`, `tags`, `status` **WIP** until owner sets **DONE**). Run `validate-publish.mjs` when content is complete. **Do not** overwrite **0001–0003**; dedupe if a site story matches an existing project. |
| **Out of scope** | Auto-publish to social; editing `index.html` to point at new folders (→ **T-00009** rebuild). Optional: one-off script `scripts/import-site-projects.mjs` for repeatability. |
| **Related** | T-00009 (wire DONE projects into new site), T-00008 (`business-info.md` for tone/tags). |
