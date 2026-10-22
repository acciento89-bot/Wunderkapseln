import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, findMatches, legalMoves, swap } from '../core/game.mjs';
import { levelFor } from '../core/levels.mjs';
import { rescueLevelFor, RESCUE_LEVELS } from '../core/rescue-levels.mjs';
import { createRescueGame, applyRescueMove, validateRescueGame, applyRescueWonder } from '../core/rescue.mjs';

// Removing companion-preserving gravity, exit-only collection, or immutable candidates breaks these outcomes.
test('twelve fixed recipes start stable with legal moves and deterministic independent identities',()=>{
 assert.equal(RESCUE_LEVELS.length,12);
 for(let n=1;n<=12;n++){
  const l=rescueLevelFor(`rescue-${String(n).padStart(2,'0')}`),g=createRescueGame(l);
  assert.equal(validateRescueGame(g),true,l.id);assert.deepEqual(g,createRescueGame(l));
  assert.equal(findMatches(g.board,8).length,0,l.id);assert.ok(legalMoves(g).length,l.id);
  assert.equal(g.rescueId,l.id);assert.ok(g.board.filter(c=>c.companion).length>=1);
 }
 assert.throws(()=>rescueLevelFor('rescue-13'));
});
test('first tutorial legal swap clears support and rescues at bottom exit without mutating input',()=>{
 const g=createRescueGame(rescueLevelFor('rescue-01')),old=structuredClone(g);
 const r=applyRescueMove(g,56,57);
 assert.equal(r.ok,true);assert.deepEqual(g,old);assert.equal(r.game.rescued.length,1);assert.equal(r.game.status,'won');
 assert.equal(r.game.moves,g.moves-1);assert.equal(validateRescueGame(r.game),true);
});
test('companion cannot be swapped or matched and invalid input never spends a move',()=>{
 const g=createRescueGame(rescueLevelFor('rescue-01'));const index=g.board.findIndex(c=>c.companion);
 for(const pair of [[index,index+1],[-1,0],[0,63]]){const r=applyRescueMove(g,...pair);assert.equal(r.ok,false);assert.strictEqual(r.game,g);}
 assert.equal(findMatches(g.board,8).some(r=>r.indices.includes(index)),false);
});
test('companion away from an exit remains on board after support clear',()=>{
 const g=createRescueGame(rescueLevelFor('rescue-01'));g.exits=[7];
 const r=applyRescueMove(g,56,57);assert.equal(r.game.rescued.length,0);assert.ok(r.game.board[58].companion);assert.notEqual(r.game.status,'won');
});
test('column blast and charged blossom preserve companion identity while clearing its support',()=>{
 const g=createRescueGame(rescueLevelFor('rescue-03'));const ids=g.board.filter(c=>c.companion).map(c=>c.companion);
 const r=applyRescueMove(g,57,58);assert.equal(r.ok,true);
 assert.deepEqual([...r.game.rescued,...r.game.board.filter(c=>c.companion).map(c=>c.companion)].sort(),ids.sort());
 const b=createRescueGame(rescueLevelFor('rescue-01'));b.charge=100;b.frost[58]=1;
 const w=applyRescueWonder(b,58);assert.equal(w.ok,true);assert.equal(w.game.wonderUsed,true);assert.equal(w.game.rescued.length,1);
});
test('rescue state rejects forged outcomes, duplicate IDs, invalid exits and nonfinite RNG',()=>{
 const good=createRescueGame(rescueLevelFor('rescue-01'));
 for(const mutate of [g=>g.rescued.push('not-a-companion'),g=>g.board[0]={...g.board[50]},g=>g.exits=[99],g=>g.rng=Infinity,g=>g.extra=true]){
  const g=structuredClone(good);mutate(g);assert.equal(validateRescueGame(g),false);
 }
});
test('all legacy campaign starts and first legal moves remain exact against baseline fixtures',async()=>{
 const {default:goldens}=await import('./fixtures/campaign-rescue-baseline.json',{with:{type:'json'}});
 const {createHash}=await import('node:crypto');
 for(let id=1;id<=480;id++){
  const g=createGame(levelFor(id)),m=legalMoves(g)[0],r=swap(g,...m);
  assert.equal(createHash('sha256').update(JSON.stringify({g,m,r})).digest('hex'),goldens[id-1],`legacy ${id}`);
 }
});
test('all twelve actual companion/exit recipes have legal complete solution traces',async()=>{
 const {RESCUE_SOLUTIONS}=await import('./fixtures/rescue-solutions.mjs');
 for(let i=0;i<12;i++){
  let g=createRescueGame(RESCUE_LEVELS[i]);
  for(const [a,b] of RESCUE_SOLUTIONS[i]){if(g.status==='won')break;const r=applyRescueMove(g,a,b);assert.equal(r.ok,true,`${g.rescueId} move ${a}/${b}`);g=r.game;assert.ok(validateRescueGame(g),g.rescueId);}
  assert.equal(g.status,'won',g.rescueId);assert.equal(g.rescued.length,g.companionIds.length);assert.ok(g.moves>=0);
 }
});
test('prism double blast never deletes an unrescued companion in a nonexit column',()=>{
 const g=createRescueGame(RESCUE_LEVELS[0]);g.exits=[7];g.board[56]={color:-1,special:'prism'};g.board[57]={color:-1,special:'prism'};
 const r=applyRescueMove(g,56,57);assert.equal(r.ok,true);assert.equal(r.game.rescued.length,0);assert.equal(r.game.board.filter(c=>c.companion).length,1);
});
