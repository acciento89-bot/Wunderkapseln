import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('purchase hook fetches exact consumables and finishes only after controller delivery',()=>{
 const source=read('../payments/usePurchases.js');
 assert.match(source,/PRODUCT_IDS/);assert.match(source,/type:\s*['"]in-app['"]/);
 assert.match(source,/applyPaidAllocation/);assert.match(source,/isConsumable:\s*true/);
 assert.doesNotMatch(source,/supabase|service[_-]?role|fallbackPrice/i);
});

test('treasure shop renders dynamic store prices and native buy actions',()=>{
 const source=read('../App.js');
 assert.match(source,/usePurchases/);assert.match(source,/displayPrice/);assert.match(source,/purchases\.buy/);
 assert.doesNotMatch(source,/\$0\.99|€\s*0[,.]99|notAvailable[^\n]*shopRow/);
});

test('purchase outcome copy exists in both languages',async()=>{
 const {STRINGS}=await import('../ui/strings.mjs');
 for(const key of ['storeLoading','storeUnavailable','purchasePending','purchaseNetwork','purchaseDelivery','purchaseCapacity','purchaseComplete']){
  assert.equal(typeof STRINGS.de[key],'string');assert.equal(typeof STRINGS.en[key],'string');
  assert.ok(STRINGS.de[key]);assert.ok(STRINGS.en[key]);
 }
});
