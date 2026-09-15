import assert from 'node:assert/strict';
import { campaign } from '../core/levels.mjs';
import { createGame,findMatches,legalMoves,swap,useWonder,goalProgress,validateGame } from '../core/game.mjs';
const levels=campaign(),seeds=new Set();
for(const level of levels){
 const g=createGame(level);assert.ok(validateGame(g),`Level ${level.id}: schema`);
 assert.equal(findMatches(g.board).length,0,`Level ${level.id}: automatic starting match`);
 assert.ok(legalMoves(g).length,`Level ${level.id}: no legal opening`);
 assert.ok(!seeds.has(level.seed),`Level ${level.id}: duplicate seed`);seeds.add(level.seed);
}
const samples=[1,2,3,5,10,20,30,40,41,80,81,120,160,200,240,280,320,360,400,440,480];
const outcomes=[];
for(const id of samples){
 let g=createGame(levels[id-1]),moves=0;
 while(g.status==='playing'&&moves<64){
  if(g.charge===100&&!g.wonderUsed){g=useWonder(g,0).game;if(g.status!=='playing')break;}
  const candidates=legalMoves(g).map(([a,b])=>swap(g,a,b).game);
  candidates.sort((a,b)=>utility(b)-utility(a));g=candidates[0];assert.ok(validateGame(g));moves++;
 }
 outcomes.push({level:id,result:g.status,moves,remaining:g.moves});
}
function utility(g){return(g.status==='won'?10000:0)+g.targets.reduce((n,target)=>n+goalProgress(g,target)/target.amount,0)*500+g.charge*.1+g.board.filter(c=>c.special).length*3;}
console.log(JSON.stringify({definitions:levels.length,uniqueSeeds:seeds.size,validOpeningBoards:levels.length,bot:'one-ply greedy, fixed seeds, not human playtesting',sampleWins:outcomes.filter(o=>o.result==='won').length,samples:outcomes.length,outcomes},null,2));
