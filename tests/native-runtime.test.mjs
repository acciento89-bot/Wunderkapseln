import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameController } from '../core/controller.mjs';
import { createFeedbackDriver } from '../core/feedback.mjs';
import { legalMoves } from '../core/game.mjs';
const runtime = await import('../native/runtime.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});

// Boundary simulator for React Native AppState, with production controller/accounting.
// Not a native-device test and not a substitute for OS event delivery validation.
async function fixture(platform = 'android', initialState = 'active') {
  let now = 0; let nextTimer = 1;
  const listeners = new Map(), timers = new Map(), cancelled = [], data = new Map();
  const appState = {
    currentState: initialState,
    addEventListener(name, listener) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(listener);
      return {remove: () => listeners.get(name).delete(listener)};
    },
  };
  const c = new GameController({
    storage: {getItem: async key => data.get(key) ?? null, setItem: async (key, value) => {data.set(key, value);}},
    now: () => 1800000000000 + now, monotonic: () => now,
  });
  await c.initialize(); c.preference('reducedMotion', true); c.activate('time10'); c.play();
  assert.equal(typeof runtime.attachNativeRuntime, 'function', 'native lifecycle adapter must be implemented');
  const dispose = runtime.attachNativeRuntime({controller:c, appState, platform,
    schedule: fn => {const id=nextTimer++; timers.set(id,fn); return id;},
    cancel: id => {cancelled.push(id); timers.delete(id);},
  });
  const emit = (name, value) => {
    if(name === 'change') appState.currentState = value;
    for (const listener of [...(listeners.get(name) || [])]) listener(value);
  };
  return {c, dispose, emit, listeners, timers, cancelled, advance:ms => {now+=ms;}, pulse:() => {for(const fn of [...timers.values()])fn();}};
}

test('Android notification blur pauses the real game without an AppState change', async () => {
  const f=await fixture(); f.advance(100); f.emit('blur');
  assert.equal(f.c.foreground,false); assert.equal(f.c.state.modal,'pause');
  assert.equal(f.timers.size,0); assert.equal(f.c.state.session.profile.unlimitedSeconds,599.9);
  const game=f.c.state.session.game; f.advance(10000); f.pulse();
  await f.c.move(...legalMoves(game)[0]);
  assert.deepEqual(f.c.state.session.game,game); assert.equal(f.c.state.session.profile.unlimitedSeconds,599.9);
  f.dispose();
});

test('focus does not auto-resume a paused attempt or deduct the interruption', async () => {
  const f=await fixture(); f.emit('blur'); f.advance(20000); f.emit('focus'); f.pulse();
  assert.equal(f.c.foreground,true); assert.equal(f.c.state.modal,'pause');
  assert.equal(f.c.state.session.profile.unlimitedSeconds,600);
  f.c.resume(); f.advance(250); f.pulse();
  assert.equal(f.c.state.session.profile.unlimitedSeconds,599.75);
  f.dispose();
});

test('background status and focus are independent gates in either event order', async () => {
  const f=await fixture(); f.emit('blur'); f.emit('change','background'); f.emit('focus');
  assert.equal(f.c.foreground,false); assert.equal(f.timers.size,0);
  f.emit('change','active'); assert.equal(f.c.foreground,true);
  f.emit('blur'); f.emit('change','background'); f.emit('change','active');
  assert.equal(f.c.foreground,false); f.emit('focus'); assert.equal(f.c.foreground,true);
  f.dispose();
});

test('iOS inactive interrupts time and retains explicit resume after returning', async () => {
  const f=await fixture('ios'); assert.equal(f.listeners.has('blur'),false);
  f.emit('change','inactive'); f.advance(5000); f.emit('change','active'); f.pulse();
  assert.equal(f.c.foreground,true); assert.equal(f.c.state.modal,'pause');
  assert.equal(f.c.state.session.profile.unlimitedSeconds,600); f.dispose();
});

test('unknown initial state remains paused until an active event', async () => {
  const f=await fixture('ios',null);
  assert.equal(f.c.foreground,false); assert.equal(f.timers.size,0);
  f.emit('change','active'); assert.equal(f.timers.size,1); f.dispose();
});

test('duplicate focus and active events never create additional timers', async () => {
  const f=await fixture(); for(let i=0;i<10;i++){f.emit('focus');f.emit('change','active');}
  assert.equal(f.timers.size,1); f.emit('blur'); f.emit('blur');
  assert.equal(f.cancelled.length,1); f.dispose();
});

test('cleanup is idempotent and stale timers and callbacks cannot reactivate the game', async () => {
  const f=await fixture(); const staleTick=[...f.timers.values()][0]; const staleFocus=[...f.listeners.get('focus')][0];
  f.dispose(); f.dispose(); const before=f.c.state; f.advance(10000); staleTick(); staleFocus();
  assert.equal(f.c.foreground,false); assert.equal(f.c.state,before);
  assert.equal([...f.listeners.values()].reduce((n,set)=>n+set.size,0),0); assert.equal(f.timers.size,0);
});

test('interruption retains a terminal result and never charges another life', async () => {
  const f=await fixture(); const lives=f.c.state.session.profile.lives;
  f.c.emit({session:{...f.c.state.session,game:{...f.c.state.session.game,status:'lost'},settled:true},busy:true,modal:null});
  f.emit('blur'); f.emit('focus'); assert.equal(f.c.state.modal,'result');
  assert.equal(f.c.state.busy,false); assert.equal(f.c.state.session.profile.lives,lives); f.dispose();
});

test('Android blur stops ability sounds and cancels a scheduled victory fanfare', async () => {
  const f=await fixture(), cues=[], scheduled=new Map(); let stopped=0,id=0;
  const driver=createFeedbackDriver({play:async cue=>{cues.push(cue);},stop:()=>{stopped++;}}, {
    schedule:(fn)=>{scheduled.set(++id,fn);return id;}, cancel:key=>scheduled.delete(key),
  });
  const unsubscribe=f.c.subscribe(()=>{void driver.update(f.c.state,f.c.foreground);});
  await driver.update(f.c.state,f.c.foreground);
  f.c.emit({feedback:{id:1,cue:'mega',followups:[{cue:'win',delayMs:350}]}});
  assert.deepEqual(cues,['mega']); assert.equal(scheduled.size,1);
  f.emit('blur'); assert.equal(stopped,1); assert.equal(scheduled.size,0);
  f.emit('focus'); f.c.resume(); assert.deepEqual(cues,['mega']);
  unsubscribe(); driver.dispose(); f.dispose();
});

test('native entry uses the tested runtime rather than a separate unmanaged interval', () => {
  const source=readFileSync(new URL('../App.js',import.meta.url),'utf8');
  assert.match(source,/attachNativeRuntime\(\{\s*controller,\s*appState:\s*AppState,\s*platform:\s*Platform\.OS\s*\}\)/);
  assert.doesNotMatch(source,/setInterval\(\(\)=>controller\.tick/);
});
