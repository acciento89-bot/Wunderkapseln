// Test-only fixtures, constructed through production reducers. Never imported by either app.
import { freshProfile, finishLevel } from '../core/profile.mjs';
import { createSession, startLevel, applyMove } from '../core/session.mjs';
import { legalMoves, goalProgress } from '../core/game.mjs';
import { encodeSave } from '../core/storage.mjs';
const wins = count => { let p = freshProfile(Date.now(),'de-DE');for(let id=1;id<=count;id++)p=finishLevel(p,id,2);return p; };
const utility = g => (g.status==='won'?10000:0)+g.targets.reduce((v,t)=>v+goalProgress(g,t)/t.amount,0)*500+g.charge*.1;
let milestone = null;
for(let attempt=0;attempt<8&&!milestone;attempt++){
 let s=startLevel({...createSession(wins(7)),attempt},8);
 while(s.game.status==='playing'){
  const candidates=legalMoves(s.game).map(pair=>({pair,result:applyMove(s,...pair)}));
  candidates.sort((a,b)=>utility(b.result.game)-utility(a.result.game));
  const best=candidates[0];
  if(best.result.game.status==='won'){milestone={save:encodeSave(s),pair:best.pair};break;}
  s=best.result.session;
 }
}
if(!milestone)throw new Error('No winning level-8 fixture found');
const legacy=createSession(freshProfile(Date.now(),'de-DE'));delete legacy.profile.sound;
console.log(JSON.stringify({milestone,completed:encodeSave(createSession(wins(40))),legacy:encodeSave(legacy)}));
