# Repair video workflow

How to turn phone clips and photos of a repair into a main YouTube video, a few vertical Shorts and a thumbnail, then the YouTube copy and a website project.

**Each repair is different.** Clip choice, length, speed, cuts and captions are decided for that job. Do not copy another video's timestamps, shots or music treatment. An older job's build scripts are a toolbox, not a template.

**Do not commit raw video** to this repo. Keep clips, exports and build scripts in the job's folder (Downloads or USB). Only story stills and `config.json` come into `projects/` when a website project is added.

---

## The usual sequence

1. **Analyse** every clip and photo. Say what each one shows, and ask about anything unclear.
2. **Main video preview** at 960×540, with captions and music.
3. **Propose Shorts** and build them at full size.
4. **Thumbnail** for the main video.
5. The owner reviews. Fix what they flag, then render the **main video final** at 1080p.
6. **YouTube copy** (titles, descriptions, tags, release plan) drafted in chat. The owner uploads.
7. When they send the links, **add the website project** and publish when asked.

Steps 2 to 4 can be delivered together for one review round.

---

## Where the files live

```
toy repair/<this repair>/
  IMG_* / VID_*                       # phone photos and clips
  *.mp3                               # background music the owner adds
  narrative*.m4a                      # voiceover, only if the owner records one
  export/
    build_main.py                     # main video builder (--final for 1080p)
    build_shorts.py                   # Shorts builder
    <name>-main-preview.mp4           # 960x540 review copy
    <name>-main-final.mp4             # 1920x1080 upload copy
    <name>-long-thumbnail.jpg         # Comic Split thumbnail
    shorts/<name>-short-N-<slug>.mp4  # 1080x1920 Shorts
    <name>-youtube-upload-details.md  # titles, descriptions, tags, release plan
```

ffmpeg and ffprobe live in `~/.local/bin`. Always pass **`-nostdin`** in loops, or ffmpeg eats the loop's input. In zsh, a glob with no matches aborts the whole command line, so list files explicitly.

---

## 1. Analyse the material

- Probe every clip for length, size, **rotation metadata** and audio.
- Make contact sheets: photos by capture time, and frames from each clip (about 16 per clip).
- Match the footage to the owner's description of the repair. Say what each clip shows, and ask about anything you had to guess, such as a tool, a liquid or which part was replaced.
- Find the **demo clip**: the finished toy working, played through at normal speed. Note when the action happens in it.
- Check every frame you plan to use for **customer details** (postage labels, names, addresses) and for screens showing personal content. Crop them out or leave the shot out.

## 2. Main video

**Frame:** 1920×1080 at 30 fps for the final, 960×540 for the preview.

**Story:** arrival and what's wrong, the cause, the repair in order, reassembly, then the demo. Cover the whole repair, not only the first clips.

**Captions, not voiceover, by default.** One descriptive sentence per shot, in a black rounded box at about 60% opacity, with white Arial Rounded Bold text. The box is bottom centre, at most two lines, and fades in and out with its shot. Don't use step titles unless the owner asks. If the owner records a voiceover instead, place each line on its picture and keep the voice clearly louder than the music.

**Photos:** shown in full over a blurred, darkened copy of the same photo, with a slow zoom in or out. Each one stays on screen for at least the time it takes to read the caption (about 16 characters per second, plus a second).

**Clips:**
- Rotate overhead clips so they fill the frame, unless the content is clearly better upright. Portrait clips sit over a blurred, darkened fill.
- Speed up long process clips (2× to 20×) so each shot runs about 4 to 10 seconds.
- When speeding up, limit the **source** first (`-ss` and `-t` before `-i`), then use `setpts`.

**Demo:**
- Plays at normal speed, **with its own sound** when the sound matters, as when sound was part of the repair.
- Duck the music to about a quarter under it.
- Split it into a few shots so captions can land on the action ("Now it waits...", "...and it jumps!"), with no caption in between.

**Outro:** the last caption is "Thanks for watching, and see you next time for the next repair!"

**Music:** use the track the owner adds. If none is added, use a track from `Downloads/bgm/` and say so. The music runs under the whole video with a short fade in and a 3.5-second fade out. Loop it with crossfades only when it is shorter than the video. Loudness: about −16 LUFS for the main video, −14 LUFS for Shorts, with a limiter.

**Cuts:** times refer to the **current** picture. After each change, later times move. Keep a per-shot index (`index.json`) so feedback like "the slide at 1:37" maps to a shot.

## 3. Shorts

Propose **two or three**, each with its own angle. For example:
- **Explainer** (30 to 45 seconds): the cause and the fix, ending on the demo.
- **Fast montage** (15 to 25 seconds): very short captions like "Taken apart", "Restuffed", "Good as new".
- **Single wow moment:** the one surprising step.

Build them all, then drop any that don't make sense on their own. The owner may keep only some.

- **Frame:** 1080×1920 at 30 fps. Crop each landscape clip to the subject with a per-shot horizontal focus. Show whole landscape photos ("fit") over a blurred fill.
- **Captions:** the same black rounded box, larger text, centred at about y = 1400, which is clear of the Shorts interface.
- **Sound:** music starts at an interesting point in the track. The demo keeps its own sound.
- If the owner already posted a demo Short, don't make another plain demo.

Check each Short with a contact sheet showing one frame per shot. Look for subjects cropped out of frame or shots that are too zoomed in.

## 4. Thumbnail

Follow [youtube-thumbnail-style-guide.md](youtube-thumbnail-style-guide.md) (Comic Split) and run `scripts/make-youtube-thumbnail.py`.

- Use real photos or sharp video frames.
- **No blurred fill** in thumbnails. If no photo fits, take a frame from the video.
- The before side shows the problem. The after side shows the toy working, with its face visible.
- Save it as `<name>-long-thumbnail.jpg` in `export/`.

## 5. Review and final

- Report: video length, what each Short is for, anything you guessed, and anything not checked. Frames and audio levels are checked, but nobody has watched the video at full speed.
- Files over about 30 MB only open in the desktop app on the Mac. Say so.
- After approval, run `build_main.py --final`.
- `node scripts/compress-video-for-upload.mjs "<file>"` makes a smaller copy, about 5 Mbps at 1080p, if the upload needs one.

## 6. YouTube copy

Draft this in chat and save it to `<name>-youtube-upload-details.md`. The owner uploads.

- **Title:** the problem and the repair, with the shop name.
- **Description:** a short story, then chapters (starting at `0:00`, each at least 10 seconds), then `https://sptoydoctor.com.au/`. Swap in the project page URL once it is live.
- **Hashtags** at the end of the description. YouTube shows the first three above the title.
- **Studio tags** with no `#`.
- **Release plan:** the main video first, then the Shorts spaced a few days apart. Each Short links to the main video as its related video.

When the owner sends the links, store `youtubeUrl`, and store `youtubeShortUrl` plus `additionalYoutubeUrls` for the Shorts.

## 7. Website project

Only when the owner asks. Follow the usual project flow: before, WIP and after photos (bench photos or sharp video frames), `config.json`, and status `WIP`. Publish only after `DONE` and `publish <id> to webpage`. Never commit raw video.

---

## Say in chat

| You say | Agent does |
|---------|------------|
| **Create the video for <repair>** | Steps 1 to 4: analysis, main preview, proposed Shorts, thumbnail. |
| **Use this BGM** | Swap the music into the main video and the Shorts. |
| **Remove the slide at 1:37** | Map the time to a shot through the index, cut it, and re-render. |
| **Render final** | Main video at 1080p. |
| **Prepare them** | YouTube titles, descriptions, tags and release plan. |
| **Add this project** | Website folder with status WIP and the YouTube links. |
| **Compress for YouTube** | `node scripts/compress-video-for-upload.mjs "/path/to/video.mp4"` |
