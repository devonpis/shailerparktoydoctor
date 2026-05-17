# Product identification (T-00030 + fallback)

How to name repair projects from photos and metadata. Use after USB ingest or when `projectName` is still generic.

## Flow

1. **In-repo photos** — read `before` → `after` → `hero` → first `WIP`; note damage and visual traits (brand, scale, character).
2. **Update config** — `node scripts/apply-project-identities.mjs` when identity is in [`scripts/lib/t30-project-identities.mjs`](../scripts/lib/t30-project-identities.mjs) (or add an entry first).
3. **Still unsure?** — run fallback report:
   ```bash
   node scripts/report-product-id-fallback.mjs
   ```
4. **Lens / Google Images (URL)** — for each flagged row, open the **Lens URL** (image must be live on GitHub Pages):
   ```text
   https://lens.google.com/uploadbyurl?url=<encoded-image-url>
   ```
   Public image base: `https://sptoydoctor.com.au/projects/<folder>/<file>` (see [`scripts/lib/site-image-url.mjs`](../scripts/lib/site-image-url.mjs)).
5. **Text web search** — use the suggested query from the report; cross-check one manufacturer page (Good Smile, MFC, Bandai, etc.).
6. **Confirm** — update `projectName`, folder `#### - Name`, `tags`, `repairDetails`; re-run apply or edit `config.json`. Skip **0001, 0002, 0003** (Donald Duck).

## When to use fallback

| Signal | Action |
|--------|--------|
| Name like “Anime bunny girl”, “Tan plush dog”, “Teddy bear” | Lens + web search |
| `repairDetails` says “No photos yet” | Timesheet name only; Lens when photos added |
| Competing 1/4 bunny / generic plush | Lens required |
| Confident ID from vision + one web hit | Update identity map and apply |

## Do not

- Guess character names without Lens or a clear product page.
- Commit customer PII from Lens or USB paths into filenames.

## Fallback review (2026-05-17)

After the batch T-00030 pass, photo review + web search updated:

| ID | Was | Now |
|----|-----|-----|
| 0088 | Anime bunny girl figure | Yui Yuigahama Bunny Ver 1/4 FREEing |
| 0079 | Shaggy bunny plush | Tan shaggy dog brown ribbon (USB `Brown_ribbon_dog`) |
| 0090 | Vintage tan teddy / polar_bear USB | Cream teddy blue satin bow |
| 0045 | Husky plush dog | Beanie Boo husky plush |
| 0081 | Tan plush dog | Terry cloth tan puppy plush |

Re-run `node scripts/report-product-id-fallback.mjs` after deploy so Lens URLs match live folder names on sptoydoctor.com.au.

## Related

- [`docs/usb-photo-ingest.md`](usb-photo-ingest.md) — copy from USB
- [`docs/reports/`](reports/) — dry-run and fallback reports
- **T-00032** — CSV gap report for owner fill-in after names and dates (T-00031) are set
