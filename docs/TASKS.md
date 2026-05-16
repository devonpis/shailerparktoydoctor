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
| T-00003 | Todo | Optional: generate site/project index from `projects/**/config.json` | BR-002, BR-004 |
| T-00004 | Todo | Repair story webpage template / section when owner requests HTML | BR-001, BR-002, BR-006 |
| T-00005 | Done | Meta local API: token & `.env` setup guide (FB / IG / Threads) | BR-007, BR-010 |
| T-00006 | Done | Publish content guards (validation script, limits, rules) | BR-005, BR-012 |
| T-00007 | Todo | Local publish script (Facebook, Instagram, Threads) | BR-001, BR-010, BR-012, BR-013 |
| T-00008 | In progress | Collect business info doc for future web content / SEO | BR-014 |
| T-00009 | In progress | Website rebuild — analysis & direction (discuss before build) | BR-006, BR-015 |

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

## T-00003 — Project index from config (optional)

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-002, BR-004 |
| **Notes** | Script or build step to list repairs from JSON; respect `status` and URLs for links. |

---

## T-00004 — Repair story webpage template

| Field | Value |
|-------|-------|
| **Status** | Todo |
| **Requirements** | BR-001, BR-002, BR-006 |
| **Notes** | Only implement when owner asks for HTML; use `config.json` URLs as `href`s. May merge into T-00009 rebuild. |

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
| **Status** | Todo |
| **Requirements** | BR-001, BR-010, BR-012, BR-013 |
| **Scope** | Node script(s) under `scripts/` reading `.env` + `projects/<id>/config.json`; run `validate-publish.mjs` first; post **images** to Facebook Page, Instagram, Threads; write back permalinks to `config.json` after owner confirm. |
| **Out of scope (for now)** | Video publish to social; automated webpage deploy (still commit + push). |
| **Depends on** | Tokens in `.env`; explicit `publish <id> to …` + preview + confirm. |

---

## T-00008 — Collect business info doc

| Field | Value |
|-------|-------|
| **Status** | In progress |
| **Requirements** | BR-014 |
| **Outcome** | [`docs/business-info.md`](business-info.md) — owner fills contact, services, tone, SEO keywords, trust signals. |
| **Next** | Owner completes tables and Q&A; mark **Done** when baseline is usable for copy/SEO. |

---

## T-00009 — Website rebuild (analysis & direction)

| Field | Value |
|-------|-------|
| **Status** | In progress |
| **Requirements** | BR-006, BR-015 |
| **Outcome** | [`docs/website-rebuild-analysis.md`](website-rebuild-analysis.md) — current state, options A/B/C, SEO/visual questions. |
| **Next** | Discuss direction in chat; agree brief; **no HTML** until owner approves build. |
| **Related** | T-00004, T-00003, T-00008 |
