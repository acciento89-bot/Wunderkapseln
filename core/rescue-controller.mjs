import {createRescueStore,freshRescueJournal} from './rescue-storage.mjs';
import {createRescueGame,applyRescueMove,applyRescueWonder} from './rescue.mjs';
import {RESCUE_LEVELS,rescueLevelFor} from './rescue-levels.mjs';
export class RescueController{
 constructor({storage}){this.store=createRescueStore(storage);this.listeners=new Set();this.foreground=true;this.loading=null;this.intent=0;this.state={loaded:false,journal:freshRescueJournal(),pending:null,error:null,busy:false,paused:true,selected:-1,screen:'list'};}
 getSnapshot=()=>this.state;
 subscribe=fn=>{this.listeners.add(fn);return()=>this.listeners.delete(fn);};
 emit(patch){this.state={...this.state,...patch};for(const fn of this.listeners)fn();}
 initialize(){if(this.loading)return this.loading;this.loading=this.store.load().then(journal=>this.emit({loaded:true,journal,paused:true,error:null}),()=>this.emit({error:'rescueLoadError'})).finally(()=>{this.loading=null;});return this.loading;}
 async commit(journal){
  if(this.state.busy)return false;
  const pending={...journal,revision:this.state.journal.revision+1};this.emit({busy:true,pending,error:null,selected:-1});
  try{const committed=await this.store.save(this.state.journal.revision,pending);this.emit({journal:committed,pending:null,error:null});return true;}
  catch{this.emit({error:'rescueSaveError',paused:true});return false;}
  finally{this.emit({busy:false});}
 }
 async retry(){if(!this.state.pending||this.state.busy)return false;return this.commit(this.state.pending);}
 async start(id){
  if(!this.state.loaded||this.state.pending||this.state.busy||!this.foreground)return false;
  let l;try{l=rescueLevelFor(id);}catch{return false;}
  if(RESCUE_LEVELS.indexOf(l)>this.state.journal.completed.length)return false;
  const held=this.state.journal.game;
  if(held?.status==='playing'){
   if(held.rescueId!==id){this.emit({screen:'game',paused:true,error:'rescueHeld'});return false;}
   this.emit({screen:'game',paused:false,error:null});return true;
  }
  const intent=this.intent;
  const ok=await this.commit({...this.state.journal,game:createRescueGame(l)});
  // Saving publishes the board; only the still-current navigation intent may activate it.
  if(ok&&intent===this.intent&&this.foreground)this.emit({screen:'game',paused:false});return ok;
 }
 async restart(){if(this.state.pending||this.state.busy||!this.state.journal.game||!this.foreground)return false;const intent=this.intent;const ok=await this.commit({...this.state.journal,game:createRescueGame(rescueLevelFor(this.state.journal.game.rescueId))});if(ok&&intent===this.intent&&this.foreground)this.emit({paused:false,screen:'game'});return ok;}
 async apply(result){
  if(!result.ok)return false;const game=result.game,journal={...this.state.journal,game};
  if(game.status==='won'){
   journal.completed=[...journal.completed];if(!journal.completed.includes(game.rescueId))journal.completed.push(game.rescueId);
   const spent=rescueLevelFor(game.rescueId).moves-game.moves;journal.bests={...journal.bests,[game.rescueId]:Math.min(journal.bests[game.rescueId]??Infinity,spent)};
  }
  return this.commit(journal);
 }
 async move(a,b){if(!this.canPlay())return false;return this.apply(applyRescueMove(this.state.journal.game,a,b));}
 async wonder(target){if(!this.canPlay())return false;return this.apply(applyRescueWonder(this.state.journal.game,target));}
 canPlay(){return this.state.loaded&&this.foreground&&!this.state.paused&&!this.state.busy&&!this.state.pending&&this.state.journal.game?.status==='playing';}
 tap(index){if(!this.canPlay())return;if(this.state.selected<0){this.emit({selected:index});return;}const from=this.state.selected;this.emit({selected:-1});return this.move(from,index);}
 pause(){this.intent++;this.emit({paused:true,selected:-1});}
 resume(){if(this.foreground&&!this.state.pending&&!this.state.busy)this.emit({paused:false,screen:'game',error:null});}
 leave(){this.pause();this.emit({screen:'list'});}
 setForeground(value){this.foreground=value;if(!value)this.pause();}
 tick(){} // Rescue has no paid clock, regeneration or background simulation.
}
