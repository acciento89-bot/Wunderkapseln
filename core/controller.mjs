import { feedbackPlan, compactFeedback } from './feedback.mjs';
import { milestoneReached } from './restoration.mjs';
import { freshProfile, regenerate, spendActiveTime, activatePack, applyPaidAllocation as allocatePaidPurchase } from './profile.mjs';
import { createSession, startLevel, applyMove, applyWonder, abandonLevel } from './session.mjs';
import { createSaveQueue } from './storage.mjs';
import { recommendMove } from './strategy.mjs';
import { levelFor } from './levels.mjs';
function openingHint(session) {
  const g=session.game;
  return g&&g.levelId<=3&&!session.profile.stars[g.levelId]&&g.moves===levelFor(g.levelId).moves&&g.score===0?recommendMove(g)||[]:[];
}
export class GameController {
  constructor({storage,locale='en',now=()=>Date.now(),monotonic=()=>performance.now()}) {
    this.now=now;this.monotonic=monotonic;this.store=createSaveQueue(storage);this.listeners=new Set();this.foreground=true;this.lastTick=monotonic();this.lastSave=this.lastTick;this.epoch=0;this.systemReducedMotion=false;this.initialization=null;this.feedbackId=0;this.purchaseTail=Promise.resolve();
    this.state={session:createSession(freshProfile(now(),locale)),screen:'home',world:0,modal:null,selected:-1,hint:[],wonder:false,busy:false,visual:null,animation:{},notice:null,saveError:false,loadError:null,loaded:false,feedback:null,milestone:null};
  }
  getSnapshot=()=>this.state;
  subscribe=listener=>{this.listeners.add(listener);return()=>this.listeners.delete(listener);};
  emit(patch={}) {this.state={...this.state,...patch};for(const listener of this.listeners) listener();}
  initialize() {
    if (!this.initialization) {
      this.emit({loadError:null});
      this.initialization=this.hydrate().then(()=>{if(!this.state.loaded)this.initialization=null;});
    }
    return this.initialization;
  }
  async hydrate() {
    const result=await this.store.load();
    if(result.blocked) {this.emit({loaded:false,loadError:result.reason,modal:null});return;}
    const session=result.session||this.state.session;
    session.profile=regenerate(session.profile,this.now());
    this.emit({session,world:Math.floor((session.profile.unlocked-1)/40),loaded:true,loadError:null,notice:result.recovered?'recovered':result.error?'corrupt':null});this.lastTick=this.monotonic();
  }
  save() {if(!this.state.loaded)return Promise.resolve();return this.store.save(this.state.session).then(()=>{if(this.state.saveError)this.emit({saveError:false});}).catch(()=>{this.emit({saveError:true});});}
  flush(){return this.store.flush();}
  tick() {
    const now=this.monotonic(),delta=Math.max(0,Math.min(2,(now-this.lastTick)/1000));this.lastTick=now;
    if(!this.state.loaded)return;
    const s=this.state,active=this.foreground&&s.screen==='game'&&!s.modal&&!s.busy&&s.session.game?.status==='playing';
    const profile=spendActiveTime(regenerate(s.session.profile,this.now()),delta,active);
    this.emit({session:{...s.session,profile}});
    if(now-this.lastSave>=5000){this.lastSave=now;this.save();}
  }
  setForeground(foreground) {
    this.tick();this.foreground=foreground;this.lastTick=this.monotonic();
    if(!foreground) {this.cancelAnimation();if(this.state.screen==='game'&&this.state.session.game)this.emit({modal:this.state.session.game.status==='playing'?'pause':'result'});this.save();}
  }
  navigate(screen) {if(!this.state.loaded)return;if(!['home','atlas','treasures','settings','levels'].includes(screen))return;this.tick();this.cancelAnimation();this.emit({screen,modal:null,selected:-1,wonder:false,hint:[],notice:null});this.save();}
  world(index) {if(!Number.isInteger(index)||index<0||index>=12)return;this.emit({world:index});this.navigate('levels');}
  play(id) {
    if(!this.state.loaded||!this.foreground)return;
    this.tick();this.cancelAnimation();this.emit({milestone:null});
    if(this.state.session.game?.status==='playing') {const hint=openingHint(this.state.session);this.emit({screen:'game',world:this.state.session.game.world,modal:null,hint,notice:hint.length?'firstMove':null});return;}
    try {
      const session=startLevel(this.state.session,id??this.state.session.profile.unlocked,this.now());
      const hint=openingHint(session);
      this.emit({session,screen:'game',world:session.game.world,modal:null,selected:-1,hint,wonder:false,notice:hint.length?'firstMove':null});this.save();
    } catch(e) {if(e.message==='no_lives')this.emit({modal:'noLives'});}
  }
  pause(){this.tick();this.cancelAnimation();this.emit({modal:this.state.session.game?.status==='playing'?'pause':'result'});this.save();}
  resume(){
    if(!this.foreground)return;
    this.lastTick=this.monotonic();
    this.emit({modal:this.state.screen==='game'&&this.state.session.game?.status!=='playing'?'result':null,notice:null});
  }
  closeModal(){
    const {modal,screen,session}=this.state;
    if(modal==='result'){this.navigate('levels');return;}
    if(modal==='abandon'){this.emit({modal:'pause'});return;}
    if(modal==='pause'||modal==='rules'){this.resume();return;}
    this.emit({modal:screen==='game'&&session.game?.status!=='playing'?'result':null});
  }
  back(){
    if(this.state.modal){this.closeModal();return true;}
    if(this.state.screen==='game'){this.pause();return true;}
    if(this.state.screen!=='home'){this.navigate('home');return true;}
    return false;
  }
  motionReduced(){return this.systemReducedMotion||this.state.session.profile.reducedMotion;}
  setSystemReducedMotion(value){
    this.systemReducedMotion=value===true;this.emit();
    if(this.systemReducedMotion&&this.state.busy){
      this.cancelAnimation();
      this.emit({modal:this.state.screen==='game'&&this.state.session.game?.status!=='playing'?'result':this.state.modal});
    }
  }
  acceptsInput(){
    const s=this.state;
    return s.loaded&&this.foreground&&s.screen==='game'&&!s.busy&&!s.modal&&s.session.game?.status==='playing';
  }
  rules(){this.tick();this.cancelAnimation();this.emit({modal:'rules'});}

  requestAbandon(){this.emit({modal:'abandon'});}
  abandon(){this.cancelAnimation();this.emit({session:abandonLevel(this.state.session,this.now()),screen:'home',modal:null,selected:-1,wonder:false});this.save();}
  next(){const id=this.state.session.game?.levelId??1;if(id>=480){this.navigate('atlas');return;}this.play(id+1);}
  retry(){this.play(this.state.session.game?.levelId);}
  preference(key,value) {if(!this.state.loaded)return;if(!['language','reducedMotion','haptics','sound'].includes(key))return;if(key==='language'?!['de','en'].includes(value):typeof value!=='boolean')return;this.emit({session:{...this.state.session,profile:{...this.state.session.profile,[key]:value}}});this.save();}
  activate(key){if(!this.state.loaded)return;this.tick();try{const s=this.state.session,profile=activatePack(s.profile,key);this.emit({session:{...s,profile,protectedAttempt:s.protectedAttempt||(s.game?.status==='playing'&&profile.unlimitedSeconds>0)}});this.save();}catch(error){this.emit({notice:error.message?.includes('capacity')?'packCapacity':'notAvailable'});}}
  applyPaidAllocation(allocation) {
    const operation=this.purchaseTail.then(async()=>{
      if(!this.state.loaded) throw new Error('not_loaded');
      const current=this.state.session;
      const result=allocatePaidPurchase(current.profile,allocation);
      if(result.status!=='applied') return result;
      const session={...current,profile:result.profile};
      await this.store.save(session);
      this.emit({session,saveError:false});
      return result;
    });
    this.purchaseTail=operation.catch(()=>{});
    return operation;
  }
  hint(){if(!this.acceptsInput())return;const g=this.state.session.game;if(!g)return;this.emit({hint:recommendMove(g)||[],selected:-1,wonder:false,notice:'hintHelp'});}
  wonder(){if(!this.acceptsInput())return;const g=this.state.session.game;if(!g||g.charge<100||g.wonderUsed||this.state.busy)return;this.emit({wonder:!this.state.wonder,selected:-1,hint:[]});}
  async tap(index) {
    if(!this.acceptsInput()||!Number.isInteger(index)||index<0||index>63)return;
    if(this.state.wonder){this.tick();await this.perform(applyWonder(this.state.session,index,this.now()),'wonder');return;}
    const selected=this.state.selected;
    if(selected===index){this.emit({selected:-1});return;}
    if(selected<0){this.emit({selected:index,hint:[],notice:null});return;}
    const adjacent=Math.abs(selected-index)===8||(Math.floor(selected/8)===Math.floor(index/8)&&Math.abs(selected-index)===1);
    if(!adjacent){this.emit({selected:index,hint:[]});return;}
    await this.move(selected,index);
  }
  async move(a,b) {
    if(!this.acceptsInput())return;
    this.tick();await this.perform(applyMove(this.state.session,a,b,this.now()));
  }
  cancelAnimation(){this.epoch++;this.lastTick=this.monotonic();this.emit({busy:false,visual:null,animation:{}});}
  async tween(duration,token,render) {
    const start=performance.now();
    while(token===this.epoch){const p=Math.min(1,(performance.now()-start)/duration);render(p);if(p>=1)return;await new Promise(r=>setTimeout(r,16));}
  }
  async perform(result,kind='move') {
    if(!result.ok){this.emit({selected:-1,hint:[],notice:null});return;}
    const original=this.state.session.game,token=++this.epoch;
    const milestone=milestoneReached(this.state.session.profile,result.session.profile,result.game.world);
    const plan=feedbackPlan(result,{kind,initialCharge:original.charge,milestone:!!milestone});
    const animate=!this.motionReduced()&&this.foreground;
    this.emit({session:result.session,busy:true,selected:-1,wonder:false,hint:[],notice:null,milestone});this.save();
    if(animate) {
      if(result.swap) await this.tween(115,token,p=>this.emit({visual:original,animation:{swap:result.swap,swapProgress:p}}));
      for(const [index,frame] of result.frames.slice(0,6).entries()) {
        if(token!==this.epoch)break;
        if(plan.frames[index])this.emit({feedback:{id:++this.feedbackId,cue:plan.frames[index]}});
        if(frame.before)await this.tween(100,token,p=>this.emit({visual:{...result.game,board:frame.before,frost:frame.frostBefore},animation:{burst:frame.cleared,burstProgress:p}}));
        if(token!==this.epoch)break;
        await this.tween(145,token,p=>this.emit({visual:{...result.game,board:frame.board,frost:frame.frost},animation:{falls:frame.falls,fallProgress:p}}));
      }
    }
    if(token!==this.epoch)return;
    // Animations are not active play. Start the next billable interval here,
    // including when no timer pulse ran during the animation.
    this.lastTick=this.monotonic();
    const finalFeedback=compactFeedback(animate?{frames:[],settled:plan.settled}:plan);
    this.emit({...finalFeedback?{feedback:{id:++this.feedbackId,...finalFeedback}}:{},busy:false,visual:null,animation:{},modal:result.game.status==='playing'?null:'result',notice:result.reshuffled?'shuffle':result.frames.length>=3?'combo':null});
  }
}
