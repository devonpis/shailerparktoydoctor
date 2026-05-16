# Website design + SEO brief (T-00012)

**Status:** Draft — **owner template choice: Prepbox (#33)**. Approve this brief before **T-00014** (“build the site”).

**References:** [`website-rebuild-analysis.md`](website-rebuild-analysis.md) · [`business-info.md`](business-info.md) · [`website-template-shortlist.md`](website-template-shortlist.md)

---

## Template base

| Item | Choice |
|------|--------|
| **Template** | **Prepbox** — [FreeStack](https://freestacktemplates.io/tailwind/prepbox-ecommerce-vibrant_block-template) |
| **License** | MIT (verify attribution line in downloaded ZIP footer if required) |
| **Stack** | Pure HTML + **Tailwind** (use template’s Tailwind setup; align with **Tailwind CDN** + no CI build per analysis doc) |
| **Why** | Vibrant **block-based** layout, playful typography, strong product/service cards — closest Tailwind match to the desired toy-shop energy without Bootstrap |

**Not used:** Zoutoys (Bootstrap). Toybox (#16) remains a secondary reference for toy-specific copy blocks only.

---

## Brand & mood

| Element | Direction |
|---------|-----------|
| **Feel** | Friendly **neighbourhood toy hospital** — Prepbox **layout** (blocks, borders), **Toy Doctor** colours and fonts |
| **Tone** | Warm, clear, not corporate SaaS; avoid “meal prep” / food copy from demo |
| **Imagery** | Real **before/after/WIP** from `projects/`; Dr. Fluffy / Dr. Electronics personas from [`business-info.md`](business-info.md) where helpful |
| **Hero** | Strong headline + dual CTA: **“Send photos for a quote”** → contact; secondary **“See repairs”** → `/repairs/` |

---

## Colour scheme (replace Prepbox palette)

**Rule:** Strip Prepbox’s default food-brand colours from the ZIP. All pages use the tokens below via **Tailwind CDN `theme` extend** (one shared snippet in a partial or copied into each HTML `<head>`) — no separate CSS build.

| Token | Hex | Use |
|-------|-----|-----|
| **primary** | `#4caac9` | Buttons, links, key borders, active nav (existing site accent) |
| **primary-dark** | `#3a8fa8` | Hover states on primary buttons |
| **primary-light** | `#e8f6fa` | Light section backgrounds, badges |
| **secondary** | `#f5a623` | Optional warm accent on one hero block or icon highlight (playful; use sparingly) |
| **secondary-light** | `#fff4e0` | Alternate block background (instead of Prepbox loud primaries) |
| **surface** | `#ffffff` | Cards, main content |
| **surface-muted** | `#f7f8fa` | Alternating sections |
| **text** | `#2d3748` | Body copy |
| **text-muted** | `#737373` | Secondary text (matches current site) |
| **border** | `#2d3748` | Prepbox-style **bold outlines** — keep the look, recolour to dark grey or `primary` |
| **warning** | `#da4444` | Exclusions / “we don’t repair” callouts (from current site) |
| **success** | `#38a169` | Optional “DONE” / positive trust chips only |

**Do not carry over:** Prepbox meal-prep greens, oranges, or neon block fills as-is — remap each section to `primary` / `primary-light` / `surface-muted` / white.

**Tailwind CDN (shared config pattern):**

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: { DEFAULT: '#4caac9', dark: '#3a8fa8', light: '#e8f6fa' },
          secondary: { DEFAULT: '#f5a623', light: '#fff4e0' },
          warning: '#da4444',
        },
        fontFamily: {
          display: ['Lobster', 'cursive'],
          sans: ['Nunito', 'system-ui', 'sans-serif'],
        },
      },
    },
  };
</script>
```

Use `font-display` for headings and `font-sans` for body in markup (replace Prepbox font classes).

---

## Typography (replace Prepbox Google Fonts)

**Use existing brand fonts** from the live site ([`business-info.md`](business-info.md)), not Prepbox’s demo typefaces.

| Role | Font | Source |
|------|------|--------|
| **Headings** | **Lobster** | Google Fonts |
| **Body** | **Nunito** (400, 600, 700) | Google Fonts |

**In every page `<head>` (remove Prepbox font links):**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Lobster&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
```

| Element | Class / style |
|---------|----------------|
| `h1`, hero titles | `font-display text-4xl md:text-5xl` |
| `h2`, section titles | `font-display text-3xl` |
| Body, nav, buttons | `font-sans` |
| Buttons | `font-sans font-semibold` (not display — readability) |

**At build (T-00014):** Search/replace Prepbox font family names and hard-coded `style="color:…"` / arbitrary hex in the HTML ZIP.

---

## Site map (unchanged from analysis)

| URL | Page | Based on Prepbox / new |
|-----|------|-------------------------|
| `/` | Home | Prepbox `index` — hero, service “lineup”, benefits, testimonials, CTA |
| `/contact.html` | Contact | Prepbox `contact` + NAP, SMS preferred, no walk-in |
| `/reviews.html` | Reviews | Google reviews highlight (32× 5★) — new or Prepbox testimonial strip |
| `/repairs/` | Repair gallery | **New** — React CDN + `data/repairs-index.json` (not in Prepbox ZIP) |
| `/projects/<folder>/` | Repair story | Static `index.html` per **DONE** project (shared snippet) |

**Optional later:** `/how-it-works.html` (enquiry → quote → drop-off/mail-in) — can adapt Prepbox “3 steps” section on home first.

**Cutover:** Replace legacy `index.html` / `contact.html` / `reviews.html` when T-00014 ships; keep `CNAME` and GitHub Pages flow.

---

## Prepbox page → Toy Doctor mapping

| Prepbox page | Toy Doctor use |
|--------------|----------------|
| `index` | Home |
| `products` / `product detail` | **Services** (plush, mechanical, figures, paint) + optional detail per service |
| `bundle deals` | **“Common fixes”** or featured repair types (not literal bundles) |
| `about` | About Toy Doctor / mission (landfill, affordable repair) |
| `contact` | Contact + enquiry instructions |
| `meal prep tips` | **Care tips** or blog stub — or drop |
| `material safety` | **How we work** / quality & safety (no food metaphors) |
| `wholesale` | Remove or repurpose → **Mail-in / bulk enquiries** if needed |

---

## Key sections (home)

1. **Hero** — tagline from business-info; photo collage or single strong repair image  
2. **Services lineup** — four pillars: plush, electrical/mechanical, figures/collectibles, paint (icons or photos)  
3. **Trust** — Google Maps rating, link to reviews, “appointment only” / Shailer Park  
4. **Latest repairs** — 6 cards linking to `/projects/<folder>/` or `/repairs/`  
5. **How to enquire** — photos + description → quote → confirmed drop-off or mail-in  
6. **Footer** — NAP, social links from business-info, ABN when available  

---

## Repairs gallery (`/repairs/`)

- Prepbox **card grid** aesthetic where possible (colours/borders).  
- **React + htm** via CDN; data from `data/repairs-index.json`.  
- Filter by tags from `config.json` (optional v1: search only).  
- Only **`status: "DONE"`** entries.

---

## SEO (launch checklist)

- Unique `<title>` and meta description per page  
- `lang="en-AU"`; canonical URLs; HTTPS Open Graph  
- `LocalBusiness` / `ProfessionalService` JSON-LD on home/contact ([`business-info.md`](business-info.md) NAP)  
- `sitemap.xml` — home, contact, reviews, repairs, each DONE `projects/<folder>/`  
- Image `alt` from project `title`  
- Local keywords: Shailer Park, Brisbane, Gold Coast, toy repair, plush repair, wind-up toy repair  

---

## Technical constraints (non-negotiable)

- **No** GitHub Actions build; **no** Astro/Vite/Webpack/Babel in CI  
- **No** Bootstrap  
- **No** compile/bundle required for deploy — static files on `main`  
- Social publish: image URLs remain `https://sptoydoctor.com.au/projects/<folder>/…`  

---

## Owner decisions still open (optional)

1. **Secondary accent** `#f5a623` — keep warm yellow/orange or pick another (e.g. soft coral `#ff8a65`)?  
2. **Reviews** on home vs separate `/reviews.html` only?  
3. **Homepage repair count** in “Latest repairs”: 6 or 8?  

**Decided:** **Teal primary + Lobster/Nunito** replace Prepbox colours and fonts (owner, 2026-05-16).

---

## Approval

- [ ] Owner approves this brief (reply **“approve brief”** or edit this file).  
- [ ] Then explicit **“build the site”** for T-00014.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-16 | Draft brief; base template **Prepbox (#33)** |
| 2026-05-16 | Brand **colour tokens** + **Lobster/Nunito** (replace Prepbox palette and fonts) |
