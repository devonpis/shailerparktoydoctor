# YouTube thumbnail style guide

The **Comic Split** style is the standard for long-form Toy Doctor videos. It shows the repair as a clean before-and-after, with comic lettering and almost no decoration.

Visual reference: [Toy Doctor Thumbnails design canvas](https://claude.ai/artifact/QgdrPVHSJHvoX9spyncmaR), artboard **Selected style**. The canvas is private to the owner unless shared.

## Layout

All measurements are for the final **1280 × 720** image.

| Element | Specification |
|---------|---------------|
| Split | Two equal photo halves, before on the left and after on the right |
| Divider | Straight white vertical line, 5 px wide, centred |
| Before badge | Top-left, 30 px from the edges, tilted 3° anticlockwise |
| After badge | Top-right, 30 px from the edges, tilted 3° clockwise |
| Title | One line, centred on the full image, 30 px from the bottom |
| Decoration | None beyond the divider, badges and title |

## Typography

| Use | Font | Size | Treatment |
|-----|------|------|-----------|
| Badges | Bangers | 58 px | Uppercase, square corners, 4 px border |
| Title | Luckiest Guy | Up to 110 px, 72 px minimum | Uppercase, 10 px outer outline |

Long titles shrink automatically to stay within 1000 px, which keeps them clear of YouTube's duration badge.

## Colour and shadow

| Token | Hex | Used for |
|-------|-----|----------|
| Ink | `#161426` | Before badge, outlines, shadows, after-badge text |
| Comic yellow | `#FFD91A` | Title and after badge |
| White | `#FFFFFF` | Divider, before-badge text and border |

Every badge and title uses the **same hard shadow**: Ink, 9 px right and 12 px down, with no blur.

## Words

- **Before badge:** one word for the arrival condition, such as `DEAD`, `BITTEN` or `BRITTLE`.
- **After badge:** one word for the result, ending in `!`, such as `ALIVE!`, `SAVED!` or `STRONG!`.
- **Title:** two or three short words naming the repair, such as `BRAIN TRANSPLANT`.
- Keep the whole thumbnail to about five words.

## Photos

- Use real photos from the repair.
- Show both toys upright in portrait where possible. Rotate overhead photos if the content allows it.
- Keep the toy's face visible on both sides, and keep the damage visible on the before side.
- Keep important details out of the top corners and the bottom title area.
- Do not recolour either photo to exaggerate the repair.

## Must not include

- **Customer details:** check every photo at full size for names, phone numbers, addresses and postage labels. Parcels often appear in arrival photos.
- **A red cross:** its use is restricted in Australia, including for health-themed business graphics.
- Another company's characters, logos or artwork added as decoration.

## Font setup

The fonts come from Google Fonts and are stored in `scripts/fonts/` with their licence files:

- `Bangers-Regular.ttf`, SIL Open Font License (`Bangers-OFL.txt`)
- `LuckiestGuy-Regular.ttf`, Apache License 2.0 (`LuckiestGuy-LICENSE.txt`)

## Generate a thumbnail

```bash
python3 -I scripts/make-youtube-thumbnail.py --before "before.jpg" --after "after.jpg" --from BITTEN --to "SAVED!" --hook "FUR TRANSPLANT" --before-crop 0.08,0.04,0.92,0.70 --after-crop 0.08,0.04,0.92,0.70 --out "thumbnail.jpg"
```

Crops are `left,top,right,bottom` fractions from 0 to 1. Use `--before-rotate` or `--after-rotate` with `90`, `180` or `270` to turn a photo clockwise.

## Final check

- [ ] Image is 1280 × 720 and under 2 MB.
- [ ] Title and toy still read at 168 px wide.
- [ ] Title is centred and clear of the bottom-right duration badge.
- [ ] Badges and title share the same shadow.
- [ ] No customer details are visible at full size.
- [ ] The after photo matches the result shown in the video.
