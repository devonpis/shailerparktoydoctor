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
