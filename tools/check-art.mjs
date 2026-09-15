import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { domeSvg, iconSvg } from '../ui/art.mjs';
const output = new URL('../dist/qa/art/', import.meta.url);
await mkdir(output, { recursive: true });
let checked = 0;
for (let world = 0; world < 12; world++) {
  for (let stage = 0; stage <= 5; stage++) {
    const xml = domeSvg(world, stage / 5);
    assert.ok(!/undefined|NaN|<script|<foreignObject|<animate/.test(xml));
    const ids = [...xml.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, 'Duplicate SVG IDs');
    for (const match of xml.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(match[1]), `Missing SVG reference ${match[1]}`);
    assert.match(xml, new RegExp(`landmark-${world}`));
    // Rasterization validates XML/path syntax; this is not a native renderer/device test.
    const png = await sharp(Buffer.from(xml)).resize(480,456).png().toBuffer();
    assert.ok(png.length > 1500);
    if (world === 0 || stage === 5) await writeFile(new URL(`world-${world}-stage-${stage}.png`, output), png);
    checked++;
  }
}
assert.equal(iconSvg(), await readFile(new URL('../assets/icon.svg', import.meta.url),'utf8'));
console.log(`${checked} SVG world/stage combinations rendered; canonical launcher SVG unchanged.`);
