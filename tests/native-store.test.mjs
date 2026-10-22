import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyStorePurchase,normalizeStoreError} from '../payments/native-store.mjs';

const apple={store:'apple',productId:'wk_lives_5',purchaseState:'purchased',quantity:1,transactionId:'1000001',appBundleIdIOS:'com.kamilunavo.wondercaps'};
const google={store:'google',productId:'wk_time_60',purchaseState:'purchased',quantity:1,id:'order-1',purchaseToken:'secret-token',packageNameAndroid:'com.kamilunavo.wunderkapseln'};

test('native purchased callbacks become stable local allocations',async()=>{
 assert.deepEqual(await verifyStorePurchase(apple),{status:'allocated',allocation:{id:'apple:1000001',productId:'wk_lives_5',quantity:1}});
 const result=await verifyStorePurchase(google);
 assert.equal(result.status,'allocated');assert.equal(result.allocation.productId,'wk_time_60');
 assert.match(result.allocation.id,/^google:[0-9a-f]{16}$/);assert.doesNotMatch(result.allocation.id,/secret-token/);
});

test('native verifier rejects mismatched apps, revoked purchases, and malformed quantities',async()=>{
 for(const purchase of [
  {...apple,appBundleIdIOS:'wrong.bundle'},
  {...apple,revocationDateIOS:Date.now()},
  {...google,packageNameAndroid:'wrong.package'},
  {...google,quantity:2},
  {...google,purchaseToken:null,id:''}
 ]) assert.deepEqual(await verifyStorePurchase(purchase),{status:'rejected'});
});

test('store errors preserve cancellation and retryable network states',()=>{
 assert.deepEqual(normalizeStoreError({code:'user-cancelled'}),{code:'user-cancelled'});
 assert.deepEqual(normalizeStoreError({code:'service-disconnected'}),{code:'service-disconnected'});
 assert.deepEqual(normalizeStoreError({code:'anything-else'}),{code:'store-error'});
});
