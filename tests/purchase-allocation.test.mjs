import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProfile,applyPaidAllocation} from '../core/profile.mjs';
import {createSession} from '../core/session.mjs';
import {encodeSave,decodeSave} from '../core/storage.mjs';
import {GameController} from '../core/controller.mjs';

const allocation=(productId='wk_lives_5',id='grant-1')=>({id,productId,quantity:1});

test('paid lives go directly to reserve exactly once',()=>{
 const first=applyPaidAllocation(freshProfile(),allocation());
 assert.equal(first.status,'applied');assert.equal(first.profile.reserveLives,5);
 const duplicate=applyPaidAllocation(first.profile,allocation());
 assert.equal(duplicate.status,'duplicate');assert.equal(duplicate.profile.reserveLives,5);
});

test('paid time stays inactive until manually activated',()=>{
 const hour=applyPaidAllocation(freshProfile(),allocation('wk_time_60','grant-hour'));
 const fourHours=applyPaidAllocation(hour.profile,allocation('wk_time_240','grant-four'));
 assert.equal(fourHours.profile.inventory.time60,1);
 assert.equal(fourHours.profile.inventory.time240,1);
 assert.equal(fourHours.profile.unlimitedSeconds,0);
});

test('invalid allocations fail closed without mutating the profile',()=>{
 const profile=freshProfile();
 for(const bad of [
  allocation('unknown'),
  {...allocation(),id:''},
  {...allocation(),quantity:2}
 ]) assert.throws(()=>applyPaidAllocation(profile,bad),/invalid_allocation|unknown_product/);
 assert.equal(profile.reserveLives,0);assert.deepEqual(profile.appliedPurchaseIds,[]);
});

test('capacity defers delivery and does not record the allocation id',()=>{
 const profile={...freshProfile(),reserveLives:9998};
 const result=applyPaidAllocation(profile,allocation());
 assert.equal(result.status,'capacity');assert.equal(result.profile.reserveLives,9998);
 assert.deepEqual(result.profile.appliedPurchaseIds,[]);
});

test('old saves migrate to an empty purchase journal',()=>{
 const session=createSession(freshProfile());delete session.profile.appliedPurchaseIds;
 const restored=decodeSave(encodeSave(session));
 assert.deepEqual(restored.profile.appliedPurchaseIds,[]);
});

test('controller persists a verified allocation before exposing success',async()=>{
 const values=new Map();let fail=true;
 const controller=new GameController({storage:{
  getItem:async key=>values.get(key)??null,
  setItem:async(key,value)=>{if(fail)throw new Error('disk');values.set(key,value);}
 }});
 await controller.initialize();
 await assert.rejects(controller.applyPaidAllocation(allocation()),/disk/);
 assert.equal(controller.getSnapshot().session.profile.reserveLives,0);
 fail=false;
 const result=await controller.applyPaidAllocation(allocation());
 assert.equal(result.status,'applied');assert.equal(controller.getSnapshot().session.profile.reserveLives,5);
 const saved=decodeSave(values.get('wunderkapseln.save'));
 assert.equal(saved.profile.reserveLives,5);
});
