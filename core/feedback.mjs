/** Sound plans are cosmetic; they never consume moves, mutate boards or grant items. */
export function feedbackFor(result, kind = 'move') {
  if (!result?.ok) return null;
  if (result.game.status === 'won') return 'win';
  if (result.game.status === 'lost') return 'lost';
  if (kind === 'wonder') return 'wonder';
  return result.frames.length >= 3 ? 'combo' : 'match';
}
const SPECIALS = new Set(['row', 'column', 'bomb', 'prism']);
function activatedSpecials(result, frame, index) {
  const found = (frame.cleared || []).map(i => frame.before?.[i]?.special).filter(s => SPECIALS.has(s));
  // A directly swapped prism is suppressed by the resolver to avoid a second blast.
  // Merge multisets, not sets: two rockets are a combo, one reported twice is not.
  if (index === 0) {
    const direct = (result.triggeredSpecials || []).filter(s => SPECIALS.has(s));
    for (const special of SPECIALS) {
      const missing = direct.filter(s => s === special).length - found.filter(s => s === special).length;
      for (let n = 0; n < missing; n++) found.push(special);
    }
  }
  return found;
}
export function feedbackPlan(result, { kind = 'move', initialCharge = 0, milestone = false } = {}) {
  if (!result?.ok) return { frames: [], settled: [] };
  const frames = (result.frames || []).map((frame, index) => {
    if (frame.rescue || frame.reshuffled) return null;
    if (index === 0 && kind === 'wonder') return ['wind', 'tide', 'bloom'].includes(result.wonder) ? result.wonder : 'wonder';
    const specials = activatedSpecials(result, frame, index);
    if (specials.length >= 2) return 'mega';
    if (specials.includes('prism')) return 'prism';
    if (specials.includes('bomb')) return 'bomb';
    if (specials.length) return 'rocket';
    return frame.combo >= 3 ? 'combo' : 'match';
  });
  const settled = [];
  if (result.game.status === 'won') settled.push('win');
  else if (result.game.status === 'lost') settled.push('lost');
  else if (initialCharge < 100 && result.game.charge >= 100 && !result.game.wonderUsed) settled.push('charge');
  if (milestone && result.game.status === 'won') settled.push('restoration');
  return { frames, settled };
}
/** Compress cosmetic feedback without making reduced-motion users wait for animations. */
export function compactFeedback(plan) {
  const priority = ['wind', 'tide', 'bloom', 'wonder', 'mega', 'prism', 'bomb', 'rocket', 'combo', 'match'];
  const effect = priority.find(cue => plan.frames.includes(cue));
  const cues = [...(effect ? [effect] : []), ...plan.settled];
  if (!cues.length) return null;
  let delayMs = 0;
  const followups = cues.slice(1).map((cue, index) => {
    delayMs += cues[index] === 'win' ? 950 : 350;
    return { cue, delayMs };
  });
  return { cue: cues[0], followups };
}
export function createFeedbackDriver(adapter, { schedule = setTimeout, cancel = clearTimeout } = {}) {
  let lastId = 0, enabled = false, disposed = false;
  const pending = new Set();
  const clearPending = () => { for (const timer of pending) cancel(timer); pending.clear(); };
  const stop = () => { clearPending(); try { adapter.stop(); } catch { /* Released audio device. */ } };
  const play = async cue => { try { await adapter.play(cue); return true; } catch { return false; } };
  return {
    async update(state, foreground) {
      if (disposed) return false;
      const allowed = Boolean(state.loaded && foreground && state.screen === 'game' &&
        state.session.profile.sound !== false && (!state.modal || state.modal === 'result'));
      if (enabled && !allowed) stop();
      enabled = allowed;
      const event = state.feedback;
      if (!event || !Number.isInteger(event.id) || event.id <= lastId) return false;
      lastId = event.id;
      clearPending();
      if (!allowed) return false;
      const id = event.id;
      for (const follow of (event.followups || []).slice(0, 3)) {
        if (typeof follow.cue !== 'string' || !Number.isFinite(follow.delayMs) || follow.delayMs < 0 || follow.delayMs > 3000) continue;
        const timer = schedule(() => {
          pending.delete(timer);
          if (!disposed && enabled && id === lastId) void play(follow.cue);
        }, follow.delayMs);
        pending.add(timer);
      }
      return typeof event.cue === 'string' ? play(event.cue) : false;
    },
    dispose() { disposed = true; enabled = false; stop(); },
  };
}
