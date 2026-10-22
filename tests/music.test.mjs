import test from 'node:test';
import assert from 'node:assert/strict';
import {createMusicDriver,musicAllowed} from '../native/music-driver.mjs';
import {freshProfile,validateProfile} from '../core/profile.mjs';
import {createSession} from '../core/session.mjs';
import {encodeSave,decodeSave} from '../core/storage.mjs';
import {GameController} from '../core/controller.mjs';
import {musicWav,MUSIC_RATE,MUSIC_SECONDS} from '../ui/music.mjs';
import {RescueController} from '../core/rescue-controller.mjs';
import {createRescueBoundary} from '../core/rescue-boundary.mjs';

test('real rescue boundary restores list music on focus without resuming a held puzzle',async()=>{
 const data=new Map(),storage={getItem:async k=>data.get(k)??null,setItem:async(k,v)=>data.set(k,v)};
 const campaign=new GameController({storage}),rescue=new RescueController({storage});
 await campaign.initialize();await rescue.initialize();const boundary=createRescueBoundary(campaign,rescue);boundary.enter();
 const p=player(),d=createMusicDriver(p),update=()=>d.update(musicAllowed({campaign:campaign.getSnapshot(),rescue:rescue.getSnapshot(),inRescue:true,foreground:rescue.foreground}));
 const a=campaign.subscribe(update),b=rescue.subscribe(update);await update();assert.equal(p.plays,1);
 boundary.setForeground(false);await Promise.resolve();assert.equal(p.pauses,1);
 boundary.setForeground(true);await Promise.resolve();assert.equal(p.plays,2);
 await rescue.start('rescue-01');boundary.setForeground(false);boundary.setForeground(true);await Promise.resolve();
 assert.equal(rescue.getSnapshot().paused,true);assert.equal(rescue.canPlay(),false);
 a();b();d.dispose();
});

test('original music is deterministic mono PCM with a silent seamless boundary and no clipping',()=>{
 const a=musicWav(),b=musicWav(),v=new DataView(a.buffer);
 assert.deepEqual(a,b);assert.equal(new TextDecoder().decode(a.slice(0,4)),'RIFF');
 assert.equal(v.getUint16(20,true),1);assert.equal(v.getUint16(22,true),1);
 assert.equal(v.getUint32(24,true),MUSIC_RATE);assert.equal(v.getUint16(34,true),16);
 assert.equal(v.getUint32(40,true),MUSIC_RATE*MUSIC_SECONDS*2);
 let energy=0,peak=0;for(let i=44;i<a.length;i+=2){const x=v.getInt16(i,true)/32767;energy+=x*x;peak=Math.max(peak,Math.abs(x));}
 assert.ok(peak>.1&&peak<.6);assert.ok(Math.sqrt(energy/(MUSIC_RATE*MUSIC_SECONDS))>.015);
 assert.equal(v.getInt16(44,true),0);assert.equal(v.getInt16(a.length-2,true),0);
});

const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const player=()=>({plays:0,pauses:0,play(){this.plays++;},pause(){this.pauses++;}});
test('a late audio setup cannot start music after a pause or unmount',async()=>{
 const ready=deferred(),p=player(),d=createMusicDriver(p,{configured:ready.promise});
 const starting=d.update(true);await d.update(false);ready.resolve(true);await starting;assert.equal(p.plays,0);
 const ready2=deferred(),p2=player(),d2=createMusicDriver(p2,{configured:ready2.promise});
 const pending=d2.update(true);d2.dispose();ready2.resolve(true);await pending;assert.equal(p2.plays,0);assert.ok(p2.pauses>0);
});
test('music uses one looping player and repeated state updates do not restart it',async()=>{
 const p=player(),d=createMusicDriver(p);await d.update(true);await d.update(true);await d.update(true);
 assert.equal(p.plays,1);assert.equal(p.loop,true);assert.ok(p.volume>0&&p.volume<=0.2);
 await d.update(false);assert.equal(p.pauses,1);await d.update(true);assert.equal(p.plays,2);d.dispose();
});
test('unavailable audio and disposed callbacks stay cosmetic',async()=>{
 const p=player(),d=createMusicDriver(p,{configured:Promise.resolve(false)});assert.equal(await d.update(true),false);assert.equal(p.plays,0);d.dispose();assert.equal(await d.update(true),false);
 const broken={play(){throw Error('unavailable');},pause(){throw Error('released');}};const b=createMusicDriver(broken);assert.equal(await b.update(true),false);b.dispose();
});
test('both modes honor focus, explicit pause and independent music preference',()=>{
 const campaign={loaded:true,modal:null,session:{profile:{music:true,sound:false}}};
 const rescue={loaded:true,screen:'game',paused:false,error:null};
 assert.equal(musicAllowed({campaign,rescue,inRescue:false,foreground:true}),true);
 assert.equal(musicAllowed({campaign,rescue,inRescue:true,foreground:true}),true);
 assert.equal(musicAllowed({campaign,rescue:{...rescue,paused:true},inRescue:true,foreground:true}),false);
 assert.equal(musicAllowed({campaign,rescue,inRescue:true,foreground:false}),false);
 assert.equal(musicAllowed({campaign:{...campaign,modal:'pause'},rescue,inRescue:false,foreground:true}),false);
 assert.equal(musicAllowed({campaign:{...campaign,session:{profile:{music:false}}},rescue,inRescue:true,foreground:true}),false);
 assert.equal(musicAllowed({campaign,rescue:{...rescue,screen:'list',paused:true},inRescue:true,foreground:true}),true);
});
test('music preference round trips, migrates old saves and cannot change the game economy',async()=>{
 const profile=freshProfile(1800000000000);assert.equal(profile.music,true);
 const old=createSession(freshProfile(1800000000000));delete old.profile.music;assert.equal(decodeSave(encodeSave(old)).profile.music,true);
 assert.equal(validateProfile({...profile,music:'yes'}),false);
 const data=new Map(),c=new GameController({storage:{getItem:async k=>data.get(k)??null,setItem:async(k,v)=>{data.set(k,v);}}});
 await c.initialize();const before=structuredClone(c.state.session);c.preference('music',false);await c.store.flush();
 assert.equal(c.state.session.profile.music,false);const after=structuredClone(c.state.session);delete before.profile.music;delete after.profile.music;assert.deepEqual(after,before);
 const reopened=new GameController({storage:{getItem:async k=>data.get(k)??null,setItem:async(k,v)=>{data.set(k,v);}}});await reopened.initialize();assert.equal(reopened.state.session.profile.music,false);
});

function nativePlayer(){
 let callback,last;const p=player();p.nativePlaying=false;p.removed=0;
 p.addListener=(event,listener)=>{assert.equal(event,'playbackStatusUpdate');callback=last=listener;return {remove(){p.removed++;callback=null;}};};
 p.play=()=>{p.plays++;p.nativePlaying=true;callback?.({playing:true});};
 p.pause=()=>{p.pauses++;p.nativePlaying=false;callback?.({playing:false});};
 p.systemResume=()=>{p.nativePlaying=true;callback?.({playing:true});};
 p.lateStatus=()=>last?.({playing:true});return p;
}
test('native automatic resume cannot override a held pause or muted policy',async()=>{
 const p=nativePlayer(),d=createMusicDriver(p);await d.update(true);assert.equal(p.nativePlaying,true);assert.equal(p.pauses,0);
 await d.update(false);assert.equal(p.nativePlaying,false);p.systemResume();assert.equal(p.nativePlaying,false);
 await d.update(false);p.systemResume();assert.equal(p.nativePlaying,false);d.dispose();assert.equal(p.removed,1);
 const count=p.pauses;p.lateStatus();assert.equal(p.pauses,count);
});
test('native status cannot play before successful configuration, and disposal preserves hook ownership',async()=>{
 const p=nativePlayer(),ready=deferred(),d=createMusicDriver(p,{configured:ready.promise});const starting=d.update(true);
 p.systemResume();assert.equal(p.nativePlaying,false);ready.resolve(true);await starting;assert.equal(p.nativePlaying,true);
 d.dispose();assert.equal(p.removed,1);assert.equal(p.nativePlaying,false);
 const rejected=nativePlayer(),other=createMusicDriver(rejected,{configured:Promise.resolve(false)});await other.update(true);rejected.systemResume();assert.equal(rejected.nativePlaying,false);other.dispose();
});
