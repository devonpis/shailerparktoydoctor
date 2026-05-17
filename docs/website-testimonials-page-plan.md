# Testimonials page — plan (T-00021)

**Status:** Plan for owner review; implementation in **T-00020**.

**References:** [`website-design-brief.md`](website-design-brief.md) (Testimonials section) · Legacy [`reviews.html`](../reviews.html) · [`business-info.md`](business-info.md)

---

## Goal

`/new/testimonials.html` (→ `/testimonials.html` at cutover): build trust with **Google Maps reputation**, without a paid review widget or Places API.

---

## Approach: hybrid (v1)

| Layer | Content |
|-------|---------|
| **Headline** | What our customers say (or similar) |
| **Trust line** | **32 Google reviews, all 5 stars** |
| **Primary CTA** | Button → [Google Maps listing](https://maps.app.goo.gl/Yx6zSEhhyDuv6geB8) (“Read all reviews on Google Maps”) |
| **Static quotes** | **2–4 excerpts** copied from legacy `reviews.html` (attributed; link reviewer name to Maps profile where legacy did) |
| **Optional** | Small Maps **embed** (same as contact — place card); owner can skip if redundant with CTA |

**Not v1:** Elfsight / EmbedSocial; Places API feed; auto-sync of all 32 reviews.

### Can we fetch reviews from Google Maps?

| Approach | Feasible? | Notes |
|----------|-----------|--------|
| **Copy quotes into HTML** (v1) | Yes | What we ship; update manually when you want new excerpts on the site. |
| **Google Places API** | Partial | Returns **up to ~5** reviews per request; needs API key, Google Cloud billing, ToS compliance, and a server or build step (not ideal for static GitHub Pages only). |
| **Maps embed iframe** | Partial | Shows the **place**, not all review text on your page. |
| **Third-party widget** | Yes | Paid services (Elfsight, etc.) pull reviews into an iframe/script. |
| **Scraping Maps** | No | Against Google terms; brittle and can break. |

**Conclusion:** For this repo (static site, no CI), **hybrid + link to Maps** is the right default. Full auto-fetch of all 32 reviews is not practical without API cost or a paid widget.

### Maintaining testimonials (manual paste — no auto-sync)

The site does **not** fetch reviews in real time. **Paste the review text in chat** (most reliable). Example commands:

- `add google review to 0003` — map project, then run apply script (below)
- `add google review` — paste only; add to `data/testimonials-standalone.json` + sync
- `update the review count on testimonials` (e.g. change intro line via `--intro`)

Do **not** rely on `refresh testimonials from Google` alone — Maps HTML is not a dependable source for full review text.

#### Automated follow-up (recommended)

When processing a batch of new reviews, **check `new/testimonials.html` first** (or let the apply script check): if that quote (or profile URL + quote) is already on the page, **skip** it. Use `--force` on apply to override. Store **first name + last initial** in `authorName` only (e.g. `Howard C.` — never full surname in repo). Apply script converts a pasted Google name automatically.

After you map a review to a project id:

```bash
node scripts/apply-google-review.mjs <project-id> \
  --author "Reviewer Full Name" \
  --quote "Paste review text from Google." \
  [--profile-url "https://www.google.com/maps/contrib/…"]
```

This updates, in order:

1. `projects/<folder>/config.json` — **`googleReview`**
2. `projects/<folder>/index.html` — regen with `--force` **if** `index.html` already exists
3. `new/testimonials.html` — full rebuild from all project reviews + standalone list

Rebuild testimonials only:

```bash
node scripts/sync-testimonials-html.mjs
```

Refresh every mapped project + testimonials:

```bash
node scripts/apply-google-review.mjs --sync-all
```

Cursor rule: [`.cursor/rules/google-review-testimonial-workflow.mdc`](../.cursor/rules/google-review-testimonial-workflow.mdc).

#### Workflow A — review for a specific repair

| Step | Where | What |
|------|--------|------|
| 0 | `new/testimonials.html` | If review already on page → skip (apply script does this by default) |
| 1 | Map | Agent matches review → project id (owner can correct) |
| 2 | `config.json` | **`googleReview`** (source of truth) — see schema below |
| 3 | `index.html` | Blockquote under summary — via scaffold when page exists |
| 4 | `new/testimonials.html` | Quote card; **Repair: …** link when `webpageUrl` or `index.html` exists |
| 5 | Webpage release | **`publish-webpage.mjs`** syncs **`project-review`** on `index.html` + rebuilds testimonials repair link when story is live |

**`googleReview` in `config.json`:**

```json
"googleReview": {
  "quote": "Paste the review exactly as on Google (trim only if too long for layout).",
  "authorName": "Howard C.",
  "profileUrl": "https://www.google.com/maps/contrib/…",
  "featuredOnTestimonials": true,
  "featuredOrder": 53
}
```

Use **`null`** when there is no review. Set **`featuredOnTestimonials": false`** to keep the review on the project story only. Optional **`featuredOrder`** (higher = higher on testimonials page; default sort is project id).

#### Workflow B — general review (no project)

Examples: TV remote, pepper grinder — not tied to one repair folder.

1. Add entry to **`data/testimonials-standalone.json`**
2. Run **`node scripts/sync-testimonials-html.mjs`**
3. Do **not** add `googleReview` to a project `config.json`.

**Agent:** show mapping + script output; **commit and push** only after you approve.

Keep the **Read all reviews on Google Maps** button for the full live list; featured quote cards are rebuilt from config + standalone data.

---

## Page structure (top → bottom)

1. Site header (shared)  
2. `h1` — Testimonials / What our customers say  
3. Star line + Maps CTA  
4. Quote cards (legacy copy, shortened if needed for layout)  
5. Optional Maps iframe  
6. Footer (compact + `Projects · Testimonials · Contact`)

---

## Content source

| Source | Use |
|--------|-----|
| Legacy `reviews.html` | Mark Lakisoe, Hikaru Button, etc. — owner may trim count |
| `business-info.md` | 32× 5★, Maps URL |

**Owner input (optional):** Which quotes to keep vs drop; whether to add map embed on this page (in addition to contact).

---

## SEO

| Element | Value |
|---------|--------|
| `<title>` | `Testimonials — Shailer Park Toy Doctor` |
| `meta description` | 32 five-star Google reviews; toy repair Shailer Park |

---

## Dependencies

- **T-00012** — hybrid approach approved  
- **T-00018** — shared chrome (build can follow polish)  
- **Blocks** → **T-00020** (implementation)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-16 | Initial plan; hybrid + legacy quotes |
