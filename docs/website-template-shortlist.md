# Website template shortlist (T-00012)

**Purpose:** Manual review list for Shailer Park Toy Doctor rebuild.  
**Constraints:** Static HTML deploy to GitHub Pages; **no** CI build; Tailwind via **CDN** or pre-built CSS you can edit; optional React CDN only on `/repairs/` gallery (see [`website-rebuild-analysis.md`](website-rebuild-analysis.md)).

**How to review:** Open **Live preview** → check mobile → imagine your copy (toy repair, plush, wind-ups, Brisbane) in hero/services/testimonials. Note license before commercial use.

**Feedback for agent:** Pick 1–2 favourites (or “mix: hero from X, layout from Y”) and answer [visual questions](website-rebuild-analysis.md#visual-direction-questions-for-you).

**Owner choice (2026-05-16):** **#33 Prepbox** (Tailwind, FreeStack, MIT) — see [`website-design-brief.md`](website-design-brief.md). Also liked **#5 Play** and **#11 Charitium** for calmer sections. **Zoutoys (#22)** rejected (Bootstrap).

---

## Tier 1b — Playful / childish (toys, kids, bright colours)

Warmer, kid-friendly options. Balance with **reviews + “send photos for quote”** so the site still feels credible for electronics and heirloom repairs.

| # | Template | Live preview | Download / source | Stack | License | Notes |
|---|----------|--------------|-------------------|-------|---------|--------|
| **16** | **Toybox** (toy store) | [Demo](https://demo.templatesjungle.com/toybox/) | [TemplatesJungle](https://templatesjungle.com/downloads/toybox-tailwind/) | **Tailwind** (CDN-friendly) | Free commercial; **attribution required** | Best **toy** match: colourful, product/service cards — adapt “shop” copy to repair |
| **17** | **Kindergarten** (daycare) | [Demo](https://demo.templatesjungle.com/kindergarten/) | [TemplatesJungle](https://templatesjungle.com/downloads/kindergarten-daycare-and-kindergarten-bootstrap-5-html-website-template/) | **Bootstrap 5** | Free commercial | Most **childish** in the list; not Tailwind — visual reference or heavy rework |
| **18** | **Bright** (early education) | [Demo](https://www.tailawesome.com/resources/bright/demo) | [TailAwesome — $39](https://www.tailawesome.com/resources/bright) | HTML uses **Tailwind CLI** | Paid | Playful school; borrow **look** unless you accept local CLI for HTML zip |
| **19** | **FreeStack — Language Master** | [FreeStack](https://freestacktemplates.io/tailwind/language_master-education-vibrant-template) | FreeStack → download | HTML + Tailwind | **MIT** | Vibrant / gamified — young energy, not toy-themed |
| **20** | **FreeStack — Lingo Connect** | [FreeStack](https://freestacktemplates.io/tailwind/lingo_connect-education-vibrant_block-template) | FreeStack → download | HTML + Tailwind | **MIT** | Colourful blocks + micro-interactions |

**Mix idea:** **Toybox (#16)** or **Play (#5)** layout + **Charitium (#11)** trust/impact strip + teal `#4caac9` + real before/after photos.

---

## Tier 1c — “Real business” vibe (retail / LEGO-like polish)

**Important:** Do **not** copy [LEGO](https://www.lego.com/) (or any brand) logos, colours as trade dress, fonts, or layouts exactly. Use these as **reference** for *feel*: bold blocks, primary colours, clean product grids, playful but **professional**.

### A. Real sites to study (toy / repair businesses)

| Site | URL | What to borrow (not copy) |
|------|-----|---------------------------|
| **LEGO Shop** | [lego.com](https://www.lego.com/) | Strong **category grids**, bright primaries, confident typography, “play” energy with **premium** retail structure |
| **Build-A-Bear** | [buildabear.com](https://www.buildabear.com/) | Warm **plush** tone, emotional copy, clear CTAs |
| **Davey Bears** (UK teddy hospital) | [daveybears.com](https://daveybears.com/) | Real **soft-toy repair** positioning, spa/cleaning language, trust |
| **Leith Toy Hospital** | [leithtoyhospital.co.uk](https://leithtoyhospital.co.uk/) | “Hospital” metaphor, specialist team, **before/after** credibility |
| **Winey Bears** | [wineybearsrepair.com](https://wineybearsrepair.com/) | Tiered **service levels**, intake/process clarity |
| **Plush Clinic (My Oh My)** | [my-oh-my.com/plush-clinic](https://www.my-oh-my.com/plush-clinic/) | Named “doctor”, transformation stories |

**LEGO-adjacent design reading (no code):** [LEGO redesign case study](https://lego.partisanboost.com/case-study) · [Creative Review — LEGO design system](https://www.creativereview.co.uk/lego-design-system/)

### B. Templates closer to “real shop” / brand retail

| # | Template | Live preview | Stack | Fits “LEGO-like”? | Caveats |
|---|----------|--------------|-------|-------------------|---------|
| **21** | **Tailstore** (eCommerce) | [spacema-dev.com/tailstore](https://spacema-dev.com/tailstore/) | Tailwind; repo uses **npm dev** | **High** — real **store** UX: sliders, categories, product detail, reviews | Dev setup in repo; for you: copy **layout ideas** into CDN HTML or use built pages only |
| **16** | **Toybox** | [demo.templatesjungle.com/toybox](https://demo.templatesjungle.com/toybox/) | Tailwind CDN | **Medium–high** — toy **retail** sections map to “repair types” cards | More shop than hospital; attribution |
| **22** | **Zoutoys** | Search “Zoutoys demo” on [html.design](https://html.design/download/zoutoys-toys-html-template-for-website/) | **Bootstrap 4** | **Medium** — marketed for **toy / LEGO-style** shops; vibrant | Not Tailwind; port or reference only |
| **23** | **W3Layouts Toys eCommerce** | [w3layouts.com](https://w3layouts.com/template/toys-ecommerce-boostrap-responsive-web-template/) | Bootstrap | Medium — classic **toy store** grid | Bootstrap |
| **2** | **Electrical Contractor** (FreeStack) | [FreeStack](https://freestacktemplates.io/tailwind/electrical_contractor-home_services-modern-template) | Tailwind MIT | Low for “LEGO” — **high** for **real local business** (trust, booking) | Pair with #16 or #21 for play + credibility |

**Practical combo for Toy Doctor:** Study **LEGO / Build-A-Bear** for colour and grid energy → implement with **Toybox (#16)** or **Tailstore (#21)** sections → add **Leith / Davey Bears**-style “toy hospital” copy and **your** 32 Google reviews.

---

## Tier 1e — Tailwind alternatives to Zoutoys (#22)

**Requirement:** HTML + **Tailwind** (CDN or shipped static CSS), **no** Bootstrap, **no** compile in CI.

| # | Template | Live preview | Source | License | Zoutoys-like because… |
|---|----------|--------------|--------|---------|------------------------|
| **16** | **Toybox** | [demo.templatesjungle.com/toybox](https://demo.templatesjungle.com/toybox/) | [TemplatesJungle](https://templatesjungle.com/downloads/toybox-tailwind/) | Free + **attribution** | **Only dedicated toy-store Tailwind kit** found; product cards, categories, hero |
| **33** | **Prepbox** | Preview on [FreeStack template page](https://freestacktemplates.io/tailwind/prepbox-ecommerce-vibrant_block-template) | FreeStack → download | **MIT** | **Bold blocks, playful type, bright colours** — closest *feel* to Zoutoys; remap “meal prep” → repair services |
| **34** | **Blobby** | Preview on [FreeStack](https://freestacktemplates.io/tailwind/blobby-saas-playful-template) | FreeStack → download | **MIT** | Playful gradients/blobs; 10 pages; more SaaS than shop |
| **21** | **Tailstore** | [spacema-dev.com/tailstore](https://spacema-dev.com/tailstore/) | [GitHub tailstore4](https://github.com/spacemadev/tailstore4) | MIT | Full **shop** UX (slider, filters, reviews); repo has `npm run dev` — use demo/HTML as reference |
| **5** | **Play** (TailGrids) | [play-tailwind.tailgrids.com](https://play-tailwind.tailgrids.com/) | [GitHub](https://github.com/TailGrids/play-tailwind) | MIT | Polished sections; less “toy shop”, easy to brand |
| **35** | **ShopNow** + Flowbite | [Netlify demo](https://shopnow-e-commerce-website.netlify.app/) | [GitHub](https://github.com/abhishekrajput-web/shopnow-e-commerce-website) | Check repo | Tailwind + **Flowbite**; includes **children’s collection** page |
| **1** | **Dindin Local Services** | [local-services.dindind.dev](https://local-services.dindind.dev/) | [Dindin](https://www.dindindesign.com/2025/12/local-services.html) | Free commercial | Not toy-themed but **repair/local services** + Tailwind HTML |
| **2** | **Electrical Contractor** | [FreeStack](https://freestacktemplates.io/tailwind/electrical_contractor-home_services-modern-template) | FreeStack | MIT | Pair with **#16** or **#33** for **trust/booking** sections |

**DIY option:** [Flowbite e-commerce blocks](https://flowbite.com/docs/e-commerce/introduction/) + Tailwind CDN — build a toy-repair layout without a full theme (more work, full control).

**Not Tailwind (skip if stack is fixed):** #22 Zoutoys and all **Tier 1d** html.design Bootstrap templates.

---

## Tier 1d — [HTML.Design](https://html.design/) lookalikes (Zoutoys #22 family) — Bootstrap only

**#22 Zoutoys** is the **only toy / LEGO-shop** template on html.design. Same site lists “you might also like” and shares **Bootstrap 4**, **CC 3.0** (free commercial + **attribution**), previews at `https://html.design/preview/?theme=<slug>`.

| # | Template | Live preview | Download page | Similar to Zoutoys because… |
|---|----------|--------------|---------------|----------------------------|
| **22** | **Zoutoys** *(your pick)* | [Preview](https://html.design/preview/?theme=zoutoys) | [Download](https://html.design/download/zoutoys-toys-html-template-for-website/) | Toy / LEGO shop; home, about, gallery, contact |
| **24** | **Giftos** | [Preview](https://html.design/preview/?theme=giftos) | [Download](https://html.design/download/gift-ecommerce-shop-template/) | Same **gift shop** energy; pastel eCommerce; very popular on site |
| **25** | **Gamepad** | [Preview](https://html.design/preview/?theme=gamepad) | [Download](https://html.design/download/gamepad-video-games-template/) | **Games & toys** adjacent; bold accents (often darker hero) |
| **26** | **Jackpiro** | [Preview](https://html.design/preview/?theme=jackpiro) | [Download](https://html.design/download/jackpiro-gaming-html-template/) | Vibrant **gaming** layout; high ratings; blog + community feel |
| **27** | **Faraado** | [Preview](https://html.design/preview/?theme=faraado) | [Download](https://html.design/download/faraado-car-game-html-template/) | High-contrast **game** site; dynamic, youth market |
| **28** | **Coldbergs** | [Preview](https://html.design/preview/?theme=coldbergs) | [Download](https://html.design/download/ice-cream-shop-website-template/) | Playful **bright** palette; gallery + blog; family-friendly |
| **29** | **Denschool** | [Preview](https://html.design/preview/?theme=denschool) | [Download](https://html.design/download/children-school-html-template/) | **Kids** focus; courses/gallery; cheerful (school not shop) |
| **30** | **Primecare** | [Preview](https://html.design/preview/?theme=primecare) | [Download](https://html.design/download/primecare-baby-care-template/) | **Baby / daycare**; soft pastels; services + gallery |
| **31** | **Entertaint** | [Preview](https://html.design/preview/?theme=entertaint) | [Download](https://html.design/download/entertaint-music-landing-template/) | Linked from Zoutoys page; bold **entertainment** landing |
| **32** | **Mastreet** | [Preview](https://html.design/preview/?theme=mastreet) | [Download](https://html.design/download/skateboards-html-template/) | Youth **hobby** retail vibe (skateboards) |

**Browse more on the same site:** [Entertainment templates](https://html.design/search?q=entertainment-templates) · [Game & sports](https://html.design/search?q=game-sports-templates) · [Education / kids](https://html.design/templates/education-templates/)

**Stack note:** Tier 1d is **Bootstrap 4 only**. Owner requires **Tailwind** → use **Tier 1e** instead of #22.

---

## Tier 1 — Best fit (home / repair / local services)

| # | Template | Live preview | Download / source | Pages | License | Why it might work |
|---|----------|--------------|-------------------|-------|---------|-------------------|
| 1 | **Dindin — Local Services** | [Preview](https://local-services.dindind.dev/) | [Info + ZIP](https://www.dindindesign.com/2025/12/local-services.html) (Mediafire) | Multi-section landing | Free commercial (per author) | Built for **repair, workshops, cleaning, local services**; HTML + Tailwind; SEO/performance called out |
| 2 | **FreeStack — Electrical Contractor** | [On FreeStack](https://freestacktemplates.io/tailwind/electrical_contractor-home_services-modern-template) (use site preview) | FreeStack template page → download | **9** (index, services, service detail, reviews, FAQ, contact, booking, pricing, blog) | **MIT** | **Trades / home services** tone; trust blocks, testimonials, quote/booking — maps to “send photos for quote” |
| 3 | **FreeStack — Eco Comfort** | [On FreeStack](https://freestacktemplates.io/tailwind/eco_comfort-home_services-soft_ui_minimalism-template) | FreeStack → download | **10** | **MIT** | Softer **soft UI**; less “sparky contractor”, more approachable — may suit toy/plush brand |
| 4 | **FreeStack — Localy Connect** | [On FreeStack](https://freestacktemplates.io/tailwind/localy_connect-services-modern-template) | FreeStack → download | **7** | **MIT** | **Directory / marketplace** layout — useful if `/repairs/` should feel like browsing many cases (may be busy) |

---

## Tier 2 — Good base (more startup/SaaS — heavier customization)

| # | Template | Live preview | Download / source | Pages | License | Caveats |
|---|----------|--------------|-------------------|-------|---------|---------|
| 5 | **TailGrids — Play** | [play-tailwind.tailgrids.com](https://play-tailwind.tailgrids.com/) | [GitHub](https://github.com/TailGrids/play-tailwind) · [Download](https://links.tailgrids.com/play-download) | Marketing + blog-style sections | **MIT** | Polished **startup/SaaS** look; dark mode; verify Tailwind is CDN or built CSS in ZIP |
| 6 | **UIdeck — Base (Tailwind)** | [Preview](https://base-tailwind.preview.uideck.com/) | [UIdeck](https://uideck.com/templates/base-tailwind) | Home + blog + 404 etc. | **Free lite = personal only**; paid for commercial | Free “lite” is **compiled CSS, not source Tailwind** — fine for trial, not ideal long-term |
| 7 | **UIdeck — Go (Tailwind)** | [Preview on UIdeck](https://uideck.com/templates/go-tailwind) | [UIdeck](https://uideck.com/templates/go-tailwind) | Business + blog + auth pages | Check product page | Dark-default agency; may feel less “local shop” |
| 8 | **TailTemplates — Plain** | [tailtemplates.com/templates/plain](https://tailtemplates.com/templates/plain) | TailTemplates site | Multi-section business | Free commercial (per site) | Generic **business/agency**; services + portfolio + contact |
| 9 | **ThemeWagon — Agency (Tailwind)** | [ThemeWagon](https://themewagon.com/themes/agency-tailwind/) | ThemeWagon download | One-page + sections | Open source / commercial (verify on page) | Simple **one-page**; sticky nav, contact |

---

## Tier 3 — Warmer / mission-led (reuse for “save toys, less landfill” story)

| # | Template | Live preview | Download / source | Pages | License | Why consider |
|---|----------|--------------|-------------------|-------|---------|--------------|
| 10 | **FreeStack — Charity Organization** | [On FreeStack](https://freestacktemplates.io/tailwind/charity_organization-nonprofit-modern-template) | FreeStack → download | **6** | **MIT** | **Friendly, trust-first**; programs/impact — adapt “programs” → services |
| 11 | **FreeStack — Charitium** | [On FreeStack](https://freestacktemplates.io/tailwind/charitium-nonprofit-minimalism-template) | FreeStack → download | Single-page | **MIT** | Minimal, **impact/stats** — good for reviews + sustainability message |
| 12 | **TemplatesJungle — Aegis** | [Preview/download](https://templatesjungle.com/downloads/aegis-tailwind/) | TemplatesJungle | Nonprofit landing | Free commercial (**attribution** — check page) | Clean nonprofit; confirm attribution requirement |

---

## Tier 4 — Repair keyword, not Tailwind (reference only)

| # | Template | Preview | Stack | Note |
|---|----------|---------|-------|------|
| 13 | **Colorlib — Repair** | [Colorlib](https://colorlib.com/wp/template/repair/) | HTML (not Tailwind-focused) | **Computer repair** aesthetic; paid license for full use |
| 14 | **ThemeWagon — Handyman** | [Demo](https://themewagon.github.io/handyman/) | **Bootstrap 4** | Construction/handyman — would abandon Tailwind CDN approach |
| 15 | **Colorlib — Carepair / AutoRepair** | Colorlib previews | Bootstrap / HTML | Auto repair — wrong vertical unless heavily restyled |

---

## Paid (optional)

| Template | Link | Price | Note |
|----------|------|-------|------|
| **Elecdrain** (plumbing/electrical repair) | [Codezion](https://www.codezion.com/theme/product/elecdrain-plumbing-electrical-repair-services-tailwind-template-94967612) | ~$9–19 | Trades/repair; Tailwind; check license |
| **Tailwind UI — Salient / Radiant** | [tailwindui.com/templates](https://tailwindui.com/templates) | Paid | **Next.js** — does not match no-build approach |

---

## Not recommended for this project

| Item | Reason |
|------|--------|
| Astro / Next / Nuxt starters | Conflict with **no compile** decision |
| Admin dashboards (Admin One, Modernize, etc.) | Wrong product type |
| OpenTailwind block library | Component library, not a ready local-business site |

---

## Fit checklist (use when reviewing)

- [ ] Feels **friendly local workshop**, not corporate SaaS or grim construction
- [ ] Clear **hero + services + trust (reviews) + contact CTA**
- [ ] Works with **appointment / enquiry** (not walk-in) messaging
- [ ] Room for **repair gallery** (cards linking to `/projects/<folder>/`)
- [ ] **MIT or free commercial** without attribution surprises
- [ ] Ships as **editable HTML** (not only minified CSS bundle)
- [ ] Colours adaptable to teal `#4caac9` (or you’re OK changing palette)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-16 | Initial shortlist for T-00012 owner review |
| 2026-05-16 | Tier 1b playful options; owner likes #5 and #11 |
| 2026-05-16 | Tier 1c real-business references (LEGO, plush hospitals) + retail templates #21–23 |
| 2026-05-16 | Tier 1d html.design Zoutoys lookalikes #24–32 (Bootstrap) |
| 2026-05-16 | Tier 1e Tailwind Zoutoys alternatives #16 #33–35; owner requires Tailwind not Bootstrap |
