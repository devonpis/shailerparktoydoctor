# Long-form repair video — narration workflow

How to build a **~10-minute landscape repair story** with **kid voice-over**, from phone clips to YouTube upload.

**Reference project (outside git):**  
`/Users/devon/Downloads/toy repair/silvester the cat/`  
First shipped video: **giant vintage Sylvester the Cat** (Looney Tunes, wire-frame + foot-plate repair).

**Do not commit raw video** to this repo — keep media in a local project folder (Downloads/USB). Scripts and alignment maps may live in that folder’s `export/` subfolder.

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| **ffmpeg / ffprobe** | Montage, audio merge, upload compress — e.g. `~/.local/bin/` (static macOS builds from [evermeet.cx](https://evermeet.cx/ffmpeg/)) |
| **Python 3 + faster-whisper** | Transcribe `narrative.m4a` with word timestamps — `pip3 install faster-whisper` |
| **iMovie** (or DaVinci / Premiere) | Final polish when auto-sync is not smooth enough |

Add to shell if needed: `export PATH="$HOME/.local/bin:$PATH"`

---

## Folder layout (per repair video)

```
toy repair/<project name>/
  IMG_*.jpeg / VID_*.mp4          # phone media (timestamp filenames)
  narrative.m4a                   # one continuous kid narration (owner records)
  My Movie 1.mp4                  # final edit from iMovie (master — large)
  export/
    build-smart-montage.mjs       # picture montage from clips
    silvester-the-cat-long-landscape-v3.mp4   # base video (no narration)
    narration-alignment-map.json  # videoSec + script hints per beat
    narration-script-*-kid-only.txt
    narration-script-*-timestamped.md
    transcribe-narration.py
    merge-narration.mjs
    narration-work/               # generated: transcript, segments, report
    silvester-the-cat-with-narration.mp4      # auto merge (draft)
  My Movie 1-upload.mp4           # compressed for YouTube (from repo script)
```

Copy the Sylvester `export/` scripts to a new folder when starting the next video; update hardcoded `ROOT` paths at the top of each script (or refactor to `PROJECT_DIR` env later).

---

## Workflow phases

### 1. Build the picture montage

- Drop all `IMG_*` / `VID_*` into the project folder.
- Run **`build-smart-montage.mjs`** — sorts by capture time, dedupes burst stills, mixes stills + video chronologically, outputs **1080p landscape** base MP4.
- Review order; re-run or tweak plan JSON if a scene is wrong.

**Webpage vs social image order** in the main repo is different — do **not** apply social carousel rules to this long video.

### 2. Write the script and alignment map

- **`narration-script-*-kid-only.txt`** — print-friendly; **pause 2–3 seconds at each blank line** (helps auto placement).
- **`narration-script-*-timestamped.md`** — same beats with **video timestamps** from the base montage.
- **`narration-alignment-map.json`** — one entry per on-screen beat:

```json
{
  "id": "before",
  "label": "Before — worn Sylvester",
  "videoSec": 0,
  "slotSec": 9,
  "scriptHint": "Meet forty-year-old Sylvester; droopy, wobbly, can't stand."
}
```

- **`videoSec`** = when that scene starts in the base MP4 (seconds).
- **`slotSec`** = max narration window before the next beat (used to cap clip length on the timeline).

### 3. Record narration

- Owner records **one continuous take** reading the kid script → save as **`narrative.m4a`** in the project folder (not `export/`).
- Re-record is fine; re-run merge after replacing the file.

### 4. Auto merge (Whisper + align)

```bash
node export/merge-narration.mjs
```

Pipeline:

1. **`transcribe-narration.py`** — Whisper `base` model, segment + word timestamps → `narration-work/transcript.json`.
2. **Keyword match** — each spoken chunk scored against `scriptHint` / section keywords in the alignment map.
3. **Phrase splits only** — split at natural boundaries (e.g. before “still a bit wobbly”), **not** word-by-word.
4. **Timeline caps** — each clip limited so it cannot overlap the next scene’s `videoSec`.
5. **Gentle audio** — light fades; **no** aggressive per-clip silence stripping (that caused “robotic” speech).
6. Mux onto base video → `*-with-narration.mp4`.

**Check:** `export/narration-work/alignment-report.json` and optional per-beat WAVs in `narration-work/clips-for-manual-edit/`.

**Known limits of auto sync**

- Whisper mis-hears kid speech (e.g. “vestus” for Sylvester).
- One take includes **retakes** — hard to strip cleanly.
- Outro speech may be longer than video time left after the last scene — trim manually.
- For **publish quality**, expect a **manual pass** in iMovie.

### 5. Manual polish (recommended for YouTube)

1. Import base montage + **`narration-work/clips-for-manual-edit/*.wav`** (or re-sync in iMovie by eye).
2. Nudge clips to match scenes; fix pacing and volume.
3. Export master (iMovie → **large file**, often 15–20 Mbps).

### 6. Compress for upload

From repo root:

```bash
node scripts/compress-video-for-upload.mjs "/path/to/My Movie 1.mp4"
```

### 6b. Story photos from the finished video (optional)

Extract **`before`**, **`after`**, and **`WIP-001…`** stills into a new `projects/<id>/` folder. Portrait shots with black side bars are auto-cropped via [`crop-pillarbox-images.py`](../scripts/crop-pillarbox-images.py); landscape frames are left full width:

```bash
node scripts/extract-video-frames.mjs "/path/to/My Movie 1-upload.mp4" \
  "projects/0123 - Vintage giant Sylvester the Cat plush" \
  --at "2:before,11:WIP-001,620:after,..."
```

Default: **1080p, ~5 Mbps H.264**, AAC 128k, `faststart` → `*-upload.mp4` (~70% smaller).  
Example: 1.4 GB iMovie export → ~380 MB.

Options: `--bitrate 8M`, `--output path.mp4`

### 7. YouTube upload (manual)

Owner uploads **` *-upload.mp4`** in YouTube Studio. Agent can draft title / description / tags / chapters in chat — **no** automated YouTube publish in this repo unless explicitly requested later.

**Sylvester template (Mar 2026):**

- **Title:** `40-Year-Old Giant Sylvester the Cat — Full Plush Restoration | Shailer Park Toy Doctor`
- **Category:** Howto & Style
- **Description:** story lead + bullet repair steps + chapters (`0:00`, `0:09`, …) + `https://sptoydoctor.com.au`
- **Tags:** toy repair, plush repair, Sylvester the Cat, Looney Tunes, vintage plush, wire frame repair, Shailer Park Toy Doctor, …

After go-live, paste **`youtubeUrl`** into the repair project’s `config.json` when that project exists in the repo.

---

## Agent prompts (say in chat)

| You say | Agent does |
|---------|------------|
| **Re-merge narrative on &lt;project&gt;** | Run `merge-narration.mjs` on updated `narrative.m4a`; report alignment. |
| **Compress my movie for YouTube** | Run `compress-video-for-upload.mjs` on the exported MP4. |
| **Draft YouTube title/description for &lt;project&gt;** | Copy in chat from repair notes — no upload. |
| **&lt;timestamp&gt; narration is late/early** | Tune alignment map or section keywords; re-merge. |

Publishing to **website/social** still uses the normal `publish <id> to …` flow. This doc is **YouTube long-form video** only.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Choppy, “cut up” speech | Re-run **smooth** `merge-narration.mjs`; avoid word-level splits; manual iMovie pass. |
| Hear start of **next** paragraph | Source clip boundaries wrong — check `alignment-report.json`; tighten phrase splits; manual clip edit. |
| Section missing audio | No Whisper match — add keywords to `SECTION_KEYWORDS` in `merge-narration.mjs` or assign clip manually. |
| ffmpeg eats path in loops | Always **` -nostdin`** in bash loops calling ffmpeg. |
| Upload too slow | Use **`*-upload.mp4`**, not iMovie master. |

---

## Related

- [`owner-runbook.md`](owner-runbook.md) — repair publish, testimonials, images
- [`publish-content-guards.md`](publish-content-guards.md) — social/website caps (different from long video)
- Cursor rule: [`.cursor/rules/video-narration-workflow.mdc`](../.cursor/rules/video-narration-workflow.mdc)
