import test from 'node:test';
import assert from 'node:assert/strict';
import { freshProfile, finishLevel } from '../core/profile.mjs';
import { restorationFor, milestoneReached } from '../core/restoration.mjs';
import { worldLandmark, worldRestoration } from '../ui/world-scenes.mjs';
import { domeSvg } from '../ui/art.mjs';
import { t } from '../ui/strings.mjs';
function wins(count){let p=freshProfile(100);for(let i=1;i<=count;i++)p=finishLevel(p,i,2);return p;}
test('restoration advances only on exact eight-level milestones',()=>{
 const seven=restorationFor(wins(7),0),eight=restorationFor(wins(8),0);
 assert.equal(seven.stage,0);assert.equal(seven.remaining,1);assert.equal(eight.stage,1);assert.equal(eight.remaining,8);
});
test('completed worlds have five stages and no remaining milestone',()=>{
 const r=restorationFor(wins(40),0);assert.equal(r.stage,5);assert.equal(r.completed,40);assert.equal(r.remaining,0);assert.equal(r.nextAt,null);assert.equal(r.detail,null);
});
test('progress in one world does not wake another world',()=>{
 const p=wins(41);assert.equal(restorationFor(p,0).stage,5);assert.equal(restorationFor(p,1).completed,1);assert.equal(restorationFor(p,2).completed,0);
});
test('replaying a milestone cannot trigger another celebration',()=>{
 const before=wins(7),after=finishLevel(before,8,1),replay=finishLevel(after,8,3);
 assert.equal(milestoneReached(before,after,0).stage,1);assert.equal(milestoneReached(after,replay,0),null);
});
test('all twelve landmarks have distinct geometry, not just different colours',()=>{
 const landmarks=[];
 for(let i=0;i<12;i++){
  const svg=worldLandmark(i);assert.match(svg,new RegExp(`id="landmark-${i}"`));
  const paths=[...svg.matchAll(/(?:d|points)="([^"]+)"/g)].map(m=>m[1]).join('|');
  assert.ok(paths.length>25);landmarks.push(paths);assert.ok(!/undefined|NaN/.test(svg));
 }
 assert.equal(new Set(landmarks).size,12);
});
test('each world adds five cumulative visible restoration layers',()=>{
 for(let i=0;i<12;i++)for(let stage=0;stage<=5;stage++){
  const svg=worldRestoration(i,stage);
  assert.equal([...svg.matchAll(/id="restoration-\d+-\d+"/g)].length,stage);
  if(stage)for(const lang of ['de','en']){const key=`detail${i}_${stage}`;assert.notEqual(t(lang,key),key);}
 }
});
test('dome embeds the world-specific landmark and clamps invalid progress',()=>{
 for(let i=0;i<12;i++)assert.match(domeSvg(i,1),new RegExp(`landmark-${i}`));
 assert.ok(!/NaN|undefined/.test(domeSvg(0,NaN)));
 assert.throws(()=>restorationFor(wins(0),12),RangeError);
});
