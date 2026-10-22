/** Restoration is derived from unique campaign wins, never from purchases or replay count. */
export const RESTORATION_STEPS = Object.freeze([8, 16, 24, 32, 40]);
export function restorationFor(profile, world) {
  if (!Number.isInteger(world) || world < 0 || world >= 12) throw new RangeError('World must be 0..11');
  const first = world * 40 + 1;
  let completed = 0;
  for (let id = first; id < first + 40; id++) {
    if (Number.isInteger(profile.stars[id]) && profile.stars[id] >= 1 && profile.stars[id] <= 3) completed++;
  }
  const stage = RESTORATION_STEPS.filter(boundary => completed >= boundary).length;
  const nextAt = RESTORATION_STEPS[stage] ?? null;
  return { world, completed, stage, nextAt, remaining: nextAt === null ? 0 : nextAt - completed,
    detail: stage === 5 ? null : `detail${world}_${stage + 1}` };
}
export function milestoneReached(before, after, world) {
  const previous = restorationFor(before, world), current = restorationFor(after, world);
  return current.stage > previous.stage ? { world, stage: current.stage, detail: `detail${world}_${current.stage}` } : null;
}
