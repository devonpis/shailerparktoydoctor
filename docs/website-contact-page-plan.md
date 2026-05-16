# Contact page — plan (T-00022)

**Status:** Approved direction (owner, 2026-05-16). Build under `new/contact.html` until cutover.

**References:** Legacy [`contact.html`](../contact.html) · [`business-info.md`](business-info.md) · [`website-design-brief.md`](website-design-brief.md)

---

## Goal

**Same content and intent as the legacy contact page**, with rebuilt site chrome (header/footer from `/new/`) and a **Google Maps embed** for the home-business location.

---

## Content (from legacy — keep meaning)

| Block | Copy / data |
|-------|-------------|
| **Heading** | Contact us |
| **Intro** | Tell us about the toy or appliance; we confirm we can help **before** you bring it in. Contact by **email or phone (SMS preferred)**. |
| **Email** | [sptoydoctor@gmail.com](mailto:sptoydoctor@gmail.com) — fix legacy typo `maialto:` |
| **Phone** | (61) 0424 653 833 — note SMS preferred |
| **Address** | 6 Thistlerow Street, Shailer Park QLD 4128 — **appointment only**, no walk-in |

Add from [`business-info.md`](business-info.md) if missing on legacy: enquiry flow (photos + description for quote).

---

## Google Maps embed

| Item | Detail |
|------|--------|
| **Listing** | https://maps.app.goo.gl/Yx6zSEhhyDuv6geB8 |
| **Implementation** | Google Maps → place → **Share** → **Embed a map** → responsive `<iframe>` (use `loading="lazy"`, `referrerpolicy`, sensible `title` e.g. “Shailer Park Toy Doctor on Google Maps”) |
| **Layout** | Two-column on `md+`: contact details left, map right; stacked on mobile (details first, map below) |
| **Fallback** | Text link “Open in Google Maps” if iframe blocked |

**Not in scope:** Custom map styling API; Places API.

---

## SEO

| Element | Value |
|---------|--------|
| `<title>` | `Contact — Shailer Park Toy Doctor` (marketing pages use site name; **story pages** use `projectName` per wireframe) |
| `meta description` | Email, phone, address, appointment-only |
| `lang` | `en-AU` |
| **JSON-LD** | `LocalBusiness` NAP on contact (optional with home — **T-00018** / cutover) |

---

## Dependencies

- **T-00017** — page exists as stub  
- **T-00018** — shared header/footer polish (can ship contact after or with polish)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-16 | Owner: parity with legacy + Maps embed |
