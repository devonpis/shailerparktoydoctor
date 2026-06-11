# Website go-live workflow (T-00015)

How to put a **DONE** repair on the public website. This is **separate from social** publish (`publish 0003 to facebook`, etc.) — see [`publish-content-guards.md`](publish-content-guards.md) and README *Project management*.

**Story layout:** [`website-project-page-wireframe.md`](website-project-page-wireframe.md)  
**Live site:** marketing pages at site root (`/`, `/projects/`, `/testimonials.html`, `/contact.html`). Project stories at **`/projects/<folder>/`**. Legacy preview removed (**T-00016** done).

---

## Prerequisites

| Check | Requirement |
|-------|-------------|
| **Status** | Set **`"status": "DONE"`** only after `node scripts/validate-done-readiness.mjs <id>` passes (or `node scripts/set-project-status.mjs <id> --status DONE`). |
| **Content** | Presentable `projectName`, `title`, `description`, `itemDetails`, `repairDetails`, canonical `skills`, ≥1 image — enforced by readiness script. |
| **Validation** | `node scripts/validate-publish.mjs <id>` before social; `publish-webpage.mjs` blocks if not **DONE**. |
| **Explicit approval** | For agent work: `publish <id> to webpage` (or clear HTML request) → **preview** → your **yes**. |

**WIP:** Do **not** add `index.html` or a row in `projects-index.json`.

---

## Checklist (per DONE repair)

### 0. Webpage prep script (rotate + optimize + validate)

Recommended single entry point before authoring or updating **`index.html`**:

```bash
npm install   # once per machine (installs sharp)
node scripts/validate-done-readiness.mjs <id>      # before setting status DONE
node scripts/set-project-status.mjs <id> --status DONE   # optional; enforces readiness
node scripts/publish-webpage.mjs <id>              # requires DONE; images → validate → SEO meta
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

Rotation and resize share **one sharp pipeline** per file (`optimize-project-images.mjs` via `publish-webpage.mjs`), so you do not rotate then optimize separately (which would JPEG-compress twice). Orient-only files use `--orient-quality` 92; resize/convert uses 90%.

**Manual renames:** If you edited filenames in `projects/<folder>/` yourself, run **`node scripts/sync-project-story-images.mjs <id>`** — HTML only. **Do not** run **`normalize-project-media-names.mjs`** unless you want automatic capture-time renaming. See [`.cursor/rules/project-images-manual-rename.mdc`](../.cursor/rules/project-images-manual-rename.mdc).

**`publish-webpage.mjs`** (T-00024 story SEO): if **`index.html`** is missing, runs **`scaffold-project-story-html.mjs`** first (body + head tags from `config.json`). On existing pages, syncs the **Work in progress** gallery (before → WIP → after, excludes `hero.*` only). Then syncs **SEO meta** from current images: `<title>`, meta description, canonical, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`), and **project-hero** (`hero` → `after` → `WIP-001` → `before`). Sets **`webpageUrl`** in config if empty. Use `--no-meta` to skip. Edit prose in `config.json` (`repairDetails`, `itemDetails`) before scaffold, or hand-edit `index.html` after (re-run publish to refresh meta/hero only).

Agent flow for **`publish <id> to webpage`**: after owner confirms → `publish-webpage.mjs` (images + validate + scaffold if needed + SEO meta) → **`sync-testimonials-html.mjs`** when the project has **`googleReview`** and a live story URL (`webpageUrl` or `index.html`) so the testimonials quote card gets a **Repair:** link → **`sync-projects-gallery-index.mjs <id>`** (updates `data/projects-index.json` **and** rebakes pre-rendered tiles in **`projects/index.html`**) → sitemap → commit/push when approved. New story scaffolds include **static** header/footer from `includes/` (no `site-chrome.js`). After editing `includes/site-header.html`, `site-footer.html`, or `social-icons.html`, run **`node scripts/sync-site-chrome.mjs`**. Optional: `scaffold-project-story-html.mjs <id> --force` to regenerate body from config without re-optimizing images.

**Google review (required for testimonials):** `publish-webpage.mjs` does **not** invent reviews. If `config.json` has **`googleReview": null`**, the story page will have **no** review block and **`new/testimonials.html` will not** get a card for that repair (checklist shows `[ ] googleReview + testimonials`). After you map a Google review, run:

```bash
node scripts/apply-google-review.mjs <id> --author "…" --quote "…" [--profile-url "…"]
```

That updates config, syncs the story `project-review` block, and rebuilds testimonials (with **Repair:** link when the story is live).

**Google review on story + testimonials:** When `googleReview` is set, `publish-webpage.mjs` (before release):

1. **Story** — inserts or updates **`<blockquote class="project-review">`** on `index.html` from config (`--no-story-review` to skip). New scaffolds include it automatically.
2. **Testimonials** — runs `sync-testimonials-html.mjs` when the story is live, adding **Repair: {title}** on that quote card (`--no-testimonials` to skip).

See [`website-testimonials-page-plan.md`](website-testimonials-page-plan.md).

### 0b. Optimize project images (included in `publish-webpage.mjs`)

Or run the optimizer alone:

```bash
node scripts/optimize-project-images.mjs <id>   # resize/convert only (no EXIF unless flagged)
node scripts/optimize-project-images.mjs <id>                 # EXIF + resize in one pass (default)
node scripts/optimize-project-images.mjs --all              # batch optimize (EXIF baked by default)
node scripts/optimize-project-images.mjs <id> --no-exif-orient   # skip EXIF bake (rare)
```

- **PNG &gt; 500 KB** → `.jpg` at **90%**; scaled to fit **1024×1024** when width or height &gt; 1024; source **`.png` deleted** after success.
- **Other types** (JPEG, WebP, GIF) **&gt; 500 KB** and **width or height &gt; 1024 px** → JPEG at **90%**, scaled to fit inside a **1024×1024** box (aspect preserved); source removed when the filename changes.
- Renames (e.g. `after.png` → `after.jpg`) update that project’s **`index.html`** and **`projects-index.json`** thumbnail paths automatically.

Use `--dry-run` first to preview. Social-only publish can skip this step; **webpage** go-live should not.

### 1. Add the story page

Create **`projects/<folder>/index.html`** from [`projects/0000 - template/index.html.example`](../projects/0000%20-%20template/index.html.example) (optional sections: google review, **Work in progress** gallery, videos — see template comments). **`googleReview`** shape: [`googleReview.example.json`](../projects/0000%20-%20template/googleReview.example.json).

**Work in progress** gallery (scaffold / `scaffold-project-story-html.mjs --force`): all repair images except `hero.*`, ordered **before → WIP-### → after** (before/after appear even when used as the page hero). Section omitted when there is nothing to show.

- Copy fields from `config.json` (see wireframe field map).
- **Thumbnail / hero image:** first file found in order **hero → after → WIP-001 → before** (any `.jpg` / `.jpeg` / `.png`).
- **`<title>`:** `{projectName} — Shailer Park Toy Doctor`
- **Nav (until T-00016 cutover):** “← All projects” → `/new/projects/`; site links → `/new/…`
- **After cutover:** update story page links to `/projects/`, `/contact.html`, etc. (or re-copy from an updated template).
- **Prose (`repairDetails`, `itemDetails`):** Rewrite as **readable paragraphs**, not one wall of text.
  - In **`config.json`**, separate paragraphs with a **blank line** (`\n\n` in the string).
  - In **`index.html`**, use **one `<p>` per paragraph** under “The repair” and “About this item”.
  - Typical split: problem → work done → outcome (repair); what it is → context → materials/market (item).
  - Keep `description` as the short lead above the gallery; long copy lives only in `repairDetails` / `itemDetails`.
  - When the owner supplies **`repairDetails`** (chat or CSV), **update `title` and `description` in the same edit** — slogan-style title plus a one- or two-sentence outcome lead derived from the repair story (see **T-00042**).

**First reference implementation:** [`projects/0003 - Donald Duck/index.html`](../projects/0003%20-%20Donald%20Duck/index.html).

### 2. Register in the projects gallery

Run **`node scripts/sync-projects-gallery-index.mjs <id>`** (or `--all`). This:

1. Adds or updates the row in **`data/projects-index.json`** (used by home highlights / featured scripts).
2. Rebakes **pre-rendered** project cards inside **`projects/index.html`** between `<!-- sync-projects-gallery:start -->` … `<!-- sync-projects-gallery:end -->`**.

Skill filtering on `/projects/` stays client-side ([`js/projects-gallery.js`](../js/projects-gallery.js) shows/hides baked tiles; no JSON fetch for the grid).

To refresh gallery HTML only (after hand-editing JSON): **`node scripts/sync-projects-gallery-index.mjs --html-only`**.

### 3. Set `webpageUrl`

In `projects/<folder>/config.json`:

```json
"webpageUrl": "https://sptoydoctor.com.au/projects/0003%20-%20Donald%20Duck/"
```

Use the real folder name; URL-encode spaces as `%20` in the stored URL.

### 3b. Google review on story page and testimonials

If `config.json` has **`googleReview`**:

**Story page** — handled by `publish-webpage.mjs` (syncs `<blockquote class="project-review">` from config). **`apply-google-review.mjs`** does the same when `index.html` already exists.

**Testimonials** — when the story page is live:

```bash
node scripts/sync-testimonials-html.mjs
```

`publish-webpage.mjs` does this step for you when `index.html` / `webpageUrl` exist. The matching quote card on **`new/testimonials.html`** gets a **Repair:** link to this project.

Skip with `publish-webpage.mjs --no-testimonials`. Reviews with no repair page stay on the card without a repair link until the story is published.

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
| `endDate` | yes | ISO `YYYY-MM-DD` in JSON (from `config.json`); **display** on gallery tiles and story pages as AU long date (e.g. `6 May 2026`) |

### Projects gallery (`/projects/`)

[`scripts/lib/projects-gallery-html.mjs`](../scripts/lib/projects-gallery-html.mjs) (via `sync-projects-gallery-index.mjs`) bakes tiles into [`projects/index.html`](../projects/index.html):

- **Sort:** `endDate` descending (newest repair first); tie-break by project `id` descending.
- **Tile date:** `endDate` only, formatted with `en-AU` long date — same convention as story `<p class="project-meta">` from [`scaffold-project-story-html.mjs`](../scripts/scaffold-project-story-html.mjs).
- **Skills:** each card has `data-skills` for filter buttons; [`js/projects-gallery.js`](../js/projects-gallery.js) toggles visibility only (same layout and filter bar as before).

Home highlight tiles do not show dates (ranked by `importance` in `config.json`). Social “oldest unpublished” picks use **`endDate`**, not project id.

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
