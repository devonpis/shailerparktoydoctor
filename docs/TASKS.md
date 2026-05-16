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
| T-00018 | Todo | Website rebuild: UI style polish (Prepbox, responsive) | BR-006, BR-015 |
| T-00019 | Done | Website rebuild: project story page wireframe & plan | BR-015 |
| T-00020 | Done | Website rebuild: testimonials page (build) | BR-006, BR-015 |
| T-00021 | Done | Website rebuild: testimonials page (plan) | BR-015 |
| T-00022 | Done | Website rebuild: contact page (legacy + Maps embed) | BR-006, BR-015 |
| T-00023 | Done | Google reviews: manual paste workflow (config + story + testimonials) | BR-015 |

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
| **Status** | Todo |
| **Requirements** | BR-006, BR-015 |
| **Goal** | Apply Prepbox block styling across `new/` pages: typography, borders, section rhythm, hero/services blocks; **mobile hamburger** nav; social icon styling; responsive pass (~375px+). **Owner:** final **colour tweaks** (e.g. secondary accent `#f5a623`) decided here, not in brief. |
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

## T-00016 — Website rebuild: promote `new/` to root (cutover)

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-006, BR-015 |
| **Goal** | After owner confirms the preview site: move `new/*` to site root (or equivalent promote); remove or archive legacy root HTML (`index.html`, `contact.html`, `reviews.html`, `index_bk.html`); drop preview banners and `noindex` on marketing pages; point nav/sitemap at production URLs; update `webpageUrl` in project configs; regenerate `sitemap.xml`. |
| **Depends on** | T-00018, T-00020, T-00022 (and T-00013 for story pages as needed); explicit owner approval for cutover. |
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
