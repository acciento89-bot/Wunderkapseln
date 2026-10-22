import test from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCT_IDS,normalizeProducts} from '../payments/catalog.mjs';
import {createPurchaseMachine} from '../payments/purchase-machine.mjs';

const bought=(id='wk_lives_5',key='tx-1')=>({productId:id,purchaseState:'purchased',transactionId:key});
function setup(overrides={}){
 const calls={verify:[],apply:[],finish:[]};
 const dependencies={
  verify:async purchase=>{calls.verify.push(purchase);return {status:'allocated',allocation:{id:`grant-${purchase.transactionId}`,productId:purchase.productId,quantity:1}};},
  applyAllocation:async allocation=>{calls.apply.push(allocation);return {status:'applied'};},
  finishTransaction:async purchase=>{calls.finish.push(purchase);},
  ...overrides
 };
 return {machine:createPurchaseMachine(dependencies),calls};
}

test('catalog exposes only the three approved consumables and store display prices',()=>{
 assert.deepEqual(PRODUCT_IDS,['wk_lives_5','wk_time_60','wk_time_240']);
 assert.deepEqual(normalizeProducts([
  {id:'wk_time_60',displayPrice:'1,99 €',title:'Eine Stunde'},
  {id:'unknown',displayPrice:'0,01 €'},
  {id:'wk_lives_5',displayPrice:'$0.99',title:'Five lives'}
 ]),{
  wk_lives_5:{id:'wk_lives_5',displayPrice:'$0.99',title:'Five lives'},
  wk_time_60:{id:'wk_time_60',displayPrice:'1,99 €',title:'Eine Stunde'}
 });
});

test('pending purchase grants and finishes nothing',async()=>{
 const {machine,calls}=setup();
 const state=await machine.receive({...bought(),purchaseState:'pending'});
 assert.equal(state.phase,'pending');assert.deepEqual(calls,{verify:[],apply:[],finish:[]});
});

test('cancel is quiet and grants nothing',()=>{
 const {machine,calls}=setup();
 const state=machine.fail({code:'user-cancelled'});
 assert.equal(state.phase,'cancelled');assert.equal(state.error,null);assert.deepEqual(calls,{verify:[],apply:[],finish:[]});
});

test('network failure remains retryable and grants nothing',()=>{
 const {machine,calls}=setup();
 const state=machine.fail({code:'network-error'});
 assert.equal(state.phase,'retryable');assert.equal(state.error,'network');assert.deepEqual(calls,{verify:[],apply:[],finish:[]});
});

test('verification rejection never applies or finishes',async()=>{
 const {machine,calls}=setup({verify:async purchase=>{calls.verify.push(purchase);return {status:'rejected'};}});
 const state=await machine.receive(bought());
 assert.equal(state.phase,'failed');assert.equal(state.error,'verification');
 assert.equal(calls.verify.length,1);assert.equal(calls.apply.length,0);assert.equal(calls.finish.length,0);
});

test('verified allocation is persisted before the consumable is finished',async()=>{
 const order=[];
 const {machine}=setup({
  verify:async purchase=>{order.push('verify');return {status:'allocated',allocation:{id:'grant-1',productId:purchase.productId,quantity:1}};},
  applyAllocation:async()=>{order.push('apply');return {status:'applied'};},
  finishTransaction:async()=>{order.push('finish');}
 });
 const state=await machine.receive(bought());
 assert.equal(state.phase,'delivered');assert.deepEqual(order,['verify','apply','finish']);
});

test('duplicate callback reuses the allocation and cannot grant twice',async()=>{
 const applied=new Set();let increments=0,finishes=0;
 const {machine}=setup({
  verify:async purchase=>({status:'duplicate',allocation:{id:'grant-1',productId:purchase.productId,quantity:1}}),
  applyAllocation:async allocation=>{if(!applied.has(allocation.id)){applied.add(allocation.id);increments++;}return {status:increments?'applied':'duplicate'};},
  finishTransaction:async()=>{finishes++;}
 });
 await machine.receive(bought());await machine.receive(bought());
 assert.equal(increments,1);assert.equal(finishes,2);
});

test('local persistence failure leaves the transaction unfinished for redelivery',async()=>{
 let finishes=0;
 const {machine}=setup({applyAllocation:async()=>{throw new Error('storage');},finishTransaction:async()=>{finishes++;}});
 const state=await machine.receive(bought());
 assert.equal(state.phase,'retryable');assert.equal(state.error,'delivery');assert.equal(finishes,0);
});

test('capacity deferral keeps the paid transaction unfinished',async()=>{
 const {machine,calls}=setup({applyAllocation:async()=>({status:'capacity'})});
 const state=await machine.receive(bought());
 assert.equal(state.phase,'capacity');assert.equal(calls.finish.length,0);
});

test('unfinished store transactions are replayed through the same verified path',async()=>{
 const {machine,calls}=setup();
 const states=await machine.retryUnfinished([bought('wk_lives_5','tx-1'),bought('wk_time_60','tx-2')]);
 assert.deepEqual(states.map(state=>state.phase),['delivered','delivered']);
 assert.equal(calls.apply.length,2);assert.equal(calls.finish.length,2);
});

test('unknown products fail closed before verification',async()=>{
 const {machine,calls}=setup();
 const state=await machine.receive(bought('wk_unknown'));
 assert.equal(state.phase,'failed');assert.equal(state.error,'product');assert.equal(calls.verify.length,0);
});
