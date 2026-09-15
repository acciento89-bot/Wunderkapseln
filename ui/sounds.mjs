/** Original bell-like musical effects, synthesized locally. No recordings or remote assets. */
const SCORES = Object.freeze({
  match: [[0, 659.255, .23], [.07, 987.767, .28]],
  combo: [[0, 523.251, .3], [.09, 659.255, .3], [.18, 783.991, .35], [.27, 1046.502, .45]],
  wonder: [[0, 391.995, .35], [.06, 523.251, .4], [.12, 659.255, .45], [.18, 783.991, .5], [.24, 1046.502, .65]],
  win: [[0, 523.251, .35], [.12, 659.255, .35], [.24, 783.991, .35], [.38, 1046.502, .72], [.38, 659.255, .62]],
  lost: [[0, 329.628, .42], [.19, 261.626, .56]],
});
// Synth recipes: [start, duration, fromHz, toHz, amplitude, waveform].
// Noise has a stable seeded generator; no microphone, samples, downloads or randomness.
const ABILITIES = Object.freeze({
  rocket: [[0,.36,160,1450,.24,'sweep'],[0,.42,0,0,.22,'air'],[.28,.42,1046.502,1046.502,.2,'bell']],
  bomb: [[0,.52,180,48,.45,'sweep'],[.015,.38,0,0,.28,'softNoise'],[.12,.52,391.995,391.995,.16,'bell'],[.2,.48,783.991,783.991,.13,'bell']],
  prism: [[0,.5,523.251,523.251,.21,'bell'],[.08,.52,659.255,659.255,.21,'bell'],[.16,.55,783.991,783.991,.21,'bell'],[.24,.6,1046.502,1046.502,.21,'bell'],[.32,.68,1318.51,1318.51,.16,'bell'],[.4,.7,1567.982,1567.982,.12,'bell']],
  mega: [[0,.7,145,38,.45,'sweep'],[0,.65,0,0,.26,'softNoise'],[.1,.6,200,1450,.13,'sweep'],[.25,.8,523.251,523.251,.17,'bell'],[.3,.85,659.255,659.255,.17,'bell'],[.36,.9,783.991,783.991,.18,'bell'],[.46,.9,1046.502,1046.502,.2,'bell']],
  wind: [[0,.85,0,0,.32,'air'],[.04,.65,320,780,.11,'sweep'],[.28,.45,1174.659,1174.659,.18,'bell'],[.4,.5,1567.982,1567.982,.13,'bell']],
  tide: [[0,.75,0,0,.22,'softNoise'],[0,.7,110,260,.22,'sweep'],[.18,.5,523.251,523.251,.16,'bell'],[.3,.5,659.255,659.255,.15,'bell'],[.43,.55,783.991,783.991,.14,'bell']],
  bloom: [[0,.4,391.995,391.995,.21,'bell'],[.1,.45,523.251,523.251,.2,'bell'],[.2,.5,659.255,659.255,.2,'bell'],[.3,.6,783.991,783.991,.19,'bell'],[.4,.7,1174.659,1174.659,.13,'bell']],
  charge: [[0,.32,783.991,783.991,.19,'bell'],[.12,.46,1567.982,1567.982,.2,'bell']],
  restoration: [[0,.4,391.995,391.995,.2,'bell'],[.13,.42,523.251,523.251,.2,'bell'],[.26,.45,659.255,659.255,.21,'bell'],[.4,.5,783.991,783.991,.2,'bell'],[.57,.9,1046.502,1046.502,.2,'bell'],[.57,.85,659.255,659.255,.15,'bell'],[.7,.85,1567.982,1567.982,.11,'bell']],
});
export const SOUND_NAMES = Object.freeze([...Object.keys(SCORES), ...Object.keys(ABILITIES)]);
function abilityPcm(name, sampleRate) {
  const recipe = ABILITIES[name];
  const pcm = new Float32Array(Math.ceil((Math.max(...recipe.map(([start, length])=>start+length))+.015)*sampleRate));
  let seed = [...name].reduce((n, c)=>Math.imul(n,31)+c.charCodeAt(0),1) >>> 0;
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
  for(const [start,length,from,to,amplitude,wave] of recipe){
    const offset=Math.round(start*sampleRate),count=Math.floor(length*sampleRate);let low=0;
    for(let i=0;i<count;i++){
      const time=i/sampleRate,progress=time/length;
      const attack=Math.min(1,time/(wave==='air'?.06:.008));
      const release=Math.min(1,(length-time)/.12);
      const envelope=attack*release*(wave==='air'?Math.sin(Math.PI*progress):Math.exp(-(wave==='bell'?4:3)*progress));
      const phase=2*Math.PI*(from*time+(to-from)*time*time/(2*length));
      let value;
      if(wave==='softNoise'||wave==='air'){
        const white=noise();low+=.08*(white-low);value=wave==='air'?white-low:low*2.4;
      }else value=wave==='bell'?.8*Math.sin(phase)+.15*Math.sin(phase*2)+.05*Math.sin(phase*3):Math.sin(phase);
      pcm[offset+i]+=amplitude*envelope*value;
    }
  }
  let peak=0;for(const value of pcm)peak=Math.max(peak,Math.abs(value));
  if(peak>.5)for(let i=0;i<pcm.length;i++)pcm[i]*=.5/peak;
  return pcm;
}
export function synthesize(name, sampleRate = 22050) {
  if (!Object.hasOwn(SCORES, name) && !Object.hasOwn(ABILITIES, name)) throw new RangeError('Unknown sound');
  if (!Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 96000) throw new RangeError('Unsupported sample rate');
  if (Object.hasOwn(ABILITIES, name)) return abilityPcm(name, sampleRate);
  const score = SCORES[name], duration = Math.max(...score.map(([start, , length]) => start + length)) + .015;
  const pcm = new Float32Array(Math.ceil(duration * sampleRate));
  for (const [start, frequency, length] of score) {
    const offset = Math.round(start * sampleRate), count = Math.floor(length * sampleRate);
    for (let i = 0; i < count; i++) {
      const time = i / sampleRate, phase = 2 * Math.PI * frequency * time;
      const attack = Math.min(1, time / .006), release = Math.min(1, (length - time) / .1);
      const envelope = attack * release * Math.exp(-5 * time / length);
      pcm[offset + i] += .22 * envelope * (.8 * Math.sin(phase) + .15 * Math.sin(2 * phase) + .05 * Math.sin(3 * phase));
    }
  }
  return pcm;
}
export function wavBytes(name, sampleRate = 22050) {
  const pcm = synthesize(name, sampleRate), bytes = new Uint8Array(44 + pcm.length * 2), view = new DataView(bytes.buffer);
  const text = (offset, value) => { for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i); };
  text(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, pcm[i])) * 32767), true);
  return bytes;
}
