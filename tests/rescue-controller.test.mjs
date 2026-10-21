import test from 'node:test';import assert from 'node:assert/strict';
import {RescueController} from '../core/rescue-controller.mjs';
import {createRescueStore} from '../core/rescue-storage.mjs';
import {GameController} from '../core/controller.mjs';
import {createRescueBoundary} from '../core/rescue-boundary.mjs';
const memory=()=>{const d=new Map();return {d,async getItem(k){return d.get(k)??null;},async setItem(k,v){d.set(k,v);}};};
test('saved move commits before visible win; failed write holds exact result and retry only commits once',async()=>{
 const a=memory(),c=new RescueController({storage:a});await c.initialize();await c.start('rescue-01');const before=structuredClone(c.getSnapshot().journal);
 let fail=true;const set=a.setItem;a.setItem=async(k,v)=>{if(fail)throw Error('disk full');return set(k,v);};
 await c.move(56,57);assert.deepEqual(c.getSnapshot().journal,before);assert.ok(c.getSnapshot().pending);assert.ok(c.getSnapshot().error);assert.equal(await c.move(56,57),false);
 fail=false;await c.retry();assert.equal(c.getSnapshot().journal.game.status,'won');assert.deepEqual(c.getSnapshot().journal.completed,['rescue-01']);const revision=c.getSnapshot().journal.revision;
 await c.retry();assert.equal(c.getSnapshot().journal.revision,revision);assert.deepEqual((await createRescueStore(a).load()).completed,['rescue-01']);
});
test('cold unfinished attempt is held paused, later level locked and explicit restart does not discard on leave',async()=>{
 const a=memory(),c=new RescueController({storage:a});await c.initialize();assert.equal(await c.start('rescue-02'),false);await c.start('rescue-01');c.pause();
 const reloaded=new RescueController({storage:a});await reloaded.initialize();assert.equal(reloaded.getSnapshot().paused,true);assert.equal(reloaded.getSnapshot().journal.game.rescueId,'rescue-01');
 reloaded.resume();reloaded.setForeground(false);reloaded.setForeground(true);assert.equal(reloaded.getSnapshot().paused,true);assert.equal(await reloaded.move(56,57),false);
 reloaded.leave();assert.equal(reloaded.getSnapshot().journal.game.rescueId,'rescue-01');
});
test('mode boundary holds real classic attempt and paid inventory across rescue wins, blur and leaving',async()=>{
 const classic=new GameController({storage:memory(),now:()=>0,monotonic:()=>0}),rescue=new RescueController({storage:memory()});await classic.initialize();classic.play(1);await rescue.initialize();
 const old=structuredClone(classic.getSnapshot().session);const b=createRescueBoundary(classic,rescue);b.enter();await rescue.start('rescue-01');await rescue.move(56,57);b.setForeground(false);b.setForeground(true);b.tick();b.leave();
 assert.deepEqual(classic.getSnapshot().session,old);assert.equal(classic.getSnapshot().modal,'pause');assert.equal(rescue.getSnapshot().paused,true);
});
test('actual native lifecycle bridge routes Android focus gates through rescue without campaign clock spending',async()=>{
 const {attachNativeRuntime}=await import('../native/runtime.mjs');let time=0;const handlers=new Map();
 const classic=new GameController({storage:memory(),now:()=>time,monotonic:()=>time}),rescue=new RescueController({storage:memory()});await classic.initialize();classic.activate('time10');classic.play(1);await rescue.initialize();
 const boundary=createRescueBoundary(classic,rescue),state={currentState:'active',addEventListener(n,f){handlers.set(n,f);return {remove(){handlers.delete(n);}};}};
 const stop=attachNativeRuntime({controller:boundary,appState:state,platform:'android',schedule:()=>1,cancel:()=>{}});
 boundary.enter();const before=structuredClone(classic.getSnapshot().session);await rescue.start('rescue-01');
 // Existing regenerate() advances wall-clock lastSeenAt even while paused; paid and game facts must stay exact.
 const assertHeld=()=>{const current=structuredClone(classic.getSnapshot().session);assert.ok(current.profile.lastSeenAt>=before.profile.lastSeenAt);current.profile.lastSeenAt=before.profile.lastSeenAt;assert.deepEqual(current,before);};
 time=50000;handlers.get('blur')();handlers.get('focus')();boundary.tick();assert.equal(rescue.getSnapshot().paused,true);assert.equal(classic.foreground,false);assertHeld();
 boundary.leave();assert.equal(classic.getSnapshot().modal,'pause');assertHeld();stop();
});
async function deferredWriteFixture({started=true}={}){
 const a=memory(),c=new RescueController({storage:a});await c.initialize();if(started)await c.start('rescue-01');
 const original=a.setItem;let release,entered;const waiting=new Promise(resolve=>{entered=resolve;});
 a.setItem=async(k,v)=>{entered();await new Promise(resolve=>{release=resolve;});return original(k,v);};
 return {a,c,waiting,release:()=>{a.setItem=original;release();}};
}
test('delayed restart preserves a newer blur and focus-return pause while saving the new board',async()=>{
 const f=await deferredWriteFixture();const revision=f.c.getSnapshot().journal.revision;const op=f.c.restart();await f.waiting;
 f.c.setForeground(false);f.c.setForeground(true);f.release();assert.equal(await op,true);
 assert.equal(f.c.getSnapshot().paused,true);assert.equal(f.c.getSnapshot().journal.revision,revision+1);assert.equal(await f.c.move(56,57),false);
});
test('delayed restart preserves newer back-to-puzzles navigation and durable state',async()=>{
 const f=await deferredWriteFixture();const op=f.c.restart();await f.waiting;f.c.leave();f.release();assert.equal(await op,true);
 assert.equal(f.c.getSnapshot().screen,'list');assert.equal(f.c.getSnapshot().paused,true);assert.equal((await createRescueStore(f.a).load()).game.rescueId,'rescue-01');
});
test('normal delayed foreground restart still resumes the successfully saved board',async()=>{
 const f=await deferredWriteFixture();const op=f.c.restart();await f.waiting;f.release();assert.equal(await op,true);
 assert.equal(f.c.getSnapshot().screen,'game');assert.equal(f.c.getSnapshot().paused,false);assert.equal(await f.c.move(56,57),true);
});
test('delayed first start preserves newer list navigation after its durable save',async()=>{
 const f=await deferredWriteFixture({started:false});const op=f.c.start('rescue-01');await f.waiting;f.c.leave();f.release();assert.equal(await op,true);
 assert.equal(f.c.getSnapshot().screen,'list');assert.equal(f.c.getSnapshot().paused,true);assert.equal((await createRescueStore(f.a).load()).game.rescueId,'rescue-01');
});
test('delayed first start does not auto-resume after blur and focus-return',async()=>{
 const f=await deferredWriteFixture({started:false});const op=f.c.start('rescue-01');await f.waiting;f.c.setForeground(false);f.c.setForeground(true);f.release();assert.equal(await op,true);
 assert.equal(f.c.getSnapshot().paused,true);assert.equal(await f.c.move(56,57),false);
});
