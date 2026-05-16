# Local Meta API setup (Facebook, Instagram, Threads)

Step-by-step to obtain **App ID**, **App Secret**, and **access tokens** for running publish calls **on your machine**. **Do not** commit secrets; use **`.env`** (gitignored) and **`.env.example`** as the key list.

**Webpage:** Your site is deployed by **GitHub Actions on push**. “Publish webpage” = merge to the branch your workflow uses, then `git push` (after your normal preview + approval flow).

---

## Meta app reference — sptoydoctor

| | |
|--|--|
| **App display name** | sptoydoctor |
| **App ID** | `1311610070937761` |
| **Developer dashboard** | [Open app in Meta for Developers](https://developers.facebook.com/apps/1311610070937761/dashboard/?business_id=906133335785819) |

The `business_id` parameter in that URL (`906133335785819`) identifies your **[Meta Business Portfolio](https://developers.facebook.com/docs/business-management-apis)** context inside the dashboard. It is **not** a substitute for the App Secret and is fine to keep in docs.

---

## 0. Prerequisites

1. **Meta account** that can administer the business properties.
2. **Facebook Page** for Shailer Park Toy Doctor (you already promote there).
3. **Instagram** as a **Professional** account (**Business** or **Creator**) **linked** to that Facebook Page ([Meta: connect IG to Page](https://www.facebook.com/business/help/connect-instagram-to-page)).
4. **Threads** profile for the same brand (Threads posting uses the [Threads API](https://developers.facebook.com/docs/threads), which is separate from IG media IDs in many flows).
5. Optional but typical for production: **[Meta Business Portfolio](https://business.facebook.com/)** (formerly Business Manager) to own the app and assets cleanly.

---

## 1. Create a Meta app

For **Shailer Park Toy Doctor**, the app **sptoydoctor** already exists — use the [Developer dashboard](https://developers.facebook.com/apps/1311610070937761/dashboard/?business_id=906133335785819) from the **Meta app reference — sptoydoctor** section above and skip creation unless you intentionally want a second app.

Otherwise, for a brand-new app:

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

**`curl: (3) URL rejected: Malformed input`** almost always means the URL was **split across lines**, had **extra spaces** inside the quotes (Meta’s docs often wrap the URL for readability), or still contained `{placeholder}` text. Use **one continuous line** inside the quotes, with real values and a real Graph API version (e.g. `v25.0` — check [Graph API changelog](https://developers.facebook.com/docs/graph-api/changelog)):

```bash
curl -sS "https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_USER_TOKEN"
```

If your **App Secret** or **fb_exchange_token** contains characters like `&`, `+`, or `#`, prefer **`curl -G`** with `--data-urlencode` so curl encodes them:

```bash
curl -sS -G "https://graph.facebook.com/v25.0/oauth/access_token" \
  --data-urlencode "grant_type=fb_exchange_token" \
  --data-urlencode "client_id=YOUR_APP_ID" \
  --data-urlencode "client_secret=YOUR_APP_SECRET" \
  --data-urlencode "fb_exchange_token=YOUR_SHORT_LIVED_USER_TOKEN"
```

### B. Proper local OAuth (recommended for a script you run yourself)

1. Implement Facebook Login with redirect URI `http://localhost:PORT/redirect` (must match **Settings → Basic → App settings** / **Facebook Login** valid OAuth redirects).
2. After auth, capture short-lived token → exchange for **long-lived user token** → fetch **Page access tokens** for your Page.

Store **only** the token(s) you need in **`.env`** as `META_ACCESS_TOKEN=` (or split into `META_PAGE_ACCESS_TOKEN=` / `META_USER_ACCESS_TOKEN=` if your script distinguishes them — you can extend `.env.example`).

---

## 6. IDs to put in `.env`

Use your **long-lived user access token** (the one from the exchange). Pick a Graph API version (e.g. `v25.0`) and keep it consistent. **Do not** paste tokens into shells that log history shared with others; run these on your own machine.

**Tip:** put the token in an env var so it never appears in shell history:

```bash
export META_ACCESS_TOKEN='paste-long-lived-user-token-here'
# Match Graph API v25 (see .env META_GRAPH_API_VERSION)
GRAPH_V=v25.0
```

### `META_PAGE_ID` (Facebook Page)

List Pages this user can manage — each object’s **`id`** is a Page id (use the one for Shailer Park Toy Doctor):

```bash
curl -sS "https://graph.facebook.com/${GRAPH_V}/me/accounts?fields=id,name,access_token&access_token=${META_ACCESS_TOKEN}"
```

- Copy **`id`** of the correct Page → `META_PAGE_ID`.
- Optional: that response also includes a **page access token** per Page (often what you use for posting as the Page).

### `META_INSTAGRAM_USER_ID` (Instagram Business account)

Using the **same** `META_PAGE_ID` from above (the Page linked to the IG account):

```bash
curl -sS "https://graph.facebook.com/${GRAPH_V}/${META_PAGE_ID}?fields=instagram_business_account&access_token=${META_ACCESS_TOKEN}"
```

The JSON has `instagram_business_account: { "id": "…" }` — that **`id`** (often a long numeric string) is **`META_INSTAGRAM_USER_ID`**.

If `instagram_business_account` is missing, the Instagram profile is not a **Business/Creator** account linked to that Page, or the token lacks the right scopes (see [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)).

### `META_THREADS_USER_ID` (Threads)

The **same** long-lived token you use for `graph.facebook.com` (Facebook Login / Page / Instagram Graph) is **not** accepted on **`graph.threads.net`**. If you pass it there, Meta often returns **`OAuthException` code 190** — e.g. *“Invalid OAuth access token - Cannot parse access token”* — because that string is a **Facebook** user token, not a **Threads** user token.

You need a **User access token** issued for the **Threads** use case, with **Threads** permissions (see [Threads Get Started](https://developers.facebook.com/docs/threads/get-started)). Typical flow:

1. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select app **sptoydoctor** (or the app that has Threads product enabled).
3. Under **Meta API** / API selector, choose **Threads** (not only “Graph API” for Facebook-only), if the tool offers it.
4. **Get User Access Token** and add the Threads scopes your app needs (e.g. `threads_basic` / posting scopes per current Meta docs).
5. Copy that token and call **`/me`** on the Threads host (version is often `v1.0` on `graph.threads.net`; confirm in docs):

```bash
export META_THREADS_ACCESS_TOKEN='paste-threads-user-token-here'
curl -sS "https://graph.threads.net/v1.0/me?fields=id,username&access_token=${META_THREADS_ACCESS_TOKEN}"
```

- The returned **`id`** is **`META_THREADS_USER_ID`**.
6. Exchange the short-lived Threads token for a **long-lived** token (see **Threads long-lived token** below).

Store Threads tokens separately in **`.env`** (e.g. `META_THREADS_ACCESS_TOKEN`) so you do not overwrite your Facebook user token used for Page/Instagram.

### Threads long-lived token

Threads short-lived tokens last about **1 hour**. Exchange on the **Threads** host (not `graph.facebook.com`). Official doc: [Long-Lived Access Tokens — Threads API](https://developers.facebook.com/docs/threads/get-started/long-lived-tokens/).

**Secret:** Use **Threads App secret** from **App Dashboard → App settings → Basic → Threads App secret** (may be labeled separately from the main Meta App secret — use the Threads field).

```bash
export META_THREADS_SHORT_TOKEN='paste-short-lived-threads-token'
export META_THREADS_APP_SECRET='paste-threads-app-secret-from-dashboard'
```

**One-line `curl` (quote the whole URL in zsh):**

```bash
curl -sS "https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${META_THREADS_APP_SECRET}&access_token=${META_THREADS_SHORT_TOKEN}"
```

**Safer encoding (`&` in secrets/tokens):**

```bash
curl -sS -G "https://graph.threads.net/access_token" \
  --data-urlencode "grant_type=th_exchange_token" \
  --data-urlencode "client_secret=${META_THREADS_APP_SECRET}" \
  --data-urlencode "access_token=${META_THREADS_SHORT_TOKEN}"
```

**Response** (example):

```json
{
  "access_token": "<LONG_LIVED_USER_ACCESS_TOKEN>",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

Put **`access_token`** in **`.env`** as **`META_THREADS_ACCESS_TOKEN`**. Long-lived tokens last about **60 days**; refresh before expiry with `GET https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=<LONG_LIVED_TOKEN>` ([refresh docs](https://developers.facebook.com/docs/threads/get-started/long-lived-tokens/)).

**Do not** use Facebook’s `fb_exchange_token` on `graph.facebook.com` for a Threads token — that only works for Facebook user tokens.

**Error reference:** `code` **190** on Threads almost always means **wrong token type** (Facebook token on Threads host) or **expired/malformed** token — fix by obtaining a Threads-scoped user token as above.

### Summary table

| Variable | Source |
|----------|--------|
| `META_PAGE_ID` | `GET /me/accounts` → `data[].id` for your Page |
| `META_INSTAGRAM_USER_ID` | `GET /{page-id}?fields=instagram_business_account` → `instagram_business_account.id` |
| `META_THREADS_USER_ID` | `GET .../me` on **graph.threads.net** with a **Threads-scoped** user token → `id` (not the same token as Facebook Graph) |

Add these to **`.env`** next to your app and token variables. **`.env.example`** lists names only, no values.

**Threads block (typical):** `META_THREADS_APP_ID`, `META_THREADS_APP_SECRET`, `META_THREADS_ACCESS_TOKEN` (long-lived after `th_exchange_token`), `META_THREADS_USER_ID` from `GET /v1.0/me`. `META_THREADS_APP_ID` is usually the same numeric id as `META_APP_ID` for one Meta app.

### Quick check (optional)

```bash
curl -sS "https://graph.facebook.com/${GRAPH_V}/debug_token?input_token=${META_ACCESS_TOKEN}&access_token=${META_APP_ID}|${META_APP_SECRET}"
```

(Uses **app id** and **app secret** — keep secret out of shared logs.) Confirms the token is valid and shows granted scopes.

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
- [ ] Threads: `META_THREADS_APP_ID`, `META_THREADS_APP_SECRET`, `META_THREADS_ACCESS_TOKEN` (long-lived) in **`.env`** only  
- [ ] **`.env`** listed in **`.gitignore`** (already in repo)  
- [ ] Plan **App Review** before switching app to **Live** for non-test users  

---

## Troubleshooting

### `error_code: 1349245` on Threads OAuth (`threads.com/oauth/authorize`)

JSON like:

```json
{"error_message":"Invalid Request: The user has not accepted the invite to test the app.","error_code":1349245}
```

This appears when getting a **Threads** token (Graph API Explorer with Threads, or a redirect to `threads.com/oauth/authorize`). It is **not** fixed by being “Facebook app owner” alone — in **Development** mode Meta also requires the **Threads profile** used at login to be a **tester** for the app, and that invite must be **accepted inside Threads**.

#### A. Add the Threads / Instagram account as a tester (app dashboard)

1. Open [sptoydoctor app dashboard](https://developers.facebook.com/apps/1311610070937761/dashboard/?business_id=906133335785819).
2. Go to **App roles** (or **Roles** under the app).
3. Add testers — look for sections such as:
   - **Instagram Testers** — add the **Instagram username** for **@sptoydoctor** (exact handle, no `@` if the field says so).
   - **Threads** / **Threads testers** — if shown separately, add the same business Threads identity.
4. Your **Facebook** account should still be **Administrator** on the app (you as owner).

See [Threads use case — app setup](https://developers.facebook.com/docs/development/create-an-app/threads-use-case/) for the current UI labels.

#### B. Accept the invite in the **Threads app** (not only on the web)

Many owners only check email or developers.facebook.com; **Threads OAuth often requires acceptance in the mobile Threads app**:

1. On the phone, open **Threads** logged in as **@sptoydoctor** (same profile you use in the OAuth popup).
2. Check **notifications** for an invite to test **sptoydoctor**.
3. Also check **Profile → Settings** (wording varies):
   - **Account** / **Security** → **Website permissions** (or similar) — approve pending access for your app if listed.
4. If nothing appears, remove and re-add the Instagram/Threads tester in the dashboard, then wait a few minutes and check Threads again.

Community reports for this exact error: [Meta Developers forum — Threads access token](https://developers.facebook.com/community/threads/813355550962448/), [Graph API Explorer token error](https://developers.facebook.com/community/threads/454430560719367/).

#### C. Match accounts end-to-end

| Step | Must be the same identity |
|------|---------------------------|
| Facebook **Admin** on app **sptoydoctor** | Your developer Facebook login |
| **Instagram Tester** username in dashboard | **@sptoydoctor** (business IG) |
| Login in OAuth popup | That **Instagram/Threads** profile (or Facebook that owns it) |
| Threads app where you accept invite | **@sptoydoctor** Threads profile |

If the popup asks for **Instagram** login, use the account tied to the business — not a personal IG that was never added as a tester.

#### D. Graph API Explorer — Facebook token vs Threads token

- **Facebook / Page / Instagram Graph** token: use **Graph API** in Explorer, app **sptoydoctor**, permissions for Pages/Instagram — host `graph.facebook.com` (you already got Page + IG ids this way).
- **Threads** token: Explorer must target **Threads** / Threads permissions; OAuth goes to **`threads.com`** — follow **A + B** above before retrying.

#### E. Still 1349245 as owner

1. **Incognito**, one Facebook login only → Explorer → Threads token again.
2. Re-add **Administrator** role for your Facebook user; re-add **Instagram Tester** for **@sptoydoctor**.
3. Confirm app **Mode** is still **Development** (expected for now) and **Threads** product is added to the app.
4. Do **not** switch to **Live** expecting this to skip testers — Live needs **App Review** for public users; testers are still required in Development.

---

### Graph API Explorer — `error_code: 1349245` (Facebook-only token flow)

While the app is in **Development** mode, only people listed under **App roles** (and who have **accepted** their role) can generate tokens for that app.

**If you were invited as Tester / Developer (not the app owner):**

1. Check the **email** Meta sent for the invitation, or Facebook **notifications**.
2. Open [developers.facebook.com](https://developers.facebook.com/) while logged in as **that** Facebook user and look for **pending app invitations** / requests.
3. Until you **accept**, **Get User Access Token** in Graph API Explorer will keep failing with **1349245**.

**If you own the app or are an Admin:**

1. **App Dashboard** for **sptoydoctor** → **App roles** → **Roles**.
2. Confirm the Facebook account you use in Graph API Explorer appears as **Admin** with status **accepted**, not only “invited”.
3. For **Threads**, also complete the **Threads OAuth** section above — owner status on Facebook does not replace **Threads tester + in-app accept**.

After roles are accepted, try **Get User Access Token** again.

---

## References

- [Graph API overview](https://developers.facebook.com/docs/graph-api)  
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)  
- [Threads API](https://developers.facebook.com/docs/threads)  
- [Access tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)
