# Project story page — wireframe & plan (T-00019)

**Status:** Approved plan (owner input 2026-05-16). Informs **T-00013** (`projects/<folder>/index.html` template).

**References:** [`website-design-brief.md`](website-design-brief.md) · [`website-rebuild-analysis.md`](website-rebuild-analysis.md) · [`TASKS.md`](TASKS.md)

**First build target:** [`projects/0003 - Donald Duck/`](../projects/0003%20-%20Donald%20Duck/)

---

## URL & scope

| Rule | Detail |
|------|--------|
| **URL** | `https://sptoydoctor.com.au/projects/<folder>/` — folder name unchanged (e.g. `0003 - Donald Duck`, encoded in links). |
| **File** | Static `index.html` inside the same folder as `config.json` and images. |
| **Visibility** | Only when `config.json` **`status`** is **`"DONE"`**. WIP projects must not have a public `index.html`. |
| **`webpageUrl`** | Set to the canonical story URL when the page goes live. |
| **Site depth** | **Two levels only:** marketing site → **Projects index** → **this story**. No deeper hierarchy. |

---

## Shared chrome

Match the rebuilt marketing site header/footer (see `/new/` preview until cutover):

- Logo → home  
- Nav: Projects · Testimonials · Contact · social icons  

**In-page navigation (story level only):**

```
[← All projects]     →  /projects/   (gallery index)
```

- Use the label **“← All projects”** (not breadcrumbs with project name as a middle crumb).  
- **No** prev/next project links on v1 — keeps navigation to two levels.  
- Story page `h1` = **`title`** (slogan); **`projectName`** is the real project label (see field map).

---

## Page sections (top → bottom)

Desktop wireframe (mobile = same order, stacked full-width):

```
┌─────────────────────────────────────────────────────────────┐
│  [Site header: logo | Projects | Testimonials | Contact | …] │
├─────────────────────────────────────────────────────────────┤
│  ← All projects                                              │
├─────────────────────────────────────────────────────────────┤
│  HERO — lead image (hero.* or fallback after.*)              │
├─────────────────────────────────────────────────────────────┤
│  H1: title (slogan / headline)                               │
│  H2 or lead: projectName                                     │
│  Date: endDate (AU format)                                   │
│  Tags: [chip] [chip]  +  links out (social / YouTube)        │
├─────────────────────────────────────────────────────────────┤
│  SHORT SUMMARY — description (shortened on-page if needed)   │
├─────────────────────────────────────────────────────────────┤
│  BEFORE / AFTER — two images (side-by-side md+, stack sm)    │
├─────────────────────────────────────────────────────────────┤
│  WIP GALLERY — WIP-001 … WIP-n (grid, chronological)         │
│  (omit section if no WIP-* files)                           │
├─────────────────────────────────────────────────────────────┤
│  VIDEO — YouTube embed(s)                                    │
├─────────────────────────────────────────────────────────────┤
│  FULL STORY                                                  │
│    · repairDetails (primary narrative)                       │
│    · itemDetails (below or subheading “About this item”)     │
├─────────────────────────────────────────────────────────────┤
├─────────────────────────────────────────────────────────────┤
│  CTA band — “Send photos for a quote” → /contact.html        │
├─────────────────────────────────────────────────────────────┤
│  [Site footer]                                               │
└─────────────────────────────────────────────────────────────┘
```

### Section notes (owner decisions)

| Section | Source | Rules |
|---------|--------|--------|
| **Hero** | Best “lead” image per [thumbnail priority](#thumbnail--hero-priority) | Full width, `object-cover`, max height ~400–480px desktop; `alt` = `projectName`. |
| **Title block** | `title`, `projectName`, `endDate`, `tags[]`, link fields | **`h1` = `title`** (slogan / headline, e.g. “Illco Donald Duck wind-up — gear repair”). **`projectName`** = actual project name (e.g. “Vintage Illco Donald Duck wind-up”) — show as prominent subheading (`h2` or styled lead). **Date:** **`endDate` only**, AU format (e.g. 6 May 2026). Tags as chips. **Links out** directly under tags (see below). |
| **Links out** | `facebookUrl`, `instagramUrl`, `threadUrl`, `youtubeUrl`, `youtubeShortUrl` | Row under tags: icons or text links; only non-null; `rel="noopener"`. YouTube here can duplicate embed section (link) or link only to Short if embedded below. |
| **Short summary** | `description` | Shortened **`description`** for intro; use as-is if already short. |
| **Photo sections** | `before.*`, `after.*`, `WIP-*` | Layout by [image count rules](#in-page-photo-layout-by-count); hero image not repeated if already used as hero. |
| **Video** | `youtubeUrl`, `youtubeShortUrl` | **Embed** via YouTube iframe. Primary: `youtubeUrl`. Second: `youtubeShortUrl` if set. Omit section if both null. |
| **Full story** | `repairDetails` then `itemDetails` | “The repair” then “About this item”; plain text → `<p>`. |
| **CTA** | — | Full-width band → contact. |

---

## `config.json` field map

| Field | Role | On story page | On gallery / tiles |
|-------|------|---------------|-------------------|
| **`title`** | **Slogan / headline** for the repair story | `h1` | Optional subtitle on card (smaller text under name) |
| **`projectName`** | **Actual project name** — primary human label | Subheading under `h1` | **Card title**, search, filtering |
| **`endDate`** | Completion date | **Only date shown** (AU format) | Shown on tile |
| `startDate` | Internal / publish workflow | Not shown on public page v1 | — |
| `tags` | Topics | Chips + search | Search / filter |
| `description` | Short blurb | Summary paragraph | — |
| `repairDetails`, `itemDetails` | Long copy | Full story | — |
| `youtubeUrl`, `youtubeShortUrl` | Video | Embeds + links under tags | — |
| `facebookUrl`, `instagramUrl`, `threadUrl` | Social | Links under tags | — |
| `webpageUrl` | Canonical URL | `<link rel="canonical">` when set | Tile `url` target |
| `status` | Gate | Must be `DONE` | Only `DONE` in gallery index |

**SEO `<title>` / OG:** prefer `{projectName} — Shailer Park Toy Doctor` or `{title} — {projectName}` (T-00013: use `projectName` in `<title>` if slogan alone is too cryptic).

---

## Thumbnail & hero priority

**One rule everywhere** (gallery tiles, home featured, story hero, OG image):

```
hero.*  →  after.*  →  before.*  →  WIP-001.*  (first WIP only for thumbnail)
```

- Resolve first existing file in that order (any of `.jpg` / `.jpeg` / `.png`).  
- **`projects-index.json`** field `thumbnail` (rename from `hero` in **T-00013**) stores the resolved path when the entry is added.  
- Story **hero** band uses the same resolved image.  
- Do not use the same file twice on the page if it is already the hero (e.g. if `after` is hero, skip `after` in before/after row).

### 0003 Donald Duck (today)

No `hero.*` or `before.*` → thumbnail & hero = **`after.png`**; WIP-001–005 in gallery section only.

---

## In-page photo layout (by count)

Count **before**, **after**, and **WIP** files only (exclude the image already used as hero).

| Count | Layout |
|-------|--------|
| **0** | No photo section (hero only). |
| **1** | Single centered image, max-width ~720px, caption from filename role. |
| **2** | Before/after row: 2 columns `md+`, stacked on mobile; labels “Before” / “After”. |
| **3–4** | 2×2 grid on `md+`, 1 column on mobile. |
| **5+** | Responsive grid: 2 cols `sm`, 3 cols `lg`; lazy-load; optional “Work in progress” subheading for WIP-only groups. |

WIP files always sorted `WIP-001`, `WIP-002`, …

---

## Images (folder conventions)

| Role | Pattern |
|------|---------|
| Hero (preferred) | `hero.*` |
| After | `after.*` |
| Before | `before.*` |
| WIP | `WIP-###.*` |

Discover by prefix; any image extension.

---

## YouTube embed

- Parse video ID from `youtubeUrl` / `youtubeShortUrl` (watch, shorts, youtu.be).  
- Responsive 16:9 wrapper (`aspect-video` in Tailwind).  
- `loading="lazy"` on iframe.  
- **No autoplay** with sound (accessibility / mobile data).

Example IDs for 0003:

- Full: `https://www.youtube.com/watch?v=hzypIr88ZwA` → embed `hzypIr88ZwA`  
- Short: `https://www.youtube.com/shorts/nYUmkOlOfT8` → embed `nYUmkOlOfT8`

---

## SEO (per page)

**Owner:** yes — include on every story page.

| Element | Source |
|---------|--------|
| `<title>` | `{projectName} — Shailer Park Toy Doctor` (or `{title} \| {projectName}` if slogan helps search) |
| `meta description` | Shortened `description` (≤ ~160 chars) |
| `link rel="canonical"` | `webpageUrl` or `https://sptoydoctor.com.au/projects/<folder>/` |
| `og:title`, `og:description`, `og:image` | `projectName`, summary, **thumbnail URL** (priority chain above) |
| `lang` | `en-AU` on `<html>` |

---

## Mobile (v1 — owner feedback welcome)

| Area | Choice |
|------|--------|
| **Layout** | Single column; no horizontal scroll. |
| **Hero** | Full viewport width; max-height ~50vh so first screen shows headline. |
| **Title block** | `h1` slogan → `projectName` → date → tags → link row (wrap icons). |
| **Before/after** | Always **stacked** on `< md` (even when side-by-side on desktop). |
| **WIP grid** | 1 column default; 2 columns from `sm:` (480px+). |
| **Video** | Full-width `aspect-video` embed. |
| **Touch** | “← All projects” and footer links ≥44px tap height. |
| **Nav** | Same header as desktop for v1 (hamburger when **T-00018** lands); no separate mobile menu on story pages only. |

---

## Gallery index — what it is

The **gallery index** is **not** your `projects/` folder listing on disk. It is the **curated list of DONE repairs** that powers the public **Projects** page (`/projects/` — today `/new/projects/` in preview).

| Piece | Purpose |
|-------|---------|
| **`data/projects-index.json`** | Small JSON array: one object per **published** repair. |
| **`/projects/index.html`** | React page reads that JSON and draws **searchable tiles**. |
| **Each entry** | Points visitors to the story URL (`/projects/<folder>/`) with thumbnail, name, date, tags. |

**When you finish a repair on the website:**

1. Set `status` to **`DONE`**.  
2. Add **`projects/<folder>/index.html`** (story page).  
3. **Add or update** a row in `projects-index.json` (manual or script in **T-00013**).  
4. Set **`webpageUrl`** in `config.json`.  

WIP folders stay **out** of the JSON so they never appear as tiles.

### Proposed `projects-index.json` entry (T-00013)

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

**Gallery search** (v1): match `projectName`, `tags`, and optionally `title` / slogan.

**Home featured ×3:** same `url` + `thumbnail`; owner picks which three IDs to highlight (later: `"featured": true` in JSON or a small `featured.json`).

---

## Relationship to gallery & home

| System | Link |
|--------|------|
| **Gallery index** | Tile → this story’s `url`; label = **`projectName`**. |
| **Home featured** | Same entries; three highlighted until real picks. |

---

## T-00013 deliverables (after this plan)

1. `projects/0000 - template/index.html.example` (or documented snippet) following this wireframe.  
2. First real page: **`projects/0003 - Donald Duck/index.html`** (owner approval before go-live / `webpageUrl`).  
3. Document in go-live workflow (**T-00015**): add index + update `projects-index.json` + sitemap.

---

## Open / deferred (v2)

- Prev/next project navigation.  
- Markdown in story fields.  
- Lightbox for WIP / before-after.  
- Auto-generate `index.html` from `config.json` (generator script — out of scope for static rebuild v1).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-16 | Initial wireframe; owner: two-level nav, ← All projects, summary from description, full story = repairDetails + itemDetails, YouTube embeds |
| 2026-05-16 | title = slogan, projectName = tile/filter name; endDate only; thumbnail order hero→after→before→WIP; links under tags; gallery index explained; mobile v1 |
