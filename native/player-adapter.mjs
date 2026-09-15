/**
 * Adapter for hook-owned expo-audio players. A seek is asynchronous and cannot
 * be undone by pause(): serialize operations on each player so an old seek
 * cannot complete after a replacement has already started playing.
 * No React or native SDK imports here; the hardware boundary is injectable.
 */
export function createNativePlayerAdapter(players, { configured = Promise.resolve(true) } = {}) {
  const ready = Promise.resolve(configured).then(value => value === true, () => false);
  const tails = new Map(), generations = new Map();
  let disposed = false;
  const known = cue => typeof cue === 'string' && Object.hasOwn(players, cue);
  function stop(cue) {
    if (!known(cue)) return;
    generations.set(cue, (generations.get(cue) || 0) + 1);
    try { players[cue].pause(); } catch { /* A hook-owned player may be released. */ }
  }
  return {
    start(cue, { isCurrent }) {
      if (disposed || !known(cue) || !isCurrent()) return Promise.resolve(false);
      const generation = generations.get(cue) || 0;
      const current = () => !disposed && isCurrent() && generation === (generations.get(cue) || 0);
      const operation = (tails.get(cue) || Promise.resolve()).then(async () => {
        if (!current() || !(await ready) || !current()) return false;
        const player = players[cue];
        player.volume = .5;
        await player.seekTo(0);
        if (!current()) return false;
        player.play();
        return true;
      });
      // A failed native operation must not poison this player's future queue.
      const settled = operation.then(() => {}, () => {});
      tails.set(cue, settled);
      void settled.then(() => { if (tails.get(cue) === settled) tails.delete(cue); });
      return operation;
    },
    stop,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const cue of Object.keys(players)) stop(cue);
      // useAudioPlayer owns release; pending operations only observe cancellation.
    },
  };
}
