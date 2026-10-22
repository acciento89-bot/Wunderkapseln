import test from 'node:test';
import assert from 'node:assert/strict';
import { tileAt, gestureTarget } from '../ui/input.mjs';
test('touch coordinates honor all board edges and reject off-board input',()=>{
 assert.equal(tileAt(0,0,352),0); assert.equal(tileAt(351.9,351.9,352),63);
 assert.equal(tileAt(352,20,352),-1); assert.equal(tileAt(-1,10,352),-1);
 assert.equal(tileAt(10,NaN,352),-1);assert.equal(tileAt(10,10,0),-1);
});
test('a swipe picks the dominant direction and never wraps around a row',()=>{
 assert.equal(gestureTarget(7,60,1,352),-1);assert.equal(gestureTarget(8,-60,2,352),-1);
 assert.equal(gestureTarget(10,8,32,352),18);assert.equal(gestureTarget(10,-26,4,352),9);
 assert.equal(gestureTarget(10,2,2,352),10);assert.equal(gestureTarget(0,1,-30,352),-1);
});
