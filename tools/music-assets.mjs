import {mkdir,writeFile} from 'node:fs/promises';
import {musicWav} from '../ui/music.mjs';
const folder = new URL('../assets/music/',import.meta.url);
await mkdir(folder,{recursive:true});
await writeFile(new URL('wonder-garden.wav',folder),musicWav());
console.log('Generated original 32-second garden music loop.');
