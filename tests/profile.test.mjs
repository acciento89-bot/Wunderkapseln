import test from 'node:test';
import assert from 'node:assert/strict';
import { freshProfile, regenerate, loseLife, finishLevel, activatePack, spendActiveTime, validateProfile, LIFE_MS } from '../core/profile.mjs';
import { createSession, startLevel, applyMove, abandonLevel } from '../core/session.mjs';
import { legalMoves } from '../core/game.mjs';
import { encodeSave, decodeSave, createSaveQueue } from '../core/storage.mjs';
const now=1_800_000_000_000;
test('German device language defaults to DE; everything else EN',()=>{
  assert.equal(freshProfile(now,'de-DE').language,'de');assert.equal(freshProfile(now,'pl-PL').language,'en');
});
test('life regeneration respects exact 25-minute boundary and caps at five',()=>{
  const p=loseLife(freshProfile(now),now);assert.equal(p.lives,4);
  assert.equal(regenerate(p,now+LIFE_MS-1).lives,4);
  assert.equal(regenerate(p,now+LIFE_MS).lives,5);
  assert.equal(regenerate(p,now+LIFE_MS*100).lives,5);
  assert.equal(regenerate(p,now+LIFE_MS*100).nextLifeAt,null);
});
test('additional failures do not restart an already running regeneration timer',()=>{
  const p=loseLife(freshProfile(now),now); const q=loseLife(p,now+300000);
  assert.equal(q.nextLifeAt,p.nextLifeAt);assert.equal(q.lives,3);
  assert.equal(regenerate(q,now+LIFE_MS*2).lives,5);
});
test('backwards system clock neither creates lives nor moves deadline backwards',()=>{
  const p=loseLife(freshProfile(now),now); const q=regenerate(p,now-100000000);
  assert.equal(q.lives,4);assert.equal(q.nextLifeAt,p.nextLifeAt);assert.equal(q.lastSeenAt,now);
});
test('zero lives cannot go negative',()=>{
  let p=freshProfile(now);for(let i=0;i<9;i++) p=loseLife(p,now);
  assert.equal(p.lives,0);
});
test('wins cost no life; replays cannot duplicate rewards or skip levels',()=>{
  const p=freshProfile(now), q=finishLevel(p,1,2);
  assert.equal(q.lives,5);assert.equal(q.unlocked,2);assert.equal(q.sparkles,20);
  const r=finishLevel(q,1,3);assert.equal(r.sparkles,20);assert.equal(r.unlocked,2);assert.equal(r.stars['1'],3);
  assert.throws(()=>finishLevel(r,4,3));
});
test('all 480 levels unlock sequentially with no level 481',()=>{
  let p=freshProfile(now); for(let i=1;i<=480;i++) p=finishLevel(p,i,1);
  assert.equal(p.unlocked,480);assert.equal(Object.keys(p.stars).length,480);assert.ok(validateProfile(p));
});
test('gift timer remains in inventory until deliberately activated',()=>{
  const p=freshProfile(now);assert.equal(p.unlimitedSeconds,0);assert.equal(p.inventory.time10,1);
  const q=activatePack(p,'time10');assert.equal(q.unlimitedSeconds,600);assert.equal(q.inventory.time10,0);
  assert.throws(()=>activatePack(q,'time10'));
});
test('one and four-hour packs grant active time, never a wall-clock expiry',()=>{
  const p=freshProfile(now);p.inventory.time60=1;p.inventory.time240=1;
  const q=activatePack(activatePack(p,'time60'),'time240');assert.equal(q.unlimitedSeconds,18000);
});
test('time is never charged in background, menus, pause or an ad',()=>{
  const p=activatePack(freshProfile(now),'time10');
  for(const active of [false,undefined,null]) assert.equal(spendActiveTime(p,200,active).unlimitedSeconds,600);
  assert.equal(spendActiveTime(p,12.5,true).unlimitedSeconds,587.5);
  assert.equal(spendActiveTime(p,9999,true).unlimitedSeconds,0);
  assert.equal(spendActiveTime(p,-100,true).unlimitedSeconds,600);
});
test('protected attempt stays protected if timer expires during the level',()=>{
  let s=startLevel(createSession(activatePack(freshProfile(now),'time10')),1,now);
  s={...s,profile:spendActiveTime(s.profile,600,true)};
  s=abandonLevel(s,now);assert.equal(s.profile.lives,5);assert.equal(s.game,null);
});
test('active attempt cannot be reset or skipped by starting another',()=>{
  const s=startLevel(createSession(freshProfile(now)),1,now);
  assert.throws(()=>startLevel(s,1,now));assert.throws(()=>startLevel(s,2,now));
  const q=abandonLevel(s,now);assert.equal(q.profile.lives,4);assert.equal(abandonLevel(q,now).profile.lives,4);
});
test('no lives blocks start, active unlimited time permits it',()=>{
  let p=freshProfile(now);p.lives=0;p.nextLifeAt=now+LIFE_MS;
  assert.throws(()=>startLevel(createSession(p),1,now));
  p=activatePack(p,'time10');assert.ok(startLevel(createSession(p),1,now).game);
});
test('saved unfinished attempt restores exact board and move count',()=>{
  const s=startLevel(createSession(freshProfile(now)),1,now), [a,b]=legalMoves(s.game)[0];
  const out=applyMove(s,a,b,now);const restored=decodeSave(encodeSave(out.session));
  assert.deepEqual(restored,out.session);assert.notDeepEqual(restored.game.board,s.game.board);
});
test('corrupted, oversized and incompatible saves fail safely',()=>{
  assert.equal(decodeSave('{'),null);assert.equal(decodeSave('{}'),null);assert.equal(decodeSave('x'.repeat(500001)),null);
  const s=createSession(freshProfile(now)); const encoded=encodeSave(s);
  const envelope=JSON.parse(encoded);envelope.payload=envelope.payload.replace('"lives":5','"lives":99');
  assert.equal(decodeSave(JSON.stringify(envelope)),null);
  assert.equal(decodeSave(encoded.replace('"version":1','"version":999')),null);
});
test('invalid persisted profile is rejected',()=>{
  const p=freshProfile(now);assert.ok(validateProfile(p));
  assert.equal(validateProfile({...p,lives:NaN}),false);assert.equal(validateProfile({...p,unlimitedSeconds:-1}),false);
  assert.equal(validateProfile({...p,unlocked:40}),false);
});
test('save queue serializes writes and recovers last valid backup',async()=>{
  const values=new Map();const adapter={getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{await new Promise(r=>setTimeout(r,2));values.set(k,v);}};
  const store=createSaveQueue(adapter);const a=createSession(freshProfile(now));
  const b={...a,profile:finishLevel(a.profile,1,3)};
  await Promise.all([store.save(a),store.save(b)]);
  assert.deepEqual((await store.load()).session,b);
  values.set('wunderkapseln.save','broken');const loaded=await store.load();
  assert.equal(loaded.recovered,true);assert.deepEqual(loaded.session,a);
});
test('failed storage write is reported and does not poison future writes',async()=>{
  const values=new Map();let failing=true;
  const store=createSaveQueue({getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{if(failing) throw Error('disk full');values.set(k,v);}});
  const s=createSession(freshProfile(now));await assert.rejects(store.save(s));
  failing=false;await store.save(s);assert.deepEqual((await store.load()).session,s);
});
