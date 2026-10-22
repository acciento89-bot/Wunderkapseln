import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createVoicePool} from '../core/voice-pool.mjs';
const module=await import('../native/player-adapter.mjs').catch(error=>{
  if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;return {};
});
const drain=()=>new Promise(setImmediate);
function player(){
  const seeks=[], plays=[], pauses=[];
  return {seeks,plays,pauses,volume:0,
    seekTo(seconds){return new Promise((resolve,reject)=>seeks.push({seconds,resolve,reject}));},
    play(){plays.push('play');},pause(){pauses.push('pause');},
  };
}
function setup(players, configured=Promise.resolve(true)){
  assert.equal(typeof module.createNativePlayerAdapter,'function','native playback adapter must exist');
  const adapter=module.createNativePlayerAdapter(players,{configured});
  return {adapter,pool:createVoicePool(adapter)};
}

test('replacement sounds serialize seeks on the same native player',async()=>{
  const p=player(),{pool}=setup({bomb:p});
  const first=pool.play('bomb');await drain();assert.equal(p.seeks.length,1);
  const second=pool.play('bomb');await drain();assert.equal(p.seeks.length,1,'second seek must wait for old seek');
  p.seeks[0].resolve();await drain();assert.equal(await first,false);assert.equal(p.seeks.length,2);assert.equal(p.plays.length,0);
  p.seeks[1].resolve();assert.equal(await second,true);assert.equal(p.plays.length,1);assert.equal(p.volume,.5);pool.dispose();
});

test('different sound players are not globally serialized',async()=>{
  const bomb=player(),rocket=player(),{pool}=setup({bomb,rocket});
  const jobs=[pool.play('bomb'),pool.play('rocket')];await drain();
  assert.equal(bomb.seeks.length,1);assert.equal(rocket.seeks.length,1);
  bomb.seeks[0].resolve();rocket.seeks[0].resolve();assert.deepEqual(await Promise.all(jobs),[true,true]);pool.dispose();
});

test('stop during a seek suppresses its eventual playback',async()=>{
  const p=player(),{pool}=setup({mega:p});const pending=pool.play('mega');await drain();
  pool.stop();p.seeks[0].resolve();assert.equal(await pending,false);assert.equal(p.plays.length,0);
});

test('stop before audio configuration completes does not seek or play',async()=>{
  let ready;const p=player(),{pool}=setup({wind:p},new Promise(resolve=>ready=resolve));
  const pending=pool.play('wind');await drain();pool.stop();ready(true);
  assert.equal(await pending,false);assert.equal(p.seeks.length,0);assert.equal(p.plays.length,0);
});

test('failed seeks do not poison the next attempt on that player',async()=>{
  const p=player(),{pool}=setup({tide:p});const first=pool.play('tide');await drain();
  p.seeks[0].reject(Error('device interrupted'));assert.equal(await first,false);
  const second=pool.play('tide');await drain();assert.equal(p.seeks.length,2);
  p.seeks[1].resolve();assert.equal(await second,true);pool.dispose();
});

test('obsolete queued repeats are dropped before touching the player',async()=>{
  const p=player(),{pool}=setup({rocket:p});const first=pool.play('rocket');await drain();
  const second=pool.play('rocket'),third=pool.play('rocket');await drain();
  assert.equal(p.seeks.length,1);p.seeks[0].resolve();await drain();
  assert.equal(p.seeks.length,2);p.seeks[1].resolve();
  assert.deepEqual(await Promise.all([first,second,third]),[false,false,true]);assert.equal(p.plays.length,1);pool.dispose();
});

test('adapter disposal blocks pending and future playback without releasing hook-owned players',async()=>{
  const p=player(),{adapter,pool}=setup({prism:p});const first=pool.play('prism');await drain();
  adapter.dispose();adapter.dispose();p.seeks[0].resolve();assert.equal(await first,false);
  assert.equal(await pool.play('prism'),false);assert.equal(p.plays.length,0);pool.dispose();
});

test('failed configuration and unknown cues never reach a player',async()=>{
  let reject;const ready=new Promise((resolve,no)=>{reject=no;});
  const p=player(),{pool}=setup({bloom:p},ready);reject(Error('audio unavailable'));
  assert.equal(await pool.play('bloom'),false);assert.equal(await pool.play('unknown'),false);
  assert.equal(p.seeks.length,0);pool.dispose();
});

test('direct adapter stop invalidates its pending work even with a still-current caller',async()=>{
  const p=player(),{adapter}=setup({bomb:p});const pending=adapter.start('bomb',{isCurrent:()=>true});await drain();
  adapter.stop('bomb');p.seeks[0].resolve();assert.equal(await pending,false);assert.equal(p.plays.length,0);adapter.dispose();
});

test('native audio hook wires the tested player adapter and disposes it',()=>{
  const source=readFileSync(new URL('../native/useGameAudio.js',import.meta.url),'utf8');
  assert.match(source,/createNativePlayerAdapter\(players,\s*\{\s*configured\s*\}\)/);
  assert.match(source,/adapter\.dispose\(\)/);
});
