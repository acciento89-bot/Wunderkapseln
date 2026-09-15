import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { SOUND_NAMES, synthesize, wavBytes } from '../ui/sounds.mjs';
const descriptions = {
  match:['Kleine Verbindung','Zwei helle Glasnoten.'],combo:['Kettenreaktion','Aufsteigende, spielerische Tonfolge.'],wonder:['Wunderklang','Allgemeiner Klang als kompatibler Rueckfall.'],win:['Level geschafft','Warme, kurze Erfolgsfanfare.'],lost:['Neuer Versuch','Sanfter, abfallender Abschluss.'],
  rocket:['Rakete','Luftiger Anstieg mit glitzerndem Ausklang.'],bomb:['Kapselbombe','Weicher Bassimpuls und helle Splitter.'],prism:['Regenbogenperle','Funkelnde, aufsteigende Kristallnoten.'],mega:['Grosse Kombination','Kraeftiger Impuls mit mehrstimmigem Schimmer.'],wind:['Windboee','Leichter Luftzug mit hohen Glocken.'],tide:['Flutwelle','Weicher Wellenschub und perlende Toene.'],bloom:['Bluetenwunder','Ein warmer, aufbluehender Akkord.'],charge:['Wunder bereit','Zwei kurze, klare Signaltoene.'],restoration:['Welt erwacht','Eigene Fanfare fuer einen Ausbau-Meilenstein.'],
};
const moduleText = (await readFile('ui/sounds.mjs','utf8')).replace(/export\s+(?=(const|function)\s)/g,'');
const cards=SOUND_NAMES.map(cue=>{
 const pcm=synthesize(cue),duration=(pcm.length/22050).toFixed(2);
 return `<article><span class="tag">${cue}</span><h2>${descriptions[cue][0]}</h2><p>${descriptions[cue][1]}</p><button data-cue="${cue}" aria-label="${descriptions[cue][0]} abspielen">Anhoeren <small>${duration} s</small></button></article>`;
}).join('');
const html=`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wunderkapseln | Klangatelier 0.4.0</title><style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#10343e;color:#eef7ea}*{box-sizing:border-box}body{margin:0}main{max-width:1100px;margin:auto;padding:36px 20px 60px}.eyebrow,.tag{letter-spacing:.15em;color:#edcf96;font-size:11px;text-transform:uppercase}h1{font-size:clamp(32px,7vw,60px);line-height:1.07;margin:16px 0}h1 span{color:#edcf96}header p{max-width:700px;line-height:1.65;color:#b4d1cd}nav{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0}button{font:inherit;border:0;border-radius:16px;background:#ebd4a1;color:#253f3b;font-weight:700;padding:14px 18px;cursor:pointer;min-height:48px}button:focus-visible{outline:3px solid white;outline-offset:4px}button.secondary{background:#315761;color:#eef7ea}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:14px}article{border:1px solid #527579;border-radius:22px;padding:22px;background:linear-gradient(145deg,#244d55,#173d46)}h2{font-size:21px;margin:10px 0}article p{color:#b4d1cd;line-height:1.5;min-height:48px}article button{width:100%;display:flex;justify-content:space-between;gap:12px}small{font-weight:400}footer{color:#b4d1cd;line-height:1.6;margin-top:24px}#status{min-height:28px;color:#edcf96}[data-playing=true]{outline:2px solid #edcf96}
</style><main><header><div class="eyebrow">Kamilunavo / Wunderkapseln / Alpha 0.4.0</div><h1>Kleine Welten.<br><span>Grosse Klangmomente.</span></h1><p>Alle 14 Originaleffekte zum direkten Anhoeren. Die Klaenge werden hier mit demselben lokalen Synthesizer erzeugt wie im Spiel. Keine Werbung, keine Verbindung zu einem Server und keine Mikrofonfreigabe.</p></header><nav><button id="sequence">Faehigkeit + Sieg + Ausbau</button><button class="secondary" id="stop">Alles stoppen</button></nav><p role="status" aria-live="polite" id="status">Bereit. Die Wiedergabe beginnt erst nach einem Klick.</p><div class="grid">${cards}</div><footer>Die neuen Effekte sind auch im Spiel angebunden. Diese Seite ist ein Klangtest, kein In-App-Shop. Das Ergebnis auf echten iOS-/Android-Geraeten muss separat geprueft werden.</footer></main><script type="module">
${moduleText}
let context=null,source=null,timers=[],revision=0;const status=document.querySelector('#status');
function stop(){revision++;for(const timer of timers)clearTimeout(timer);timers=[];if(source){try{source.stop()}catch{}source.disconnect();source=null;}document.querySelectorAll('[data-playing]').forEach(e=>e.removeAttribute('data-playing'));}
async function play(cue,token=revision){
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){status.textContent='Dieser Browser unterstuetzt Web Audio nicht.';return;}if(!context)context=new Audio();await context.resume();if(token!==revision)return;
  if(source){try{source.stop()}catch{}source.disconnect();}
  const pcm=synthesize(cue),buffer=context.createBuffer(1,pcm.length,22050);buffer.copyToChannel(pcm,0);const next=context.createBufferSource(),gain=context.createGain();gain.gain.value=.5;next.buffer=buffer;next.connect(gain);gain.connect(context.destination);source=next;
  const button=document.querySelector('[data-cue="'+cue+'"]');document.querySelectorAll('[data-playing]').forEach(e=>e.removeAttribute('data-playing'));button?.setAttribute('data-playing','true');status.textContent='Jetzt: '+(button?.getAttribute('aria-label')||cue);
  next.onended=()=>{next.disconnect();gain.disconnect();if(source===next){source=null;button?.removeAttribute('data-playing');}};next.start();
 }catch{status.textContent='Ton konnte nicht gestartet werden. Bitte erneut antippen.';}
}
document.querySelectorAll('[data-cue]').forEach(button=>button.onclick=()=>{stop();void play(button.dataset.cue)});
document.querySelector('#stop').onclick=()=>{stop();status.textContent='Alle Klaenge gestoppt.'};
document.querySelector('#sequence').onclick=()=>{stop();const token=revision;void play('mega',token);timers.push(setTimeout(()=>void play('win',token),1450),setTimeout(()=>void play('restoration',token),2650));};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);
</script></html>`;
await mkdir('dist',{recursive:true});await writeFile('dist/Wunderkapseln-soundcheck.html',html);
const samples=[];for(const cue of ['rocket','bomb','prism','mega','wind','tide','bloom','charge','restoration']){samples.push(synthesize(cue),new Float32Array(6615));}
const length=samples.reduce((n,s)=>n+s.length,0),bytes=new Uint8Array(44+length*2);
bytes.set(wavBytes('match').slice(0,44));const view=new DataView(bytes.buffer);view.setUint32(4,bytes.length-8,true);view.setUint32(40,length*2,true);let at=44;
for(const pcm of samples)for(const x of pcm){view.setInt16(at,Math.round(x*.5*32767),true);at+=2;}
await writeFile('dist/Wunderkapseln-ability-showcase.wav',bytes);
console.log('Sound audition page and nine-effect WAV showcase built.');
