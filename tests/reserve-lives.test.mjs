import test from 'node:test';
import assert from 'node:assert/strict';
import { freshProfile, activatePack, loseLife, regenerate, validateProfile, LIFE_MS } from '../core/profile.mjs';
import { createSession, startLevel, abandonLevel } from '../core/session.mjs';
import { encodeSave, decodeSave } from '../core/storage.mjs';
const now=1800000000000;
const packProfile=()=>{const p=freshProfile(now);p.inventory.lives5=1;return p;};

test('a five-life pack adds all five lives to reserve even with four natural lives',()=>{
  const p=loseLife(packProfile(),now),q=activatePack(p,'lives5');
  assert.equal(q.lives,4);assert.equal(q.reserveLives,5);assert.equal(q.inventory.lives5,0);
  assert.equal(q.nextLifeAt,p.nextLifeAt);assert.equal(p.inventory.lives5,1);
});
test('a five-life pack is usable with a full natural-life meter',()=>{
  const q=activatePack(packProfile(),'lives5');assert.equal(q.lives,5);assert.equal(q.reserveLives,5);
});
test('natural lives are used first and reserve lives only pay for a failed attempt',()=>{
  let p=activatePack(packProfile(),'lives5');for(let i=0;i<5;i++)p=loseLife(p,now);
  assert.equal(p.lives,0);assert.equal(p.reserveLives,5);
  const s=startLevel(createSession(p),1,now);assert.equal(s.profile.reserveLives,5);
  const q=abandonLevel(s,now);assert.equal(q.profile.reserveLives,4);assert.equal(q.profile.lives,0);
  assert.equal(abandonLevel(q,now).profile.reserveLives,4);
});
test('natural life regeneration is independent of the reserve',()=>{
  let p=activatePack(loseLife(packProfile(),now),'lives5');
  p=regenerate(p,now+LIFE_MS);assert.equal(p.lives,5);assert.equal(p.reserveLives,5);
});
test('an unlimited-time attempt never consumes reserve lives after the timer expires',()=>{
  const p=activatePack(packProfile(),'lives5');p.lives=0;p.nextLifeAt=now+LIFE_MS;p.unlimitedSeconds=1;
  const s=startLevel(createSession(p),1,now);s.profile.unlimitedSeconds=0;
  assert.equal(abandonLevel(s,now).profile.reserveLives,5);
});
test('old saves migrate to an empty reserve without changing their natural lives',()=>{
  const s=createSession(freshProfile(now));delete s.profile.reserveLives;
  const restored=decodeSave(encodeSave(s));assert.equal(restored.profile.reserveLives,0);assert.equal(restored.profile.lives,5);
});
test('reserve lives survive save/load and invalid balances are rejected',()=>{
  const s=createSession(activatePack(packProfile(),'lives5'));
  assert.equal(decodeSave(encodeSave(s)).profile.reserveLives,5);
  for(const reserveLives of [-1,1.5,10000,'5'])assert.equal(validateProfile({...s.profile,reserveLives}),false);
});
test('inventory is not consumed when an activation would exceed safe capacity',()=>{
  const p=packProfile();p.reserveLives=9998;
  assert.throws(()=>activatePack(p,'lives5'),/capacity/);assert.equal(p.inventory.lives5,1);
  p.unlimitedSeconds=864000;p.inventory.time240=1;
  assert.throws(()=>activatePack(p,'time240'),/capacity/);assert.equal(p.inventory.time240,1);
});
test('rejected capacity activation is visible and keeps the inventory pack',async()=>{
  const {GameController}=await import('../core/controller.mjs');
  const c=new GameController({storage:{getItem:async()=>null,setItem:async()=>{}},now:()=>now});
  await c.initialize();const profile=packProfile();profile.reserveLives=9998;
  c.emit({session:createSession(profile)});c.activate('lives5');
  assert.equal(c.state.notice,'packCapacity');assert.equal(c.state.session.profile.inventory.lives5,1);
});
