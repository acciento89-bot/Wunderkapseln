/**
 * React Native lifecycle bridge. AppState and Android window focus are distinct
 * gates: the notification drawer can blur the window without backgrounding it.
 * The boundary is injected so the real game/controller can be tested offline.
 */
export function attachNativeRuntime({ controller, appState, platform,
  schedule = setInterval, cancel = clearInterval }) {
  let state = appState.currentState;
  let focused = true;
  let foreground;
  let timer = null;
  let disposed = false;
  const subscriptions = [];

  function stopTimer() {
    if (timer !== null) { cancel(timer); timer = null; }
  }
  function reconcile() {
    if (disposed) return;
    const next = state === 'active' && (platform !== 'android' || focused);
    if (next === foreground) return;
    foreground = next;
    stopTimer();
    // This accounts for time up to the interruption, cancels animation/sounds,
    // checkpoints the attempt, and leaves a pause/result dialog for the player.
    controller.setForeground(next);
    if (next) timer = schedule(() => {
      if (!disposed && foreground) controller.tick();
    }, 250);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    stopTimer();
    for (const subscription of subscriptions) subscription.remove();
    if (foreground !== false) controller.setForeground(false);
    foreground = false;
  }
  try {
    subscriptions.push(appState.addEventListener('change', next => {
      if (disposed) return;
      state = next; reconcile();
    }));
    if (platform === 'android') {
      subscriptions.push(appState.addEventListener('blur', () => {
        if (disposed) return;
        focused = false; reconcile();
      }));
      subscriptions.push(appState.addEventListener('focus', () => {
        if (disposed) return;
        focused = true; reconcile();
      }));
    }
    reconcile();
  } catch (error) {
    dispose();
    throw error;
  }
  return dispose;
}
