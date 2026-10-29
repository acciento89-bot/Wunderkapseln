import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RescueController} from '../core/rescue-controller.mjs';

// Render the real component with a small native host: no source-order regex or
// duplicated layout policy. Device geometry remains a separate native gate.
let source=readFileSync(new URL('../ui/RescueChapter.js',import.meta.url),'utf8');
// This native host supplies Text; font loading has its own APK/device gate.
source=source.replace("import { Text } from './product-type.js';\n",'');
source=source.replace(/import React[^\n]+\n/,`const useState=x=>[x,()=>{}],useSyncExternalStore=(_,get)=>get();
const React={createElement:(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props:props||{},children:children.flat()})};\n`);
source=source.replace(/import \{View[^\n]+\n/,`const View='View',Text='Text',Pressable='Pressable',ScrollView='ScrollView',StatusBar='StatusBar';const StyleSheet={create:x=>x},useWindowDimensions=()=>({width:360,height:720});\n`);
source=source.replace(/import \{useSafeAreaInsets\}[^\n]+\n/,`const useSafeAreaInsets=()=>({top:24,bottom:24,left:0,right:0});\n`);
source=source.replace(/import \{SvgXml\}[^\n]+\n/,`const SvgXml='SvgXml';\n`);
source=source.replace(/from '([^']+)';/g,(match,path)=>`from '${new URL(path,new URL('../ui/RescueChapter.js',import.meta.url)).href}';`);
const {RescueChapter}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function nodes(tree,insideScroll=false,out=[]){if(!tree||typeof tree!=='object')return out;const scroll=insideScroll||tree.type==='ScrollView';out.push({tree,insideScroll:scroll});for(const child of tree.children||[])nodes(child,scroll,out);return out;}
async function controller(gate={}){const data=new Map();const c=new RescueController({storage:{getItem:async k=>data.get(k)??null,setItem:async(k,v)=>{if(gate.fail)throw Error("Disk full");data.set(k,v);}}});await c.initialize();await c.start('rescue-01');return c;}
const render=c=>nodes(RescueChapter({controller:c,language:'en',onExit(){}}));
test('rescue pause and resume remain outside the scrolling board at every stage',async()=>{
 const c=await controller();let n=render(c);assert.equal(n.find(x=>x.tree.type==='Pressable'&&x.tree.props.accessibilityLabel==='A little pause')?.insideScroll,false);
 c.pause();n=render(c);assert.equal(n.find(x=>x.tree.type==='Pressable'&&x.tree.props.accessibilityLabel==='Resume')?.insideScroll,false);
 assert.equal(c.canPlay(),false);
});
test('puzzle identity and pause status stay in the fixed native controls',async()=>{
 const c=await controller();c.pause();const n=render(c);
 for(const value of ['Rescue puzzle 1','Rescue paused'])assert.equal(n.find(x=>x.tree.type==='Text'&&x.tree.children.includes(value))?.insideScroll,false,value);
});
test('each puzzle and the level list have independent scroll identities',async()=>{
 const c=await controller(),key=()=>render(c).find(x=>x.tree.type==='ScrollView').tree.props.key;
 const first=key();await c.move(56,57);c.leave();const list=key();await c.start('rescue-02');const second=key();
 assert.notEqual(first,list);assert.notEqual(first,second);assert.notEqual(second,list);
});

test('failed native saves expose Retry outside the scrolling board',async()=>{
 const gate={},c=await controller(gate);gate.fail=true;await c.move(56,57);const n=render(c);
 const retry=n.find(x=>x.tree.type==='Pressable'&&x.tree.props.accessibilityLabel==='Retry saving');
 assert.equal(retry?.insideScroll,false);assert.equal(retry.tree.props.disabled,false);assert.equal(c.canPlay(),false);
 const error=n.find(x=>x.tree.type==='Text'&&x.tree.children.some(t=>typeof t==='string'&&t.startsWith('Not saved.')));assert.equal(error?.insideScroll,false);
});
