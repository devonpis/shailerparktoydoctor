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

### Maintaining testimonials (on demand — no auto-sync)

The site does **not** fetch reviews in real time. When you want the static page updated, ask the agent explicitly, for example:

- `refresh testimonials from Google`
- `update testimonials page — add this review: …` (paste text)
- `update the review count on testimonials` (e.g. if no longer 32)

**Agent will:**

1. Read your [Google Maps listing](https://maps.app.goo.gl/Yx6zSEhhyDuv6geB8) or use text you provide (pasting is most reliable).
2. Edit `new/testimonials.html` (after **T-00016** cutover: `testimonials.html` at site root) — rating line, quote cards, contributor links.
3. Show you the diff; **commit and push** only after you approve.

Keep the **Read all reviews on Google Maps** button for the full live list; keep **3–6 featured quotes** on the page and refresh those on demand (e.g. when you get a standout review or every few months).

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
