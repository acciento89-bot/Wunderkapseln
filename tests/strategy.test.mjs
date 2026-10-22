import test from 'node:test';
import assert from 'node:assert/strict';
import * as strategy from '../core/strategy.mjs';
import {createGame,legalMoves,findMatches} from '../core/game.mjs';
import {levelFor} from '../core/levels.mjs';
import {GameController} from '../core/controller.mjs';

function recommend(g){assert.equal(typeof strategy.recommendMove,'function');return strategy.recommendMove(g);}
function wonder(g){assert.equal(typeof strategy.recommendWonder,'function');return strategy.recommendWonder(g);}
const controller=()=>new GameController({storage:{getItem:async()=>null,setItem:async()=>{}},now:()=>1800000000000});

test('hints return a legal pair without reading hidden refill RNG',()=>{
  const g=createGame(levelFor(1)),before=structuredClone(g);
  Object.defineProperty(g,'rng',{get(){throw Error('future refill state must stay hidden');}});
  const pair=recommend(g);assert.ok(legalMoves(g).some(m=>m[0]===pair[0]&&m[1]===pair[1]));assert.deepEqual(g.board,before.board);
});
test('changing hidden RNG never changes the recommended visible move',()=>{
  const g=createGame(levelFor(83));assert.deepEqual(recommend(g),recommend({...g,rng:0xffffffff}));
});
test('finished and missing games have no recommended moves',()=>{
  assert.equal(recommend(null),null);assert.equal(recommend({...createGame(levelFor(1)),status:'won'}),null);
});
test('hints respond to visible unmet goals rather than choosing the first legal pair',()=>{
  const g=createGame(levelFor(1)),pairs=[];
  for(let color=0;color<4;color++)pairs.push(recommend({...g,targets:[{kind:'color',color,amount:20}]}));
  assert.ok(new Set(pairs.map(p=>JSON.stringify(p))).size>1);
  for(let color=0;color<4;color++){
    const b=g.board.map(c=>({...c})),[a,z]=pairs[color];[b[a],b[z]]=[b[z],b[a]];
    const targetHits=findMatches(b).flatMap(r=>r.indices).filter(i=>b[i].color===color).length;
    const some=legalMoves(g).some(([x,y])=>{const board=g.board.slice();[board[x],board[y]]=[board[y],board[x]];return findMatches(board).some(r=>board[r.indices[0]].color===color);});
    if(some)assert.ok(targetHits>0,`target color ${color}`);
  }
});
test('charged wonder target uses visible frost and cannot read RNG',()=>{
  const g=createGame(levelFor(81));g.charge=100;g.targets=[{kind:'frost',amount:8}];g.frost=Array.from({length:64},(_,i)=>i%8===6?1:0);
  Object.defineProperty(g,'rng',{get(){throw Error('hidden RNG');}});
  assert.equal(wonder(g)%8,6);g.wonderUsed=true;assert.equal(wonder(g),null);
});
test('first level highlights a useful starting swap without spending a move',async()=>{
  const c=controller();await c.initialize();c.play();assert.equal(c.state.hint.length,2);assert.equal(c.state.session.game.moves,24);assert.equal(c.state.notice,'firstMove');
});
test('manual hints do not mutate a board or consume lives, moves or inventory',async()=>{
  const c=controller();await c.initialize();c.play();const before=structuredClone(c.state.session);c.hint();assert.deepEqual(c.state.session,before);assert.deepEqual(c.state.hint,recommend(before.game));assert.equal(c.state.notice,'hintHelp');
});
test('reopening a played attempt does not restart automatic opening guidance',async()=>{
  const c=controller();await c.initialize();c.preference('reducedMotion',true);c.play();await c.move(...legalMoves(c.state.session.game)[0]);c.navigate('home');c.play();assert.deepEqual(c.state.hint,[]);
});
test('selecting a tile removes stale two-highlight opening instructions',async()=>{
  const c=controller();await c.initialize();c.play();await c.tap(0);
  assert.equal(c.state.notice,null);assert.deepEqual(c.state.hint,[]);
});
