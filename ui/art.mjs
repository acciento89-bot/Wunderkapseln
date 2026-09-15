import { CANONICAL_ICON_SVG } from './icon.mjs';
import { worldLandmark, worldBackdrop, worldRestoration } from './world-scenes.mjs';
import { WORLDS } from '../core/levels.mjs';
export const COLORS=['#ff9b9b','#7edaff','#a3e5a6','#ffd27d','#bdb0ff','#ffc0df'];
const edge=['#bf5969','#338db4','#549367','#cc903d','#7864b1','#bf77a2'];
const path=[
  'M32 12C43 0 53 15 48 25C64 26 65 42 50 46C49 63 32 63 27 50C12 60 0 44 14 34C1 21 14 8 25 17Z',
  'M32 5C27 17 11 29 11 40C11 66 54 66 54 40C54 29 39 16 32 5Z',
  'M53 8C18 7 4 21 11 43C17 64 51 58 54 34C55 24 53 17 53 8Z',
  'M32 5L40 22L59 24L45 38L48 58L32 49L15 58L19 38L5 24L24 22Z',
  'M21 8L45 8L59 29L34 59L7 30Z',
  'M9 42C1 23 19 7 33 8C49 6 62 22 58 40L45 53L21 53Z',
];
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
function star(x,y,r=5,color='#ffe4a4') {return `<path d="M${x} ${y-r}Q${x+1} ${y-1} ${x+r} ${y}Q${x+1} ${y+1} ${x} ${y+r}Q${x-1} ${y+1} ${x-r} ${y}Q${x-1} ${y-1} ${x} ${y-r}Z" fill="${color}"/>`;}
function defs() {return `<defs>${COLORS.map((c,i)=>`<linearGradient id="gem${i}" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="${c}"/><stop offset="1" stop-color="${edge[i]}"/></linearGradient>`).join('')}<linearGradient id="pearl"><stop stop-color="#f7adcd"/><stop offset=".32" stop-color="#ffe1a2"/><stop offset=".64" stop-color="#86e0dd"/><stop offset="1" stop-color="#bca8fc"/></linearGradient></defs>`;}
export function gemMarkup(cell,x=0,y=0,size=64) {
  const color=Math.max(0,Math.min(5,cell.color)),p=path[color];
  let body=cell.special==='prism'?`<circle cx="32" cy="34" r="25" fill="#455a75"/><circle cx="32" cy="29" r="25" fill="url(#pearl)" stroke="#fff3d7" stroke-width="2"/>${star(32,28,14,'#ffffff')}<ellipse cx="23" cy="15" rx="9" ry="4" fill="#ffffff" opacity=".5"/>`:
    `<path d="${p}" transform="translate(0 3)" fill="${edge[color]}"/><path d="${p}" fill="url(#gem${color})" stroke="${COLORS[color]}" stroke-width="1.7"/><path d="M18 25Q22 14 34 16" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>`;
  if(color===2&&!cell.special) body+='<path d="M20 44L41 22M30 33L25 23M30 33L41 33" stroke="#e6ffdf" stroke-opacity=".55" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  if(color===4&&!cell.special) body+='<path d="M21 8L21 29L34 59L45 29L45 8M8 29H58M21 29L32 8L45 29" stroke="#efebff" stroke-opacity=".38" stroke-width="1.4" fill="none"/>';
  if(color===5&&!cell.special) body+='<path d="M25 46L19 25M32 46V18M39 46L47 25" stroke="#ffe8f6" stroke-opacity=".65" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  if(cell.special==='row'||cell.special==='column') body+=`<g transform="rotate(${cell.special==='column'?90:0} 32 33)"><path d="M7 33L19 23V29H45V23L57 33L45 43V37H19V43Z" fill="#fff9e7" stroke="#72566c" stroke-opacity=".24" stroke-width="1.2"/></g>`;
  if(cell.special==='bomb') body+=`<circle cx="32" cy="32" r="14" fill="#33465c"/>${star(32,32,12)}<path d="M39 20Q45 10 48 19" fill="none" stroke="#ffedae" stroke-width="3"/>`;
  return `<g transform="translate(${x} ${y}) scale(${size/64})">${body}</g>`;
}
export function gemSvg(cell) {return svg(64,64,defs()+gemMarkup(cell));}
export function boardSvg(game,{selected=-1,hint=[],burst=[],burstProgress=0,falls=[],fallProgress=1,swap=[],swapProgress=0}={}) {
  let body=defs();const cell=44;
  for(let i=0;i<64;i++) {
    const x=i%8*cell,y=Math.floor(i/8)*cell;
    body+=`<g data-cell="${i}"><rect x="${x+1}" y="${y+1}" width="42" height="42" rx="12" fill="${(i+Math.floor(i/8))%2?'#123d49':'#174552'}" stroke="#b8e9df" stroke-opacity=".06"/>`;
    if(i===selected||hint.includes(i)) body+=`<rect x="${x+1.5}" y="${y+1.5}" width="41" height="41" rx="12" fill="#ffda87" fill-opacity=".09" stroke="#ffdf96" stroke-width="2"/>`;
    let dx=0,dy=0;
    if(swap.length===2&&swap.includes(i)){const other=i===swap[0]?swap[1]:swap[0];dx=(other%8-i%8)*44*swapProgress;dy=(Math.floor(other/8)-Math.floor(i/8))*44*swapProgress;}
    const fall=falls.find(f=>f.to===i);if(fall)dy=Math.max(-88,(Math.floor(fall.from/8)-Math.floor(i/8))*44)*(1-fallProgress);
    if(game.board[i]) body+=gemMarkup(game.board[i],x+3+dx,y+2+dy,38);
    if(game.frost[i]) body+=`<g class="frost"><rect x="${x+3}" y="${y+3}" width="38" height="38" rx="9" fill="#b7faff" fill-opacity="${game.frost[i]===2?.3:.15}" stroke="#b8f7ff" stroke-opacity=".65"/><path d="M${x+7} ${y+16}V${y+7}H${x+18}M${x+27} ${y+37}H${x+37}V${y+26}" stroke="#e0fbff" stroke-opacity=".65" stroke-width="2" fill="none"/></g>`;
    body+='</g>';
  }
  for(const i of burst) for(let j=0;j<6;j++) {const a=j*Math.PI/3, r=10+burstProgress*20;body+=`<circle cx="${i%8*44+22+Math.cos(a)*r}" cy="${Math.floor(i/8)*44+22+Math.sin(a)*r}" r="${Math.max(1,3-burstProgress*2)}" opacity="${1-burstProgress*.7}" fill="${j%2?'#fff8d8':'#ffe3a0'}"/>`;}
  return svg(352,352,body);
}
function plant(x,y,s=1,color='#85ba88') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0Q-6-24 0-43Q3-15 0 0" fill="#4e8b76"/><path d="M0-6Q-24-10-20-27Q-3-25 0-6M0-14Q24-20 17-35Q0-33 0-14" fill="${color}"/><path d="M-1-4L-13-20M2-16L10-29" stroke="#d6e4a3" stroke-opacity=".4" stroke-width="1.5"/></g>`;
}
function mushroom(x,y,s=1,color='#f5a67c') {return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="2" rx="19" ry="5" fill="#0d3d3d" opacity=".25"/><path d="M-6 0L-8-32H8L6 0Q0 4-6 0" fill="#fff0cd"/><path d="M-31-27Q-23-64 0-61Q23-64 31-27Q0-11-31-27Z" fill="${color}"/><path d="M-31-27Q0-16 31-27" fill="none" stroke="#ffe0c6" stroke-width="3"/><ellipse cx="-10" cy="-44" rx="6" ry="4" fill="#fff1d9"/><ellipse cx="13" cy="-37" rx="4" ry="3" fill="#fff1d9"/></g>`;}
function critter(x,y,color,phase=0) {
  return `<g transform="translate(${x} ${y+Math.sin(phase)*1.6})"><ellipse cy="29" rx="23" ry="6" fill="#173d42" opacity=".3"/><path d="M-21 12Q-29-13-12-23Q0-33 15-20Q29-10 21 13L17 27Q11 32 6 25H-7Q-12 32-18 25Z" fill="${color}" stroke="#fff1c0" stroke-opacity=".5"/><ellipse cx="-8" cy="-14" rx="7" ry="4" fill="#fff3d9" opacity=".5"/><ellipse cx="-8" cy="4" rx="2.7" ry="4.2" fill="#30484b"/><ellipse cx="9" cy="4" rx="2.7" ry="4.2" fill="#30484b"/><circle cx="-9" cy="3" r=".8" fill="#fff"/><circle cx="8" cy="3" r=".8" fill="#fff"/><ellipse cx="-15" cy="11" rx="4.5" ry="2.7" fill="#ee8f91" opacity=".6"/><ellipse cx="16" cy="11" rx="4.5" ry="2.7" fill="#ee8f91" opacity=".6"/><path d="M-3 11Q1 15 5 11" fill="none" stroke="#70535a" stroke-width="1.5" stroke-linecap="round"/><path d="M0-26Q-17-43-15-29Q-7-24 0-26M0-26Q11-43 16-35Q13-26 0-26" fill="#b5d78d"/><path d="M18 15Q30 6 29 17" stroke="${color}" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
}
export function domeSvg(world=0,progress=0,phase=0) {
  world=Number.isInteger(world)&&world>=0&&world<12?world:0;
  const w=WORLDS[world],p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
  phase=Number.isFinite(phase)?phase:0;
  const dome='M43 287V181C43 89 109 36 200 36S357 89 357 181V287Q200 340 43 287Z';
  let body=`<defs><linearGradient id="sky" x2=".3" y2="1"><stop stop-color="${w.sky}"/><stop offset="1" stop-color="${w.mist}"/></linearGradient><radialGradient id="aura"><stop stop-color="${w.accent}" stop-opacity=".24"/><stop offset="1" stop-color="${w.accent}" stop-opacity="0"/></radialGradient><linearGradient id="glass" x2="1" y2=".4"><stop stop-color="#d5f7ed" stop-opacity=".27"/><stop offset=".3" stop-color="#edf8e7" stop-opacity=".02"/><stop offset="1" stop-color="#d0f5f7" stop-opacity=".19"/></linearGradient><linearGradient id="rim" x2="0" y2="1"><stop stop-color="#e4d6a6"/><stop offset=".45" stop-color="#7fae9c"/><stop offset="1" stop-color="#2e6261"/></linearGradient><linearGradient id="earth" x2="0" y2="1"><stop stop-color="#50736a"/><stop offset="1" stop-color="#244e52"/></linearGradient><clipPath id="domeClip"><path d="${dome}"/></clipPath></defs>`;
  body+=`<ellipse cx="200" cy="345" rx="134" ry="15" fill="#041e2c" opacity=".4"/><circle cx="200" cy="188" r="172" fill="url(#aura)"/>`;
  body+=`<ellipse cx="200" cy="28" rx="16" ry="13" fill="#abcbbb"/><ellipse cx="196" cy="24" rx="9" ry="6" fill="#e6f6d9"/><path d="M182 37Q200 28 218 37" fill="#86b3ad"/><path d="${dome}" fill="url(#sky)" stroke="#b2dddd" stroke-opacity=".6" stroke-width="2"/>`;
  body+=`<g clip-path="url(#domeClip)"><circle cx="222" cy="165" r="126" fill="url(#aura)"/>`;
  for(let i=0;i<27;i++) {const x=58+(i*71+world*13)%285,y=67+(i*37)%154;body+=i%4===0?star(x,y,2.4+(i%3),w.accent):`<circle cx="${x}" cy="${y}" r="${.7+i%2*.5}" fill="#d9f2e0" opacity="${.22+i%4*.11}"/>`;}
  body+=`<path d="M37 230Q87 172 130 209Q173 168 218 215Q284 151 367 229V299H37Z" fill="${w.mist}" opacity=".5"/><path d="M32 264Q102 216 167 245Q241 201 366 254V317H32Z" fill="${w.ground}" opacity=".17"/>`;
  if(world>2) {body+=worldBackdrop(world);
  } else if(w.type==='sky') {
    body+=`<path d="M84 191A112 112 0 0 1 303 191" fill="none" stroke="${w.accent}" stroke-width="9" opacity=".55"/><path d="M96 191A100 100 0 0 1 291 191" fill="none" stroke="#c1e8cc" stroke-width="8" opacity=".45"/>`;
    for(const[x,y,s]of [[82,169,1],[299,144,.7],[267,91,.5]])body+=`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-37 9Q-43-8-23-11Q-26-32-3-28Q14-40 25-18Q48-18 44 2Q39 14-37 9" fill="#e0eeed" opacity=".86"/></g>`;
    body+=`<g transform="translate(235 ${130+Math.sin(phase)*3})"><ellipse cy="-18" rx="26" ry="33" fill="${w.accent}"/><path d="M0-50Q-16-12 0 16Q16-12 0-50" fill="#fff1c1" opacity=".55"/><path d="M-14 9L-8 30M14 9L8 30" stroke="#ecd9aa" stroke-width="1.5"/><path d="M-11 28H11L8 39H-8Z" fill="#bd8970"/></g>`;
  } else if(w.type==='ocean') {
    for(let i=0;i<10;i++)body+=`<circle cx="${78+i*27}" cy="${106+i*19%119}" r="${3+i%4}" fill="none" stroke="#c0eff0" stroke-opacity=".35"/>`;
    body+=`<g transform="translate(231 ${144+Math.sin(phase)*3})"><path d="M-33-9Q-49-31-49-9V14Q-45 24-33 8" fill="${w.accent}"/><ellipse rx="39" ry="22" fill="#dce5b6"/><path d="M-1-20V-32H13" stroke="#dce5b6" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="16" r="13" fill="#43838b" stroke="#fbf1c7" stroke-width="5"/><circle cx="19" cy="-4" r="5" fill="#a7dce0" opacity=".5"/></g>`;
    for(const[x,y]of [[89,265],[300,261],[118,239]])body+=`<path d="M${x} ${y}V${y-47}M${x} ${y-17}L${x-17} ${y-34}V${y-46}M${x} ${y-26}L${x+16} ${y-41}V${y-57}" stroke="${w.accent}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  } else {
    body+=`<path d="M283 259Q266 218 278 154" fill="none" stroke="#718d74" stroke-width="11"/>`;
    for(const[x,y,r]of [[265,165,25],[291,151,31],[308,174,29],[276,191,24]])body+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${w.ground}"/><circle cx="${x-7}" cy="${y-8}" r="${r*.5}" fill="#e5edb0" opacity=".18"/>`;
    body+=`<path d="M290 174Q254 191 252 213" stroke="#869f78" stroke-width="5" fill="none"/><path d="M251 202V220" stroke="#ffdea0" stroke-width="1.3"/><rect x="246" y="220" width="11" height="15" rx="4" fill="${w.accent}"/>`;
  }
  body+=`<path d="M67 276Q200 327 333 276L286 315Q200 348 109 315Z" fill="url(#earth)"/><ellipse cx="200" cy="273" rx="135" ry="42" fill="${w.ground}"/><ellipse cx="194" cy="269" rx="117" ry="33" fill="#d5e5a4" opacity=".18"/><path d="M185 248Q163 269 203 281Q244 295 220 309" stroke="#ecdfb0" stroke-width="20" fill="none" opacity=".82"/><path d="M180 254L193 258M176 266L185 270M198 282L207 289M218 296L231 298" stroke="#b0b78e" stroke-width="2"/>`;
  body+=worldLandmark(world);
  if(world===0)body+=mushroom(113,266,.8,'#f2ae98')+mushroom(91,275,.5,w.accent);
  body+=plant(78,279,.8,w.ground)+plant(319,273,1.0,w.ground)+plant(283,294,.55,w.accent);
  for(let i=0;i<9+Math.floor(p*15);i++){const x=86+(i*43)%223,y=269+(i*17)%29;body+=`<path d="M${x} ${y}V${y-8}" stroke="#609076" stroke-width="1.5"/><circle cx="${x}" cy="${y-10}" r="${i%3+2}" fill="${i%2?w.accent:'#f5b1bf'}"/>`;}
  body+=worldRestoration(world,Math.floor(p*5));
  body+=critter(236,278,w.creature,phase);
  body+=`</g><path d="${dome}" fill="url(#glass)" stroke="#d0e6d4" stroke-opacity=".4" stroke-width="2"/><path d="M59 230V179Q59 100 119 65" fill="none" stroke="#effce4" stroke-opacity=".26" stroke-width="9" stroke-linecap="round"/><path d="M68 149Q78 112 99 94" fill="none" stroke="#fbfff1" stroke-opacity=".42" stroke-width="4" stroke-linecap="round"/><path d="M340 181V259" stroke="#e9fff1" stroke-opacity=".22" stroke-width="4" stroke-linecap="round"/>`;
  body+=`<path d="M37 290Q200 346 363 290V309Q200 365 37 309Z" fill="url(#rim)"/><ellipse cx="200" cy="293" rx="163" ry="37" fill="none" stroke="#c4d5ac" stroke-width="3"/><path d="M53 315Q200 359 347 315" fill="none" stroke="#163f48" stroke-width="5" opacity=".6"/><rect x="169" y="315" width="62" height="19" rx="7" fill="#285859" stroke="#c1c49b" stroke-width="1.2"/>${star(200,324,6,w.accent)}`;
  body+=star(45,108,8)+star(361,188,9)+star(336,62,4)+star(26,260,4);
  return svg(400,380,body.replaceAll('id="',`id="w${world}_`).replaceAll('url(#',`url(#w${world}_`));
}
export function iconSvg(){return CANONICAL_ICON_SVG;}
const icons={
  heart:'M12 21C9 18 2 13 2 7C2 1 10 0 12 5C14 0 22 1 22 7C22 13 15 18 12 21Z',
  play:'M7 3L21 12L7 21Z',back:'M15 4L7 12L15 20',next:'M9 4L17 12L9 20',
  pause:'M8 5V19M16 5V19',close:'M6 6L18 18M18 6L6 18',
  star:'M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8Z',
  capsule:'M5 17V10C5 0 19 0 19 10V17M3 17Q12 22 21 17V20Q12 25 3 20ZM9 12L12 7L15 12Z',
  atlas:'M2 5L8 2L16 5L22 2V19L16 22L8 19L2 22ZM8 2V19M16 5V22',
  gift:'M3 9H21V14H3ZM5 14V22H19V14M12 9V22M12 8C-2 8 6-4 12 8C26 8 18-4 12 8',
  settings:'M12 8A4 4 0 1 0 12 16A4 4 0 1 0 12 8M9 2H15L16 5L19 6L22 9V15L19 16L18 19L15 22H9L8 19L5 18L2 15V9L5 8L6 5Z',
  frost:'M12 2V22M3 7L21 17M3 17L21 7M9 4L12 7L15 4M9 20L12 17L15 20',
  check:'M4 12L9 17L20 6',hint:'M8 17H16M9 21H15M8 14C0 3 10-1 15 3C22 7 18 12 16 14Z',
};
export function uiIcon(name,color='#e5eee3',size=24) {return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path d="${icons[name]||icons.star}" fill="${['heart','play','star'].includes(name)?color:'none'}" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
