# Google Analytics 4 (GA4) setup — Shailer Park Toy Doctor

Step-by-step to add **page-view analytics** on **https://sptoydoctor.com.au/**. Tracks marketing pages and repair story pages after **T-00044** wires the tag in the repo.

**Task:** [`TASKS.md`](TASKS.md) **T-00044** · **Requirement:** [`SD.md`](SD.md) **BR-035**

The **Measurement ID** (`G-XXXXXXXXXX`) is **public** in HTML (not a secret). Still use the **business Google account** you want to own the property long term.

---

## Overview

| Step | Who | What |
|------|-----|------|
| 1–3 | **Owner** | Create GA4 property + web data stream → copy **Measurement ID** |
| 4 | **Owner or agent** | Add gtag snippet to site HTML (T-00044 implementation) |
| 5 | **Owner** | Push to `main` → GitHub Pages deploy |
| 6 | **Owner** | Verify **Realtime** in GA4 |

---

## 1. Sign in and open Analytics

1. Use the Google account that should **own** analytics for the business (ideally the same account used for **Google Business Profile** / Search, if you have one).
2. Open [Google Analytics](https://analytics.google.com/).
3. If prompted, accept terms and choose **Start measuring** (or use an existing **Account** named e.g. `Shailer Park Toy Doctor`).

---

## 2. Create a GA4 property

1. **Admin** (gear, bottom left) → under **Account**, pick or create an account (e.g. `Shailer Park Toy Doctor`).
2. Under **Property**, click **Create property** (or **+ Create property**).
3. **Property name:** e.g. `Shailer Park Toy Doctor website`.
4. **Reporting time zone:** `Australia/Brisbane` (or your local zone).
5. **Currency:** `Australian Dollar (AUD)`.
6. **Industry / business size:** choose what fits (e.g. small business / services); exact choice does not block setup.
7. **Business objectives:** e.g. **Generate leads** or **Examine user behaviour** — any is fine for basic page views.
8. Finish the wizard (data sharing defaults are your choice).

You now have a **GA4 property** (not Universal Analytics — UA was sunset in 2023).

---

## 3. Add a Web data stream (your domain)

1. In the property: **Admin** → **Property settings** → **Data collection and modification** → **Data streams**  
   — or **Admin** → **Data display** → **Data streams** (wording varies).
2. Click **Add stream** → **Web**.
3. **Website URL:** `https://sptoydoctor.com.au`
4. **Stream name:** e.g. `Production — sptoydoctor.com.au`
5. Create the stream.
6. On the stream details page, copy the **Measurement ID** — format **`G-XXXXXXXXXX`**.  
   **This site:** `G-3T7KLB9S7F` (stored in [`data/site-analytics.json`](../data/site-analytics.json) and [`business-info.md`](business-info.md)).

**Optional (recommended later):**

- **Enhanced measurement** — leave default toggles (page views, scrolls, outbound clicks) unless you want fewer events.
- **Google tag** section shows the same gtag snippet you will paste into the site.

---

## 4. Add the tag to this repository (T-00044)

**T-00044** is implemented. The live tag uses Measurement ID **`G-3T7KLB9S7F`**. Reference snippet (also generated from [`scripts/lib/google-analytics.mjs`](../scripts/lib/google-analytics.mjs)):

**Snippet template** (replace `G-XXXXXXXXXX` with your Measurement ID):

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Pages that must include the tag:**

| Page | Path |
|------|------|
| Home | [`index.html`](../index.html) |
| Projects gallery | [`projects/index.html`](../projects/index.html) |
| Contact | [`contact.html`](../contact.html) |
| Testimonials | [`testimonials.html`](../testimonials.html) |
| Each repair story | `projects/<id> - <name>/index.html` |

**Implementation pattern for this repo:**

1. Put the snippet in a small include, e.g. [`includes/google-analytics.html`](../includes/google-analytics.html), **or** duplicate the two `<script>` blocks in each page’s `<head>`. Header/footer are **baked static HTML** via [`scripts/sync-site-chrome.mjs`](../scripts/sync-site-chrome.mjs) (not loaded by JS).
2. Update [`projects/0000 - template/index.html.example`](../projects/0000%20-%20template/index.html.example) and [`scripts/publish-webpage.mjs`](../scripts/publish-webpage.mjs) so **new** story pages get the tag.
3. Optionally run a one-shot script to backfill existing story `index.html` files.
4. Record the Measurement ID in [`business-info.md`](business-info.md) (ID only).

**Do not** commit Google **service account** JSON or API secrets for Analytics.

---

## 5. Deploy to production

Same as other site changes:

1. Commit on `main` (task **T-00044** in commit message when done).
2. `git push` → GitHub Pages builds from `main` ([`github-pages-deploy.md`](github-pages-deploy.md)).
3. Wait 1–3 minutes for **https://sptoydoctor.com.au/** to update.

---

## 6. Verify data is flowing

1. In GA4: **Reports** → **Realtime** (or **Admin** → **DebugView** if you enable debug mode later).
2. On your phone or laptop, open:
   - `https://sptoydoctor.com.au/`
   - `https://sptoydoctor.com.au/projects/`
   - One project story URL
3. Within ~30 seconds you should see **at least 1 active user** and page paths like `/` and `/projects/…`.

If nothing appears:

- Confirm the live page **View source** contains your `G-…` ID (hard refresh / private window).
- Disable ad blockers for the test.
- Check the stream URL is exactly `https://sptoydoctor.com.au` (no typo).
- Confirm you pushed the commit that added the tag.

---

## 7. Optional next steps (out of scope for T-00044)

| Topic | Notes |
|-------|--------|
| **Google Search Console** | [search.google.com/search-console](https://search.google.com/search-console) — add property for `sptoydoctor.com.au`, verify via DNS or HTML file; links with GA4 for search queries. |
| **Cookie / privacy notice** | AU visitors may expect a short privacy note if you use analytics; legal advice is outside this repo. |
| **Exclude yourself** | Install [Google Analytics Opt-out Browser Add-on](https://tools.google.com/dlpage/gaoptout) on your work browser, or use an internal IP filter in GA4 Admin. |
| **Custom events** | e.g. “Get a quote” clicks — only add if you need them; keep events free of customer PII. |

---

## Checklist

- [ ] GA4 **property** created
- [ ] **Web** data stream for `https://sptoydoctor.com.au`
- [ ] **Measurement ID** `G-…` copied
- [x] **T-00044** — tag added to all public HTML + deploy
- [ ] **Realtime** shows your test visit
- [ ] Measurement ID noted in `business-info.md` (optional but helpful)

To backfill or refresh tags after adding new story pages: `node scripts/inject-google-analytics.mjs`
