# Image orientation audit (T-00039)

**Date:** 2026-05-17  
**Scanned:** 478 images in 90 projects  
**Full CSV (heuristic):** [`image-orientation-audit-2026-05-17.csv`](image-orientation-audit-2026-05-17.csv)

## Summary

| Category | Count | Notes |
|----------|------:|-------|
| EXIF auto-fixed (prior run) | 69 | `fix-project-image-orientation.mjs --all --exif-only` |
| EXIF still wrong | 0 | Re-scan found none |
| **Confirmed wrong rotation** | **3** | Visual check (see below) |
| Heuristic “landscape primary” flags | 90 | Mostly **false positives** — correct landscape workbench shots |
| Portrait primary (upright check sample) | 25 | Sampled; **OK** (0001 hero, 0009 after, 0010–0015 heroes, etc.) |

**Without `OPENAI_API_KEY`**, automated vision on all 478 files was not run. Heuristic rules (landscape + hero/before/after) over-flag normal 4:3 repair photos.

## Confirmed — fixed

| Project | File | Fix applied |
|---------|------|-------------|
| **0001** | `hero.jpeg` | **`--180`** (upright portrait) |
| **0001** | `after.jpeg` | **`--cw`** via `publish-webpage.mjs` (2026-05-17) |
| **0002** | `before.jpeg` | **`--cw`** via `publish-webpage.mjs` (2026-05-17) |
| **0002** | `after.jpeg` | **`--cw`** via `publish-webpage.mjs` (2026-05-17) |

Manual rotate (if needed again):

```bash
node scripts/publish-webpage.mjs <id> --rotate <file> --cw   # or --ccw / --180
```

## Verified OK (do not rotate)

Spot-checked published / hero images including:

- **0001** `before.jpg`, `hero.jpeg` — upright portrait  
- **0003** `after.jpg`, WIP set — landscape workbench; Donald upright  
- **0007** `before.jpg` — landscape; bear upright  
- **0009** `hero.jpg`, `after.jpeg`, `before.jpeg` — upright  
- **0004–0015** heroes sampled (Rocky, Guitar Hero, Duggee, Big Loader chassis, etc.) — correct  
- **0093** `hero.jpg` — landscape; toys upright on floor  

## Heuristic CSV (review only)

The CSV lists **90** `hero` / `before` / `after` files with width > height. **Most are correct** landscape repair shots (4:3 phone photos on a bench). Do **not** bulk-rotate from that list without vision or manual check.

## Recommended next steps

1. **Fix the 3 confirmed files** (commands above).  
2. **Optional full pass:** add `OPENAI_API_KEY` to `.env`, then:

   ```bash
   node scripts/report-project-image-orientation.mjs --vision --out docs/reports/image-orientation-audit-vision.csv
   node scripts/fix-project-image-orientation.mjs --all --vision
   ```

3. Re-run after fixes:

   ```bash
   node scripts/report-project-image-orientation.mjs --out docs/reports/image-orientation-audit-2026-05-17.csv
   ```

## How to re-run this report

```bash
node scripts/report-project-image-orientation.mjs
node scripts/report-project-image-orientation.mjs --vision   # needs OPENAI_API_KEY
```
