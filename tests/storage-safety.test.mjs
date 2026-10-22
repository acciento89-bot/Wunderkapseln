import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProfile,finishLevel} from '../core/profile.mjs';
import {createSession} from '../core/session.mjs';
import {createSaveQueue,encodeSave} from '../core/storage.mjs';
import {GameController} from '../core/controller.mjs';
const KEY='wunderkapseln.save',BACKUP=KEY+'.backup';
const now=1800000000000;
const saved=()=>encodeSave(createSession(finishLevel(freshProfile(now),1,3)));

test('read failures block hydration and cannot fall back to a stale backup',async()=>{
  const store=createSaveQueue({getItem:async k=>{if(k===KEY)throw Error('temporary read failure');return saved();},setItem:async()=>{}});
  const result=await store.load();assert.equal(result.blocked,true);assert.equal(result.reason,'storageUnavailable');assert.equal(result.session,null);
});
test('unknown save versions are not overwritten by an older backup',async()=>{
  const store=createSaveQueue({getItem:async k=>k===KEY?JSON.stringify({version:42,payload:'future'}):saved(),setItem:async()=>{}});
  const result=await store.load();assert.equal(result.blocked,true);assert.equal(result.reason,'saveIncompatible');
});
test('unrecoverable corrupted data remains blocked rather than becoming a fresh game',async()=>{
  const result=await createSaveQueue({getItem:async k=>k===KEY?'broken':null,setItem:async()=>{}}).load();
  assert.equal(result.blocked,true);assert.equal(result.reason,'saveCorrupt');
});
test('both absent slots permit the first start',async()=>{
  const result=await createSaveQueue({getItem:async()=>null,setItem:async()=>{}}).load();
  assert.equal(result.blocked,false);assert.equal(result.session,null);
});
test('a corrupt primary still recovers a valid backup',async()=>{
  const result=await createSaveQueue({getItem:async k=>k===KEY?'broken':saved(),setItem:async()=>{}}).load();
  assert.equal(result.blocked,false);assert.equal(result.recovered,true);assert.equal(result.session.profile.unlocked,2);
});
test('failed hydration makes no writes and retry restores the original profile',async()=>{
  let failing=true,writes=0,mono=0;
  const values=new Map([[KEY,saved()]]);
  const c=new GameController({now:()=>now,monotonic:()=>mono,storage:{getItem:async k=>{if(failing)throw Error('offline storage');return values.get(k)??null;},setItem:async(k,v)=>{writes++;values.set(k,v);}}});
  await c.initialize();assert.equal(c.state.loaded,false);assert.equal(c.state.loadError,'storageUnavailable');
  c.play();mono=10000;c.tick();await c.save();await c.flush();assert.equal(writes,0);assert.equal(c.state.session.game,null);
  failing=false;await c.initialize();assert.equal(c.state.loaded,true);assert.equal(c.state.loadError,null);assert.equal(c.state.session.profile.unlocked,2);
  c.play();await c.flush();assert.equal(c.state.session.game.levelId,2);assert.ok(writes>0);
});
