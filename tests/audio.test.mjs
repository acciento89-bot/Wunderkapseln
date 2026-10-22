import test from 'node:test';
import assert from 'node:assert/strict';
import { feedbackFor, createFeedbackDriver } from '../core/feedback.mjs';
import { SOUND_NAMES, synthesize, wavBytes } from '../ui/sounds.mjs';
import { freshProfile, validateProfile } from '../core/profile.mjs';
import { createSession } from '../core/session.mjs';
import { encodeSave, decodeSave } from '../core/storage.mjs';
import { GameController } from '../core/controller.mjs';
import { legalMoves } from '../core/game.mjs';
const result=(status='playing',frames=1)=>({ok:true,game:{status},frames:Array(frames).fill({})});
test('sound cues distinguish matches, chains, wonders and terminal outcomes',()=>{
 assert.equal(feedbackFor({ok:false}),null);assert.equal(feedbackFor(result()),'match');
 assert.equal(feedbackFor(result('playing',3)),'combo');assert.equal(feedbackFor(result(),'wonder'),'wonder');
 assert.equal(feedbackFor(result('won',3),'wonder'),'win');assert.equal(feedbackFor(result('lost')),'lost');
});
function snapshot(id=1,changes={}){return {loaded:true,screen:'game',modal:null,session:{profile:{sound:true}},feedback:{id,cue:'match'},...changes};}
test('feedback is emitted once per event, not once per controller tick',async()=>{
 const events=[];const d=createFeedbackDriver({play:async cue=>events.push(cue),stop(){}});
 await d.update(snapshot(),true);await d.update(snapshot(),true);await d.update(snapshot(2),true);assert.deepEqual(events,['match','match']);
});
test('muting or backgrounding stops playback and never replays skipped cues',async()=>{
 const events=[];let stops=0;const d=createFeedbackDriver({play:async cue=>events.push(cue),stop(){stops++;}});
 await d.update(snapshot(),true);await d.update(snapshot(2),false);await d.update(snapshot(2),true);
 await d.update(snapshot(3,{session:{profile:{sound:false}}}),true);await d.update(snapshot(3),true);
 assert.equal(events.length,1);assert.ok(stops>=1);
});
test('result fanfare is allowed but pause and menus are silent',async()=>{
 const events=[];const d=createFeedbackDriver({play:async cue=>events.push(cue),stop(){}});
 await d.update(snapshot(1,{modal:'result',feedback:{id:1,cue:'win'}}),true);
 await d.update(snapshot(2,{modal:'pause'}),true);await d.update(snapshot(3,{screen:'home'}),true);assert.deepEqual(events,['win']);
});
test('audio device errors do not escape into gameplay or unhandled rejections',async()=>{
 const d=createFeedbackDriver({play:async()=>{throw new Error('audio unavailable');},stop(){throw new Error('removed');}});
 assert.equal(await d.update(snapshot(),true),false);await d.update(snapshot(2),false);d.dispose();
 assert.equal(await d.update(snapshot(3),true),false);
});
test('legacy saves gain sound preference and a saved mute survives reload',()=>{
 const old=createSession(freshProfile(100));delete old.profile.sound;
 assert.equal(decodeSave(encodeSave(old)).profile.sound,true);
 old.profile.sound=false;assert.equal(decodeSave(encodeSave(old)).profile.sound,false);
 old.profile.sound='yes';assert.equal(validateProfile(old.profile),false);
});
test('generated sounds are finite, bounded and contain audible PCM content',()=>{
 assert.equal(SOUND_NAMES.length,14);
 for(const name of SOUND_NAMES){const pcm=synthesize(name);assert.ok(pcm.length>=4000&&pcm.length<40000);
 let energy=0;for(const x of pcm){assert.ok(Number.isFinite(x)&&Math.abs(x)<=.65);energy+=x*x;}assert.ok(energy>1);
 assert.ok(Math.abs(pcm[0])<.001);assert.ok(Math.abs(pcm.at(-1))<.001);
 const bytes=wavBytes(name),v=new DataView(bytes.buffer);const text=(a,b)=>String.fromCharCode(...bytes.slice(a,b));
 assert.equal(text(0,4),'RIFF');assert.equal(text(8,12),'WAVE');assert.equal(v.getUint16(22,true),1);assert.equal(v.getUint32(24,true),22050);
 assert.equal(v.getUint16(34,true),16);assert.equal(v.getUint32(40,true),pcm.length*2);assert.equal(bytes.length,44+pcm.length*2);
 }
 assert.throws(()=>synthesize('missing'),RangeError);
});
test('valid moves emit a feedback event; invalid swaps emit none',async()=>{
 const c=new GameController({storage:{getItem:async()=>null,setItem:async()=>{}}});await c.initialize();c.preference('reducedMotion',true);c.play();
 await c.move(0,63);assert.equal(c.state.feedback,null);await c.move(...legalMoves(c.state.session.game)[0]);assert.equal(c.state.feedback.id,1);assert.ok(SOUND_NAMES.includes(c.state.feedback.cue));
});
