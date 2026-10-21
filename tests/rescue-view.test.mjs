import test from 'node:test';import assert from 'node:assert/strict';
import {rescuePresentation} from '../ui/rescue-view.mjs';import {rescueBoardSvg} from '../ui/rescue-svg.mjs';
import {freshRescueJournal} from '../core/rescue-storage.mjs';import {createRescueGame} from '../core/rescue.mjs';import {RESCUE_LEVELS} from '../core/rescue-levels.mjs';
const state=()=>({journal:{...freshRescueJournal(),game:createRescueGame(RESCUE_LEVELS[0])},loaded:true,paused:false,busy:false,pending:null,selected:-1});
test('real board view labels companions, exits, frost and shapes in both locales without raw keys',()=>{
 for(const lang of ['de','en']){
  const p=rescuePresentation(state(),lang,320,600);assert.equal(p.tiles.length,64);assert.match(p.tiles[50].label,lang==='de'?/Begleiter/:/Companion/);assert.match(p.tiles[58].label,lang==='de'?/Ausgang/:/Exit/);
  assert.ok(p.tiles.filter(t=>t.disabled).some(t=>t.index===50));assert.doesNotMatch(p.status,/^rescue/);
  const svg=rescueBoardSvg(state().journal.game);assert.match(svg,/data-companion="a"/);assert.match(svg,/data-exit="2"/);assert.doesNotMatch(svg,/undefined|NaN/);
 }
});
test('window changes bound board and genuine pending save disables all tiles with explicit retry',()=>{
 for(const [w,h] of [[240,300],[320,220],[900,400],[1600,1200]]){const p=rescuePresentation(state(),'en',w,h);assert.ok(p.boardSize<=w-24);assert.ok(p.boardSize<=640);assert.ok(p.boardSize>0);}
 const s=state();s.pending=s.journal;s.error='rescueSaveError';const p=rescuePresentation(s,'en',320,600);assert.equal(p.canRetry,true);assert.ok(p.tiles.every(t=>t.disabled));assert.match(p.error,/saved|save/i);
});
test('a durably retried win is presented as rescued even when the interruption left pause set',()=>{
 const s=state();s.paused=true;s.journal.game.status='won';s.journal.game.rescued=['a'];
 assert.match(rescuePresentation(s,'en',320,600).status,/All companions rescued/);
});
