# Specification & design (SD)

Single place for **business intent** and **constraints**. Each item has an ID (`BR-xxx`). **Tasks** in [`TASKS.md`](TASKS.md) must trace to one or more requirements here.

---

## BR-001 — Publishing hub

The site and repo are a **publishing hub** for toy repair/restoration projects: each finished story can be promoted to **Facebook**, **Threads**, **Instagram**, the **public website**, and **YouTube** (video uploaded manually as needed).

---

## BR-002 — Project folder model

Each repair is a folder under `projects/` with:

- a `config.json` (metadata, URLs, `status`),
- images named by convention (`before`, `after`, `hero`, `WIP-001`, …).

---

## BR-003 — Owner-controlled `status` and `DONE` gate

`status` is set by the owner. Only **`DONE`** allows promoting that project on social or the live site. Other values (e.g. `WIP`) block public promotion.

---

## BR-004 — URL bookkeeping

Per-channel fields in `config.json` (`facebookUrl`, `instagramUrl`, `threadUrl`, `youtubeUrl`, `youtubeShortUrl`, `webpageUrl`):

- `null` → not recorded yet.
- non-null permalink → **already live** there; no duplicate post without explicit override.

After a successful publish, update the matching field. YouTube links are updated when the owner provides them after manual upload.

---

## BR-005 — Explicit publish commands

Publishing workflows start only on explicit instructions (e.g. `publish 0001 to facebook`, `… to webpage`, `… to social media and webpage`). The agent shows a **preview** and waits for **confirmation** before go-live steps.

---

## BR-006 — No unsolicited HTML

No **create or edit** of `*.html` unless the owner explicitly asks for HTML work, or `webpage` is part of an approved `publish <id> to …` flow (after preview + confirm).

---

## BR-007 — Human confirmation for sensitive actions

No **publish**, **git commit**, **git push**, or **secrets/API keys** without explicit owner confirmation in chat, per project rules.

---

## BR-008 — Task-driven delivery

Engineering work is planned in [`TASKS.md`](TASKS.md). Commits should **reference task IDs** (`T-` + five digits, e.g. `T-00001`) so history maps to requirements. New scope should add or extend a `BR` here and a `T` in the task list before large changes.

---

## BR-009 — Business links (root `config.json`)

Site-wide social and site URLs live in the repository root `config.json` (not per repair).

---

## BR-010 — Local Meta API for social publish

Social posting (Facebook Page, Instagram, Threads) may use **Meta’s official APIs** run **locally**. **Secrets** (App Secret, tokens) stay in **`.env`** (gitignored), never in tracked files. Operational steps live in [`docs/meta-local-api-setup.md`](meta-local-api-setup.md).

---

## BR-011 — Static site via GitHub Actions

The public **HTML site** is deployed by **GitHub Actions** when changes are **pushed** to the configured branch. Updating the live webpage is done by editing site files (when explicitly requested), committing, and pushing — not via the Meta Graph API.

---

## BR-012 — Publish content guards

Before social or webpage publish, content must pass validation: `status` **DONE**, non-empty **`title`**, **`description`**, **`tags`**, and at least one image or video in the project folder. Cross-platform social text uses the **lowest** limits: **500** characters (Threads) and **30** tags (Instagram). See [`docs/publish-content-guards.md`](publish-content-guards.md) and `scripts/validate-publish.mjs`.
