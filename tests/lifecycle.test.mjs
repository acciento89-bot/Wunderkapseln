import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameController } from '../core/controller.mjs';
import { legalMoves } from '../core/game.mjs';
function setup() {
 const data=new Map();let now=1800000000000;
 const c=new GameController({storage:{getItem:async k=>data.get(k)??null,setItem:async(k,v)=>data.set(k,v)},now:()=>now,monotonic:()=>now});
 return {c,data};
}
async function playing(){const {c}=setup();await c.initialize();c.preference('reducedMotion',true);c.play();return c;}
test('stale gestures cannot spend moves after navigation to a menu',async()=>{
 const c=await playing(),before=c.state.session.game,pair=legalMoves(before)[0];c.navigate('home');await c.move(...pair);
 assert.deepEqual(c.state.session.game,before);
});
test('background taps cannot select or swap game pieces',async()=>{
 const c=await playing(),before=c.state.session.game;c.setForeground(false);c.closeModal();
 await c.tap(0);await c.move(...legalMoves(before)[0]);assert.equal(c.state.selected,-1);assert.deepEqual(c.state.session.game,before);
});
test('hydration is deduplicated and never replaces an already-started level',async()=>{
 const {c}=setup();await c.initialize();c.play();const game=c.state.session.game;
 await c.initialize();assert.equal(c.state.session.game,game);
});
test('hardware back from a result leaves a usable level-selection screen',async()=>{
 const c=await playing();c.emit({session:{...c.state.session,game:{...c.state.session.game,status:'lost'},settled:true},modal:'result'});
 assert.equal(c.back(),true);assert.equal(c.state.screen,'levels');assert.equal(c.state.modal,null);
});
test('backgrounding a terminal animation keeps its result accessible',async()=>{
 const c=await playing();c.emit({session:{...c.state.session,game:{...c.state.session.game,status:'lost'},settled:true},busy:true,modal:null});
 c.setForeground(false);c.setForeground(true);assert.equal(c.state.modal,'result');assert.equal(c.state.busy,false);
});
test('closing abandonment returns to pause without losing a life',async()=>{
 const c=await playing();c.pause();c.requestAbandon();c.closeModal();assert.equal(c.state.modal,'pause');assert.equal(c.state.session.profile.lives,5);
});
test('system reduced motion is transient and does not overwrite player settings',async()=>{
 const c=await playing();c.preference('reducedMotion',false);c.setSystemReducedMotion(true);
 assert.equal(c.motionReduced(),true);assert.equal(c.state.session.profile.reducedMotion,false);
 c.setSystemReducedMotion(false);assert.equal(c.motionReduced(),false);
});
test('native labels contain no damaged control characters',()=>{
 const source=readFileSync(new URL('../App.js',import.meta.url),'utf8');assert.doesNotMatch(source,/[\x00-\x08\x0b\x0c\x0e-\x1f]/);
});
