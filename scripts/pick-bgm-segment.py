#!/usr/bin/env python3
"""Pick a random segment of a long background-music track for one video.

Prints JSON with the track, the start time and the length, ready for
ffmpeg (`-ss <start> -t <length> -i <track>`). Store the output in the
video's index.json so re-renders reuse the same segment.

The random start is moved to the nearest quiet moment (within 30 s) so the
music begins between phrases rather than mid-note.

Usage:
  python3 -I scripts/pick-bgm-segment.py --length 160
  python3 -I scripts/pick-bgm-segment.py --length 45 --seed 7 --track other.mp3
"""
import argparse
import json
import os
import random
import re
import subprocess

DEFAULT_TRACK = os.path.expanduser(
    "~/Downloads/toy repair/Musicas Para O Dia a Dia - Café e Leitura.mp3"
)
FFMPEG = os.path.expanduser("~/.local/bin/ffmpeg")
FFPROBE = os.path.expanduser("~/.local/bin/ffprobe")


def duration(track):
    out = subprocess.run(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", track],
        capture_output=True, text=True, stdin=subprocess.DEVNULL, check=True,
    ).stdout
    return float(out.strip())


def quiet_points(track, start, span):
    """Ends of quiet dips (-30 dB, 0.3 s) between start and start+span."""
    err = subprocess.run(
        [FFMPEG, "-nostdin", "-v", "info", "-ss", f"{start:.2f}", "-t", f"{span:.2f}",
         "-i", track, "-af", "silencedetect=noise=-30dB:d=0.3", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    return [start + float(m) for m in re.findall(r"silence_end: ([0-9.]+)", err)]


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--length", type=float, required=True,
                    help="seconds of music needed (video length plus a few seconds)")
    ap.add_argument("--track", default=DEFAULT_TRACK)
    ap.add_argument("--seed", type=int, help="fix the pick so it can be repeated")
    ap.add_argument("--skip-intro", type=float, default=10.0,
                    help="never start before this many seconds (the track opens with silence)")
    args = ap.parse_args()

    total = duration(args.track)
    latest = total - args.length - 5
    if latest <= args.skip_intro:
        raise SystemExit(f"track is {total:.0f}s, too short for {args.length:.0f}s")

    seed = args.seed if args.seed is not None else random.randrange(1_000_000)
    start = random.Random(seed).uniform(args.skip_intro, latest)

    lo = max(args.skip_intro, start - 30)
    near = [p for p in quiet_points(args.track, lo, 60) if args.skip_intro <= p <= latest]
    if near:
        start = min(near, key=lambda p: abs(p - start))

    print(json.dumps({
        "track": args.track,
        "start": round(start, 2),
        "length": args.length,
        "seed": seed,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
