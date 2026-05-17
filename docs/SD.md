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

The owner may supply a **CSV** listing repairs to onboard in bulk. A script (or documented one-shot workflow) should create `projects/<id> - <name>/` folders from the template, writing `config.json` fields mapped from CSV columns. **Duplicate rows** (same project id, same folder name, or clearly the same repair under different spellings) must be **detected** and **merged** into one folder/config rather than creating conflicting copies. Merged output should prefer non-empty values, surface conflicts for human review, and support **`--dry-run`**. Must not overwrite existing project folders unless the owner explicitly opts in. **Do not** import customer names, phones, or emails from timesheets — see **BR-019**. See **T-00025**.

---

## BR-019 — No customer PII in the repository

Customer-identifying information (names, phones, emails, addresses on repair jobs) must **not** appear in tracked project content, except **Google review author names** (and optional public Maps profile URLs) in `googleReview` / testimonials, and the **business** Google Maps listing link in site copy. Agents and import scripts must enforce this. See [`.cursor/rules/client-privacy-no-pii-in-repo.mdc`](../.cursor/rules/client-privacy-no-pii-in-repo.mdc).

---

## BR-020 — Social publish image cap and priority

When posting **photos** to **Facebook, Instagram, and Threads** with one shared carousel, the repo uses the **lowest** per-post image count across those three APIs. Today that binding limit is **10** images per carousel ([Instagram](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media/); Facebook multi-photo posts align with the same cap in [`scripts/lib/social-publish.mjs`](../scripts/lib/social-publish.mjs); Threads allows more but is not the driver).

If a project folder has **more** publishable images than the cap, **social** publish must **select** which files to upload using this **priority** (keep higher tiers first; drop lower tiers until within the cap):

1. **`hero`**
2. **`before`**
3. **`after`**
4. **`WIP-###`** (lowest priority — omit excess WIP shots first)

Within a tier, preserve numeric WIP order. **Carousel display order** on the post may still follow story order (before → WIP → hero → after) for the **selected** set.

**Webpage** publishing has **no** image-count cap — all convention-named images may appear on the repair story page.

Selection rules, preview output, and script behaviour belong in [`docs/publish-content-guards.md`](publish-content-guards.md) and the publish workflow (**T-00026**).

---

## BR-021 — Project image optimization (compress / PNG → JPEG)

Repair images under `projects/` should be **web-friendly** (reasonable file size, JPEG for photos). The repo provides:

1. **Batch** optimization — one command to process **all** existing project folders (and optionally legacy `images/` if in scope).
2. **On-demand** optimization — same tool scoped to one project folder after the owner adds new files.

**PNG** photos (common from phones/export) should be converted to **JPEG** with configurable quality; large existing JPEGs may be recompressed in place when over a size threshold. When a file is renamed (`hero.png` → `hero.jpg`), any **HTML** that references the old path (e.g. `projects/<folder>/index.html`, gallery JSON) must be **updated** to match.

Recommended as an optional step **before** webpage go-live (see [`docs/website-go-live.md`](website-go-live.md)); **not** required for social-only publish if images already meet Meta size guidance. Implementation: **T-00027**.

---

## BR-022 — USB repair photos: analyse, match, copy, and rename

The owner stores repair photos on **USB** (or another external volume) in camera export layout (often by date folder or `IMG_*` names). The repo must support a workflow to:

1. **Scan** a given USB path (read-only on source; never modify originals on the stick).
2. **Analyse** each image using **capture timestamp** (EXIF `DateTimeOriginal` / file mtime fallback) and **visual content** (e.g. before vs after vs in-progress vs hero-worthy) to suggest which **`projects/<id> - <name>/`** folder it belongs to, matched against existing `config.json` metadata (`projectName`, `startDate` / `endDate`, receive dates in `repairDetails` / timesheet imports).
3. **Propose** destination filenames per [BR-002](../README.md#project-image-filenames): `before`, `after`, `hero`, `WIP-001`, … — respecting existing files in the target folder (next free WIP number, do not overwrite without explicit flag).
4. **Copy** (default) or move (opt-in) into the matched project folder after owner review; **`--dry-run`** reports matches, role guesses, and planned names without writing.

Conflicts (one photo fits multiple projects, ambiguous date window, missing project) must be **reported** for human decision. Must not copy unrelated personal photos or write customer PII into filenames. Prefer **agent-assisted** review for uncertain matches rather than silent wrong assignment. Implementation: **T-00028**.

---

## BR-023 — Timesheet import cleanup (dates and ambiguous rows)

CSV scaffold imports may produce **invalid ISO dates** when day/month are parsed incorrectly (Australian **DD/MM/YYYY** and compact **DDMMYYYY**). The repo should parse and repair dates consistently and allow **owner review** of ambiguous scaffold rows (e.g. client first names mistaken for toy projects). See `scripts/fix-imported-dates.mjs`, scaffold date logic, and **T-00029**.

---

## BR-024 — Project identity: product info and rename

Repair folders may use **working labels** from USB export or timesheet gaps (e.g. `Godfy`, `Dog`, `anime figure`) that are not proper product names. The repo should support a workflow to:

1. **Identify** the toy or product from photos in `projects/<id> - <name>/` and any owner notes (optional public product references).
2. **Update** `projectName`, folder name `#### - Name`, and descriptive fields in `config.json` (`title`, `description`, `itemDetails`, `tags`) after owner confirmation when ambiguous.
3. **Avoid** customer PII in filenames or committed metadata.

Depends on images being present (often after **T-00028** USB ingest). Does not auto-publish or edit story HTML unless requested. Implementation: **T-00030**.

---

## BR-025 — Project dates from image capture time (EXIF)

When `config.json` lacks reliable **`startDate`** / **`endDate`** (empty, template default, or USB/timesheet scaffold placeholders), the repo should derive dates from **repair images** in the project folder:

1. **Read** capture time per image: EXIF `DateTimeOriginal` (or equivalent), then `IMG_YYYYMMDD_*` filename, then file mtime.
2. **Set** `startDate` = oldest capture (date only); `endDate` = newest capture (date only).
3. **Preserve** owner-verified timesheet dates unless explicitly overridden (`--force` or confirmed import).
4. **Exclude** legacy homepage imports **0004–0014** and owner projects **0001–0003** (unreliable hero/ingest EXIF); dates for that band via timesheet or **T-00032** fill-in.

Implementation: **T-00031** (Done). Feeds accurate rows into owner metadata CSV (**T-00032**).

---

## BR-026 — Owner metadata gap CSV (fill-in workflow)

After product naming (**T-00030**) and EXIF dates (**T-00031**), the owner (or partner) needs a single **CSV report** of projects missing or stub metadata: **`repairDetails`**, **`description`**, **`skills`**, **`tags`**, **`title`**, and related fields. The file must be safe to share (no client phone/email in rows), easy to open in Excel/Sheets, and structured so filled columns can be imported back into `config.json` in a follow-up step. Implementation: **T-00032**.

---

## BR-028 — Project skill categories (four IDs only)

Each `projects/<id>/config.json` **`skills`** array must contain **only** site skill IDs:

- `plush`
- `electronic`
- `mechanical`
- `paintjob`

One or more per project; empty `[]` allowed. No legacy granular values (`sewing`, `electronics`, `cleaning`, etc.) in committed JSON. Normalize with `node scripts/normalize-project-skills.mjs`; see [`docs/project-skills.md`](project-skills.md). Site badges/filters: [`new/js/skills.js`](../new/js/skills.js). `validate-publish.mjs` rejects unknown skill IDs.

---

## BR-029 — Review `title` and `description` from images + metadata

After **T-00030** naming and **T-00033** `itemDetails`, many projects still have **auto-generated** `title` / `description` (skill-list stubs). Owner or agent should rewrite them using **repair photos**, **`itemDetails`**, and **`repairDetails`** (legacy **0004–0015** when present).

- **`title`:** short headline (≤500 chars), not identical to `projectName` alone.
- **`description`:** social/website lead (≤500 chars), not `ProjectName — sewing and cleaning` style stubs.
- **Exclude** projects already publish-ready: **0002**, **0003** (and any future IDs flagged by the review report).
- **0001:** description done; title may still need review.

Report: `node scripts/report-title-description-review.mjs` → [`docs/reports/`](reports/). Implementation: **T-00034**.

---

## BR-030 — Import owner metadata CSV and generate publish copy

After **T-00032** fill-in CSV is returned:

1. **Import** `repairDetails_FILL_IN` and `skills_FILL_IN` (and optional date columns) into matching `projects/<id>/config.json` rows.
2. **Polish** owner draft **`repairDetails`** into presentable website copy using the same tier budgets as **`itemDetails`** ([`scripts/lib/item-details-budget.mjs`](../scripts/lib/item-details-budget.mjs) — short / standard / full).
3. **Generate** **`description`** (≤500 chars, social/website lead) from **`projectName`**, **`itemDetails`**, polished **`repairDetails`**, and **`skills`** — not skill-list stubs.
4. **Normalize** **`skills`** to canonical IDs (see BR-028; after **T-00036**, `needlework` replaces `plush`).

Implementation: **T-00035**. Blocks **T-00034** description pass for CSV-filled projects; **T-00024** SEO should run after this.

---

## BR-031 — Rename skill category `plush` → `needlework`

Rename the fabric/sewing skill ID everywhere so site labels match workshop language:

- `projects/*/config.json` — `skills` arrays
- [`scripts/lib/normalize-skills.mjs`](../scripts/lib/normalize-skills.mjs), validation, export/import scripts
- [`new/js/skills.js`](../new/js/skills.js) — filters, badges, labels
- [`docs/project-skills.md`](project-skills.md), Cursor rules, story/gallery **HTML** that reference `plush` or “Plush”

Map legacy `plush` → `needlework`; keep `electronic`, `mechanical`, `paintjob`. Implementation: **T-00036** — **after T-00035** (so imported CSV skills are normalized once).

---

## BR-032 — Replace legacy homepage images (0004–0015)

Projects **0004–0015** still use **hero/images copied from the old website** (`images/` import, often edited or montaged). Replace with **authentic repair photos** from USB ingest, owner files, or new shoots — `before`, `after`, `hero`, `WIP-###` per README naming; run **T-00027** optimize after copy.

Implementation: **T-00037**. Depends on **T-00028** / owner supplying files; unrelated to CSV import except dating (**T-00031** / owner dates for **0004–0014**).

---

## BR-033 — Testimonials page refresh before go-live

Before **T-00016** cutover, owner updates [`new/testimonials.html`](../new/testimonials.html): current Google review count, featured quote excerpts (manual paste per **T-00023**), Maps CTA/links. **Last** marketing content task before the new site is published — not at initial **T-00020** build time.

Implementation: **T-00038**. Blocks cutover until done.

---

## BR-034 — On-demand project image rotation

When the owner pastes or uploads a repair photo that displays sideways (wrong EXIF orientation, or phone held portrait/landscape), rotate it **on explicit request** so it reads correctly on the site and in social crops — without re-running full USB ingest.

Implementation: **T-00039**. Uses **sharp** (same stack as **T-00027**). Respect `before` / `after` / `hero` / `WIP-###` filenames; update `projects-index.json` thumbnail paths if the file is renamed. **On-demand only** — no batch auto-rotate from EXIF unless the owner asks.
