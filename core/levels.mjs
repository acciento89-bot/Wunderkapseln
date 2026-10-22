/** Authored campaign recipes. Seeds make each level reproducible, not hand-playtested. */
export const WORLDS = Object.freeze([
  { de:'Sternengarten', en:'Starlight Garden', sky:'#103e4c', mist:'#2b8190', ground:'#8ccc78', accent:'#ffc96a', type:'garden', wonder:'bloom', creature:'#ffd48c' },
  { de:'Wolkenhafen', en:'Cloud Harbour', sky:'#284c7c', mist:'#78b8d4', ground:'#b7dce8', accent:'#ffb9a0', type:'sky', wonder:'wind', creature:'#ffe8b5' },
  { de:'Korallenbucht', en:'Coral Cove', sky:'#073c56', mist:'#29a9b7', ground:'#7be0c6', accent:'#ff999f', type:'ocean', wonder:'tide', creature:'#ffb3c7' },
  { de:'Pilzlichtwald', en:'Glowshroom Grove', sky:'#293455', mist:'#627393', ground:'#9bb59c', accent:'#eab1eb', type:'garden', wonder:'bloom', creature:'#f3a5c4' },
  { de:'Honigatelier', en:'Honey Atelier', sky:'#574239', mist:'#b78869', ground:'#d9b86f', accent:'#ffda85', type:'garden', wonder:'bloom', creature:'#ffd272' },
  { de:'Mondbibliothek', en:'Moon Library', sky:'#29294e', mist:'#7778a7', ground:'#979bcc', accent:'#ffe3a1', type:'sky', wonder:'wind', creature:'#d8c9ff' },
  { de:'Kristallbucht', en:'Crystal Bay', sky:'#193c56', mist:'#5498ab', ground:'#97d8d6', accent:'#d9b8ff', type:'ocean', wonder:'tide', creature:'#b4eff1' },
  { de:'Sonnenwerkstatt', en:'Sunshine Workshop', sky:'#3b4245', mist:'#b7a174', ground:'#b3c47a', accent:'#ffbc72', type:'garden', wonder:'bloom', creature:'#ffca7d' },
  { de:'Schneefunkeln', en:'Snowglow Village', sky:'#263e62', mist:'#90b6d2', ground:'#d7eced', accent:'#ffd2ce', type:'sky', wonder:'wind', creature:'#e4eafa' },
  { de:'Drachenhain', en:'Dragon Grove', sky:'#19423d', mist:'#5b9787', ground:'#a2c378', accent:'#efb7b0', type:'garden', wonder:'bloom', creature:'#abdbaa' },
  { de:'Traumkarussell', en:'Dream Carousel', sky:'#42344d', mist:'#a17caa', ground:'#c5a4bb', accent:'#ffd0a0', type:'sky', wonder:'wind', creature:'#f4bbdf' },
  { de:'Aurorapalast', en:'Aurora Palace', sky:'#17344c', mist:'#539a9c', ground:'#9ed1c9', accent:'#efc1fc', type:'ocean', wonder:'tide', creature:'#e4ccff' },
]);
export const LEVEL_COUNT = 480;
export function levelFor(id) {
  if(!Number.isInteger(id)||id<1||id>LEVEL_COUNT) throw new RangeError('Level must be 1..480');
  const world=Math.floor((id-1)/40), step=(id-1)%40, palette=id<=5?4:id<=40?5:6;
  const mode=step<5?0:step%3, hard=step%10===9;
  const frost=Array(64).fill(0);
  if(mode!==0) for(let i=0;i<64;i++) {
    const x=i%8,y=Math.floor(i/8);
    const patterns=[x===y||x+y===7, x===2||x===5, y===2||y===5, x>1&&x<6&&y>1&&y<6, (x+y)%3===0];
    if(patterns[Math.floor(step/3)%5]) frost[i]=hard&&i%3===0?2:1;
  }
  const targets=[];
  if(mode!==1) targets.push({kind:'color',color:(world+step)%palette,amount:step<5?9+step:14+Math.floor(step/10)*2});
  if(mode===0&&step>=5) targets.push({kind:'color',color:(world+step+2)%palette,amount:10+Math.floor(step/10)*2});
  if(mode!==0) targets.push({kind:'frost',amount:frost.reduce((a,b)=>a+b,0)});
  return {id,world,size:8,palette,seed:(0xC0FFEE+id*2654435761)>>>0,moves:step<5?24:hard?28:32,targets,frost,hard};
}
export function campaign() { return Array.from({length:LEVEL_COUNT},(_,i)=>levelFor(i+1)); }
