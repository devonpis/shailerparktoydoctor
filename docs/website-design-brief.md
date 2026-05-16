# Website design + SEO brief (T-00012)

**Status:** **Approved** (owner, 2026-05-16). **T-00012** Done. Implementation tracked as **T-00017**–**T-00020** (see [`TASKS.md`](TASKS.md)).

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

## Information architecture (owner, 2026-05-16)

Preview paths use **`/new/`** prefix until **T-00016** cutover; production URLs below omit `/new/`.

### Global header

| Element | Behaviour |
|---------|-----------|
| **Logo / brand** | Links to **home** (`/` or `/new/` in preview) |
| **Projects** | Tile index of all **DONE** repairs |
| **Testimonials** | Google Maps reviews (implementation TBD — see below) |
| **Contact** | Contact details and enquiry instructions |
| **Social icons** | Facebook, Instagram, Threads, YouTube — icon row in header (and/or footer); URLs from [`business-info.md`](business-info.md) |

**Responsive:** Mobile-first; collapsible **hamburger** (or equivalent) for nav links on small viewports; social icons remain tappable (min touch target ~44px). Desktop: horizontal nav + icons.

**Preview paths:** `/new/projects/` (gallery), `/new/testimonials.html`, `/new/contact.html` — aligned with this IA.

### URL map

| Production URL | Nav label | Purpose |
|----------------|-----------|---------|
| `/` | *(via logo)* | Home — see [Home sections](#home-page-sections-owner-2026-05-16) |
| `/projects/` | **Projects** | **Gallery index** — all DONE projects as tiles (React + JSON); links to story pages |
| `/projects/<folder>/` | — | Single repair story (`index.html` per DONE folder) — wireframe: [`website-project-page-wireframe.md`](website-project-page-wireframe.md) |
| `/testimonials.html` | **Testimonials** | Google reviews |
| `/contact.html` | **Contact** | NAP, enquiry flow, SMS preferred, no walk-in |

**Why `/projects/` for the gallery:** Matches owner language (“Projects”). Coexists with story URLs: `projects/index.html` is the index; `projects/0003 - Donald Duck/` is a subfolder. No separate `/repairs/` path in the rebuilt site.

**Data file (internal):** `data/projects-index.json` (or keep `repairs-index.json` name — implementation detail); only **DONE** entries.

**Optional later:** `/how-it-works.html` — can fold enquiry steps into home or Contact first.

**Cutover:** **T-00016** promotes `new/*` to root; remove legacy `index.html`, `contact.html`, `reviews.html`.

---

## Home page sections (owner, 2026-05-16)

Order top → bottom (hero and services blocks from Prepbox still apply above or between as design fits):

| # | Section | Content source |
|---|---------|----------------|
| 1 | **Hero** | Tagline + dual CTA: quote → Contact; secondary → Projects |
| 2 | **About us / our mission** | Merge legacy **About us** + **Do You Know** ([`index.html`](../index.html)); keep phone/laptop exclusion callout (`warning` colour) |
| 3 | **Our Doctors** | Three personas: **Dr. Fluffy**, **Dr. Electronics**, **Dr. Hobby** ([`business-info.md`](business-info.md)); respect the “doctor” area visually (cards/grid; legacy uses `images/DrFluffy.jpg`, `images/DrElectronic.jpg`; **Dr. Hobby image TBD** — placeholder OK until owner supplies) |
| 4 | **Featured projects** | **Three** highlight tiles → each project’s story URL; owner picks which three (config flag or curated list in JSON until automation exists) |
| 5 | **Projects CTA** | Full-width band/button → **Projects** index page |
| 6 | *(optional)* | Services lineup, trust strip — from earlier brief; not removed unless owner says so |

**Decided:** Homepage featured count = **3** (not 6).

---

## Testimonials page

Reviews live on **Google Maps** ([listing](https://maps.app.goo.gl/Yx6zSEhhyDuv6geB8)). Legacy site uses **static HTML** — quotes copied manually into [`reviews.html`](../reviews.html) (still valid).

| Option | What you get | Embedding? |
|--------|----------------|------------|
| **A — Static copy** | You paste chosen reviews into HTML (like today). | **No embed** — just text + optional links to reviewer profiles. Full control; does not auto-update when new Google reviews arrive. |
| **B — Hybrid (recommended v1)** | “32 reviews, all 5★” + prominent **Read on Google Maps** button; optionally 1–3 favourite quotes copied from Maps. | **No review feed embed** — link-out only. Fast, matches static-site stack, no API keys. |
| **C — Google Maps iframe** | Embed the **place** (map + business card) via Google Maps → Share → Embed a map. | **Partial** — shows location and may show rating snippet; **not** a scrollable list of all review text on your page. |
| **D — Places API** | Script fetches place details (Google Cloud project, API key, billing, ToS). | **Limited** — typically up to **5** review texts per request; not all 32; ongoing maintenance. |
| **E — Third-party widget** | Services (e.g. Elfsight, EmbedSocial) pull reviews into a styled widget. | **Yes** — usually paid; loads their script; depends on their Google connection. |

**There is no official free Google widget** that embeds your full Maps review feed on a custom static site without API or a third party.

**Owner direction (2026-05-16):** Start with **hybrid (B)** on `/new/testimonials.html`. Can later add static quotes from legacy page and/or a **map iframe (C)** if desired — not a full auto-sync review wall.

---

## Footer (recommendation)

**Recommended (compact):** Do **not** repeat the full primary nav in the footer — header/hamburger already covers wayfinding.

| Include | Skip |
|---------|------|
| Brand name or small logo | Duplicate logo + four nav links + social (clutter) |
| One-line NAP or “Shailer Park QLD · appointment only” | Long multi-column sitemap |
| Email + phone (SMS preferred note) | |
| Social icons (same four channels) | |
| `© {year} Shailer Park Toy Doctor` | |

**Optional:** Single text row — `Projects · Testimonials · Contact` — for users who scroll to the bottom only (lighter than repeating icons + nav).

**Owner decision:** **Confirmed** — compact footer **plus** text line: `Projects · Testimonials · Contact`.

---

## Responsive / mobile

- **Layout:** Single column on small screens; doctors and project tiles stack; 2–3 columns from `md:` / `lg:` breakpoints.
- **Nav:** Hamburger or drawer; logo stays visible; social icons in header or inside menu (pick one pattern and stay consistent).
- **Images:** `max-w-full`, sensible `object-cover` on tiles; lazy-load below fold.
- **Touch:** Adequate padding on links and social icons; no hover-only critical actions.
- **Test:** Verify at ~375px width and desktop; no horizontal scroll from fixed widths.

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

## Projects gallery (`/projects/`)

- Prepbox **card grid** aesthetic (colours/borders).  
- **React + htm** via CDN; data from `data/projects-index.json` (rename from preview `repairs-index.json` when aligned).  
- Filter/search by tags (optional v1: search only).  
- Only **`status: "DONE"`** entries; each card links to `/projects/<folder>/`.

---

## Key sections (home) — legacy reference

Superseded by [Home page sections](#home-page-sections-owner-2026-05-16) for order; still useful for copy:

- **Services lineup** — four pillars: plush, electrical/mechanical, figures/collectibles, paint  
- **Trust** — Google Maps rating snippet → Testimonials  
- **How to enquire** — photos + description → quote → drop-off or mail-in  

---

## SEO (launch checklist)

- Unique `<title>` and meta description per page  
- `lang="en-AU"`; canonical URLs; HTTPS Open Graph  
- `LocalBusiness` / `ProfessionalService` JSON-LD on home/contact ([`business-info.md`](business-info.md) NAP)  
- `sitemap.xml` — home, contact, testimonials, projects index, each DONE `projects/<folder>/`  
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

1. **Secondary accent** `#f5a623` — keep or change?  
2. **Testimonials:** v1 **hybrid** (see [Testimonials page](#testimonials-page)); map iframe or static quotes optional later.  
3. **Featured three** on home: **placeholders** until owner picks real projects (`featured` in JSON later).  
4. **Dr. Hobby** image — **reuse `DrFluffy.jpg`** until owner supplies dedicated asset.  

**Decided (2026-05-16):**

- **Teal primary + Lobster/Nunito** replace Prepbox colours and fonts.  
- **Nav:** logo → home; Projects, Testimonials, Contact; social icons (FB, IG, Threads, YouTube).  
- **Home:** About/mission (combined legacy sections); Our Doctors (×3); **3** featured project tiles + CTA to Projects.  
- **Gallery path:** `/projects/` (not `/repairs/`).  
- **Responsive / mobile-first** required.  
- **Footer:** compact + `Projects · Testimonials · Contact` text links.  
- **Preview folder:** `new/projects/` (renamed from `new/repairs/`).

---

## Approval

- [x] Owner approves this brief (**2026-05-16**).  
- [x] Build work split: **T-00017** (scaffold, done) · **T-00018** (UI polish) · **T-00019** (project page wireframe) · **T-00020** (testimonials).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-16 | Draft brief; base template **Prepbox (#33)** |
| 2026-05-16 | Brand **colour tokens** + **Lobster/Nunito** (replace Prepbox palette and fonts) |
| 2026-05-16 | **IA planning:** nav, home sections, `/projects/` gallery, testimonials, footer recommendation, responsive |
| 2026-05-16 | Footer text links confirmed; hybrid testimonials; Dr. Hobby placeholder image; featured placeholders; `new/repairs/` → `new/projects/` |
| 2026-05-16 | **Brief approved**; T-00014 closed; build split into T-00017–T-00020 |
