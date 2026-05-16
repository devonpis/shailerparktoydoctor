# Local Meta API setup (Facebook, Instagram, Threads)

Step-by-step to obtain **App ID**, **App Secret**, and **access tokens** for running publish calls **on your machine**. **Do not** commit secrets; use **`.env`** (gitignored) and **`.env.example`** as the key list.

**Webpage:** Your site is deployed by **GitHub Actions on push**. “Publish webpage” = merge to the branch your workflow uses, then `git push` (after your normal preview + approval flow).

---

## 0. Prerequisites

1. **Meta account** that can administer the business properties.
2. **Facebook Page** for Shailer Park Toy Doctor (you already promote there).
3. **Instagram** as a **Professional** account (**Business** or **Creator**) **linked** to that Facebook Page ([Meta: connect IG to Page](https://www.facebook.com/business/help/connect-instagram-to-page)).
4. **Threads** profile for the same brand (Threads posting uses the [Threads API](https://developers.facebook.com/docs/threads), which is separate from IG media IDs in many flows).
5. Optional but typical for production: **[Meta Business Portfolio](https://business.facebook.com/)** (formerly Business Manager) to own the app and assets cleanly.

---

## 1. Create a Meta app

1. Open [Meta for Developers](https://developers.facebook.com/) and log in.
2. **My Apps** → **Create app**.
3. Choose a use case that matches **business publishing** (wording in the wizard changes over time; pick what mentions **Pages**, **Instagram**, or **business** management).
4. Note the **App ID** and App name.

---

## 2. App Secret (keep private)

1. **App Dashboard** → **Settings** → **Basic**.
2. Click **Show** next to **App secret** — treat this like a password.
3. Copy **App ID** and **App secret** into your **local** `.env` (copy from `.env.example`):

   ```bash
   cp .env.example .env
   # edit .env — never commit
   META_APP_ID=...
   META_APP_SECRET=...
   ```

**Never** paste the App secret into GitHub issues, README, or chat logs you don’t control. Cursor/agents should use **placeholders** until *you* paste locally (per project rules).

---

## 3. Add products you need

In the app dashboard, **Add products** (or **Use cases**) as required:

| Goal | Typical product / area |
|------|------------------------|
| Post to **Facebook Page** | Facebook Login, **Pages API** (Graph API `/{page-id}/feed` pattern) |
| Post to **Instagram** | **Instagram** product, Instagram Graph API |
| Post to **Threads** | **Threads API** ([docs](https://developers.facebook.com/docs/threads)) |

Enable **development mode** while testing; you’ll add **Testers** under **Roles** so a non-admin account can authorize if needed.

---

## 4. Required permissions (scopes)

Exact names change — always check **App Dashboard → Use cases / Permissions and features** and the [Graph API reference](https://developers.facebook.com/docs/graph-api). You will typically need combinations along these lines:

**Facebook Page posting**

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts` (and sometimes related `pages_*` scopes depending on media)

**Instagram publishing**

- `instagram_basic`
- `instagram_content_publish`
- Often tied to the linked Page via `pages_read_engagement` / Page access

**Threads**

- Threads-specific scopes listed under [Threads API — Get started](https://developers.facebook.com/docs/threads/get-started) (e.g. posting and reading content for your Threads profile).

**App Review:** In **Development**, only testers/roles you add can grant these. **Live** mode usually requires **App Review** for each permission.

---

## 5. Get tokens for local use

You have two common patterns:

### A. Graph API Explorer (quick tests)

1. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your **app**, **Get User Access Token**, choose the permissions above.
3. Exchange for a **long-lived** token (see [Long-lived user token](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived)); Page posting often needs a **Page access token** derived from that user token with the right scopes.

### B. Proper local OAuth (recommended for a script you run yourself)

1. Implement Facebook Login with redirect URI `http://localhost:PORT/redirect` (must match **Settings → Basic → App settings** / **Facebook Login** valid OAuth redirects).
2. After auth, capture short-lived token → exchange for **long-lived user token** → fetch **Page access tokens** for your Page.

Store **only** the token(s) you need in **`.env`** as `META_ACCESS_TOKEN=` (or split into `META_PAGE_ACCESS_TOKEN=` / `META_USER_ACCESS_TOKEN=` if your script distinguishes them — you can extend `.env.example`).

---

## 6. IDs to put in `.env`

| Variable | What it is | How to find (typical) |
|----------|------------|------------------------|
| `META_PAGE_ID` | Numeric Page id | Page **About** / **Page info**, or `GET /me/accounts` with a user token that has Page access |
| `META_INSTAGRAM_USER_ID` | Instagram **business** scoped user id | `GET /{page-id}?fields=instagram_business_account` via Graph API |
| `META_THREADS_USER_ID` | Threads profile id for API | [Threads Get Started](https://developers.facebook.com/docs/threads/get-started) — profile / debug tools |

Add these to `.env` alongside tokens. **`.env.example`** lists names only, no values.

---

## 7. Verify before posting

Use Graph API Explorer or `curl` against `graph.facebook.com` (and the Threads endpoints from Meta docs) to:

- Read Page info,
- Read IG account id,
- Optionally create a **draft** or restricted test post per platform docs.

Only then wire your **local script** (future task) to read from `process.env` / dotenv.

---

## 8. Getting the post URL after publishing

After a successful API publish, the response includes **object ids** (post id, media id, etc.). You then:

1. **Facebook:** build or resolve the canonical post URL from the returned `id` (often `pageId_postId` format) or follow Graph API fields if documented for permalinks.
2. **Instagram:** `GET /{ig-media-id}?fields=permalink,shortcode` (field availability per Meta docs).
3. **Threads:** retrieve the post; responses often include **`permalink`** ([retrieve posts](https://developers.facebook.com/docs/threads/retrieve-and-discover-posts/retrieve-posts/)).

Paste the final browser links into the project’s **`projects/…/config.json`** (`facebookUrl`, `instagramUrl`, `threadUrl`) after you approve.

---

## 9. Webpage = git commit + push

Static site updates are **not** Meta API calls:

1. Change HTML/assets (when you explicitly ask for HTML work).
2. Commit with a **`T-#####`** message (per [`TASKS.md`](TASKS.md)), **after you approve**.
3. **Push** to the branch connected to **GitHub Actions**; the workflow already publishes the site.

If the workflow file is not in this repo yet, track that under **T-00002** (document or add the workflow).

---

## 10. Checklist

- [ ] App created; **App ID** + **App secret** in **`.env`** only  
- [ ] Instagram **Professional** + linked to Page  
- [ ] Products: Page / Instagram / Threads as needed  
- [ ] Permissions added; testers added in **Development**  
- [ ] Long-lived **Page** (and/or **User**) token in **`.env`**  
- [ ] `META_PAGE_ID`, `META_INSTAGRAM_USER_ID`, `META_THREADS_USER_ID` filled  
- [ ] **`.env`** listed in **`.gitignore`** (already in repo)  
- [ ] Plan **App Review** before switching app to **Live** for non-test users  

---

## References

- [Graph API overview](https://developers.facebook.com/docs/graph-api)  
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)  
- [Threads API](https://developers.facebook.com/docs/threads)  
- [Access tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)
