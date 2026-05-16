# Website rebuild — analysis & direction (T-00009)

**Status:** **T-00009 Done** — stack and approach agreed (below). **No HTML** until **T-00012** brief is approved and **T-00014** build is explicitly requested.

**Goals you stated:**

- More **visually impressive** presentation  
- **Better SEO**  
- Rebuild (not just tweak) — direction to be agreed with you before build  

---

## Current state (brief)

| Area | Observation |
|------|-------------|
| **Stack** | Static HTML + inline styles + `css/style.css`; no build step |
| **Deploy** | GitHub Pages from `main` → [sptoydoctor.com.au](https://sptoydoctor.com.au/) — see [`github-pages-deploy.md`](github-pages-deploy.md) |
| **Content** | Marketing on `index.html`; `contact.html`, `reviews.html`; repair stories live in `projects/` but are **not** integrated into the public homepage yet |
| **SEO** | Basic `title` / `description` / OG tags on home; `lang=""` empty; mixed `http`/`https` in some OG URLs; limited structured data |
| **Visual** | Lobster + Nunito, teal accent `#4caac9`, polaroid-style image blocks; large inline `<style>` block on pages |
| **Mobile** | Viewport meta present; layout is mostly custom flex — needs audit in rebuild |

This is **not** a judgement of quality — it documents the baseline for rebuild planning.

---

## Proposed phases

| Phase | Deliverable | Your involvement |
|-------|-------------|------------------|
| **1. Analysis** (now) | This doc + [`business-info.md`](business-info.md) filled in | Answer questions below |
| **2. Direction** | Short “design + SEO brief” (1–2 pages): sitemap, mood, priorities | Approve brief |
| **3. Build** | New static HTML/CSS + CDN JS | Explicit **“build the site”** / `publish … to webpage` |
| **4. Content** | Wire `projects/` **DONE** stories into site | Per-project publish |

---

## Direction options (to discuss)

### A. Refresh static site (evolution)

- Keep GitHub Pages + plain HTML/CSS (or minimal JS).  
- New layout system, shared header/footer, remove inline styles.  
- Add project gallery fed manually or via small script from `projects/**/config.json`.  
- **Pros:** Simple deploy, matches current workflow. **Cons:** More manual HTML unless we add a generator.

### B. Static site generator (e.g. Eleventy, Astro)

- Build step produces `/_site` or `dist/` for Pages.  
- Templates for repair stories from `config.json` + images.  
- **Pros:** Scales with many repairs; DRY components. **Cons:** Adds Node build to CI; you learn one tool.

### C. Visual-first marketing site + separate “stories” section

- Bold homepage (hero, services, trust, CTA).  
- `/repairs/` or `/stories/` for DONE projects only (auto or semi-auto).  
- **Pros:** Matches publishing hub model. **Cons:** Larger initial build.

**Recommendation to discuss:** **B or C** if you expect many repair posts; **A** if you want the smallest change and only a handful of pages.

**Superseded:** Options **B** and **C** were not chosen; see **Agreed approach** below.

---

## Agreed approach (owner, 2026-05-16)

**Chosen: A — fully static site, no compile or bundling.**

| Principle | Decision |
|-----------|----------|
| **Deploy** | GitHub Pages from `main` — **no build step in GitHub Actions** |
| **Tooling** | **No** npm build, Vite, Webpack, Astro, Eleventy, Tailwind CLI, Babel, or local “compile” |
| **CSS** | [Tailwind CDN](https://cdn.tailwindcss.com) (+ optional hand-written `css/site.css`) |
| **JS** | Plain `.js` only; **React via CDN** (e.g. [esm.sh](https://esm.sh)) for `/repairs/` gallery only — optional [htm](https://esm.sh/htm@3) for readable templates **without** a bundler |
| **Marketing pages** | Static HTML from **Prepbox** Tailwind template ([FreeStack #33](https://freestacktemplates.io/tailwind/prepbox-ecommerce-vibrant_block-template)) — see [`website-design-brief.md`](website-design-brief.md) |
| **Repair stories** | One **static** `projects/<id> - <name>/index.html` per **DONE** project (same folder as `config.json` + images; filled from config + template) |
| **Projects gallery** | `projects/index.html` + `js/projects-gallery.js` (or equivalent) reads **`data/projects-index.json`** — tile index at `/projects/`; story pages at `/projects/<folder>/` |
| **Source of truth** | `projects/<id> - <name>/` holds **config**, **images**, and **public story HTML**; social publish `--use-site` image URLs unchanged (`/projects/<folder>/hero.jpg`) |
| **Scaling** | No generator script required; add HTML + JSON entry per DONE repair (agent can assist). Accept more copy-paste as catalog grows. |

**Explicitly out of scope for this rebuild:** Astro, CI build jobs, committed Tailwind build output, JSX build step, SPA-only repair pages (bad for SEO).

### File layout (target)

```
index.html, contact.html, testimonials.html, …
css/site.css                              optional extras
projects/index.html                       gallery index (React CDN + Tailwind CDN) — all DONE tiles
js/projects-gallery.js                    fetch + filter/grid (name TBD; preview used repairs-gallery.js)
data/projects-index.json                  DONE repairs: folder, title, tags, hero, url, featured (optional)
projects/<id> - <name>/
  config.json                             metadata (existing)
  hero.jpg, before.jpg, …                 images (existing)
  index.html                              public repair story (add when DONE / go-live on site)
```

**Preview (T-00014):** same structure under `new/` until **T-00016** cutover. See [`website-design-brief.md`](website-design-brief.md) for nav and home layout.

**Public repair URL:** `https://sptoydoctor.com.au/projects/<folder>/`  
Example: `https://sptoydoctor.com.au/projects/0003%20-%20Donald%20Duck/`  
Set `webpageUrl` in `config.json` to that canonical URL when `index.html` exists.

**`repairs-index.json` fields (draft):** `id`, `folder`, `title`, `tags`, `hero`, `url` (path to project folder), `endDate` — for gallery only; full story stays in each folder’s `index.html`.

---

## SEO priorities (draft)

1. **Local SEO** — Shailer Park / Brisbane southside wording, consistent NAP (name, address, phone) once in [`business-info.md`](business-info.md).  
2. **On-page** — Unique `title` / `meta description` per page; `lang="en-AU"`; canonical URLs; fix OG to HTTPS.  
3. **Structure** — Semantic headings (one `h1` per page), alt text on all repair images.  
4. **Schema** — `LocalBusiness` or `ProfessionalService` JSON-LD when contact details are confirmed.  
5. **Performance** — Compress images, modern formats (WebP), lazy-load galleries.  
6. **Content** — DONE repairs as indexable pages (titles + descriptions from project `config.json`).  

---

## Visual direction questions (for you)

Answer in chat or edit this section:

1. **Feel:** Playful toy hospital vs premium restoration studio vs friendly neighbourhood workshop?  
2. **Hero:** One big photo, before/after slider, or video loop (remember social video is separate for now)?  
3. **Colour:** Keep teal `#4caac9` or refresh palette?  
4. **Repair gallery:** Grid of cards linking to full stories — how many on homepage?  
5. **Trust:** Reviews prominent on home vs separate page?  
6. **CTA:** Call, Facebook message, contact form, or all?  

---

## Sitemap (owner IA, 2026-05-16)

```
/                     Home — hero, about/mission, Our Doctors, 3 featured projects, CTA → Projects
/projects/            Gallery index (all DONE projects as tiles)
/projects/<folder>/   Single repair story (`index.html` inside each DONE project folder)
/testimonials.html    Google reviews (static vs embed — owner TBD)
/contact.html         Contact & enquiry
```

Global header: logo → home; **Projects**, **Testimonials**, **Contact**; social icons (Facebook, Instagram, Threads, YouTube). **Mobile-first** responsive layout. Details: [`website-design-brief.md`](website-design-brief.md).

Folder name stays `{id} - {name}` (e.g. `0003 - Donald Duck`) — matches repo and publish scripts. **Owner (2026-05-16):** keep this format for now (no slug-only / kebab renames); rely on page `title` / meta / `h1` for SEO.

---

## Dependencies on other tasks

| Task | Relationship |
|------|----------------|
| **T-00008** | Business copy, SEO keywords, tone |
| **T-00007** | Local publish script (social) — separate from site deploy |
| **T-00002** | Deploy path documented |
| **T-00011** | Migrate homepage repair stories into `projects/` before or during rebuild |

---

## Next step (tracked in [`TASKS.md`](TASKS.md))

| Task | Work |
|------|------|
| ~~**T-00009**~~ | ~~Analysis & stack~~ — **Done** |
| ~~**T-00012**~~ | ~~Brief~~ — **Done** (approved) |
| **T-00013** | `projects-index` schema, repair `index.html` template (after **T-00019** wireframe), sitemap/robots |
| **T-00015** | Webpage go-live workflow doc |
| **T-00017** | ~~Scaffold `new/`~~ — **Done** |
| **T-00018** | UI style polish (Prepbox, hamburger, responsive) |
| ~~**T-00019**~~ | ~~Project story page wireframe~~ — **Done** ([`website-project-page-wireframe.md`](website-project-page-wireframe.md)) |
| ~~**T-00021**~~ | ~~Testimonials page plan~~ — **Done** |
| **T-00020** | Testimonials page build |
| ~~**T-00022**~~ | ~~Contact page~~ — **Done** (`new/contact.html`) |
| **T-00016** | Cutover `new/` → root (after build slices) |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-16 | Initial analysis doc (T-00009) |
| 2026-05-16 | Owner chose **approach A**: static HTML, Tailwind CDN, React CDN for repairs gallery only; no compile/bundle/CI build |
| 2026-05-16 | Repair **sub-pages live in `projects/<folder>/index.html`** (reuse project folders; gallery at `/repairs/`) |
| 2026-05-16 | **Folder names unchanged** (`0001 - Name` with spaces) — SEO via page content, not URL renames |
| 2026-05-16 | **T-00009 closed**; follow-ups **T-00012**–**T-00015** added to task list |
