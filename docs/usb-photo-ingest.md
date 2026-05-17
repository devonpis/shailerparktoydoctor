# USB repair photo ingest (T-00028)

Ingest photos from an external volume into `projects/<id> - <name>/` using convention filenames (`before`, `after`, `hero`, `WIP-###`).

## Prerequisites

- USB mounted (read-only on source).
- `npm install` (uses **sharp** for capture time / EXIF).
- New uncaptured jobs scaffolded: `0078`–`0092` (see `scripts/lib/usb-folder-map.mjs`). USB `Woody`, `Woody_2`, and `Woody_n_Buzz` are **different clients** → `0050`, `0091`, `0092`.

## Steps

1. **Scaffold** (once, if new USB-only projects needed):

   ```bash
   node scripts/ingest-usb-photos.mjs "/Volumes/NO NAME/Toy_doctor_photos" --scaffold-new
   ```

2. **Dry-run** (default — writes report, no copy):

   ```bash
   node scripts/ingest-usb-photos.mjs "/Volumes/NO NAME/Toy_doctor_photos" --overwrite
   ```

   Reports: `docs/reports/usb-ingest-dry-run-<date>.md` and `.csv`.

3. **Review** the report; fix `scripts/lib/usb-folder-map.mjs` if a folder maps wrong.

4. **Apply** copy (after owner says `apply`):

   ```bash
   node scripts/ingest-usb-photos.mjs "/Volumes/NO NAME/Toy_doctor_photos" --overwrite --apply
   ```

5. **Optimize** (T-00027) before committing images:

   ```bash
   node scripts/optimize-project-images.mjs --all
   ```

6. **Rename / product info** (T-00030): `node scripts/apply-project-identities.mjs` — see [`docs/reports/t30-project-identities-2026-05-17.md`](reports/t30-project-identities-2026-05-17.md).
7. **Lens / web fallback** for still-generic names: [`docs/product-identification.md`](product-identification.md) — `node scripts/report-product-id-fallback.mjs`.

## Rules

- Root-level loose files on the USB are **ignored**.
- `--overwrite` replaces existing `before` / `after` / `hero` in the target project.
- Unlabeled `IMG_*` files are ordered by **capture time** (filename → EXIF → mtime) as `WIP-###`.
- Do **not** commit unoptimized images to git.
