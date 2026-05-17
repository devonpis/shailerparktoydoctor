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

### 0. Webpage prep script (rotate + optimize + validate)

Recommended single entry point before authoring or updating **`index.html`**:

```bash
npm install   # once per machine (installs sharp)
node scripts/publish-webpage.mjs <id>              # process images → orientation check → validate
node scripts/publish-webpage.mjs <id> --dry-run      # preview only

# Fix sideways photos (EXIF + manual rotate + resize in **one encode** per file — avoids double JPEG loss):
node scripts/publish-webpage.mjs 0003 --rotate WIP-001.jpg --cw
node scripts/publish-webpage.mjs 0003 --rotate after.jpg --ccw --rotate before.jpg --180
node scripts/publish-webpage.mjs 0003 --no-exif-orient   # skip EXIF bake (default is on)
```

**Rotate only** (no optimize/validate):

```bash
node scripts/rotate-project-image.mjs <id> <filename> --cw | --ccw | --180
node scripts/rotate-project-image.mjs <id> --exif --all
```

**Batch EXIF + optional vision** (all projects):

```bash
node scripts/fix-project-image-orientation.mjs --all --exif-only
node scripts/fix-project-image-orientation.mjs --all --vision   # needs OPENAI_API_KEY
```

Rotation and resize share **one sharp pipeline** per file (`optimize-project-images.mjs` via `publish-webpage.mjs`), so you do not rotate then optimize separately (which would JPEG-compress twice). Orient-only files use `--orient-quality` 92; resize/convert uses 90%. The publish script does **not** create HTML — it prints a checklist for `index.html`, gallery index, `webpageUrl`, and `sitemap.xml`.

Agent flow for **`publish <id> to webpage`**: after owner confirms → run `publish-webpage.mjs` (with any `--rotate`; EXIF orient is on by default) → author/update **`index.html`** → gallery + sitemap + `webpageUrl` → commit/push when approved.

### 0b. Optimize project images (included in `publish-webpage.mjs`)

Or run the optimizer alone:

```bash
node scripts/optimize-project-images.mjs <id>   # resize/convert only (no EXIF unless flagged)
node scripts/optimize-project-images.mjs <id> --exif-orient   # EXIF + resize in one pass
node scripts/optimize-project-images.mjs --all --exif-orient  # batch EXIF bake
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

Home highlights use optional **`importance`** in each project’s **`config.json`** (not in this index): **higher number ranks higher** (lead + up to six tiles). See [`.cursor/rules/home-highlight-importance.mdc`](../.cursor/rules/home-highlight-importance.mdc).

---

## Social vs website

| Action | Command / step |
|--------|----------------|
| **Facebook / IG / Threads** | `publish 0003 to social media` → preview → confirm → `publish-social.mjs` |
| **Website story + gallery** | This doc; `node scripts/publish-webpage.mjs 0003` then HTML + index (or `publish 0003 to webpage` with agent) |
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
