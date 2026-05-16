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

- `add google review to 0003` — then paste reviewer name, text, optional [Google profile URL](https://www.google.com/maps/contrib/…), optional date
- `add google review` — paste only; **testimonials page only** (no project link)
- `update the review count on testimonials` (e.g. if no longer 32)

Do **not** rely on `refresh testimonials from Google` alone — Maps HTML is not a dependable source for full review text.

#### Workflow A — review for a specific repair (recommended)

When a customer’s Google review clearly belongs to a project (e.g. Donald Duck wind-up):

| Step | Where | What |
|------|--------|------|
| 1 | `projects/<folder>/config.json` | Set **`googleReview`** (source of truth) — see schema below |
| 2 | `projects/<folder>/index.html` | Blockquote **under the short summary** (`description`), matching wireframe |
| 3 | `new/testimonials.html` | Append a **featured quote card** (same text; link author to `profileUrl` if set). Optionally note “Repair: …” linking to `webpageUrl` when live |

**`googleReview` in `config.json`:**

```json
"googleReview": {
  "author": "Customer Name",
  "rating": 5,
  "text": "Paste the review exactly as on Google (trim only if too long for layout).",
  "date": "2026-05-16",
  "profileUrl": "https://www.google.com/maps/contrib/…",
  "featuredOnTestimonials": true
}
```

Use **`null`** when there is no review for that project. Omit `profileUrl` / `date` if unknown. Set **`featuredOnTestimonials": false`** to keep the review on the project page only (not on the global testimonials page).

#### Workflow B — general review (no project)

Examples: Guitar Hero guitars, TV remote — not tied to one repair folder.

1. Append quote card to `new/testimonials.html` only.
2. Do **not** add `googleReview` to a project `config.json`.

**Agent:** show diff for all touched files; **commit and push** only after you approve.

Keep the **Read all reviews on Google Maps** button for the full live list; keep **3–6 featured quotes** on the testimonials page and add more on demand.

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
