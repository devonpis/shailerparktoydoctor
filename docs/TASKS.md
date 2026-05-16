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
| T-00002 | Todo | Document GitHub Actions deploy + static site publish path | BR-001, BR-011 |
| T-00003 | Todo | Optional: generate site/project index from `projects/**/config.json` | BR-002, BR-004 |
| T-00004 | Todo | Repair story webpage template / section when owner requests HTML | BR-001, BR-002, BR-006 |
| T-00005 | Done | Meta local API: token & `.env` setup guide (FB / IG / Threads) | BR-007, BR-010 |

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
| **Status** | Todo |
| **Requirements** | BR-001, BR-011 |
| **Notes** | Owner: live site already updates on **commit + push** via existing Action. Capture workflow YAML path, branch, and any secrets **only** in GitHub repo settings (not in git). |

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
| **Notes** | Only implement when owner asks for HTML; use `config.json` URLs as `href`s. |

---

## T-00005 — Meta local API: token & `.env` setup

| Field | Value |
|-------|-------|
| **Status** | Done |
| **Requirements** | BR-007, BR-010 |
| **Outcome** | [`docs/meta-local-api-setup.md`](meta-local-api-setup.md), root [`.env.example`](../.env.example), `.env` entries in [`.gitignore`](../.gitignore). |
