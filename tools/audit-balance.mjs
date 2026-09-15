// Privileged deterministic stress player. Knows post-refill outcomes; NOT a human win-rate estimate.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { campaign } from '../core/levels.mjs';
import { createGame, legalMoves, swap, useWonder, goalProgress, validateGame } from '../core/game.mjs';
const utility=g=>(g.status==='won'?10000:0)+g.targets.reduce((n,t)=>n+goalProgress(g,t)/t.amount,0)*500+g.charge*.1+g.board.filter(c=>c.special).length*3;
const outcomes=[];
for(const level of campaign()){
 let g=createGame(level,0),steps=0;
 while(g.status==='playing'&&steps<65){
  if(g.charge===100&&!g.wonderUsed)g=useWonder(g,0).game;
  if(g.status!=='playing')break;
  const next=legalMoves(g).map(pair=>swap(g,...pair).game).sort((a,b)=>utility(b)-utility(a))[0];
  assert.ok(next,`No move in level ${level.id}`);g=next;steps++;assert.ok(validateGame(g),`Invalid board in level ${level.id}`);
 }
 assert.notEqual(g.status,'playing',`Unterminated level ${level.id}`);
 outcomes.push({level:level.id,world:level.world+1,status:g.status,movesUsed:level.moves-g.moves,movesLeft:g.moves});
}
const report={definitions:480,attemptsPerLevel:1,description:'Deterministic stress test with post-refill foresight. These results are not human difficulty or completion rates.',
 won:outcomes.filter(o=>o.status==='won').length,lost:outcomes.filter(o=>o.status==='lost').length,
 worlds:Array.from({length:12},(_,w)=>{const all=outcomes.filter(o=>o.world===w+1);return {world:w+1,won:all.filter(o=>o.status==='won').length,lost:all.filter(o=>o.status==='lost').length};}),outcomes};
await mkdir('dist/qa',{recursive:true});await writeFile('dist/qa/campaign-stress-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({definitions:480,won:report.won,lost:report.lost,invalidBoards:0,unterminatedGames:0,description:report.description},null,2));
