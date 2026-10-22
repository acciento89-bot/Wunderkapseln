import {legalMoves,swap,goalProgress} from '../core/game.mjs';
let input='';for await(const c of process.stdin)input+=c;const g=JSON.parse(input);
const all=legalMoves(g).map(pair=>({pair,g:swap(g,...pair).game}));
const utility=g=>(g.status==='won'?10000:0)+g.targets.reduce((s,t)=>s+goalProgress(g,t)/t.amount,0)*500+g.charge*.1;
all.sort((a,b)=>utility(b.g)-utility(a.g));console.log(JSON.stringify(all[0].pair));
