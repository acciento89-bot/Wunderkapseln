import { createGame, swap, useWonder, starsFor } from './game.mjs';
import { levelFor } from './levels.mjs';
import { regenerate, loseLife, finishLevel } from './profile.mjs';
export function createSession(profile) {return {profile,game:null,attempt:0,protectedAttempt:false,settled:false};}
export function startLevel(session,id,now=Date.now()) {
  if(session.game?.status==='playing') throw new Error('unfinished_attempt');
  const p=regenerate(session.profile,now);
  if(!Number.isInteger(id)||id<1||id>p.unlocked) throw new Error('locked_level');
  if(p.lives===0&&(p.reserveLives??0)===0&&p.unlimitedSeconds===0) throw new Error('no_lives');
  return {profile:p,game:createGame(levelFor(id),session.attempt),attempt:session.attempt+1,protectedAttempt:p.unlimitedSeconds>0,settled:false};
}
function settle(session,now) {
  if(session.settled||session.game.status==='playing') return session;
  return {...session,settled:true,profile:session.game.status==='won'?finishLevel(session.profile,session.game.levelId,starsFor(session.game)):loseLife(session.profile,now,session.protectedAttempt)};
}
export function applyMove(session,a,b,now=Date.now()) {
  if(!session.game||session.settled) return {ok:false,session,frames:[]};
  const result=swap(session.game,a,b);
  return {...result,session:result.ok?settle({...session,game:result.game},now):session};
}
export function applyWonder(session,target,now=Date.now()) {
  if(!session.game||session.settled) return {ok:false,session,frames:[]};
  const result=useWonder(session.game,target);
  return {...result,session:result.ok?settle({...session,game:result.game},now):session};
}
export function abandonLevel(session,now=Date.now()) {
  return {...session,game:null,settled:false,protectedAttempt:false,profile:session.game?.status==='playing'&&!session.settled?loseLife(session.profile,now,session.protectedAttempt):session.profile};
}
