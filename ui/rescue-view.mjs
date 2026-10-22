import {t,SHAPES} from './strings.mjs';
export function rescuePresentation(state,language,width,height){
 const tr=(key,values)=>t(language,key,values),g=state.journal.game;
 const blocked=!state.loaded||state.paused||state.busy||Boolean(state.pending)||g?.status!=='playing';
 const status=state.busy?'rescueSaving':g?.status==='won'?'rescueWon':g?.status==='lost'?'rescueLost':g?.status==='stuck'?'rescueStuck':state.paused?'rescuePaused':'rescueReady';
 return {boardSize:Math.floor(Math.max(0,Math.min(width-24,640,Math.max(160,height*.58)))/8)*8,status:tr(status),error:state.error?tr(state.error):null,canRetry:Boolean(state.pending)&&!state.busy,
 tiles:(g?.board||[]).map((c,index)=>({index,disabled:blocked||Boolean(c.companion),label:[tr('cell',{r:Math.floor(index/8)+1,c:index%8+1}),c.companion?tr('rescueCompanion',{id:c.companion.toUpperCase()}):tr(c.special||SHAPES[c.color]),g.frost[index]?tr('frost'):null,index>=56&&g.exits.includes(index%8)?tr('rescueExit'):null].filter(Boolean).join(', ')}))};
}
