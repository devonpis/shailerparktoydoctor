# Repair video — generic approach

How to turn phone clips of a repair into a landscape video with kid narration, then optional YouTube copy and a website project.

**Each repair is different.** Clip choice, length, speed, cuts, and what the narration says are decided for that job. Do not copy another video’s timestamps, which shots to keep, or how the music was treated.

**Do not commit raw video** to this repo. Keep clips, exports, and one-off scripts in a local folder (Downloads or USB). Only story stills and `config.json` come into `projects/` when a website project is added.

---

## Where the files live

```
toy repair/<this repair>/
  IMG_* / VID_*                 # phone photos and clips
  narrative*.m4a                # kid narration (one take, or one file per line)
  *.mp3                         # background music, only if the owner adds a track
  export/
    <name>-landscape.mp4        # picture only
    <name>-with-narration.mp4   # picture + voice (+ music if added)
    narration-script-*.txt      # lines to read
    narration-script-*.md       # same lines with times on this cut
```

Working scripts may sit in `export/` for that folder. An older job’s scripts are a toolbox, not a template.

ffmpeg and ffprobe: `~/.local/bin` (add `export PATH="$HOME/.local/bin:$PATH"`). In shell loops, pass **`-nostdin`**.

---

## 1. Picture

1. Look at **every** clip the owner provided (length and what it shows). The montage has to cover the **whole repair** — taking it apart and putting it back — not only the first file.
2. Usual frame: **1920×1080 landscape, 30 fps**. Fix phone rotation per clip. A demo clip may already be upright when the others are not.
3. Length follows the story. Speed up dull stretches **only when the owner wants** more of the process in a shorter video. Leave the moments they name (a close-up, the finished demo) at normal speed.
4. When speeding a clip up, limit the **source** first (`-ss` and `-t` before `-i`), then `setpts`. A duration limit after `-i` does not shorten a sped-up clip.
5. Opening still: what is wrong. A second still for the cause when the narration needs it. Ending: the finished toy working, usually the demo clip the owner names, played through at normal speed.
6. Cuts are times on the **current** picture. After each cut, later times move. Keep the picture-only file, then make a separate mixed file.

Concat lists must quote paths that contain spaces.

## 2. Script

Write short lines a child can read, one beat at a time: welcome and what is wrong, the cause, a key moment in the repair, reassembly starting, and the finished run. Save a plain script and a timestamped copy. Times belong to **this** cut and change if the picture changes.

## 3. Narration

The owner records. One continuous take **or** one file per line — use whichever they added.

Place each line on its picture. When they ask the opening stills to match the recording, set each still to **the spoken length plus about one second**, then shift the later lines with the picture.

A single take can be aligned by ear, or with a transcript (Whisper) plus a manual pass. Auto alignment is a draft.

## 4. Music

Only if the owner supplies a track.

Keep the **voice clearly louder** than the music. Do **not** loop the track and do **not** fade it unless they ask. If the track is shorter than the picture, let it end.

## 5. YouTube

Draft in chat only. The owner uploads.

- **Title** — the problem and the repair, with the shop name.
- **Description** — a short story, then chapters (`0:00` first, each chapter at least 10 seconds), then `https://sptoydoctor.com.au/`. A project page URL replaces the homepage only after that story is live.
- **Hashtags** at the end of the description (YouTube shows the first three above the title).
- **Studio tags** with no `#`.

When they send a link, store `youtubeUrl` and, if they made a Short, `youtubeShortUrl`. A Short is a separate upload. A landscape demo will not sit on the Shorts shelf unless it is vertical or square.

## 6. Website project

Only when they ask to add the project. Copy `projects/0000 - template/`, add `before` / `after` / `WIP-###` (and `hero` only if they name that file). Fill `config.json`. Leave **`status` as `WIP`**. Do not build the story page or publish until they set **DONE** and say `publish <id> to webpage`.

Stills can be bench photos or frames from the finished video (`scripts/extract-video-frames.mjs`). Run `scripts/optimize-project-images.mjs <id>` on large images. No raw video in git.

---

## Say in chat

| You say | Agent does |
|---------|------------|
| **Edit this repair video** | Picture from the clips in that folder, using the steps above. Confirm length and what must stay at normal speed if it is not already clear. |
| **Script for my kid** | Lines matched to the current picture. |
| **Add the narration** (and music, if present) | Mix onto the picture. Voice louder than music. No loop or fade unless asked. |
| **Fit the slides to the narration** | Opening stills = spoken length + about 1 second; move later cues. |
| **YouTube title, description, tags** | Draft in chat. No upload. |
| **Add this project** | Website folder, status **WIP**, no publish until asked. |
| **Compress for YouTube** | `node scripts/compress-video-for-upload.mjs "/path/to/video.mp4"` → sibling `*-upload.mp4` (1080p, about 5 Mbps). |

Publishing the repair on the **website or social** is still `publish <id> to …`, after **DONE** and a preview.
