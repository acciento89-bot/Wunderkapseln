// Original, deterministic garden theme: twelve bars at 90 BPM. No samples or RNG.
export const MUSIC_RATE = 22050;
export const MUSIC_SECONDS = 32;
export function musicSamples() {
  const out = new Float32Array(MUSIC_RATE * MUSIC_SECONDS);
  const chords = [[60,64,67],[57,60,64],[53,57,60],[55,59,62]];
  const beat = 2 / 3, bar = beat * 4;
  const hz = note => 440 * 2 ** ((note - 69) / 12);
  for (let b = 0; b < 12; b++) {
    const chord = chords[b % chords.length];
    for (let k = 0; k < 8; k++) {
      const note = chord[[0,1,2,1,0,2,1,2][k]] + 12;
      const start = b * bar + k * beat / 2;
      const length = Math.min(1.35, MUSIC_SECONDS - start);
      for (let j = 0; j < length * MUSIC_RATE; j++) {
        const t = j / MUSIC_RATE, f = hz(note);
        const envelope = Math.min(1, t / .015) * Math.exp(-4 * t) * Math.min(1, (length - t) / .07);
        const i = Math.floor(start * MUSIC_RATE) + j;
        if (i < out.length) out[i] += envelope * (.17 * Math.sin(2*Math.PI*f*t) + .035 * Math.sin(4*Math.PI*f*t));
      }
    }
    for (const note of chord) {
      const start = b * bar, length = bar;
      for (let j = 0; j < length * MUSIC_RATE; j++) {
        const t = j / MUSIC_RATE;
        const envelope = Math.sin(Math.PI * t / length) ** 2;
        const i = Math.floor(start * MUSIC_RATE) + j;
        if (i < out.length) out[i] += .035 * envelope * Math.sin(2*Math.PI*hz(note-12)*t);
      }
    }
  }
  // Fade the loop boundary to silence to avoid discontinuity clicks.
  for (let i = 0; i < out.length; i++) out[i] *= Math.min(1, i/(MUSIC_RATE*.04), (out.length-1-i)/(MUSIC_RATE*.12));
  return out;
}
export function musicWav() {
  const samples = musicSamples(), bytes = new Uint8Array(44 + samples.length * 2), v = new DataView(bytes.buffer);
  const tag = (at,s) => [...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
  tag(0,'RIFF');v.setUint32(4,bytes.length-8,true);tag(8,'WAVE');tag(12,'fmt ');
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,MUSIC_RATE,true);v.setUint32(28,MUSIC_RATE*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
  tag(36,'data');v.setUint32(40,samples.length*2,true);
  for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);
  return bytes;
}
