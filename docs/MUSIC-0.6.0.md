# Original garden music — 0.6.0

The mobile game adds an original, deterministic 32-second composition: twelve bars at 90 BPM with soft arpeggios and low accompaniment. `ui/music.mjs` synthesizes mono 22050 Hz, 16-bit PCM. `npm run assets` regenerates `assets/music/wonder-garden.wav`; no downloaded recording or external licence is required. The existing fourteen sound effects stay unchanged.

One hook-owned Expo Audio player loops at volume 0.18. A separate persistent Music setting defaults on for existing saves and does not change the Sound effects preference. Foreground loss, campaign dialogs and a paused rescue stop playback. Native audio configuration failures stay cosmetic; stale async setup cannot start playback after pause or disposal. Cleanup pauses the player and lets the hook release its own resource.

Verified: deterministic PCM container, bounded peak and nonzero RMS, silent loop endpoints, independent saved preference and old-save migration, lifecycle policy and async cancellation. These checks establish source behavior and audio data, not audible playback or actual device acceptance. Native Android acceptance is a separate release gate. Browser preview remains an engine/UI preview without the new native music player.
