import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { SOUND_NAMES, wavBytes } from '../ui/sounds.mjs';
test('documentation links, store field lengths and release claims are validated',()=>{
 const p=spawnSync(process.execPath,['tools/check-docs.mjs'],{encoding:'utf8'});
 assert.equal(p.status,0,p.stdout+p.stderr);
});
test('every shipped sound is byte-identical to its deterministic generator',()=>{
 for(const cue of SOUND_NAMES)assert.deepEqual(new Uint8Array(readFileSync(new URL(`../assets/audio/${cue}.wav`,import.meta.url))),wavBytes(cue),cue);
});
