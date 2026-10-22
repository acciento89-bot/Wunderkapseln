import {swap,useWonder,findMatches,legalMoves} from './game.mjs';
import {rescueLevelFor} from './rescue-levels.mjs';
export function createRescueGame(recipe){
 const l=rescueLevelFor(recipe.id),board=Array.from({length:64},(_,i)=>({color:(i%8+2*Math.floor(i/8))%5,special:''}));
 const frost=Array(64).fill(0);for(const i of l.frost)frost[i]=1;
 const companions=l.lesson==='pair'?[{id:'a',column:2,row:l.row},{id:'b',column:5,row:Math.min(6,l.row+1)}]:[{id:'a',column:l.column,row:l.row}];
 if(l.lesson==='match'){
  const start=l.column-2;[0,1,0,0].forEach((color,i)=>board[56+start+i]={color,special:''});
 }else if(l.lesson==='column'||l.lesson==='pair'){
  for(const column of l.exits)board[56+column-1].special='column';
 }else if(l.lesson==='prism'){
  board[56]={color:-1,special:'prism'};board[57].color=0;board[58].color=0;board[59].color=2;
 }else board[56+l.column-1].special=l.lesson;
 for(const c of companions)board[c.row*8+c.column]={color:-2,special:'',companion:c.id};
 return {mode:'rescue',rescueId:l.id,catalogRevision:1,levelId:1,world:0,size:8,palette:5,rng:l.seed>>>0,board,frost,frostCleared:0,collected:Array(6).fill(0),targets:[],score:0,moves:l.moves,charge:0,wonderUsed:false,status:'playing',exits:[...l.exits],rescued:[],companionIds:companions.map(c=>c.id)};
}
export function applyRescueMove(game,a,b){return swap(game,a,b);}
export function applyRescueWonder(game,target){return useWonder(game,target);}
const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function validateRescueGame(g){
 try{
  const l=rescueLevelFor(g.rescueId),initial=createRescueGame(l);
  if(JSON.stringify(Object.keys(g).sort())!==JSON.stringify(Object.keys(initial).sort()))return false;
  if(g.mode!=='rescue'||g.catalogRevision!==1||g.levelId!==1||g.world!==0||g.size!==8||g.palette!==5||JSON.stringify(g.exits)!==JSON.stringify(l.exits)||JSON.stringify(g.companionIds)!==JSON.stringify(initial.companionIds))return false;
  if(!integer(g.rng,0,0xffffffff)||!integer(g.moves,0,l.moves)||!integer(g.score,0,10000000)||!integer(g.charge,0,100)||typeof g.wonderUsed!=='boolean'||!integer(g.frostCleared,0,128))return false;
  if(!Array.isArray(g.board)||g.board.length!==64||!Array.isArray(g.frost)||g.frost.length!==64||!g.frost.every(v=>integer(v,0,2))||!Array.isArray(g.collected)||g.collected.length!==6||!g.collected.every(v=>integer(v,0,100000))||JSON.stringify(g.targets)!=='[]')return false;
  const present=[];
  for(const c of g.board){
   if(!c||typeof c!=='object')return false;
   if(c.companion){if(c.color!==-2||c.special!==''||Object.keys(c).sort().join()!=='color,companion,special')return false;present.push(c.companion);}
   else if(Object.keys(c).sort().join()!=='color,special'||!['','row','column','bomb','prism'].includes(c.special)||!(integer(c.color,0,4)||(c.color===-1&&c.special==='prism')))return false;
  }
  if(!Array.isArray(g.rescued)||new Set([...present,...g.rescued]).size!==initial.companionIds.length||[...present,...g.rescued].sort().join()!==initial.companionIds.sort().join())return false;
  const won=g.rescued.length===g.companionIds.length;
  if(!['playing','won','lost','stuck'].includes(g.status)||won!==(g.status==='won')||(g.status==='lost'&&g.moves!==0)||(g.status==='playing'&&g.moves===0))return false;
  // Bounded engine exhaustion is a held terminal, not a board allowed to accept more moves.
  return (g.status==='stuck'||!findMatches(g.board,8).length)&&(g.status!=='playing'||legalMoves(g).length>0);
 }catch{return false;}
}
