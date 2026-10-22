import test from 'node:test';
import assert from 'node:assert/strict';
import { GameController } from '../core/controller.mjs';
import { legalMoves } from '../core/game.mjs';

async function setup() {
  let monotonic = 0;
  const data = new Map();
  const c = new GameController({
    storage: { getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); } },
    now: () => 1800000000000 + monotonic, monotonic: () => monotonic,
  });
  await c.initialize(); c.play();
  return { c, advance: ms => { monotonic += ms; } };
}

test('animation duration is not deducted from active-play time after settling', async () => {
  const {c, advance} = await setup(); c.activate('time10');
  // Replace only the wall-clock animation driver, not the game rules or accounting.
  c.tween = async (duration, token, render) => { advance(duration); render(1); };
  await c.move(...legalMoves(c.state.session.game)[0]);
  c.tick();
  assert.equal(c.state.session.profile.unlimitedSeconds, 600);
  assert.equal(c.state.busy, false);
});

test('finishing an animation keeps charging subsequent real play time', async () => {
  const {c, advance} = await setup(); c.activate('time10');
  advance(100); c.tick();
  c.tween = async (duration, token, render) => { advance(duration); render(1); };
  await c.move(...legalMoves(c.state.session.game)[0]);
  advance(300); c.tick();
  assert.ok(Math.abs(c.state.session.profile.unlimitedSeconds - 599.6) < 1e-9);
});

test('activating a time pack does not charge time before activation', async () => {
  const {c, advance} = await setup();
  advance(200); c.activate('time10'); c.tick();
  assert.equal(c.state.session.profile.unlimitedSeconds, 600);
  advance(100); c.tick();
  assert.equal(c.state.session.profile.unlimitedSeconds, 599.9);
});

test('switching to reduced motion mid-animation does not retroactively bill animation time', async () => {
  const {c, advance} = await setup(); c.activate('time10');
  c.tween = async () => { advance(180); c.setSystemReducedMotion(true); };
  await c.move(...legalMoves(c.state.session.game)[0]);
  c.tick();
  assert.equal(c.state.session.profile.unlimitedSeconds, 600);
  assert.equal(c.state.busy, false);
});

test('world ability accounts for active time before, but not during, its animation', async () => {
  const {c, advance} = await setup(); c.activate('time10');
  c.emit({session: {...c.state.session, game: {...c.state.session.game, charge:100}}});
  c.wonder(); advance(150);
  c.tween = async (duration, token, render) => { advance(duration); render(1); };
  await c.tap(0); c.tick();
  assert.equal(c.state.session.game.wonderUsed, true);
  assert.ok(Math.abs(c.state.session.profile.unlimitedSeconds - 599.85) < 1e-9);
});
