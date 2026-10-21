import test from 'node:test';import assert from 'node:assert/strict';
import {createRescueStore,encodeRescue,decodeRescue,freshRescueJournal,RESCUE_KEY} from '../core/rescue-storage.mjs';
import {createRescueGame} from '../core/rescue.mjs';import {RESCUE_LEVELS} from '../core/rescue-levels.mjs';
function memory(){const data=new Map();return {data,async getItem(k){return data.get(k)??null;},async setItem(k,v){data.set(k,v);}};}
function journal(){return {...freshRescueJournal(),revision:1,game:createRescueGame(RESCUE_LEVELS[0])};}
// Dropping current-byte preflight/readback or treating malformed as empty would fail these real adapter outcomes.
test('rescue-only journal roundtrips exact state and cannot read campaign/payment data',async()=>{
 const a=memory();a.data.set('wunderkapseln.save','untouched-paid-campaign');const s=createRescueStore(a);assert.deepEqual(await s.load(),freshRescueJournal());
 const j=journal();await s.save(0,j);assert.deepEqual(await createRescueStore(a).load(),j);assert.equal(a.data.get('wunderkapseln.save'),'untouched-paid-campaign');
 assert.deepEqual(decodeRescue(encodeRescue(j)),j);
});
test('malformed/future/unknown and nested invalid attempts block replacement without erasing bytes',async()=>{
 for(const text of ['not-json',JSON.stringify({schema:2}),JSON.stringify({...journal(),extra:true}),JSON.stringify({...journal(),game:{}}),JSON.stringify({...journal(),completed:['rescue-12']})]){
  const a=memory();a.data.set(RESCUE_KEY,text);const s=createRescueStore(a);await assert.rejects(s.load());await assert.rejects(s.save(0,journal()));assert.equal(a.data.get(RESCUE_KEY),text);
 }
 assert.throws(()=>decodeRescue(' '.repeat(500001)));
});
test('a competing current revision cannot be overwritten by a stale client',async()=>{
 const a=memory(),s=createRescueStore(a);await s.load();const other=createRescueStore(a);await other.load();await other.save(0,journal());await assert.rejects(s.save(0,{...journal(),game:null}));assert.deepEqual(await createRescueStore(a).load(),journal());
});
test('write succeeded but readback threw retains exact retry and rejects changed content at that revision',async()=>{
 const a=memory(),s=createRescueStore(a);await s.load();const get=a.getItem;let fail=true;
 a.getItem=async k=>{if(fail&&a.data.has(k)){fail=false;throw Error('disk read');}return get(k);};
 await assert.rejects(s.save(0,journal()));await s.save(0,journal());assert.equal((await createRescueStore(a).load()).revision,1);
 await assert.rejects(s.save(0,{...journal(),game:null}));
});
test('bounded-cascade terminal can be durably held for explicit restart but an active matching board is rejected',async()=>{
 const j=journal();j.game.status='stuck';j.game.board=j.game.board.map(c=>c.companion?c:{color:0,special:''});
 assert.deepEqual(decodeRescue(encodeRescue(j)),j);
 const a=memory(),s=createRescueStore(a);await s.load();await s.save(0,j);assert.equal((await createRescueStore(a).load()).game.status,'stuck');
 j.game.status='playing';assert.throws(()=>encodeRescue(j));
});
