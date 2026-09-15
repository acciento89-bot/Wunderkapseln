import { mkdir, writeFile } from 'node:fs/promises';
import { SOUND_NAMES, wavBytes } from '../ui/sounds.mjs';
const root = new URL('../assets/audio/', import.meta.url);
await mkdir(root, { recursive: true });
for (const name of SOUND_NAMES) await writeFile(new URL(`${name}.wav`, root), wavBytes(name));
console.log(`Generated ${SOUND_NAMES.length} original offline PCM sound effects.`);
