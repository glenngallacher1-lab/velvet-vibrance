# Stage Loop — AI Video Generation Prompt

Prompt for **Google Veo 3, OpenAI Sora, Runway Gen-3, or Luma Dream Machine**. Generates the lofi background loop that plays behind Glenn on stage. Logos are **not** part of the generated video — they're composited on top in `stage/loop.html`. Text and logos come out unreliable from every current AI video model, so keep them separate.

---

## The prompt (copy from here down to the next `---`)

```
A cinematic, dreamy lofi loop for a house-music DJ's stage backdrop. 16:9, 4K, seamless start-to-end for infinite looping.

Scene: a slow, hypnotic drift through warm hazy atmosphere. Ambient particles of golden dust float in soft focus. Deep plum-red and midnight-purple background with rich warm-gold accents. Palette: #14090b (deep plum-black), #050303 (near-black), #E8B547 (warm gold), #f5ede0 (aged cream, sparingly). Muted volumetric light beams filter through low fog, like a dim vinyl-record-store meets a velvet-curtained late-night lounge.

Mood: the warm-up hour before a house set — contemplative, elegant, unhurried, sensual. Analog softness. Very light film grain, subtle chromatic aberration. VHS-era warmth without being retro-kitsch.

Motion: extremely slow drift. Particles float upward and gently right. A subtle radial pulse in the light like a slow breath — one pulse every two seconds, matching a ~30 BPM half-time feel over a 120 BPM track. No cuts. Camera creeps forward at 5% speed. Everything breathes.

Composition: darker vignette in the centre so a logo can sit cleanly on top. Motes and light concentrated at the edges. Rule-of-thirds respected. Deep central negative space.

Rendering: 8-second seamless loop. First frame identical to last frame. 24 fps for cinematic feel. Rich deep blacks that never crush. Warm colour grade — think Roger Deakins lighting a Blade Runner 2049 nightclub scene.

DO NOT include: people, faces, text, letters, numbers, logos, brand marks, bright high-contrast spots, quick cuts, harsh motion, cool colour tints, blue light. Nothing recognisable — the video is a mood, not a scene.
```

---

## Platform-specific tweaks

Different models respond to different keywords. Small adjustments per platform:

### Google Veo 3
- Add `duration: 8s, aspect: 16:9, loop-friendly` at the end.
- Veo handles motion best of the lot — the "extremely slow drift" instruction lands cleanly.
- Free tier via [labs.google/fx](https://labs.google/fx) or through Gemini Advanced.

### OpenAI Sora
- Add `style: cinematic film grain, anamorphic 2.39:1 letterbox optional`.
- Sora can go up to 20s but 8s stays sharper.
- Access via ChatGPT Plus or Sora.com.

### Runway Gen-3 (or Gen-4)
- Split the prompt into `[scene description]` + `[motion description]` — Runway parses those separately.
- Set "seed" the same across generations so you can iterate on the same base.
- Runway supports "extend" — generate 4s, then extend twice for 12s, then trim to a seamless 8s loop in DaVinci Resolve.

### Luma Dream Machine
- Prepend `Ultra-slow motion,` — Luma tends to speed things up otherwise.
- Use the loop toggle in the Luma UI (not the same as prompt-side "seamless"). Best of the current models for out-of-the-box seamless loops.

---

## After you generate it

1. Download the MP4 the tool gives you.
2. Rename it `loop.mp4`.
3. Drop it into `stage/` (this folder).
4. Open `stage/loop.html` in your browser — it'll play, loop forever, and show the logo overlay if you add logo files.

## Logo files (optional)

The player looks for two transparent PNGs in the repo root:

- `vv-logo.png` — Velvet Vibrance mark
- `stanzza-logo.png` — Stanzza mark

If either is missing the player silently hides it. Recommended: white or warm-gold logos on transparent background, ~800×400px, minimal detail so they read from the back of a room.

## Iterating on the loop

If the first generation feels wrong, adjust these levers in the prompt (not the whole thing):

- **Too busy?** Reduce "ambient particles of golden dust" → "occasional slow motes of gold".
- **Too dark?** Change `#050303` → `#0f0808` and `Muted volumetric` → `Soft volumetric`.
- **Too fast?** Add `absolutely no camera motion, only ambient light shifts`.
- **Wrong palette?** Swap hex codes — the model treats these more literally than you'd expect.
- **Not looping cleanly?** Ask for "the first frame and last frame are pixel-identical; the drift wraps around". If it still won't loop, generate 2s longer than needed and crossfade the ends in a video editor.
