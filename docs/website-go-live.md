# Website go-live workflow (T-00015)

How to put a **DONE** repair on the public website. This is **separate from social** publish (`publish 0003 to facebook`, etc.) — see [`publish-content-guards.md`](publish-content-guards.md) and README *Project management*.

**Story layout:** [`website-project-page-wireframe.md`](website-project-page-wireframe.md)  
**Preview site:** pages under [`new/`](../new/) until cutover (**T-00016**). Project stories always live at **`/projects/<folder>/`**.

---

## Prerequisites

| Check | Requirement |
|-------|-------------|
| **Status** | `config.json` → **`"status": "DONE"`** (you set this). |
| **Content** | `title`, `projectName`, `description`, `repairDetails`, images in folder. |
| **Validation** | `node scripts/validate-publish.mjs <id>` exits **0** (good practice before any publish). |
| **Explicit approval** | For agent work: `publish <id> to webpage` (or clear HTML request) → **preview** → your **yes**. |

**WIP:** Do **not** add `index.html` or a row in `projects-index.json`.

---

## Checklist (per DONE repair)

### 0. Optimize project images (recommended)

Before authoring or updating the story page, run the image optimizer so gallery and social loads stay fast:

```bash
npm install   # once per machine (installs sharp)
node scripts/optimize-project-images.mjs <id>   # e.g. 0003
# or batch: node scripts/optimize-project-images.mjs --all
```

- **PNG &gt; 500 KB** → `.jpg` at **90%**; scaled to fit **1024×1024** when width or height &gt; 1024; source **`.png` deleted** after success.
- **Other types** (JPEG, WebP, GIF) **&gt; 500 KB** and **width or height &gt; 1024 px** → JPEG at **90%**, scaled to fit inside a **1024×1024** box (aspect preserved); source removed when the filename changes.
- Renames (e.g. `after.png` → `after.jpg`) update that project’s **`index.html`** and **`projects-index.json`** thumbnail paths automatically.

Use `--dry-run` first to preview. Social-only publish can skip this step; **webpage** go-live should not.

### 1. Add the story page

Create **`projects/<folder>/index.html`** from [`projects/0000 - template/index.html.example`](../projects/0000%20-%20template/index.html.example).

- Copy fields from `config.json` (see wireframe field map).
- **Thumbnail / hero image:** first file found in order **hero → after → before → WIP-001** (any `.jpg` / `.jpeg` / `.png`).
- **`<title>`:** `{projectName} — Shailer Park Toy Doctor`
- **Nav (until T-00016 cutover):** “← All projects” → `/new/projects/`; site links → `/new/…`
- **After cutover:** update story page links to `/projects/`, `/contact.html`, etc. (or re-copy from an updated template).
- **Prose (`repairDetails`, `itemDetails`):** Rewrite as **readable paragraphs**, not one wall of text.
  - In **`config.json`**, separate paragraphs with a **blank line** (`\n\n` in the string).
  - In **`index.html`**, use **one `<p>` per paragraph** under “The repair” and “About this item”.
  - Typical split: problem → work done → outcome (repair); what it is → context → materials/market (item).
  - Keep `description` as the short lead above the gallery; long copy lives only in `repairDetails` / `itemDetails`.

**First reference implementation:** [`projects/0003 - Donald Duck/index.html`](../projects/0003%20-%20Donald%20Duck/index.html).

### 2. Register in the projects gallery

Add or update an entry in **`projects-index.json`** (see schema below).

| Phase | File path |
|-------|-----------|
| **Preview** (`/new/projects/` gallery) | [`new/data/projects-index.json`](../new/data/projects-index.json) |
| **After cutover** | [`data/projects-index.json`](../data/projects-index.json) at site root |

Keep both files **in sync** until **T-00016** removes `new/` prefix paths.

### 3. Set `webpageUrl`

In `projects/<folder>/config.json`:

```json
"webpageUrl": "https://sptoydoctor.com.au/projects/0003%20-%20Donald%20Duck/"
```

Use the real folder name; URL-encode spaces as `%20` in the stored URL.

### 4. Update sitemap

Edit [`sitemap.xml`](../sitemap.xml) at repo root:

- Add `<url><loc>https://sptoydoctor.com.au/projects/…/</loc></url>` for the story.
- Ensure marketing URLs (home, contact, testimonials, `/projects/` index) are listed when those pages are live.

Regenerate when adding pages; no CI — commit the XML.

### 5. Deploy

```bash
git add projects/ data/ new/data/ sitemap.xml   # only what changed
# commit with T-##### after owner approves
git push origin main
```

GitHub Pages rebuilds in a few minutes ([`github-pages-deploy.md`](github-pages-deploy.md)).

### 6. Verify

- Story: `https://sptoydoctor.com.au/projects/<folder>/`
- Gallery: `https://sptoydoctor.com.au/new/projects/` (preview) or `/projects/` after cutover
- Images load over HTTPS (social `--use-site` uses same paths)

---

## `projects-index.json` schema

Array of objects; **only DONE** repairs.

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Project id, e.g. `"0003"` |
| `folder` | yes | Folder name, e.g. `"0003 - Donald Duck"` |
| `projectName` | yes | **Tile title** and primary search label |
| `title` | no | Slogan; optional subtitle on card |
| `tags` | yes | String array for search/filter |
| `thumbnail` | yes | Path to thumb image (hero → after → before → WIP-001 rule) |
| `url` | yes | Story path, e.g. `/projects/0003%20-%20Donald%20Duck/` |
| `endDate` | yes | ISO date `YYYY-MM-DD`; shown on tile |

Example:

```json
{
  "id": "0003",
  "folder": "0003 - Donald Duck",
  "projectName": "Vintage Illco Donald Duck wind-up",
  "title": "Illco Donald Duck wind-up — gear repair",
  "tags": ["Vintage toy repair", "Donald Duck", "Wind-up toy"],
  "thumbnail": "/projects/0003%20-%20Donald%20Duck/after.png",
  "url": "/projects/0003%20-%20Donald%20Duck/",
  "endDate": "2026-05-06"
}
```

Optional later: `"featured": true` for home page highlights.

---

## Social vs website

| Action | Command / step |
|--------|----------------|
| **Facebook / IG / Threads** | `publish 0003 to social media` → preview → confirm → `publish-social.mjs` |
| **Website story + gallery** | This doc (or `publish 0003 to webpage` if you want agent-driven HTML) |
| **Both** | `publish 0003 to social media and webpage` |

Updating **`facebookUrl`** etc. does **not** replace adding `index.html` or the gallery row.

---

## Removing or demoting a page

- Set `status` back to **`WIP`** (your choice).
- Remove `projects/<folder>/index.html` (or stop linking).
- Remove entry from `projects-index.json`.
- Remove URL from `sitemap.xml`.
- Leave `webpageUrl` null or update if URL changed.

---

## Related tasks

| Task | Role |
|------|------|
| **T-00013** | Template, schema, sitemap/robots |
| **T-00016** | Promote `new/` → root; single `data/projects-index.json` |
