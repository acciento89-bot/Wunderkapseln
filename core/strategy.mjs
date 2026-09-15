/** Goal-aware hints based only on currently visible tiles. No refill RNG or simulation. */
import { findMatches, legalMoves } from './game.mjs';
import { WORLDS } from './levels.mjs';

function blast(board,index,size,palette) {
  const cell=board[index],x=index%size,y=Math.floor(index/size);
  if(cell.special==='row') return Array.from({length:size},(_,i)=>y*size+i);
  if(cell.special==='column') return Array.from({length:size},(_,i)=>i*size+x);
  if(cell.special==='bomb') return board.map((_,i)=>i).filter(i=>Math.abs(i%size-x)<=1&&Math.abs(Math.floor(i/size)-y)<=1);
  if(cell.special==='prism') {
    const counts=Array(palette).fill(0);
    for(const c of board) if(c.color>=0) counts[c.color]++;
    const color=counts.indexOf(Math.max(...counts));
    return board.map((c,i)=>c.color===color?i:-1).filter(i=>i>=0);
  }
  return [];
}
function visibleScore(game,board,indices,bonus=0) {
  const clear=new Set(indices),queue=[...clear];
  for(let k=0;k<queue.length;k++) {
    for(const i of blast(board,queue[k],game.size,game.palette)) {
      if(!clear.has(i)){clear.add(i);queue.push(i);}
    }
  }
  const colors=Array(game.palette).fill(0);let frost=0;
  for(const i of clear){if(board[i].color>=0)colors[board[i].color]++;if(game.frost[i]>0)frost++;}
  let score=clear.size*.5+bonus;
  for(const target of game.targets){
    const remaining=Math.max(0,target.amount-(target.kind==='frost'?game.frostCleared:game.collected[target.color]));
    const hits=Math.min(remaining,target.kind==='frost'?frost:colors[target.color]);
    score+=hits*(target.kind==='frost'?15:12)+(remaining>0&&hits===remaining?10:0);
  }
  return score;
}
function swapScore(game,[a,b]) {
  const board=game.board.map(c=>({...c})),ca=board[a],cb=board[b];
  [board[a],board[b]]=[board[b],board[a]];
  let initial=[];
  if(ca.special==='prism'||cb.special==='prism'){
    const both=ca.special==='prism'&&cb.special==='prism',color=ca.special==='prism'?cb.color:ca.color;
    initial=board.map((c,i)=>both||c.color===color?i:-1).filter(i=>i>=0);
    if(ca.special==='prism')board[b].special='';
    if(cb.special==='prism')board[a].special='';
    initial.push(a,b);
  }else if(ca.special||cb.special)initial.push(a,b);
  const runs=findMatches(board,game.size);
  const bonus=runs.reduce((n,r)=>n+(r.indices.length>=5?10:r.indices.length===4?6:0),0);
  return visibleScore(game,board,[...initial,...runs.flatMap(r=>r.indices)],bonus);
}
export function recommendMove(game) {
  if(!game||game.status!=='playing')return null;
  let best=null,bestScore=-Infinity;
  for(const pair of legalMoves(game)){
    const score=swapScore(game,pair);
    if(score>bestScore){best=pair;bestScore=score;}
  }
  return best;
}
export function recommendWonder(game) {
  if(!game||game.status!=='playing'||game.charge<100||game.wonderUsed)return null;
  const kind=WORLDS[game.world].wonder,n=game.size;
  const frozen=game.frost.map((v,i)=>v>0?i:-1).filter(i=>i>=0);
  let best=0,bestScore=-Infinity;
  for(let target=0;target<game.board.length;target++){
    const board=game.board.map(c=>({...c}));let clear;
    if(kind==='wind'){
      const row=Math.floor(target/n)*n,last=board[row+n-1];
      for(let x=n-1;x>0;x--)board[row+x]=board[row+x-1];
      board[row]=last;clear=Array.from({length:n},(_,x)=>row+x);
    }else if(kind==='tide')clear=Array.from({length:n},(_,y)=>y*n+target%n);
    else clear=frozen.length?frozen.slice(0,12):board.map((c,i)=>c.color===board[target].color?i:-1).filter(i=>i>=0);
    const score=visibleScore(game,board,clear);
    if(score>bestScore){best=target;bestScore=score;}
  }
  return best;
}
