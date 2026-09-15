export const LIFE_MS=25*60*1000;
const PACKS={time10:600,time60:3600,time240:14400};
const PURCHASE_IDS_MAX=2048;
const copy=p=>({...p,reserveLives:p.reserveLives??0,stars:{...p.stars},inventory:{...p.inventory},appliedPurchaseIds:[...(p.appliedPurchaseIds??[])]});
export function freshProfile(now=Date.now(),locale='en') {
  return {lives:5,reserveLives:0,nextLifeAt:null,lastSeenAt:now,unlocked:1,stars:{},sparkles:0,unlimitedSeconds:0,inventory:{lives5:0,time10:1,time60:0,time240:0},appliedPurchaseIds:[],language:String(locale).toLowerCase().startsWith('de')?'de':'en',reducedMotion:false,haptics:true,sound:true};
}
export function regenerate(profile,now=Date.now()) {
  const p=copy(profile), clock=Number.isFinite(now)?Math.max(now,p.lastSeenAt):p.lastSeenAt;p.lastSeenAt=clock;
  if(p.lives>=5) {p.lives=5;p.nextLifeAt=null;return p;}
  if(p.nextLifeAt===null) p.nextLifeAt=clock+LIFE_MS;
  if(clock>=p.nextLifeAt) {
    const earned=Math.floor((clock-p.nextLifeAt)/LIFE_MS)+1;
    p.lives=Math.min(5,p.lives+earned);p.nextLifeAt=p.lives===5?null:p.nextLifeAt+earned*LIFE_MS;
  }
  return p;
}
export function loseLife(profile,now=Date.now(),protectedAttempt=false) {
  const p=regenerate(profile,now);
  if(!protectedAttempt) {
    if(p.lives>0) {p.lives--;if(p.nextLifeAt===null) p.nextLifeAt=p.lastSeenAt+LIFE_MS;}
    else if(p.reserveLives>0) p.reserveLives--;
  }
  return p;
}
export function finishLevel(profile,id,stars) {
  if(!Number.isInteger(id)||id<1||id>profile.unlocked||id>480) throw new Error('locked_level');
  if(!Number.isInteger(stars)||stars<1||stars>3) throw new Error('invalid_stars');
  const p=copy(profile);if(!p.stars[id]) p.sparkles+=20;
  p.stars[id]=Math.max(stars,p.stars[id]||0);if(id===p.unlocked) p.unlocked=Math.min(480,id+1);return p;
}
export function activatePack(profile,key) {
  if(!Object.hasOwn(profile.inventory,key)||profile.inventory[key]<=0) throw new Error('pack_unavailable');
  const p=copy(profile);
  if(key==='lives5') {
    if(p.reserveLives+5>9999) throw new Error('reserve_capacity');
    p.reserveLives+=5;
  } else if(Object.hasOwn(PACKS,key)) {
    if(p.unlimitedSeconds+PACKS[key]>864000) throw new Error('time_capacity');
    p.unlimitedSeconds+=PACKS[key];
  }
  else throw new Error('unknown_pack');
  p.inventory[key]--;return p;
}
export function applyPaidAllocation(profile,allocation) {
  if(!allocation||typeof allocation.id!=='string'||allocation.id.length<1||allocation.id.length>160||allocation.quantity!==1) throw new Error('invalid_allocation');
  if(!['wk_lives_5','wk_time_60','wk_time_240'].includes(allocation.productId)) throw new Error('unknown_product');
  const p=copy(profile);
  if(p.appliedPurchaseIds.includes(allocation.id)) return {status:'duplicate',profile:p};
  if(p.appliedPurchaseIds.length>=PURCHASE_IDS_MAX) return {status:'capacity',profile:p};
  if(allocation.productId==='wk_lives_5') {
    if(p.reserveLives+5>9999) return {status:'capacity',profile:p};
    p.reserveLives+=5;
  } else {
    const key=allocation.productId==='wk_time_60'?'time60':'time240';
    if(p.inventory[key]>=999) return {status:'capacity',profile:p};
    p.inventory[key]++;
  }
  p.appliedPurchaseIds.push(allocation.id);
  return {status:'applied',profile:p};
}
export function spendActiveTime(profile,seconds,active) {
  if(active!==true||!Number.isFinite(seconds)||seconds<=0||profile.unlimitedSeconds<=0) return profile;
  return {...profile,unlimitedSeconds:Math.max(0,profile.unlimitedSeconds-seconds)};
}
export function remainingLifeSeconds(p,now=Date.now()) {return p.nextLifeAt===null?0:Math.max(0,Math.ceil((p.nextLifeAt-Math.max(now,p.lastSeenAt))/1000));}
export function validateProfile(p) {
  const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
  if(!p||!integer(p.lives,0,5)||(p.reserveLives!==undefined&&!integer(p.reserveLives,0,9999))||!integer(p.unlocked,1,480)||!integer(p.sparkles,0,1000000)||!Number.isFinite(p.lastSeenAt)||p.lastSeenAt<0||!(p.nextLifeAt===null||Number.isFinite(p.nextLifeAt)&&p.nextLifeAt>=0)||!Number.isFinite(p.unlimitedSeconds)||p.unlimitedSeconds<0||p.unlimitedSeconds>864000||!['de','en'].includes(p.language)||typeof p.reducedMotion!=='boolean'||typeof p.haptics!=='boolean'||(p.sound!==undefined&&typeof p.sound!=='boolean')||!p.stars||typeof p.stars!=='object'||Array.isArray(p.stars)||!p.inventory||typeof p.inventory!=='object') return false;
  if(Object.entries(p.stars).some(([key,value])=>!/^\d+$/.test(key)||!integer(Number(key),1,480)||!integer(value,1,3))) return false;
  for(let i=1;i<p.unlocked;i++) if(!p.stars[i]) return false;
  if(Object.keys(p.stars).some(id=>Number(id)>p.unlocked)) return false;
  if(!Array.isArray(p.appliedPurchaseIds)||p.appliedPurchaseIds.length>PURCHASE_IDS_MAX||new Set(p.appliedPurchaseIds).size!==p.appliedPurchaseIds.length||p.appliedPurchaseIds.some(id=>typeof id!=='string'||id.length<1||id.length>160)) return false;
  if(Object.keys(p.inventory).length!==4) return false;
  return ['lives5','time10','time60','time240'].every(k=>integer(p.inventory[k],0,999));
}
