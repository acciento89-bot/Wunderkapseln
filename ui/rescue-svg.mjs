import {boardSvg} from './art.mjs';
export function rescueBoardSvg(game,selected=-1){
 const board=game.board.map(c=>c.companion?null:c),base=boardSvg({...game,board},{selected});let marks='';
 for(const column of game.exits){const x=column*44;marks+=`<g data-exit="${column}"><path d="M${x+5} 345H${x+39}" stroke="#f5cf87" stroke-width="5"/><path d="M${x+16} 334L${x+22} 341L${x+28} 334" fill="none" stroke="#fff5d3" stroke-width="3"/></g>`;}
 game.board.forEach((c,i)=>{if(!c.companion)return;const x=i%8*44,y=Math.floor(i/8)*44;marks+=`<g data-companion="${c.companion}" transform="translate(${x} ${y})"><path d="M8 32Q5 15 13 12L16 5L22 12L29 5L33 14Q42 25 36 34Z" fill="#f5cf87" stroke="#fff5d3" stroke-width="2"/><circle cx="17" cy="24" r="2.5" fill="#173d49"/><circle cx="28" cy="24" r="2.5" fill="#173d49"/><path d="M18 30Q22 34 27 30" fill="none" stroke="#173d49" stroke-width="2"/></g>`;});
 return base.replace('</svg>',marks+'</svg>');
}
