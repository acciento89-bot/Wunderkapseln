import { WORLDS } from '../core/levels.mjs';

// Original native-safe SVG geometry. All scenes share the same 400 x 380 dome space.
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const stroke = (d, color, width = 3) => path(d, 'none', `stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`);
const circle = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const box = (x,y,w,h,r,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
const group = (x,y,body,s=1) => `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
const windowAt = (x,y,r=8) => circle(x,y,r,'#567e81')+circle(x,y,r-2,'#fff0b7')+stroke(`M${x-r+2} ${y}H${x+r-2}M${x} ${y-r+2}V${y+r-2}`,'#bb9367',1.3);
const flag = (x,y,c) => stroke(`M${x} ${y+24}V${y-12}`,'#d9d4b0',2)+path(`M${x} ${y-12}L${x+17} ${y-6}L${x} ${y}` ,c);
const crystal = (x,y,h,c) => path(`M${x} ${y}L${x-11} ${y-h*.68}L${x} ${y-h}L${x+13} ${y-h*.66}L${x+8} ${y}Z`,c)+path(`M${x} ${y}V${y-h}L${x+13} ${y-h*.66}L${x+8} ${y}Z`,'#ffffff','opacity=".28"');
const pine = (x,y,s=1) => group(x,y,box(-3,-4,6,19,2,'#9c877e')+path('M0-61L-18-31H-11L-25-10H25L11-31H18Z','#749d92')+path('M0-61L-18-31H-10L0-42L11-31H18Z','#e6efdc')+path('M-11-31L-25-10H-12L0-21L16-10H25L11-31L0-20Z','#c9e6d8'),s);
const book = (x,y,color,tilt=0) => `<g transform="translate(${x} ${y}) rotate(${tilt})">${box(-13,-7,26,14,3,color)}${box(-8,-5,20,10,2,'#f3e7cc')}${stroke('M-6-2H9M-6 2H9','#c8b298',1)}</g>`;
const bee = (x,y,s=1) => group(x,y,`<ellipse cx="-5" cy="-7" rx="8" ry="5" fill="#e9f6e5"/><ellipse cx="6" cy="-7" rx="8" ry="5" fill="#e9f6e5"/><ellipse rx="13" ry="9" fill="#ffd47d"/>${stroke('M-4-8V8M4-8V8','#986b45',4)}${circle(9,-1,2,'#3f514b')}`,s);
const hex = (x,y,r,c) => path(`M${x-r} ${y}L${x-r/2} ${y-r*.86}H${x+r/2}L${x+r} ${y}L${x+r/2} ${y+r*.86}H${x-r/2}Z`,c);

function garden(w) {
 return path('M139 253V200Q168 173 198 200V253Q168 267 139 253Z','#efdcbc')+
 path('M125 202Q133 151 168 151Q205 153 214 202Q168 220 125 202Z',w.accent)+
 stroke('M131 201Q168 214 209 201','#ffe7be',5)+stroke('M170 153Q143 164 146 197','#fff4d2',4)+
 path('M175 255V234Q184 217 194 234V254','#4c7f75')+windowAt(154,230)+circle(190,243,1.5,'#f9dfa4');
}
function harbour(w) {
 return path('M110 235L228 232L214 264Q172 280 124 259Z','#b1816c')+
 path('M115 235Q171 249 225 233L214 248Q160 264 123 248Z','#ecd3a7')+
 box(143,199,59,37,8,'#d5e8df')+path('M135 203L149 188H201L214 203Z',w.accent)+
 windowAt(158,217,6)+windowAt(184,216,6)+stroke('M177 198V145','#b9cec2',5)+
 path('M179 149Q224 177 216 190H179Z','#ffe4b4')+path('M173 152L145 191H173Z','#c2e6e2')+
 stroke('M110 272H239M124 270V284M223 267V279','#ceba97',5)+flag(239,198,w.accent);
}
function coral(w) {
 return path('M135 260V223Q126 206 145 193Q157 173 174 190Q208 182 214 211V260Z','#c8e2cf')+
 path('M131 213Q130 192 151 193Q162 174 174 190Q204 182 214 211Q170 225 131 213Z',w.accent)+
 path('M171 261V239Q181 224 193 239V261','#4a9090')+windowAt(151,233,8)+windowAt(199,220,6)+
 stroke('M137 256Q111 240 111 220M111 234L99 226M111 234L122 223',w.accent,5);
}
function mushrooms(w) {
 let s='';
 for(const [x,y,k] of [[139,258,.8],[196,259,1.1],[238,259,.55]])s+=group(x,y,
 path('M-15 0L-12-53Q0-66 13-53L17 0Q0 8-15 0Z','#dedac8')+
 path('M-37-44Q-29-94 1-95Q31-92 39-44Q2-27-37-44Z',w.accent)+
 stroke('M-33-43Q0-33 36-43','#f8d9ec',4)+circle(-13,-59,6,'#fff0d8')+circle(10,-75,7,'#fff0d8')+circle(24,-52,4,'#fff0d8')+
 windowAt(1,-20,7),k);
 return s;
}
function honey(w) {
 let s=path('M137 260V205Q174 169 212 205V260Z','#deb073')+
 path('M125 207L174 159L224 207Q175 222 125 207Z',w.accent)+
 stroke('M144 201L173 174L205 202','#fff0b3',4);
 for(const [x,y]of [[154,222],[174,211],[194,222]])s+=hex(x,y,12,'#a87b47')+hex(x,y,8,'#fbedb9');
 s+=box(167,237,21,25,9,'#6e795d')+box(120,245,25,22,6,'#cf8e4f')+box(120,243,25,7,3,'#ffe1a2')+bee(233,203,.85);
 return s;
}
function library(w) {
 return book(169,257,'#aa899e')+book(170,241,'#8398b3')+book(171,224,'#d1b27e')+
 path('M133 258V187Q175 159 215 187V258Z','#a8b2c2')+
 path('M128 187Q135 170 151 169Q183 125 222 165Q191 147 177 180L221 188Z',w.accent)+
 box(142,193,23,54,5,'#647789')+box(180,193,25,54,5,'#647789')+
 [0,1,2].map(i=>stroke(`M144 ${208+i*15}H162M183 ${208+i*15}H202`,'#e5d5b3',2)+
 box(146,196+i*15,4,11,1,'#f0bdab')+box(152,195+i*15,4,12,1,'#ddcca5')+box(186,196+i*15,5,11,1,'#dac2e4')).join('')+
 path('M166 262V226Q173 214 181 226V262','#f5dfae')+book(244,241,'#c7a1cb',-16);
}
function crystals(w) {
 return crystal(139,270,91,w.accent)+crystal(162,267,61,'#b3e3d9')+crystal(208,270,117,w.accent)+
 crystal(241,268,71,'#b3e3d9')+path('M150 267Q180 224 210 267Z','#567f8c')+
 path('M163 267Q180 239 197 267Z','#b4e0dc')+stroke('M114 280Q184 260 254 280','#dfe9da',5)+
 stroke('M129 279V266M240 277V266','#c9dece',3);
}
function workshop(w) {
 let s=box(135,202,82,59,6,'#e5c99e')+path('M123 204L151 174H207L226 204Z',w.accent)+
 box(192,159,11,29,3,'#bb9471')+box(189,156,17,6,2,'#ead6b0')+windowAt(151,229,9)+box(173,230,25,34,8,'#6e927a');
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=240+Math.cos(a)*26,y=243+Math.sin(a)*26;s+=stroke(`M240 243L${x.toFixed(2)} ${y.toFixed(2)}`,'#ddb680',5);}
 return s+circle(240,243,19,'#d3a464')+circle(240,243,10,'#526f67')+circle(240,243,5,w.accent)+
 path('M109 267L119 226L132 267Z','#afad75')+stroke('M132 256H212','#bc986d',3);
}
function snow(w) {
 return pine(113,252,.7)+pine(253,260,.8)+path('M133 260V214L175 179L217 214V260Z','#c1988c')+
 path('M121 218L175 171L230 216L217 223L175 188L134 224Z','#edf2e8')+
 stroke('M138 243H210M144 225H205','#d5b7a5',3)+box(189,240,18,23,6,'#678b8d')+
 windowAt(157,237,10)+path('M132 260Q155 250 174 260Q200 252 217 260V269H132Z','#eaf3e6')+
 circle(232,266,10,'#edf2e8')+circle(232,252,7,'#edf2e8')+circle(230,250,1,'#53737b')+circle(235,250,1,'#53737b');
}
function dragon(w) {
 return path('M117 256Q102 198 145 167Q183 146 219 194L220 260Z','#92ab7b')+
 path('M113 220Q133 174 169 169Q203 171 223 214Q183 202 158 216Q135 231 113 220Z','#bdd496')+
 path('M135 262V228Q154 202 173 228V262','#527c70')+windowAt(195,228,8)+
 path('M208 270Q235 277 243 259Q248 239 233 238Q218 237 214 249Q209 251 201 246Q192 244 191 253Q191 266 208 270Z',w.creature)+
 path('M222 240L217 227L229 235L234 225L241 241Z','#86b78a')+stroke('M199 253Q202 256 205 253','#53775f',1.5)+
 path('M205 265Q195 273 188 264Q191 280 210 274Z','#85b58e');
}
function carousel(w) {
 let s=path('M119 253Q180 277 241 253V264Q180 289 119 264Z','#a7819e')+
 stroke('M131 248V199M174 255V200M225 248V199','#f4dcaf',4)+
 path('M110 200Q133 183 176 155Q221 185 249 200Q177 220 110 200Z',w.accent)+
 path('M145 209L176 156L180 213Z','#e2b8d0')+path('M207 210L176 156L232 204Z','#e2b8d0')+
 flag(176,154,'#eedaba');
 for(const [x,y]of [[145,235],[197,241]])s+=group(x,y,path('M-15 2Q-24-9-13-13L2-7L5-19Q16-25 20-13L12-8L11 5H-13Z','#f1e5c5')+
 stroke('M-10 4L-14 13M5 5L8 14','#f1e5c5',4)+circle(14,-15,1.4,'#776c6b')+path('M-9-8H5V1H-9Z','#a7ccbd'));
 return s;
}
function palace(w) {
 let s=path('M128 269V201H217V269Z','#aacacb')+path('M138 203L175 170L211 203Z',w.accent)+
 path('M161 269V235Q174 213 189 235V269','#598997');
 for(const [x,y]of [[120,209],[222,204],[174,178]])s+=box(x-10,y,20,62,3,'#c4dddd')+
 path(`M${x-17} ${y}L${x} ${y-35}L${x+17} ${y}Z`,w.accent)+windowAt(x,y+21,5)+flag(x,y-35,'#d8f1cf');
 return s+crystal(99,272,41,'#e2c8ef')+crystal(245,272,36,'#bfebdf');
}
const LANDMARKS = [garden,harbour,coral,mushrooms,honey,library,crystals,workshop,snow,dragon,carousel,palace];
export function worldLandmark(world) {
  if (!Number.isInteger(world)||!LANDMARKS[world]) throw new RangeError('World must be 0..11');
  return `<g id="landmark-${world}">${LANDMARKS[world](WORLDS[world])}</g>`;
}
export function worldBackdrop(world) {
 const w=WORLDS[world];let s='';
 if(world===3)s=path('M74 250Q87 133 115 124Q102 193 119 238Z','#547267')+path('M277 263Q290 121 320 107Q308 192 329 258Z','#547267')+circle(291,139,29,'#6c7d80');
 if(world===4)s=hex(282,154,29,'#c79964')+hex(282,154,22,'#e0b86f')+bee(268,117,.8)+bee(100,186,.65);
 if(world===5)s=path('M266 97A31 31 0 1 0 300 136A28 28 0 0 1 266 97Z','#fff0c1')+book(104,168,'#c5a4c2',-18)+book(280,187,'#b1c6d4',14);
 if(world===6)s=crystal(95,229,95,'#8dbdc7')+crystal(287,239,129,'#9c98c8')+crystal(315,243,77,'#9cd6d0');
 if(world===7)s=circle(277,126,24,'#ffdd96')+Array.from({length:10},(_,i)=>{const a=i*Math.PI/5;return stroke(`M${277+Math.cos(a)*31} ${126+Math.sin(a)*31}L${277+Math.cos(a)*39} ${126+Math.sin(a)*39}`,'#e7c791',3);}).join('');
 if(world===8)s=pine(87,213,.9)+pine(297,216,1.05)+Array.from({length:15},(_,i)=>circle(85+i*17,99+i*29%113,2.5,'#e7f0e8')).join('');
 if(world===9)s=path('M74 249Q92 181 77 134Q118 184 100 254Z','#76a389')+path('M279 251Q280 175 315 137Q302 207 319 258Z','#76a389')+path('M263 183Q239 132 273 122Q308 155 286 180Z','#abc690');
 if(world===10)s=stroke('M65 157Q198 206 336 143','#d2b5af',2)+Array.from({length:8},(_,i)=>{const x=79+i*34,y=167+Math.sin(i/2)*17;return path(`M${x} ${y}L${x+10} ${y+15}L${x+20} ${y}Z`,i%2?'#dac4d9':'#edc89e');}).join('');
 if(world===11)s=path('M57 141Q109 92 160 125T284 97L335 124Q281 164 228 136T101 174Z','#a1ddc7','opacity=".46"')+path('M63 155Q140 93 196 122T325 110L338 132Q276 174 219 145T77 180Z','#d2b4ed','opacity=".32"');
 return s;
}
function themedFeature(world,w) {
 switch(world){
  case 0:return group(268,241,stroke('M-11 33L0 4L12 33','#b0c8a4',3)+path('M-6-2L20-17L27-6L1 8Z','#e6ce9b')+circle(24,-11,7,'#7aa9ac'));
  case 1:return group(283,226,stroke('M0 42V-28','#dccba4',3)+path('M-1-27L27-19L22-4L0-9Z','#f4c29c'));
  case 2:return path('M262 268Q244 240 265 230Q289 235 274 257Q291 247 303 259Q291 278 262 268Z','#eca2b0')+circle(266,242,5,'#ffe3bc');
  case 3:return group(268,242,box(-4,0,8,29,3,'#d9dcbd')+path('M-22 1Q0-37 23 1Q0 12-22 1Z','#e1aedf')+circle(-6,-5,4,'#fff0da'));
  case 4:return bee(280,235,1)+hex(108,264,11,'#ffdd85');
  case 5:return book(265,259,'#deafaa',10)+book(268,245,'#c1c8e0',-7)+circle(293,236,7,'#ffdfaa');
  case 6:return crystal(276,272,53,'#e5c3fa')+crystal(96,273,38,'#c0ecdc');
  case 7:return group(290,235,stroke('M0-24V34M-25 2H25M-18-16L18 20M-18 20L18-16','#f2d79c',6)+circle(0,2,9,'#ceab73'));
  case 8:return pine(282,273,.7)+box(90,258,26,14,4,'#bd9493')+stroke('M88 275H120','#d3ded9',3);
  case 9:return group(275,255,path('M-14 16Q-24-7 0-22Q21-6 13 16Z','#d9e6b1')+path('M-15 7L-4 1L4 7L13 1','#afc48d')+circle(0,-11,3,'#f5d0a0'));
  case 10:return group(284,236,circle(0,0,20,'#dbaecd')+circle(0,0,13,'#f7ddb5')+stroke('M0 0V-9M0 0L7 3','#9c7f99',2)+stroke('M0 20V40','#cab69b',3));
  default:return group(283,237,path('M-18 35V-4H18V35Z','#bfded6')+path('M-24-4L0-33L24-4Z','#e3c0ee')+windowAt(0,12,7));
 }
}
export function worldRestoration(world,stage) {
 const w=WORLDS[world];if(!w)throw new RangeError('World must be 0..11');
 const count=Math.max(0,Math.min(5,Number.isFinite(stage)?Math.floor(stage):0));
 const layers=[
  stroke('M104 286Q127 267 155 280M104 280V292M155 274V286','#dce0b6',4)+stroke('M115 279V290M128 275V285M141 277V287','#b4aa83',2),
  stroke('M101 205Q182 232 257 198','#d0c5a1',1.5)+[0,1,2,3,4].map(i=>{const x=111+i*30,y=210+Math.sin(i)*7;return path(`M${x} ${y}L${x+7} ${y+13}L${x+14} ${y}Z`,i%2?w.accent:'#d9e8c2');}).join(''),
  themedFeature(world,w),
  [92,129,262,305].map((x,i)=>stroke(`M${x} ${275+i%2*10}V${245+i%2*10}`,'#afbea0',2)+circle(x,242+i%2*10,6,'#ffe1a3')+circle(x,242+i%2*10,12,'#ffe5ad')).join(''),
  flag(315,213,w.accent)+group(304,276,`<ellipse rx="12" ry="10" fill="${w.creature}"/>${circle(-4,-2,1.5,'#4b6864')}${circle(4,-2,1.5,'#4b6864')}${stroke('M-3 3Q0 6 3 3','#4b6864',1.4)}`)+
  [0,1,2].map(i=>group(96+i*92,119-i%2*19,path('M0 0Q-17-15-19-4Q-20 8 0 2Q20 8 19-4Q17-15 0 0Z',w.accent))).join(''),
 ];
 return layers.slice(0,count).map((body,i)=>`<g id="restoration-${world}-${i+1}">${body}</g>`).join('');
}
