// A small, fixed chapter. Legacy generated campaign recipes never enter this catalog.
const entries=[
 [2,6,'match',1],[5,6,'match',2],[2,4,'column',3],[5,3,'column',4],
 [2,6,'pair',5],[2,3,'pair',6],[2,6,'bomb',7],[2,6,'prism',8],
 [5,6,'row',9],[2,2,'column',10],[2,4,'pair',11],[2,1,'pair',12],
];
export const RESCUE_LEVELS=Object.freeze(entries.map(([column,row,lesson,seed],i)=>Object.freeze({
 id:`rescue-${String(i+1).padStart(2,'0')}`,catalogRevision:1,column,row,lesson,seed:20261021+seed*7919,
 moves:lesson==='pair'?5:4,exits:Object.freeze(lesson==='pair'?[2,5]:[column]),
 frost:Object.freeze(i>=8?[58,61]:[]),
})));
export function rescueLevelFor(id){const recipe=RESCUE_LEVELS.find(l=>l.id===id);if(!recipe)throw new Error('unknown_rescue');return recipe;}
