import test from 'node:test';import assert from 'node:assert/strict';
import { STRINGS, t } from '../ui/strings.mjs';
import { domeSvg, gemSvg, boardSvg, iconSvg } from '../ui/art.mjs';
import { createGame } from '../core/game.mjs';import{levelFor}from'../core/levels.mjs';
test('DE and EN contain identical translation keys',()=>{assert.deepEqual(Object.keys(STRINGS.de).sort(),Object.keys(STRINGS.en).sort());for(const lang of ['de','en']) for(const key of Object.keys(STRINGS[lang])) assert.ok(t(lang,key).length);});
test('each world has complete independent vector artwork',()=>{const all=[];for(let i=0;i<12;i++){const s=domeSvg(i,.5);assert.match(s,/<svg /);assert.match(s,/<\/svg>$/);assert.ok(!s.includes('undefined'));assert.ok(!s.includes('NaN'));all.push(s);}assert.equal(new Set(all).size,12);});
test('all gems and specials render finite SVGs',()=>{for(let i=0;i<6;i++) for(const special of ['','row','column','bomb','prism']){const s=gemSvg({color:i,special});assert.match(s,/<svg /);assert.ok(!s.includes('undefined'));}assert.match(iconSvg(),/<svg /);});
test('board artwork includes 64 indexed cells and frost indicators',()=>{const g=createGame(levelFor(8));const s=boardSvg(g);assert.equal((s.match(/data-cell=/g)||[]).length,64);assert.ok(s.includes('frost'));});
