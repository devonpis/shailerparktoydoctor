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
| T-00009 | Done | Website rebuild — analysis & direction (stack agreed) | BR-006, BR-015 |
| T-00010 | Done | New project + end-to-end publish validation | BR-013, BR-016 |
| T-00011 | Done | Extract legacy site repairs into `projects/` | BR-017 |
| T-00012 | Done | Website rebuild: visual design + SEO brief | BR-015 |
| T-00013 | Done | Website rebuild: site artifacts (JSON, templates, sitemap) | BR-015 |
| T-00014 | Done | Website rebuild: initial `new/` scaffold (split → T-00017–20) | BR-006, BR-015 |
| T-00015 | Done | Website rebuild: webpage go-live workflow (docs) | BR-004, BR-015 |
| T-00016 | Todo | Website rebuild: promote `new/` to root (cutover) | BR-006, BR-015 |
| T-00017 | Done | Website rebuild: scaffold sections & structure (`new/`) | BR-006, BR-015 |
| T-00018 | Done | Website rebuild: UI style polish (Prepbox, responsive) | BR-006, BR-015 |
| T-00019 | Done | Website rebuild: project story page wireframe & plan | BR-015 |
| T-00020 | Done | Website rebuild: testimonials page (build) | BR-006, BR-015 |
| T-00021 | Done | Website rebuild: testimonials page (plan) | BR-015 |
| T-00022 | Done | Website rebuild: contact page (legacy + Maps embed) | BR-006, BR-015 |
| T-00023 | Done | Google reviews: manual paste workflow (config + story + testimonials) | BR-015 |
| T-00024 | Todo | Website rebuild: SEO metadata completeness | BR-015 |
| T-00025 | Done | Scaffold project folders from CSV (duplicate merge) | BR-018, BR-019 |
| T-00026 | Done | Social publish: image cap + priority selection (WIP last) | BR-020, BR-012 |
| T-00027 | Done | Project image optimize (batch + on-demand, PNG→JPEG, HTML paths) | BR-021 |
| T-00028 | Done | USB photos: analyse, match projects, copy and rename | BR-022 |
| T-00029 | Done | Review ambiguous timesheet imports (e.g. Sandy, client rows) | BR-023 |
| T-00030 | Done | Project identity: product info, rename folder & metadata | BR-024 |
| T-00031 | Todo | Project dates from EXIF (oldest/newest image) | BR-025 |
| T-00032 | Todo | CSV metadata gap report for owner fill-in | BR-026 |

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
| **Status** | Done |
| **Requirements** | BR-006, BR-015 |
| **Outcome** | [`docs/website-rebuild-analysis.md`](website-rebuild-analysis.md) — baseline audit; **approach A agreed**: static HTML, Tailwind CDN, React CDN for `/repairs/` gallery only; **no** compile/bundle/CI build; repair pages in `projects/<folder>/index.html`; folder names `0001 - Name` unchanged. Options B/C not chosen. |
| **Follow-up** | T-00012 (brief) → T-00013 (artifacts) → T-00017–20 (`new/` build slices) → T-00016 (cutover) + T-00015 (workflow doc). |
| **Related** | T-00007, T-00008, T-00011 |

---

## T-00012 — Website rebuild: visual design + SEO brief

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-015 |
| **Outcome** | Owner **approved brief** (2026-05-16). [`docs/website-design-brief.md`](website-design-brief.md) — Prepbox (#33), brand colours/fonts, IA (nav, home sections, `/projects/` gallery, hybrid testimonials, footer links, responsive). |
| **Blocks** | T-00017–T-00020 (implementation slices) |

---

## T-00013 — Website rebuild: site artifacts (JSON, templates, sitemap)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-015 |
| **Outcome** | [`website-go-live.md`](website-go-live.md) workflow; `data/` + `new/data/projects-index.json` (schema with `projectName`, `thumbnail`); [`projects/0000 - template/index.html.example`](../projects/0000%20-%20template/index.html.example); **0003** story [`index.html`](../projects/0003%20-%20Donald%20Duck/index.html); `sitemap.xml`, `robots.txt`; gallery JS uses `projectName` + `thumbnail`. |
| **Depends on** | T-00009, T-00019 |
| **Related** | T-00016 updates story nav links at cutover |

---

## T-00014 — Website rebuild: initial `new/` scaffold (umbrella)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-006, BR-015 |
| **Outcome** | First pass under `new/` (commits `cd70da5`, `1567df7`). Work **split** into **T-00017–T-00020** for remaining build. |
| **Superseded by** | T-00017 (structure), T-00018 (polish), T-00019 (project page plan), T-00020 (testimonials) |

---

## T-00017 — Website rebuild: scaffold sections & structure (`new/`)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-006, BR-015 |
| **Outcome** | Preview site skeleton: shared header/footer pattern; home (hero, mission, Our Doctors, 3 featured placeholders, Projects CTA); `new/projects/` + `projects-index.json` + gallery script; `testimonials.html`, `contact.html` stubs. |
| **Depends on** | T-00012 |
| **Related** | T-00018–T-00020 refine each area |

---

## T-00018 — Website rebuild: UI style polish (Prepbox, responsive)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-006, BR-015 |
| **Goal** | Apply Prepbox block styling across `new/` pages: typography, borders, section rhythm, hero/services blocks; **mobile hamburger** nav; social icon styling; responsive pass (~375px+). **Owner:** final **colour tweaks** (e.g. secondary accent `#f5a623`) decided here, not in brief. |
| **Outcome** | Legacy-aligned `site.css` (primary `#4caac9`, Lobster/Nunito, h2 bands, block padding on prose); shared `includes/` + `site-chrome.js` on all `/new/` pages and project template; home patient stories + doctors/skills; skill filters on gallery; platform social icons; responsive hero, stacked nav ≤500px; Donald Duck story page styled. Follow-on (commits through `0db6fec`): info box, 768px mobile rules, testimonials masonry, project story tags/videos/prose, CTA sizing, project card title/date-only, contact grid stack. **Closed** — further preview tweaks are ad hoc or **T-00016** cutover. |
| **Depends on** | T-00012, T-00017 |
| **Out of scope** | Project story HTML (T-00013); contact Maps content (**T-00022**); cutover (T-00016) |

---

## T-00019 — Website rebuild: project story page wireframe & plan

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-015 |
| **Outcome** | [`docs/website-project-page-wireframe.md`](website-project-page-wireframe.md) — `title` = slogan, `projectName` = tile name, `endDate` only; thumbnail order; links under tags; gallery index schema; mobile v1. |
| **Depends on** | T-00012 |
| **Blocks** | T-00013 (HTML template should match wireframe) |
| **Example** | First implementation: **0003** Donald Duck |

---

## T-00021 — Website rebuild: testimonials page (plan)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-015 |
| **Outcome** | [`docs/website-testimonials-page-plan.md`](website-testimonials-page-plan.md) — hybrid (32× 5★, Maps CTA, 2–4 legacy quotes); optional map embed. |
| **Depends on** | T-00012 |
| **Blocks** | T-00020 |
| **Owner optional** | Which quotes to keep; add Maps iframe on testimonials page or CTA only. |

---

## T-00020 — Website rebuild: testimonials page (build)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-006, BR-015 |
| **Outcome** | [`new/testimonials.html`](../new/testimonials.html) — 32× 5★, Maps CTA, three legacy quote cards with Google contributor links; short note on why reviews are not auto-fetched. |
| **Depends on** | T-00021 |
| **Out of scope** | Places API / paid widgets (documented in plan) |

---

## T-00022 — Website rebuild: contact page (legacy + Maps embed)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-006, BR-015 |
| **Outcome** | [`new/contact.html`](../new/contact.html) — legacy intro + NAP, photos-for-quote note, appointment-only; two-column layout with Maps iframe + goo.gl fallback; `LocalBusiness` JSON-LD; shared `/new/` chrome. |
| **Depends on** | T-00012, T-00017 |
| **Related** | T-00018 (further polish) |

---

## T-00023 — Google reviews: manual paste workflow

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-015 |
| **Outcome** | Documented paste-in workflow ([`website-testimonials-page-plan.md`](website-testimonials-page-plan.md), README, wireframe). Template `googleReview` in [`projects/0000 - template/config.json`](../projects/0000%20-%20template/config.json) and story-page example block. Testimonials page notes `add google review` commands; auto-fetch from Maps deferred (unreliable on static site). |
| **Depends on** | T-00020, T-00021 |
| **Out of scope** | Applying a specific pasted review until owner provides text + project id |

---

## T-00024 — Website rebuild: SEO metadata completeness

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-015 |
| **Goal** | Close gaps vs [`website-design-brief.md`](website-design-brief.md) SEO checklist and [`website-project-page-wireframe.md`](website-project-page-wireframe.md) per-page SEO — so every **indexable** page has correct `<title>`, meta description, canonical, HTTPS Open Graph, and structured data where specified. |
| **Checklist** | **Marketing (`/new/` until cutover):** add `link rel="canonical"` and `og:title`, `og:description`, `og:image`, `og:url`, `og:type` on home, projects index, testimonials, contact (contact already has `LocalBusiness` JSON-LD — add same on home); keep `noindex` on preview until **T-00016**. **Project stories:** ensure template [`index.html.example`](../projects/0000%20-%20template/index.html.example) includes full OG block like [0003 Donald Duck](../projects/0003%20-%20Donald%20Duck/index.html); add `og:type` on story pages; verify title `{projectName} — Shailer Park Toy Doctor` and description ≤ ~160 chars for each DONE page. **Sitemap:** remove `/new/*` URLs (conflicts with `robots.txt` `Disallow: /new/`); list only public URLs; add production marketing paths after cutover. **Cutover (with T-00016):** remove `noindex` from marketing pages; canonicals and OG URLs use `https://sptoydoctor.com.au/` paths (not `/new/`). **Legacy root** (`index.html`, `contact.html`, `reviews.html`): fix `lang="en-AU"`, HTTPS Open Graph URLs, or archive at cutover. **Accessibility/SEO:** one primary `<h1>` per page (header site title vs page headline); image `alt` from project titles on story/gallery images. |
| **Depends on** | T-00012, T-00017, T-00019 |
| **Related** | T-00013 (sitemap), T-00016 (cutover + de-index preview), T-00022 (contact JSON-LD pattern) |
| **Out of scope** | Paid SEO tools; auto-generated meta from AI; changing project copy for keyword stuffing |

---

## T-00016 — Website rebuild: promote `new/` to root (cutover)

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-006, BR-015 |
| **Goal** | After owner confirms the preview site: move `new/*` to site root (or equivalent promote); remove or archive legacy root HTML (`index.html`, `contact.html`, `reviews.html`, `index_bk.html`); drop preview banners and `noindex` on marketing pages; point nav/sitemap at production URLs; update `webpageUrl` in project configs; regenerate `sitemap.xml`. |
| **Depends on** | T-00018, T-00020, T-00022 (and T-00013 for story pages as needed); explicit owner approval for cutover. |
| **Related** | T-00024 (complete SEO metadata; remove `noindex` and fix canonicals/OG at cutover) |
| **Out of scope** | Publishing social posts; changing project `status` to DONE. |

---

## T-00015 — Website rebuild: webpage go-live workflow (docs)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-004, BR-015 |
| **Outcome** | [`docs/website-go-live.md`](website-go-live.md) — checklist, `projects-index.json` schema, social vs site, preview vs cutover paths. Linked from README. |
| **Depends on** | T-00009 |
| **Related** | T-00007 (`--use-site` image paths unchanged), T-00013 |

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
| **Status** | Done |
| **Requirements** | BR-017 |
| **Outcome** | [`scripts/import-site-projects.mjs`](../scripts/import-site-projects.mjs) created **0004–0015** from [`index.html`](../index.html): four full patient stories + eight gallery items. Images copied from `images/` as `hero` (0014 also `after` for Tomy2). Full stories have shortened `description` (≤500) + full text in `repairDetails`. All imported as **`status: WIP`** with placeholder dates `2024-01-01` — owner should review copy, set real dates, add `before`/WIP photos if needed, then set **DONE** before publish. **0001–0003** untouched. |
| **Related** | T-00017–T-00020 (wire DONE projects into new site), T-00008 (`business-info.md` for tone/tags). |

---

## T-00025 — Scaffold project folders from CSV (duplicate merge)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-018, BR-019 |
| **Goal** | Add a repeatable way to create many `projects/<id> - <name>/` entries from a **CSV** file instead of hand-copying the template each time. |
| **CSV** | Document expected columns (minimum: **`id`** or auto-assign next free id, **`projectName`** or **`folder`**, optional `title`, `description`, `tags`, `skills`, `startDate`, `endDate`, `status`, `itemDetails`, `repairDetails`, image path hints). Provide an example file e.g. `docs/project-import.example.csv` or `data/project-import.example.csv`. |
| **Duplicates** | Before writing folders: group rows that refer to the **same repair** — e.g. duplicate `id`, duplicate normalized folder name, or rows flagged with a shared **`mergeKey`** column. **Merge** into one record: fill empty fields from later rows; if two rows disagree on the same field, log a **conflict** and keep the first non-empty (or require owner resolution in dry-run report). Never create two folders for one merged group. |
| **Script** | e.g. `scripts/scaffold-projects-from-csv.mjs` with `node scripts/scaffold-projects-from-csv.mjs <path.csv> [--dry-run] [--force-existing]`. Copy [`projects/0000 - template/config.json`](../projects/0000%20-%20template/config.json) defaults; set `isTemplate: false`. Do **not** create `index.html` or publish — scaffold only. |
| **Safety** | Default: **skip** folders that already exist; `--dry-run` prints planned creates/merges only. Optional `--force-existing` only with explicit owner use (document risk). Do not clobber **0001–0003** without confirmation. |
| **Privacy** | **No client PII** in generated `config.json` (no customer names, phones, emails from timesheet client rows). Allowed in repo: testimonial reviewer names + Google Maps / profile URLs per *client privacy* rule. |
| **Depends on** | T-00011 (prior import patterns in [`import-site-projects.mjs`](../scripts/import-site-projects.mjs)) |
| **Related** | T-00006 (`validate-publish.mjs` after owner fills content), T-00015 (go-live after `DONE`), README *Project management* |
| **Out of scope** | Auto-publishing; downloading images from URLs; AI rewrite of copy; merging unrelated repairs that only share a vague name (merge rules must be conservative + reported) |
| **Outcome** | [`scripts/scaffold-projects-from-csv.mjs`](../scripts/scaffold-projects-from-csv.mjs) with hybrid batch grouping (C), replication report, BR-019 privacy. Timesheet import: **62** folders **`0016`–`0077`** (skipped exact matches Donald Duck, Venom). Mattel + Teddy Bear joint jobs bundle sub-items. Review dates/copy/images per folder before `DONE` / publish. |

---

## T-00026 — Social publish: image cap + priority selection (WIP last)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-020, BR-012 |
| **Goal** | When a project has more images than the **cross-platform social cap**, publish only up to the limit using **hero → before → after → WIP** priority. **Webpage** publish remains unlimited. |
| **Cap** | **10** images per carousel (lowest of FB / IG / Threads for this repo’s unified flow; see BR-020). Centralize constant in [`scripts/lib/social-publish.mjs`](../scripts/lib/social-publish.mjs) / [`scripts/lib/project-media.mjs`](../scripts/lib/project-media.mjs). |
| **Selection** | `selectImagesForSocial()` (rules) + `selectImagesForSocialPublish()` — when &gt; cap: **`--pick-images auto`** uses OpenAI vision if `OPENAI_API_KEY`, else heuristic scoring; `--no-ai` / `rules` = hero → before → after → WIP. Story display order unchanged. |
| **Workflow** | Wired in [`scripts/publish-social.mjs`](../scripts/publish-social.mjs). **Dry-run** lists method, **included** vs **omitted**, and per-file notes. Shipped in `321c1a8`. |
| **Docs** | Extend [`docs/publish-content-guards.md`](publish-content-guards.md) with image-cap table and priority; update [`.cursor/rules/publish-content-guards.mdc`](../.cursor/rules/publish-content-guards.mdc) preview checklist. |
| **Depends on** | T-00006, T-00007 (existing publish stack) |
| **Related** | T-00027 (smaller files help Meta fetch; separate concern) |
| **Out of scope** | Changing webpage gallery limits; video carousel limits; per-platform different caps in one run |

---

## T-00027 — Project image optimize (batch + on-demand, PNG→JPEG, HTML paths)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-021 |
| **Goal** | One toolchain to **compress and normalize** repair images under `projects/`, with a **batch** mode for existing folders and **on-demand** mode after new files are added. |
| **Script** | e.g. `scripts/optimize-project-images.mjs` — `node scripts/optimize-project-images.mjs [--all \| <project-id-or-path>] [--dry-run] [--quality 85] [--max-width N]` (exact flags TBD). Loop convention files: `before`, `after`, `hero`, `WIP-###` (+ optional other gallery assets in the folder). |
| **PNG → JPEG** | PNG **&gt; 500 KB** → `.jpg` at 90%; scale to **1024×1024** when oversized; **delete** source PNG after success. |
| **Oversized raster** | JPEG / WebP / GIF **&gt; 500 KB** and **width or height &gt; 1024** → JPEG at 90%, scale to fit **1024×1024** (aspect preserved); delete source when extension changes. |
| **HTML / JSON** | After rename, update references in that project’s `index.html` (and any generated snippet paths in `new/data/projects-index.json` **thumbnail** fields if they point at renamed files). Report files changed. |
| **Workflow** | Document in [`docs/website-go-live.md`](website-go-live.md) as recommended **before** `publish … to webpage` (not required for social-only). README *Project management* — one-line pointer. |
| **Dependency** | Add a Node image library (e.g. **sharp**) as a dev dependency; document install in script header or README. |
| **Depends on** | T-00013 (story pages exist); optional before T-00016 cutover |
| **Related** | T-00026 (social cap is count, not bytes); T-00015 (go-live doc) |
| **Out of scope** | Optimizing site-wide `images/` marketing assets unless owner extends scope; auto-run on git commit; changing publish caption logic |

---

## T-00028 — USB photos: analyse, match projects, copy and rename

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-022 |
| **Outcome** | [`scripts/ingest-usb-photos.mjs`](../scripts/ingest-usb-photos.mjs), [`scripts/lib/usb-folder-map.mjs`](../scripts/lib/usb-folder-map.mjs), [`docs/usb-photo-ingest.md`](usb-photo-ingest.md). Ingested 430 images from owner USB (subfolders only; root loose ignored). Scaffolded **0078–0092** for uncaptured jobs; separate **Woody** / **Woody_2** / **Woody_n_Buzz** clients; nested **Bob_n_Spud/Yoshi** → 0057, **Kangaroo** → 0059. Dry-run report in [`docs/reports/`](reports/). Roles: filename hints + capture-time WIP order; optimized via T-00027 before commit. **T-00030** for placeholder renames. |
| **Goal** | Ingest repair photos from a **USB drive** (or folder path): detect which project each image belongs to, assign convention names (`before`, `after`, `hero`, `WIP-###`), and copy into the right `projects/<id> - <name>/` folder. |
| **Inputs** | Owner supplies mount path (e.g. `/Volumes/USB_NAME` or `D:\`). Script scans recursively for image files (`.jpg`, `.jpeg`, `.png`, `.heic`, …). **Read-only** on USB; write only under `projects/`. |
| **Matching** | **Timestamp:** EXIF capture time (fallback: file mtime), compared to each project’s `startDate`, `endDate`, and timesheet receive/repair windows in `config.json` / `repairDetails`. **Content:** classify or score images (before = damage/disassembly, after = finished, WIP = mid-repair, hero = best showcase) — vision model or documented heuristics; low-confidence matches flagged. **Name hints:** optional fuzzy match on folder names / `projectName` if USB uses job labels. |
| **Output naming** | Copy to `before.jpg`, `after.jpeg`, `hero.jpeg`, `WIP-001.jpeg`, etc. per README; skip or increment if file already exists unless `--overwrite`. Preserve extension or normalize per T-00027 later. |
| **Script / workflow** | e.g. `scripts/ingest-usb-photos.mjs <usb-path> [--dry-run] [--project 0027] [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--apply]` — default **dry-run** table: source path, date, guessed project, guessed role, target filename, confidence. **`--apply`** copies after owner reviews report (or separate confirm step in agent workflow). |
| **Docs** | Short guide in `docs/` (USB ingest): mount path, dry-run first, how to fix wrong matches, link to image naming in README. |
| **Privacy** | No customer names from USB paths in repo filenames; strip or ignore EXIF GPS if present; do not commit USB path or personal albums outside repair scope. |
| **Depends on** | T-00025 (project folders exist); optional T-00027 after copy |
| **Related** | T-00011 (legacy image copy patterns); `validate-publish.mjs` once images land |
| **Out of scope** | Deleting or renaming files on the USB; auto-publish; building `index.html`; matching photos to projects with no `config.json`; ingesting non-repair personal media without owner filter |

---

## T-00029 — Review ambiguous timesheet imports (e.g. Sandy, client rows)

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-023 |
| **Goal** | Owner reviews scaffolded projects that may be **client names**, **empty quote stubs**, or **mis-assigned** rows from the timesheet import — fix, rename, merge, or delete folders as needed. |
| **Outcome** | **`0054 - Sandy`** removed (client row, not a repair). **`0069 - Transformer BumbleBee`** kept — intentional job; `description` / `repairDetails` / `skills` set to electronics + mechanical; no photos yet. Prior merges: **`0023`** → **`0015`**; **`0007`** / **`0068`** Teddy Bear separate; dates via `fix-imported-dates.mjs`. Owner signed off remaining quote stubs 2026-05-17. |
| **Also done (ref)** | **`0023`** merged into **`0015`** (Anpanman reading pen). **`0007`** and **`0068`** Teddy Bear jobs kept separate. Invalid **`startDate`/`endDate`** repaired via `scripts/fix-imported-dates.mjs` + AU date parsing fix in scaffold script. |
| **Depends on** | T-00025 |
| **Out of scope** | Re-importing full CSV; auto-deleting folders without owner confirm |

---

## T-00030 — Project identity: fetch product info, rename folder & metadata

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-024 |
| **Goal** | For projects with placeholder names (USB ingest, CSV gaps, folders like `Godfy`, `Dog`, `anime figure`): identify the toy/product from photos and owner notes, then update `projectName`, folder `#### - Name`, and `config.json` fields (`title`, `description`, `itemDetails`, `tags`) — **owner confirm before rename** if ambiguous. |
| **Outcome** | Photo review + [`scripts/apply-project-identities.mjs`](../scripts/apply-project-identities.mjs) / [`scripts/lib/t30-project-identities.mjs`](../scripts/lib/t30-project-identities.mjs). Renamed **0078–0092** (15 USB scaffolds): e.g. Godfy → **Disney Pluto plush**, Brown_ribbon_dog → **Shaggy bunny plush**, polar_bear → **Vintage tan teddy bear**, Woody_n_Buzz → **Buzz Lightyear figure**. Report: [`docs/reports/t30-project-identities-2026-05-17.md`](reports/t30-project-identities-2026-05-17.md). |
| **Depends on** | T-00028 (images in folder help identification) |
| **Related** | T-00029 (timesheet cleanup); **T-00031** (EXIF dates); **T-00032** (owner CSV after this + T-00031) |
| **Out of scope** | Auto-publish; editing `index.html` unless requested |

---

## T-00031 — Project dates from EXIF (oldest / newest image)

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-025 |
| **Goal** | For each `projects/<id> - <name>/` folder with repair images, read **EXIF capture time** (fallback: `IMG_*` filename date, then file mtime). Set `config.json` **`startDate`** to the **oldest** image date and **`endDate`** to the **newest** (ISO `YYYY-MM-DD`) when dates are missing, placeholder, or clearly scaffold/USB defaults — **do not overwrite** trusted timesheet dates without `--force` or owner confirm. |
| **Script** | e.g. `scripts/set-project-dates-from-images.mjs [--dry-run] [--all \| <id>…] [--force]` — report per project: image count, min/max capture, current vs proposed dates. |
| **Depends on** | T-00028 (images present); optional after T-00027 (JPEG EXIF retained) |
| **Related** | T-00030; **T-00032** (CSV should use updated dates) |
| **Out of scope** | Changing `status`; GPS/PII in reports; editing non-`config.json` files |

---

## T-00032 — CSV metadata gap report for owner fill-in

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-026 |
| **Goal** | Export a **spreadsheet-friendly CSV** (for owner / wife) listing projects that need human input: empty or stub **`repairDetails`**, **`description`**, **`skills`**, **`tags`**, **`title`**, weak **`projectName`** (USB placeholders), and any row flagged after **T-00030** / **T-00031**. Include current values + blank or “FILL IN” columns for updates. No customer PII in export. |
| **Script** | e.g. `scripts/export-project-metadata-gaps.mjs [--output docs/reports/project-metadata-gaps-<date>.csv]` — optional `--import` later to merge filled CSV back into `config.json` (separate task or flag). |
| **Depends on** | **T-00030** (names stable enough to label rows); **T-00031** (dates populated from EXIF) |
| **Related** | T-00029 (timesheet cleanup); T-00028 ingest stubs |
| **Out of scope** | Auto-writing repair prose without owner; publish; HTML |
