import { validateProfile } from './profile.mjs';
import { validateGame } from './game.mjs';
const KEY='wunderkapseln.save', BACKUP=KEY+'.backup';
// Accidental-corruption checksum only. Never treat a local save as proof of payment.
function checksum(text) {let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
export function encodeSave(session) {const payload=JSON.stringify(session);return JSON.stringify({version:1,payload,checksum:checksum(payload)});}
export function decodeSave(text) {
  if(typeof text!=='string'||text.length>500000) return null;
  try {
    const e=JSON.parse(text);if(e.version!==1||typeof e.payload!=='string'||checksum(e.payload)!==e.checksum) return null;
    const s=JSON.parse(e.payload);
    if(s?.profile?.appliedPurchaseIds===undefined)s.profile.appliedPurchaseIds=[];
    if(!validateProfile(s.profile)||!Number.isInteger(s.attempt)||s.attempt<0||s.attempt>1000000||typeof s.protectedAttempt!=='boolean'||typeof s.settled!=='boolean') return null;
    if(s.game!==null&&(!validateGame(s.game)||s.game.levelId>s.profile.unlocked)) return null;
    if(s.game&&((s.game.status==='playing')===s.settled)) return null;
    if(s.profile.sound===undefined)s.profile.sound=true;
    if(s.profile.reserveLives===undefined)s.profile.reserveLives=0;
    return s;
  } catch {return null;}
}
export function createSaveQueue(adapter) {
  let tail=Promise.resolve();
  return {
    save(session) {
      const text=encodeSave(session);
      if(!decodeSave(text)) return Promise.reject(new Error('invalid_save'));
      const operation=tail.then(async()=>{
        const old=await adapter.getItem(KEY);
        if(decodeSave(old)) await adapter.setItem(BACKUP,old);
        await adapter.setItem(KEY,text);
      });
      tail=operation.catch(()=>{});return operation;
    },
    async load() {
      await tail;
      let error=null;
      for(const key of [KEY,BACKUP]) {
        let text;
        try {text=await adapter.getItem(key);}
        catch {
          // A failed primary read is not evidence that its newer progress is lost.
          return {session:null,recovered:false,error:'storage_error',blocked:true,reason:'storageUnavailable'};
        }
        if(text===null||text===undefined) continue;
        try {
          const envelope=JSON.parse(text);
          if(envelope&&Number.isInteger(envelope.version)&&envelope.version!==1) {
            return {session:null,recovered:false,error:'incompatible_save',blocked:true,reason:'saveIncompatible'};
          }
        } catch { /* Malformed primary data may still have a valid backup. */ }
        const session=decodeSave(text);
        if(session) return {session,recovered:key===BACKUP,error,blocked:false,reason:null};
        error='invalid_save';
      }
      return {session:null,recovered:false,error,blocked:Boolean(error),reason:error?'saveCorrupt':null};
    },
    flush(){return tail;},
  };
}
