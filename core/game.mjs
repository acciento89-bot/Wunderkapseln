import { levelFor, WORLDS } from './levels.mjs';
const SPECIALS=['','row','column','bomb','prism'];
const copyBoard=b=>b.map(c=>c?{...c}:null);
function clone(g) { return {...g,board:copyBoard(g.board),frost:[...g.frost],collected:[...g.collected],targets:g.targets.map(t=>({...t}))}; }
function random(g,n) {
  g.rng=(g.rng+0x6D2B79F5)>>>0; let t=g.rng;
  t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61);
  return Math.floor(((t^(t>>>14))>>>0)/4294967296*n);
}
function adjacent(a,b,n) { return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<n*n&&b<n*n&&(Math.abs(a-b)===n||(Math.floor(a/n)===Math.floor(b/n)&&Math.abs(a-b)===1)); }
function exchange(b,a,z) { [b[a],b[z]]=[b[z],b[a]]; }
export function findMatches(board,n=8) {
  const runs=[];
  for(const direction of ['row','column']) for(let line=0;line<n;line++) {
    let indices=[],color=-2;
    const flush=()=>{if(indices.length>=3) runs.push({indices:[...indices],direction});};
    for(let j=0;j<n;j++) {
      const i=direction==='row'?line*n+j:j*n+line, c=board[i]?.color??-1;
      if(c>=0&&c===color) indices.push(i);
      else {flush(); indices=c>=0?[i]:[];color=c;}
    }
    flush();
  }
  return runs;
}
export function legalMoves(g) {
  if(g.status!=='playing') return [];
  const b=copyBoard(g.board), moves=[];
  for(let i=0;i<b.length;i++) for(const j of [i+1,i+g.size]) {
    if(!adjacent(i,j,g.size)) continue;
    if(b[i].special||b[j].special) {moves.push([i,j]);continue;}
    exchange(b,i,j); const match=findMatches(b,g.size).length>0; exchange(b,i,j);
    if(match) moves.push([i,j]);
  }
  return moves;
}
function freshBoard(g) {
  g.board=[];
  for(let i=0;i<g.size*g.size;i++) {
    const banned=new Set();
    if(i%g.size>=2&&g.board[i-1].color===g.board[i-2].color) banned.add(g.board[i-1].color);
    if(i>=g.size*2&&g.board[i-g.size].color===g.board[i-g.size*2].color) banned.add(g.board[i-g.size].color);
    const choices=Array.from({length:g.palette},(_,j)=>j).filter(c=>!banned.has(c));
    g.board.push({color:choices[random(g,choices.length)],special:''});
  }
}
function playable(g) {
  if(legalMoves(g).length) return false;
  // Preserve earned specials and frost during normal dead-board shuffles.
  for(let attempt=0;attempt<80;attempt++) {
    for(let i=g.board.length-1;i>0;i--) exchange(g.board,i,random(g,i+1));
    if(!findMatches(g.board,g.size).length&&legalMoves(g).length) return true;
  }
  // Pathological homogeneous boards cannot be rearranged into a stable board.
  do {freshBoard(g);} while(!legalMoves(g).length);
  return true;
}
export function createGame(level,attempt=0) {
  const g={levelId:level.id,world:level.world,size:level.size,palette:level.palette,rng:(level.seed+attempt*7919)>>>0,board:[],frost:[...level.frost],frostCleared:0,collected:Array(6).fill(0),targets:level.targets.map(t=>({...t})),score:0,moves:level.moves,charge:0,wonderUsed:false,status:'playing'};
  freshBoard(g); playable(g); return g;
}
export function goalProgress(g,t) { return Math.min(t.amount,t.kind==='frost'?g.frostCleared:g.collected[t.color]); }
function finish(g) {
  g.status=g.targets.every(t=>goalProgress(g,t)>=t.amount)?'won':g.moves<=0?'lost':'playing';
  return g.status==='playing'?playable(g):false;
}
function components(runs) {
  const groups=[];
  for(const run of runs) {
    const touching=groups.filter(group=>run.indices.some(i=>group.indices.has(i)));
    const group={indices:new Set(run.indices),runs:[run]};
    for(const old of touching) {old.indices.forEach(i=>group.indices.add(i));group.runs.push(...old.runs);groups.splice(groups.indexOf(old),1);}
    groups.push(group);
  }
  return groups;
}
function effects(g,index) {
  const c=g.board[index], n=g.size, x=index%n, y=Math.floor(index/n);
  if(!c?.special) return [];
  if(c.special==='row') return Array.from({length:n},(_,i)=>y*n+i);
  if(c.special==='column') return Array.from({length:n},(_,i)=>i*n+x);
  if(c.special==='bomb') return g.board.map((_,i)=>i).filter(i=>Math.abs(i%n-x)<=1&&Math.abs(Math.floor(i/n)-y)<=1);
  const counts=Array(g.palette).fill(0);g.board.forEach(cell=>{if(cell?.color>=0) counts[cell.color]++;});
  const color=counts.indexOf(Math.max(...counts));
  return g.board.map((_,i)=>i).filter(i=>g.board[i]?.color===color);
}
function collapse(g) {
  const falls=[],n=g.size;
  for(let x=0;x<n;x++) {
    let write=n-1;
    for(let y=n-1;y>=0;y--) {
      const from=y*n+x;
      if(!g.board[from]) continue;
      const to=write*n+x;
      if(to!==from) {g.board[to]=g.board[from];g.board[from]=null;falls.push({from,to});}
      write--;
    }
    for(let y=write;y>=0;y--) {const to=y*n+x;g.board[to]={color:random(g,g.palette),special:''};falls.push({from:-(write-y+1)*n+x,to});}
  }
  return falls;
}
function resolve(g,preferred=-1,initial=[]) {
  const frames=[];let extra=[...initial];
  for(let depth=0;depth<64;depth++) {
    const runs=findMatches(g.board,g.size);
    if(!runs.length&&!extra.length) break;
    const before=copyBoard(g.board),frostBefore=[...g.frost],clear=new Set(extra),created=[];
    for(const group of components(runs)) {
      group.indices.forEach(i=>clear.add(i));
      let special='';
      if(group.runs.some(r=>r.indices.length>=5)) special='prism';
      else if(group.runs.length>1) special='bomb';
      else if(group.runs[0].indices.length===4) special=group.runs[0].direction;
      if(special) {
        const choices=[...group.indices], index=group.indices.has(preferred)?preferred:choices[Math.floor(choices.length/2)];
        if(!g.board[index].special) created.push({index,special,color:special==='prism'?-1:g.board[index].color});
      }
    }
    // Expand each old special exactly once. The queue grows, never recurses.
    const queue=[...clear],expanded=new Set(),blast=new Set();
    for(let q=0;q<queue.length;q++) {
      const i=queue[q];if(expanded.has(i)) continue;expanded.add(i);
      for(const j of effects(g,i)) {blast.add(j);if(!clear.has(j)){clear.add(j);queue.push(j);}}
    }
    const surviving=created.filter(c=>!blast.has(c.index));
    for(const i of clear) {
      if(g.board[i].color>=0) g.collected[g.board[i].color]++;
      if(g.frost[i]>0) {g.frost[i]--;g.frostCleared++;}
      g.board[i]=null;
    }
    for(const c of surviving) g.board[c.index]={color:c.color,special:c.special};
    g.score+=clear.size*50*Math.min(5,depth+1)+surviving.length*200;
    if(!g.wonderUsed) g.charge=Math.min(100,g.charge+clear.size*2+surviving.length*12);
    const falls=collapse(g);
    frames.push({before,board:copyBoard(g.board),frostBefore,frost:[...g.frost],cleared:[...clear],created:surviving,falls,combo:depth+1});
    extra=[];preferred=-1;
  }
  // Bound pathological RNG cascades instead of freezing the UI.
  if(findMatches(g.board,g.size).length) {freshBoard(g);frames.push({board:copyBoard(g.board),frost:[...g.frost],cleared:[],created:[],falls:[],combo:0,rescue:true});}
  const reshuffled=finish(g);
  if(reshuffled) frames.push({board:copyBoard(g.board),frost:[...g.frost],cleared:[],created:[],falls:[],combo:0,reshuffled:true});
  return {ok:true,game:g,frames,reshuffled};
}
export function resolveBoard(game,preferred=-1) { return resolve(clone(game),preferred); }
export function swap(game,a,b) {
  if(game.status!=='playing'||!adjacent(a,b,game.size)) return {ok:false,game,frames:[]};
  const g=clone(game), ca=g.board[a],cb=g.board[b];exchange(g.board,a,b);
  const initial=[],triggeredSpecials=[ca.special,cb.special].filter(Boolean);
  if(ca.special==='prism'||cb.special==='prism') {
    if(ca.special==='prism'&&cb.special==='prism') initial.push(...g.board.map((_,i)=>i));
    else {const color=ca.special==='prism'?cb.color:ca.color;g.board.forEach((c,i)=>{if(c.color===color) initial.push(i);});}
    // A directly swapped prism already has a target; suppress its automatic blast.
    if(ca.special==='prism') g.board[b].special='';
    if(cb.special==='prism') g.board[a].special='';
    initial.push(a,b);
  } else if(ca.special||cb.special) initial.push(a,b);
  if(!initial.length&&!findMatches(g.board,g.size).length) return {ok:false,game,frames:[]};
  g.moves--; const result=resolve(g,b,initial);result.swap=[a,b];result.triggeredSpecials=triggeredSpecials;return result;
}
export function useWonder(game,target) {
  if(game.status!=='playing'||game.charge<100||game.wonderUsed||!Number.isInteger(target)||target<0||target>=game.board.length) return {ok:false,game,frames:[]};
  const g=clone(game);g.wonderUsed=true;g.charge=0;
  const kind=WORLDS[g.world].wonder, n=g.size;
  const resolveWonder = indices => ({...resolve(g,-1,indices),wonder:kind});
  if(kind==='wind') {
    const row=Math.floor(target/n)*n, last=g.board[row+n-1];
    for(let x=n-1;x>0;x--) g.board[row+x]=g.board[row+x-1];
    g.board[row]=last;
    // A gust always helps: it clears the selected row after shifting it.
    return resolveWonder(Array.from({length:n},(_,x)=>row+x));
  }
  if(kind==='tide') return resolveWonder(Array.from({length:n},(_,y)=>y*n+target%n));
  const frozen=g.frost.map((v,i)=>v>0?i:-1).filter(i=>i>=0);
  if(frozen.length) return resolveWonder(frozen.slice(0,12));
  const color=g.board[target].color;
  return resolveWonder(g.board.map((c,i)=>c.color===color?i:-1).filter(i=>i>=0));
}
export function starsFor(g) {return g.status==='won'?Math.min(3,1+(g.moves>=3?1:0)+(g.moves>=8?1:0)):0;}
export function validateGame(g) {
  if(!g||typeof g!=='object'||!Number.isInteger(g.levelId)||g.levelId<1||g.levelId>480) return false;
  const l=levelFor(g.levelId);
  return g.size===8&&g.world===l.world&&g.palette===l.palette&&Array.isArray(g.board)&&g.board.length===64&&g.board.every(c=>c&&Number.isInteger(c.color)&&SPECIALS.includes(c.special)&&((c.color>=0&&c.color<g.palette)||(c.color===-1&&c.special==='prism')))&&Array.isArray(g.frost)&&g.frost.length===64&&g.frost.every(v=>Number.isInteger(v)&&v>=0&&v<=2)&&Number.isInteger(g.moves)&&g.moves>=0&&g.moves<=l.moves&&Number.isFinite(g.score)&&g.score>=0&&Number.isInteger(g.rng)&&g.rng>=0&&g.rng<=0xffffffff&&Array.isArray(g.collected)&&g.collected.length===6&&g.collected.every(v=>Number.isInteger(v)&&v>=0&&v<100000)&&Number.isInteger(g.frostCleared)&&g.frostCleared>=0&&g.frostCleared<=64*2&&Number.isFinite(g.charge)&&g.charge>=0&&g.charge<=100&&typeof g.wonderUsed==='boolean'&&['playing','won','lost'].includes(g.status)&&JSON.stringify(g.targets)===JSON.stringify(l.targets);
}
