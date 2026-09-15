import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const module=await import('../native/modal.mjs').catch(error=>{
  if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;return {};
});
// Element-construction boundary test, not an Android/iOS renderer.
function factory(platform){
  assert.equal(typeof module.createGameModal,'function');
  return module.createGameModal({platform,View:'NativeView',Modal:'NativeModal',createElement:(type,props,children)=>({type,props,children})});
}
test('Android game dialogs stay inside the activity rather than stealing its window focus',()=>{
  const dialog=factory('android')({visible:true,children:'contents',animationType:'fade',transparent:true});
  assert.equal(dialog.type,'NativeView');assert.equal(dialog.children,'contents');
  assert.equal(dialog.props.style.position,'absolute');assert.equal(dialog.props.pointerEvents,'auto');
  assert.equal(dialog.props.accessibilityViewIsModal,true);
});
test('hidden Android dialog mounts no overlay or native window',()=>{
  assert.equal(factory('android')({visible:false,children:'contents'}),null);
});
test('accessibility escape invokes the same close action as Android hardware back',()=>{
  let closed=0;const dialog=factory('android')({visible:true,onRequestClose:()=>{closed++;}});
  dialog.props.onAccessibilityEscape();assert.equal(closed,1);
});
test('iOS retains its native modal presentation and close callback',()=>{
  const close=()=>{};const dialog=factory('ios')({visible:true,transparent:true,animationType:'fade',onRequestClose:close,children:'contents'});
  assert.equal(dialog.type,'NativeModal');assert.equal(dialog.props.visible,true);
  assert.equal(dialog.props.onRequestClose,close);assert.equal(dialog.props.animationType,'fade');assert.equal(dialog.children,'contents');
});
test('app uses the safe dialog and hides underlying content from screen readers',()=>{
  const source=readFileSync(new URL('../App.js',import.meta.url),'utf8');
  assert.match(source,/const GameModal=createGameModal\(/);
  assert.match(source,/<GameModal visible=/);assert.doesNotMatch(source,/<Modal visible=/);
  assert.match(source,/importantForAccessibility=\{state\.modal\?'no-hide-descendants':'auto'\}/);
  assert.match(source,/accessibilityElementsHidden=\{Boolean\(state\.modal\)\}/);
});
