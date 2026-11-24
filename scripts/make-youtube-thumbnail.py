#!/usr/bin/env python3
"""Build a 1280x720 long-video YouTube thumbnail in the Toy Doctor "Comic Split" style.

Style guide: docs/youtube-thumbnail-style-guide.md

Example:
  python3 -I scripts/make-youtube-thumbnail.py \
    --before before.jpg --after after.jpg \
    --from BITTEN --to "SAVED!" --hook "FUR TRANSPLANT" \
    --before-crop 0.08,0.04,0.92,0.70 --after-crop 0.08,0.04,0.92,0.70 \
    --out thumbnail.jpg

Bangers and Luckiest Guy are expected in scripts/fonts/. Use --badge-font or --hook-font
to point somewhere else.
"""
import argparse
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

W, H, S = 1280, 720, 2
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_BADGE_FONT = os.path.join(HERE, "fonts", "Bangers-Regular.ttf")
DEFAULT_HOOK_FONT = os.path.join(HERE, "fonts", "LuckiestGuy-Regular.ttf")
INK, WHITE, YELLOW = (22, 20, 38), (255, 255, 255), (255, 217, 26)
SHADOW = (9, 12)
DIVIDER = 5
EDGE = 30
BADGE_SIZE, BADGE_PAD_X, BADGE_PAD_Y, BADGE_BORDER, BADGE_TILT = 58, 20, 11, 4, 3
HOOK_SIZE, HOOK_MIN, HOOK_MAX_W, HOOK_STROKE = 110, 72, 1000, 10


def crop_box(text):
    values = tuple(float(v) for v in text.split(","))
    if len(values) != 4 or not (0 <= values[0] < values[2] <= 1 and 0 <= values[1] < values[3] <= 1):
        raise argparse.ArgumentTypeError("crop must be left,top,right,bottom fractions from 0 to 1")
    return values


def photo(path, crop, rotate, size):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    if rotate:
        im = im.rotate(-rotate, expand=True)
    area = (int(crop[0] * im.width), int(crop[1] * im.height), int(crop[2] * im.width), int(crop[3] * im.height))
    return ImageOps.fit(im.crop(area), size, Image.LANCZOS, centering=(.5, .42))


def require_font(path):
    if not os.path.exists(path):
        raise SystemExit(f"Font not found: {path}\nSee docs/youtube-thumbnail-style-guide.md for font setup.")
    return path


def badge(canvas, text, font_path, fill, ink, border, right):
    font = ImageFont.truetype(font_path, BADGE_SIZE * S)
    probe = ImageDraw.Draw(Image.new("L", (8, 8)))
    l, t, r, b = probe.textbbox((0, 0), text, font=font)
    w = r - l + 2 * (BADGE_PAD_X + BADGE_BORDER) * S
    h = b - t + 2 * (BADGE_PAD_Y + BADGE_BORDER) * S
    margin = 8 * S
    shadow_x, shadow_y = SHADOW[0] * S, SHADOW[1] * S
    layer = Image.new("RGBA", (w + shadow_x + margin * 2, h + shadow_y + margin * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rectangle((margin + shadow_x, margin + shadow_y, margin + shadow_x + w - 1, margin + shadow_y + h - 1), fill=INK + (255,))
    d.rectangle((margin, margin, margin + w - 1, margin + h - 1), fill=fill + (255,), outline=border + (255,), width=BADGE_BORDER * S)
    d.text((margin + (BADGE_PAD_X + BADGE_BORDER) * S - l, margin + (BADGE_PAD_Y + BADGE_BORDER) * S - t), text, font=font, fill=ink)
    layer = layer.rotate(-BADGE_TILT if right else BADGE_TILT, expand=True, resample=Image.BICUBIC)
    x = W * S - EDGE * S - layer.width + margin if right else EDGE * S - margin
    canvas.alpha_composite(layer, (x, max(0, EDGE * S - margin)))


def hook(canvas, text, font_path):
    d = ImageDraw.Draw(canvas)
    for size in range(HOOK_SIZE, HOOK_MIN - 1, -1):
        font = ImageFont.truetype(font_path, size * S)
        l, t, r, b = d.textbbox((0, 0), text, font=font, stroke_width=HOOK_STROKE * S)
        if r - l <= HOOK_MAX_W * S:
            break
    else:
        raise SystemExit(f"Title is too long for the template: {text}")
    x = (W * S - (r - l)) / 2 - l
    y = (H - EDGE) * S - SHADOW[1] * S - (b - t) - t
    d.text((x + SHADOW[0] * S, y + SHADOW[1] * S), text, font=font, fill=INK, stroke_width=HOOK_STROKE * S, stroke_fill=INK)
    d.text((x, y), text, font=font, fill=YELLOW, stroke_width=HOOK_STROKE * S, stroke_fill=INK)


parser = argparse.ArgumentParser(description="Build a Toy Doctor long-video thumbnail.")
parser.add_argument("--before", required=True)
parser.add_argument("--after", required=True)
parser.add_argument("--from", dest="state_from", required=True, help="One word for the arrival state")
parser.add_argument("--to", dest="state_to", required=True, help="One word for the repaired state")
parser.add_argument("--hook", required=True, help="Two or three short words for the repair")
parser.add_argument("--before-crop", type=crop_box, default=(0, 0, 1, 1))
parser.add_argument("--after-crop", type=crop_box, default=(0, 0, 1, 1))
parser.add_argument("--before-rotate", type=int, choices=(0, 90, 180, 270), default=0, help="Clockwise degrees")
parser.add_argument("--after-rotate", type=int, choices=(0, 90, 180, 270), default=0, help="Clockwise degrees")
parser.add_argument("--badge-font", default=DEFAULT_BADGE_FONT)
parser.add_argument("--hook-font", default=DEFAULT_HOOK_FONT)
parser.add_argument("--out", required=True)
args = parser.parse_args()
badge_font, hook_font = require_font(args.badge_font), require_font(args.hook_font)

canvas = Image.new("RGBA", (W * S, H * S), WHITE + (255,))
half = (W - DIVIDER) // 2
canvas.paste(photo(args.before, args.before_crop, args.before_rotate, (half * S, H * S)), (0, 0))
canvas.paste(photo(args.after, args.after_crop, args.after_rotate, ((W - half - DIVIDER) * S, H * S)), ((half + DIVIDER) * S, 0))
badge(canvas, args.state_from.upper(), badge_font, INK, WHITE, WHITE, False)
badge(canvas, args.state_to.upper(), badge_font, YELLOW, INK, INK, True)
hook(canvas, args.hook.upper(), hook_font)

final = canvas.convert("RGB").resize((W, H), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1, 25, 2))
os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
final.save(args.out, quality=91, optimize=True, subsampling=0)
print(args.out, final.size, f"{os.path.getsize(args.out) / 1e6:.2f} MB")
