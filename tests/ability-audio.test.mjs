import test from 'node:test';
import assert from 'node:assert/strict';
import * as feedback from '../core/feedback.mjs';
import { SOUND_NAMES, synthesize, wavBytes } from '../ui/sounds.mjs';
import { createGame, swap, useWonder, legalMoves } from '../core/game.mjs';
import { levelFor } from '../core/levels.mjs';
import { GameController } from '../core/controller.mjs';
import { createHash } from 'node:crypto';
const plan = (...args) => { assert.equal(typeof feedback.feedbackPlan, 'function', 'feedbackPlan must exist'); return feedback.feedbackPlan(...args); };
const frame = (specials = []) => ({before:specials.map(special=>({color:0,special})),cleared:specials.map((_,i)=>i),created:[],combo:1});
const result = (specials=[], changes={}) => ({ok:true,game:{status:'playing',charge:0,wonderUsed:false},frames:[frame(specials)],...changes});
const expected=['match','combo','wonder','win','lost','rocket','bomb','prism','mega','wind','tide','bloom','charge','restoration'];
test('14 original cues include distinct big ability and restoration effects',()=>{
 assert.deepEqual(SOUND_NAMES,expected);
 const hashes=new Set();
 for(const cue of expected){
  const pcm=synthesize(cue),bytes=wavBytes(cue),v=new DataView(bytes.buffer);
  assert.ok(pcm.length>=4000&&pcm.length<40000,`${cue} duration`);
  let energy=0;for(const x of pcm){assert.ok(Number.isFinite(x)&&Math.abs(x)<=.65,`${cue} bounded`);energy+=x*x;}
  assert.ok(energy>1,`${cue} audible`);assert.ok(Math.abs(pcm[0])<.001);assert.ok(Math.abs(pcm.at(-1))<.001);
  assert.equal(v.getUint32(40,true),pcm.length*2);assert.equal(v.getUint16(34,true),16);
  const hash=createHash('sha256').update(bytes).digest('hex');hashes.add(hash);
  assert.equal(createHash('sha256').update(wavBytes(cue)).digest('hex'),hash);
 }
 assert.equal(hashes.size,expected.length);
});
test('single activated specials map to their own cue; two specials map to mega',()=>{
 for(const [special,cue] of [['row','rocket'],['column','rocket'],['bomb','bomb'],['prism','prism']]) assert.equal(plan(result([special])).frames[0],cue);
 assert.equal(plan(result(['row','bomb'])).frames[0],'mega');
});
test('creating a special is not the same as activating it',()=>{
 const r=result(['']);r.frames[0].created=[{index:0,special:'bomb'}];
 assert.equal(plan(r).frames[0],'match');
});
test('directly swapped prism metadata survives suppression of automatic effects',()=>{
 const g=createGame(levelFor(1));g.board[0]={color:-1,special:'prism'};
 const r=swap(g,0,1);assert.deepEqual(r.triggeredSpecials,['prism']);assert.equal(plan(r).frames[0],'prism');
 assert.equal(g.board[0].special,'prism','input not mutated');
});
test('old special seen in both swap and frame metadata is counted once',()=>{
 const r=result(['row'],{triggeredSpecials:['row']});
 assert.equal(plan(r).frames[0],'rocket');
});
test('two directly swapped specials receive the big combination cue',()=>{
 const g=createGame(levelFor(1));g.board[0].special='row';g.board[1].special='bomb';
 const r=swap(g,0,1);assert.deepEqual(r.triggeredSpecials,['row','bomb']);assert.equal(plan(r).frames[0],'mega');
});
test('wind tide and bloom retain distinct metadata and cues',()=>{
 for(const [id,cue] of [[1,'bloom'],[41,'wind'],[81,'tide']]){
  const g=createGame(levelFor(id));g.charge=100;
  const r=useWonder(g,0);assert.equal(r.wonder,cue);assert.equal(plan(r,{kind:'wonder'}).frames[0],cue);
 }
});
test('ability and win remain separate; restoration follows the win',()=>{
 const r=result(['bomb'],{game:{status:'won',charge:100,wonderUsed:false}});
 const p=plan(r,{milestone:true,initialCharge:80});assert.deepEqual(p.frames,['bomb']);assert.deepEqual(p.settled,['win','restoration']);
 assert.equal(typeof feedback.compactFeedback,'function');const compact=feedback.compactFeedback(p);
 assert.equal(compact.cue,'bomb');assert.deepEqual(compact.followups.map(x=>x.cue),['win','restoration']);
 assert.ok(compact.followups[0].delayMs>0);assert.ok(compact.followups[1].delayMs>compact.followups[0].delayMs);
});
test('charge-ready only fires on a newly full playing board, never after the ability or a defeat',()=>{
 const r=result([],{game:{status:'playing',charge:100,wonderUsed:false}});
 assert.deepEqual(plan(r,{initialCharge:90}).settled,['charge']);assert.deepEqual(plan(r,{initialCharge:100}).settled,[]);
 r.game.wonderUsed=true;assert.deepEqual(plan(r,{initialCharge:0}).settled,[]);
 r.game.status='lost';assert.deepEqual(plan(r).settled,['lost']);
 assert.deepEqual(plan({ok:false}),{frames:[],settled:[]});
});
function scheduler(){let id=0;const tasks=new Map();return {tasks,schedule(fn,ms){tasks.set(++id,{fn,ms});return id;},cancel(id){tasks.delete(id);},run(){const all=[...tasks.values()].sort((a,b)=>a.ms-b.ms);tasks.clear();for(const t of all)t.fn();}};}
const state=(id,extra={})=>({loaded:true,screen:'game',modal:null,session:{profile:{sound:true}},feedback:{id,cue:'bomb',followups:[{cue:'win',delayMs:350},{cue:'restoration',delayMs:1200}]},...extra});
test('delayed fanfares play once and ordinary state ticks do not reschedule them',async()=>{
 const clock=scheduler(),played=[];const d=feedback.createFeedbackDriver({play:async cue=>played.push(cue),stop(){}},clock);
 await d.update(state(1),true);await d.update(state(1),true);assert.equal(clock.tasks.size,2);
 clock.run();assert.deepEqual(played,['bomb','win','restoration']);d.dispose();
});
test('pause background mute and disposal cancel delayed audio without replay',async()=>{
 for(const mode of ['pause','background','mute','dispose']){
  const clock=scheduler(),played=[];let stops=0;
  const d=feedback.createFeedbackDriver({play:async cue=>played.push(cue),stop(){stops++;}},clock);
  await d.update(state(1),true);assert.equal(clock.tasks.size,2);
  if(mode==='dispose')d.dispose();else await d.update(state(1,mode==='pause'?{modal:'pause'}:mode==='mute'?{session:{profile:{sound:false}}}:{}),mode!=='background');
  assert.equal(clock.tasks.size,0,mode);clock.run();await d.update(state(1),true);
  assert.deepEqual(played,['bomb'],mode);assert.ok(stops>=1);d.dispose();
 }
});
test('new effect replaces old followups without cutting an already playing ability',async()=>{
 const clock=scheduler(),played=[];let stops=0;const d=feedback.createFeedbackDriver({play:async cue=>played.push(cue),stop(){stops++;}},clock);
 await d.update(state(1),true);await d.update(state(2,{feedback:{id:2,cue:'rocket'}}),true);
 assert.equal(clock.tasks.size,0);assert.equal(stops,0);assert.deepEqual(played,['bomb','rocket']);d.dispose();
});
test('controller emits ability while animation is active, not only after resolution',async()=>{
 const c=new GameController({storage:{getItem:async()=>null,setItem:async()=>{}}});await c.initialize();c.play();
 c.state.session.game.board[0].special='bomb';const events=[];c.subscribe(()=>{const s=c.getSnapshot();if(s.feedback)events.push({id:s.feedback.id,cue:s.feedback.cue,busy:s.busy});});
 await c.move(0,1);assert.ok(events.some(e=>e.cue==='bomb'&&e.busy));await c.flush();
});
