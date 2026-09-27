#!/usr/bin/env python3
"""Crop left/right black pillarbox bars from portrait content in 16:9 frames."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

BAR_COL_MAX = 22  # true pillarbox: every sampled pixel in column is near-black
MIN_BAR_RUN = 36  # px of consecutive bar columns from each edge
MIN_CROPPED_RATIO = 0.30  # keep at least 30% of original width


def column_max_luma(gray: Image.Image, x: int) -> int:
    w, h = gray.size
    peak = 0
    for y in range(0, h, 4):
        peak = max(peak, gray.getpixel((x, y)))
    return peak


def is_bar_column(gray: Image.Image, x: int) -> bool:
    return column_max_luma(gray, x) <= BAR_COL_MAX


def find_horizontal_crop(img: Image.Image) -> tuple[int, int, int, int] | None:
    w, h = img.size
    gray = img.convert("L")

    left = 0
    while left < w and is_bar_column(gray, left):
        left += 1

    right = w - 1
    while right > left and is_bar_column(gray, right):
        right -= 1

    left_margin = left
    right_margin = w - 1 - right
    crop_w = right - left + 1

    if left_margin < MIN_BAR_RUN and right_margin < MIN_BAR_RUN:
        return None
    if crop_w < w * MIN_CROPPED_RATIO:
        return None
    if left_margin + right_margin < w * 0.04:
        return None

    return (left, 0, right + 1, h)


def process(path: Path) -> None:
    img = Image.open(path)
    box = find_horizontal_crop(img)
    if not box:
        print(f"skip {path.name} ({img.size[0]}x{img.size[1]}) — landscape / no pillarbox")
        return
    cropped = img.crop(box)
    cropped.save(path, "JPEG", quality=92, optimize=True)
    print(
        f"crop {path.name} {img.size[0]}x{img.size[1]} -> {cropped.size[0]}x{cropped.size[1]}"
        f"  (removed L{box[0]} R{img.size[0] - box[2]})"
    )


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/crop-pillarbox-images.py <folder>", file=sys.stderr)
        sys.exit(1)

    folder = Path(sys.argv[1])
    names = sys.argv[2:]
    files = [folder / n for n in names] if names else sorted(folder.glob("*.jpeg"))
    for path in files:
        if path.is_file():
            try:
                process(path)
            except ValueError as err:
                print(f"skip {path.name} — crop failed ({err})")


if __name__ == "__main__":
    main()
