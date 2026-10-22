/** Visible-board-only bot. Refill state is hidden, not simulated to choose moves. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {campaign} from '../core/levels.mjs';
import {createGame,swap,useWonder,validateGame,findMatches,legalMoves} from '../core/game.mjs';
import {recommendMove,recommendWonder} from '../core/strategy.mjs';
const attemptsPerLevel=3,outcomes=[];
function visible(game){
  const view={...game};
  Object.defineProperty(view,'rng',{get(){throw Error('Audit strategy accessed hidden refill RNG');}});
  return view;
}
for(const level of campaign())for(let attempt=0;attempt<attemptsPerLevel;attempt++){
  let game=createGame(level,attempt),steps=0,wonderUsed=false;
  while(game.status==='playing'&&steps<65){
    const target=recommendWonder(visible(game));
    if(target!==null){game=useWonder(game,target).game;wonderUsed=true;}
    if(game.status!=='playing')break;
    const pair=recommendMove(visible(game));assert.ok(pair,`Missing move ${level.id}/${attempt}`);
    const result=swap(game,...pair);assert.ok(result.ok,`Illegal recommendation ${level.id}/${attempt}`);
    game=result.game;steps++;
    assert.ok(validateGame(game),`Invalid game ${level.id}/${attempt}`);
    assert.equal(findMatches(game.board).length,0,`Unresolved match ${level.id}/${attempt}`);
    if(game.status==='playing')assert.ok(legalMoves(game).length,`No legal move ${level.id}/${attempt}`);
  }
  assert.ok(validateGame(game));assert.notEqual(game.status,'playing',`Unfinished game ${level.id}/${attempt}`);
  outcomes.push({level:level.id,attempt,status:game.status,movesUsed:level.moves-game.moves,movesLeft:game.moves,wonderUsed});
}
const levels=campaign().map(l=>{const a=outcomes.filter(o=>o.level===l.id);return {level:l.id,world:l.world+1,won:a.filter(o=>o.status==='won').length,attempts:3};});
const report={description:'Visible-information heuristic bot, no refill lookahead. Bot outcomes are not human win rates, a difficulty calibration or proof of solvability.',
 definitions:480,attemptsPerLevel,totalAttempts:outcomes.length,won:outcomes.filter(o=>o.status==='won').length,lost:outcomes.filter(o=>o.status==='lost').length,
 invalidBoards:0,unresolvedBoards:0,unterminatedGames:0,hiddenRngReads:0,
 zeroWinLevels:levels.filter(l=>l.won===0).map(l=>l.level),
 worlds:Array.from({length:12},(_,world)=>{const a=levels.filter(l=>l.world===world+1);return {world:world+1,attempts:a.length*3,won:a.reduce((n,l)=>n+l.won,0),zeroWinLevels:a.filter(l=>l.won===0).map(l=>l.level)};}),levels,outcomes};
await mkdir('dist/qa',{recursive:true});await writeFile('dist/qa/visible-campaign-report.json',JSON.stringify(report,null,2));
const {outcomes:_,levels:__,...summary}=report;console.log(JSON.stringify(summary,null,2));
