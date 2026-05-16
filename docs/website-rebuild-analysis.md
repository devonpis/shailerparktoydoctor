# Website rebuild — analysis & direction (T-00009)

**Status:** Analysis / discussion — **no HTML changes** until you approve direction and explicitly request implementation (per project rules).

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
| **3. Build** | New HTML/CSS (or static generator) | Explicit “build the site” / `publish … to webpage` |
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

## Sitemap (proposal)

```
/                     Home — services, trust, latest repairs
/contact/             Contact & hours
/reviews/             Testimonials (or merged into home)
/repairs/             List of DONE projects (from config)
/repairs/<slug>/      Single repair story (optional per project)
```

Slug could come from project folder id + name, e.g. `0001-saielle-willow-tree`.

---

## Dependencies on other tasks

| Task | Relationship |
|------|----------------|
| **T-00008** | Business copy, SEO keywords, tone |
| **T-00007** | Local publish script (social) — separate from site deploy |
| **T-00002** | Deploy path documented |

---

## Next step

1. You fill key sections of [`business-info.md`](business-info.md).  
2. We agree **A / B / C** (or hybrid) and answer **visual direction questions**.  
3. Agent drafts a short **design + SEO brief** (still no HTML until you say build).  
4. New task or phase for implementation once brief is approved.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-16 | Initial analysis doc (T-00009) |
