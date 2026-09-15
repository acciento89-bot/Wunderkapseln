import { createGame, legalMoves, swap } from '../core/game.mjs';
import { levelFor } from '../core/levels.mjs';
import { freshProfile, finishLevel } from '../core/profile.mjs';
import { createSession } from '../core/session.mjs';
import { encodeSave } from '../core/storage.mjs';
import { SOUND_NAMES, synthesize } from '../ui/sounds.mjs';
const fixtures={};
const save=(game,sound=true)=>{let p=freshProfile(Date.now(),'de');for(let id=1;id<game.levelId;id++)p=finishLevel(p,id,2);p.sound=sound;const s=createSession(p);s.game=game;return encodeSave(s);};
for(const [cue,special] of [['rocket','row'],['bomb','bomb'],['prism','prism'],['mega','row']]){
 const g=createGame(levelFor(80));g.board[0]={color:special==='prism'?-1:0,special};if(cue==='mega')g.board[1].special='bomb';
 fixtures[cue]={save:save(g),pair:[0,1]};if(cue==='bomb')fixtures.muted={save:save(g,false),pair:[0,1]};
}
for(const [cue,id] of [['bloom',1],['wind',41],['tide',81]]){const g=createGame(levelFor(id));g.charge=100;fixtures[cue]={save:save(g),target:0};}
const g=createGame(levelFor(80));g.charge=99;const pair=legalMoves(g).find(pair=>swap(g,...pair).game.status==='playing');fixtures.charge={save:save(g),pair};
const signature=pcm=>pcm.length+':'+Math.round(pcm.filter((_,i)=>i%97===0).reduce((sum,x)=>sum+Math.abs(x),0)*1e6);
fixtures.signatures=Object.fromEntries(SOUND_NAMES.map(cue=>[signature(synthesize(cue)),cue]));
console.log(JSON.stringify(fixtures));
