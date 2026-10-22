import {validateRescueGame} from './rescue.mjs';
import {RESCUE_LEVELS} from './rescue-levels.mjs';
export const RESCUE_KEY='wunderkapseln.rescue.v1';
export function freshRescueJournal(){return {schema:1,catalogRevision:1,revision:0,completed:[],bests:{},game:null};}
const keys=(v,names)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join()===names.split(',').sort().join();
function valid(j){
 if(!keys(j,'schema,catalogRevision,revision,completed,bests,game')||j.schema!==1||j.catalogRevision!==1||!Number.isSafeInteger(j.revision)||j.revision<0||!Array.isArray(j.completed)||j.completed.length>12||!keys(j.bests,j.completed.join(',')))return false;
 if(!j.completed.every((id,i)=>id===RESCUE_LEVELS[i].id&&Number.isInteger(j.bests[id])&&j.bests[id]>=0&&j.bests[id]<=RESCUE_LEVELS[i].moves))return false;
 if(j.game!==null){if(!validateRescueGame(j.game))return false;const index=RESCUE_LEVELS.findIndex(l=>l.id===j.game.rescueId);if(index>j.completed.length||(j.game.status==='won'&&!j.completed.includes(j.game.rescueId)))return false;}
 return true;
}
function checksum(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
export function encodeRescue(journal){if(!valid(journal))throw Error('invalid_rescue');const payload=JSON.stringify(journal),text=JSON.stringify({schema:1,payload,checksum:checksum(payload)});if(text.length>500000)throw Error('rescue_too_large');return text;}
export function decodeRescue(text){
 if(typeof text!=='string'||text.length>500000)throw Error('invalid_rescue');
 const e=JSON.parse(text);if(!keys(e,'schema,payload,checksum')||e.schema!==1||typeof e.payload!=='string'||e.checksum!==checksum(e.payload))throw Error('invalid_rescue');
 const j=JSON.parse(e.payload);if(!valid(j))throw Error('invalid_rescue');return j;
}
export function createRescueStore(adapter){
 let tail=Promise.resolve(),loaded=false,expected=null;
 return {
  async load(){await tail;const text=await adapter.getItem(RESCUE_KEY);const j=text===null||text===undefined?freshRescueJournal():decodeRescue(text);expected=text??null;loaded=true;return j;},
  save(expectedRevision,candidate){
   const text=encodeRescue(candidate);
   const op=tail.then(async()=>{
    if(!loaded||candidate.revision!==expectedRevision+1)throw Error('rescue_conflict');
    const current=await adapter.getItem(RESCUE_KEY)??null;
    if(current===text){expected=text;return structuredCopy(candidate);}
    if(current!==expected)throw Error('rescue_conflict');
    const old=current===null?freshRescueJournal():decodeRescue(current);
    if(old.revision!==expectedRevision)throw Error('rescue_conflict');
    await adapter.setItem(RESCUE_KEY,text);
    if(await adapter.getItem(RESCUE_KEY)!==text)throw Error('rescue_unverified');
    expected=text;return structuredCopy(candidate);
   });tail=op.catch(()=>{});return op;
  },
 };
}
const structuredCopy=v=>JSON.parse(JSON.stringify(v));
