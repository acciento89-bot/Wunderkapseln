import { synthesize } from '/ui/sounds.mjs';
import { createVoicePool } from '/core/voice-pool.mjs';

/** Lazy local Web Audio. No network, recordings, autoplay, or background playback. */
export function createBrowserAudio() {
  let context = null, output = null, disposed = false;
  const buffers = new Map(), sources = new Map();
  async function unlock() {
    if (disposed) return;
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) return;
    if (!context) {
      context = new Audio();
      output = context.createGain(); output.gain.value = .5; output.connect(context.destination);
    }
    if (context.state === 'suspended') await context.resume();
  }
  const pool = createVoicePool({
    async start(cue, { isCurrent, onEnded }) {
      await unlock();
      if (disposed || !isCurrent() || !context || context.state !== 'running') return false;
      let buffer = buffers.get(cue);
      if (!buffer) {
        const pcm = synthesize(cue, 22050);
        buffer = context.createBuffer(1, pcm.length, 22050);
        buffer.copyToChannel(pcm, 0); buffers.set(cue, buffer);
      }
      const next = context.createBufferSource(); next.buffer = buffer; next.connect(output);
      next.onended = () => {
        next.disconnect(); if (sources.get(cue) === next) sources.delete(cue); onEnded();
      };
      sources.set(cue, next); next.start(); return true;
    },
    stop(cue) {
      const source = sources.get(cue);
      if (source) {
        sources.delete(cue);
        try { source.stop(); } catch { /* Already ended. */ }
        source.disconnect();
      }
    },
  });
  return {
    unlock,
    play: cue => pool.play(cue),
    stop: () => pool.stop(),
    dispose() {
      disposed = true; pool.dispose(); buffers.clear();
      if (context) void context.close().catch(() => {});
    },
  };
}
