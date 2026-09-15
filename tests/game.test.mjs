import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLDS, levelFor, campaign } from '../core/levels.mjs';
import { createGame, findMatches, legalMoves, swap, useWonder, validateGame, resolveBoard } from '../core/game.mjs';

test('campaign has 480 distinct definitions in twelve worlds', () => {
  assert.equal(WORLDS.length, 12); assert.equal(campaign().length, 480);
  assert.equal(new Set(campaign().map(l=>JSON.stringify(l))).size,480);
  assert.equal(levelFor(1).world,0); assert.equal(levelFor(480).world,11);
  assert.throws(()=>levelFor(0)); assert.throws(()=>levelFor(481));
});
test('all starting boards are stable, playable and reproducible', () => {
  for (let id=1;id<=480;id++) {
    const g=createGame(levelFor(id),0);
    assert.equal(findMatches(g.board,g.size).length,0,`initial match ${id}`);
    assert.ok(legalMoves(g).length,`dead board ${id}`);
    assert.deepEqual(g,createGame(levelFor(id),0));
    assert.equal(validateGame(g),true,`invalid level ${id}`);
  }
});
test('nonadjacent, out of bounds and unproductive swaps do not spend a move', () => {
  const g=createGame(levelFor(1)); const before=JSON.stringify(g);
  for(const [a,b] of [[-1,0],[0,63],[7,8],[0,0],[0,64]]) assert.equal(swap(g,a,b).ok,false);
  let checked=false;
  for(let i=0;i<63;i++) if(i%8<7&&!legalMoves(g).some(m=>m[0]===i&&m[1]===i+1)) {
    assert.equal(swap(g,i,i+1).ok,false); checked=true; break;
  }
  assert.ok(checked); assert.equal(JSON.stringify(g),before);
});
test('productive swap spends exactly one move and stabilizes the board',()=>{
  const g=createGame(levelFor(1)); const [a,b]=legalMoves(g)[0]; const out=swap(g,a,b);
  assert.ok(out.ok); assert.equal(out.game.moves,g.moves-1); assert.ok(out.frames.length>0);
  assert.equal(findMatches(out.game.board,8).length,0); assert.ok(validateGame(out.game));
  assert.equal(g.moves,levelFor(1).moves);
});
function fixture() {
  const g=createGame(levelFor(50));
  g.board=Array.from({length:64},(_,i)=>({color:((i%8)+Math.floor(i/8)*2)%6,special:''}));
  g.frost=Array(64).fill(0); return g;
}
test('four in a row produces a rocket',()=>{
  const g=fixture(); for(let i=0;i<4;i++) g.board[i]={color:0,special:''};
  const out=resolveBoard(g,2); assert.equal(out.frames[0].created[0].special,'row');
});
test('five in a row produces a prism',()=>{
  const g=fixture(); for(let i=0;i<5;i++) g.board[i]={color:0,special:''};
  assert.equal(resolveBoard(g,2).frames[0].created[0].special,'prism');
});
test('intersecting three-lines produce a bomb',()=>{
  const g=fixture(); for(const i of [8,9,10,1,17]) g.board[i]={color:4,special:''};
  assert.ok(resolveBoard(g,9).frames[0].created.some(c=>c.special==='bomb'));
});
test('prism swap clears selected color and spends one move',()=>{
  const g=fixture(); g.board[0].special='prism'; const color=g.board[1].color;
  const expected=g.board.filter(c=>c.color===color).length;
  const out=swap(g,0,1); assert.ok(out.ok);
  assert.ok(out.game.collected[color]>=expected); assert.equal(out.game.moves,g.moves-1);
});
test('clears remove frost and chained specials are bounded',()=>{
  const g=fixture(); g.board[0].special='row'; g.board[1].special='column';
  g.frost.fill(1); const out=swap(g,0,1); assert.ok(out.ok); assert.ok(out.game.frostCleared>=15);
  assert.ok(out.frames.length<=65); assert.ok(validateGame(out.game));
});
test('wonder requires earned charge and does not cost a normal move',()=>{
  const g=createGame(levelFor(1)); assert.equal(useWonder(g,4).ok,false);
  g.charge=100; const out=useWonder(g,4); assert.ok(out.ok); assert.equal(out.game.moves,g.moves);
  assert.equal(out.game.wonderUsed,true); assert.equal(useWonder(out.game,4).ok,false);
});
test('completed/failed games reject more moves',()=>{
  const g=createGame(levelFor(1)); g.status='won'; assert.equal(swap(g,0,1).ok,false);
  g.status='lost'; assert.equal(useWonder(g,2).ok,false);
});
test('repeated valid play maintains invariants and terminates',()=>{
  for(const id of [1,6,19,40,41,80,121,240,360,480]) {
    let g=createGame(levelFor(id)); let steps=0;
    while(g.status==='playing'&&steps++<60) { const [a,b]=legalMoves(g)[0]; g=swap(g,a,b).game; assert.ok(validateGame(g)); }
    assert.notEqual(g.status,'playing');
  }
});
