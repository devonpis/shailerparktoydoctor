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

## BR-009 — Business links

Site-wide social and site URLs live in [`docs/business-info.md`](business-info.md) (not per repair). Per-repair permalinks stay in each `projects/…/config.json`.

---

## BR-010 — Local Meta API for social publish

Social posting (Facebook Page, Instagram, Threads) may use **Meta’s official APIs** run **locally**. **Secrets** (App Secret, tokens) stay in **`.env`** (gitignored), never in tracked files. Operational steps live in [`docs/meta-local-api-setup.md`](meta-local-api-setup.md).

---

## BR-011 — Static site via GitHub Actions

The public **HTML site** is deployed by **GitHub Actions** when changes are **pushed** to the configured branch. Updating the live webpage is done by editing site files (when explicitly requested), committing, and pushing — not via the Meta Graph API.

---

## BR-012 — Publish content guards

Before social or webpage publish, content must pass validation: `status` **DONE**, non-empty **`title`**, **`description`**, **`tags`**, and at least one image or video in the project folder. Cross-platform social text uses the **lowest** limits: **500** characters (Threads) and **30** tags (Instagram). See [`docs/publish-content-guards.md`](publish-content-guards.md) and `scripts/validate-publish.mjs`.

---

## BR-013 — Local publish script

A **local script** (Node) posts repair content to **Facebook**, **Instagram**, and **Threads** using `.env` tokens, after validation and explicit owner publish approval. Image-first; video deferred. Implemented: **T-00007** (`scripts/publish-social.mjs`). Live proof on a new project: **T-00010**.

---

## BR-016 — End-to-end publish validation (new project)

The owner (or agent with approval) runs the full flow on at least one **new** repair folder: create project from template, pass `validate-publish.mjs`, push images to the live site, dry-run then live `publish-social.mjs`, and persist permalinks in `config.json`. See **T-00010**.

---

## BR-014 — Business information document

Canonical business facts for copy and SEO live in [`docs/business-info.md`](business-info.md), maintained with the owner. See **T-00008**.

---

## BR-015 — Website rebuild (analysis then build)

The public site may be **rebuilt** for stronger visuals and SEO. **Analysis and stack direction** are complete ([`docs/website-rebuild-analysis.md`](website-rebuild-analysis.md), **T-00009**). **Design brief approved** (**T-00012**, 2026-05-16). IA and build slices: **T-00017**–**T-00020** under `new/`; artifacts **T-00013**; cutover **T-00016**. See [`docs/website-design-brief.md`](website-design-brief.md) and [`docs/TASKS.md`](TASKS.md).

**Rebuild must include (when built):**

- **Global nav:** brand/logo → home; **Projects** (tile index of DONE repairs); **Testimonials** (Google reviews); **Contact**; **social icons** (Facebook, Instagram, Threads, YouTube — URLs from [`business-info.md`](business-info.md)).
- **Home:** combined **About us / our mission** (legacy “About us” + “Do You Know”); **Our Doctors** (Dr. Fluffy, Dr. Electronics, Dr. Hobby); **three featured project tiles** linking to story pages + full-width CTA to Projects index.
- **Responsive:** mobile-first layout; usable nav and readable sections on small screens.
- **Staging:** build under `new/` until cutover (**T-00016**); legacy root marketing HTML untouched until then.

---

## BR-017 — Migrate legacy site repairs into `projects/`

Repair stories and gallery items currently embedded in [`index.html`](../index.html) (and assets under [`images/`](../images/)) should be extracted into `projects/<id> - <name>/` with `config.json` + images using the repo’s project conventions. Existing folders **0001–0003** are not replaced without owner review. See **T-00011**.

---

## BR-018 — Scaffold `projects/` from CSV (with duplicate merge)

The owner may supply a **CSV** listing repairs to onboard in bulk. A script (or documented one-shot workflow) should create `projects/<id> - <name>/` folders from the template, writing `config.json` fields mapped from CSV columns. **Duplicate rows** (same project id, same folder name, or clearly the same repair under different spellings) must be **detected** and **merged** into one folder/config rather than creating conflicting copies. Merged output should prefer non-empty values, surface conflicts for human review, and support **`--dry-run`**. Must not overwrite existing project folders unless the owner explicitly opts in. See **T-00025**.
