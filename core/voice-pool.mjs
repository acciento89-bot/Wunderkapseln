/** Bounded concurrent voices, including pending asynchronous starts. Platform-neutral. */
export function createVoicePool(adapter, { maxVoices = 3 } = {}) {
  if (!Number.isInteger(maxVoices) || maxVoices < 1 || maxVoices > 8) throw new RangeError('Invalid voice capacity');
  const voices = [];
  let disposed = false;
  function remove(voice, stop) {
    const index = voices.indexOf(voice);
    if (index < 0) return;
    voices.splice(index, 1);
    if (stop) { try { adapter.stop(voice.cue); } catch { /* Released device. */ } }
  }
  const stop = () => { for (const voice of [...voices]) remove(voice, true); };
  return {
    async play(cue) {
      if (disposed || typeof cue !== 'string') return false;
      const previous = voices.find(voice => voice.cue === cue);
      if (previous) remove(previous, true);
      while (voices.length >= maxVoices) remove(voices[0], true);
      const voice = { cue };
      voices.push(voice);
      const isCurrent = () => !disposed && voices.includes(voice);
      try {
        const started = await adapter.start(cue, { isCurrent, onEnded: () => remove(voice, false) });
        if (started === false) remove(voice, true);
        return started !== false && isCurrent();
      } catch { remove(voice, true); return false; }
    },
    stop,
    dispose() { disposed = true; stop(); },
  };
}
