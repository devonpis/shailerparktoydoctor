# GitHub Pages deploy (T-00002)

How the **live website** is published for **Shailer Park Toy Doctor**.

---

## Live site

| | |
|--|--|
| **URL** | https://sptoydoctor.com.au/ (also https://www.sptoydoctor.com.au/) |
| **Source** | This repository, branch **`main`**, site root **`/`** |
| **Custom domain** | `sptoydoctor.com.au` — see [`CNAME`](../CNAME) in repo root |
| **HTTPS** | Enforced by GitHub Pages |

Business site URL: **https://sptoydoctor.com.au/** — see [`business-info.md`](business-info.md) for all channel links.

---

## How deploy works

This repo uses **GitHub Pages** with the **legacy / built-in** Pages pipeline (not a custom workflow file in the repository).

1. You change static files (`index.html`, `css/`, images, etc.) — **only when you explicitly request HTML/site work** per project rules.
2. **Commit** and **push** to **`main`** (with your approval).
3. GitHub runs the managed workflow **`pages-build-deployment`** ([Actions tab](https://github.com/devonpis/shailerparktoydoctor/actions/workflows/pages/pages-build-deployment)).
4. GitHub Pages serves the updated site at **sptoydoctor.com.au**.

There is **no** `.github/workflows/*.yml` in this repo; deployment is configured in **GitHub repository settings**, not via a checked-in workflow you edit locally.

---

## Where to check / configure (GitHub UI)

Repo: **devonpis/shailerparktoydoctor**

1. **Settings → Pages**
   - Source: deploy from branch **`main`**, folder **`/ (root)`**
   - Custom domain: **sptoydoctor.com.au**
2. **Actions** → workflow **pages-build-deployment** — build status after each push to `main`
3. **Settings → Pages → Custom domain** — DNS must point at GitHub (already **built** / certificate **approved** as of setup)

Do **not** put deploy secrets in the repo; Pages for static HTML from `main` does not need repository secrets for basic hosting.

---

## “Publish webpage” in this project

For a repair project, **webpage publish** means:

1. Project passes [`validate-publish.mjs`](../scripts/validate-publish.mjs) and your explicit `publish <id> to webpage` + confirm flow.
2. Add or update site HTML (when you ask for HTML work).
3. **`git commit`** + **`git push`** to **`main`**.
4. After deploy, set **`webpageUrl`** in that project’s `config.json`.

Social channels use the **Meta local API** (see [`meta-local-api-setup.md`](meta-local-api-setup.md)), not GitHub Pages.

### Project images on the live site (Instagram / Threads)

Files under `projects/<folder>/` in this repo are served at:

`https://sptoydoctor.com.au/projects/<url-encoded-folder>/<filename>`

Example: [`…/0001%20-%20Saielle%20of%20the%20Willow%20Tree/after.jpeg`](https://sptoydoctor.com.au/projects/0001%20-%20Saielle%20of%20the%20Willow%20Tree/after.jpeg)

**Order for IG/Threads image posts:**

1. Commit and **push** `main` (includes new/updated images under `projects/…`).
2. Run `node scripts/publish-social.mjs <id> --target instagram|threads|all --use-site --wait-for-site` — polls every **5s** until **all** project images (`before`, `after`, `hero`, `WIP-*`) return HTTP OK (default max **5 min**; override with `--wait-for-site 600`).

Facebook Page posts can upload the **local file** and do not require the site URL first.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Site not updating after push | Actions → **pages-build-deployment** failed? Wait a few minutes; hard-refresh browser. |
| Wrong branch | Pages must track **`main`** (or whichever branch you configured). |
| 404 on deep links | Static site: only files that exist in the repo are served; add HTML or use client-side routing if you introduce it later. |

---

## References

- [GitHub Pages documentation](https://docs.github.com/en/pages)
- Repo Actions: https://github.com/devonpis/shailerparktoydoctor/actions
