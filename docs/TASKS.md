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
| T-00012 | In progress | Website rebuild: visual design + SEO brief | BR-015 |
| T-00013 | Todo | Website rebuild: site artifacts (JSON, templates, sitemap) | BR-015 |
| T-00014 | In progress | Website rebuild: marketing pages + repairs gallery (`new/`) | BR-006, BR-015 |
| T-00015 | Todo | Website rebuild: webpage go-live workflow (docs) | BR-004, BR-015 |
| T-00016 | Todo | Website rebuild: promote `new/` to root (cutover) | BR-006, BR-015 |

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
| **Follow-up** | T-00012 (brief) → T-00013 (artifacts) → T-00014 (build, owner says **build the site**) + T-00015 (workflow doc). |
| **Related** | T-00007, T-00008, T-00011 |

---

## T-00012 — Website rebuild: visual design + SEO brief

| Field | Value |
|-------|-------|
| **Status** | In progress |
| **Requirements** | BR-015 |
| **Goal** | Owner answers visual direction questions; picks template direction from [`docs/website-template-shortlist.md`](website-template-shortlist.md); agent produces [`docs/website-design-brief.md`](website-design-brief.md) (mood, hero, colours, homepage repair count, reviews/CTA placement). |
| **In progress** | Owner selected **Prepbox (#33)**; draft [`website-design-brief.md`](website-design-brief.md) ready for approval. |
| **Blocked by** | Owner **“approve brief”**; optional tweaks (teal vs Prepbox palette, reviews placement). |
| **Blocks** | T-00014 |

---

## T-00013 — Website rebuild: site artifacts (JSON, templates, sitemap)

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-015 |
| **Goal** | Committed scaffolding (no marketing HTML yet): `data/repairs-index.json` example/schema; `projects/0000 - template/index.html.example` (or doc snippet) for DONE repair pages; root `sitemap.xml` + `robots.txt` pattern documented. |
| **Depends on** | T-00009 (stack); brief helpful but not required for schema/template. |
| **Blocks** | T-00014 (implementation uses these) |

---

## T-00014 — Website rebuild: marketing pages + repairs gallery

| Field | Value |
|-------|-------|
| **Status** | In progress |
| **Requirements** | BR-006, BR-015 |
| **Goal** | New static site under **`new/`** only (preview at `/new/`): home, contact, reviews; `new/repairs/index.html` + `new/js/repairs-gallery.js` (React + htm via CDN); `new/data/repairs-index.json`; Tailwind CDN; shared header/footer; `lang="en-AU"`, LocalBusiness schema, HTTPS OG. Prepbox-inspired layout with Toy Doctor brand tokens. **Do not** edit root `index.html`, `contact.html`, `reviews.html` until **T-00016** cutover after owner approval. |
| **Depends on** | T-00012 (approved brief), T-00013 (artifacts); owner explicitly says **build the site**. |
| **Out of scope** | Automated generator; CI build; Astro/Next; root cutover (T-00016). |
| **Progress** | Scaffold: `new/index.html`, `new/contact.html`, `new/reviews.html`, `new/repairs/`, gallery script, example index entry for 0003. Full Prepbox sections + schema still TODO. |

---

## T-00016 — Website rebuild: promote `new/` to root (cutover)

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-006, BR-015 |
| **Goal** | After owner confirms the preview site: move `new/*` to site root (or equivalent promote); remove or archive legacy root HTML (`index.html`, `contact.html`, `reviews.html`, `index_bk.html`); drop preview banners and `noindex` on marketing pages; point nav/sitemap at production URLs; update `webpageUrl` in project configs; regenerate `sitemap.xml`. |
| **Depends on** | T-00014 (preview complete), explicit owner approval for cutover. |
| **Out of scope** | Publishing social posts; changing project `status` to DONE. |

---

## T-00015 — Website rebuild: webpage go-live workflow (docs)

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-004, BR-015 |
| **Goal** | Short doc (README section or `docs/website-go-live.md`): when `status` is DONE, add `projects/<folder>/index.html`, update `data/repairs-index.json`, set `webpageUrl`, regenerate sitemap; WIP must not have public `index.html`. |
| **Depends on** | T-00009; can complete in parallel with T-00012 / T-00013. |
| **Related** | T-00007 (`--use-site` image paths unchanged) |

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
| **Related** | T-00014 (wire DONE projects into new site), T-00008 (`business-info.md` for tone/tags). |
