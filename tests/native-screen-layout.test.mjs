import test from 'node:test';
import assert from 'node:assert/strict';
const frames=await import('../native/screen-frame.mjs').catch(e=>{if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;return {};});
const layout=await import('../ui/layout.mjs').catch(e=>{if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;return {};});
function frame(props){
 assert.equal(typeof frames.createScreenFrame,'function','native screen container must be available');
 return frames.createScreenFrame({createElement:(type,props,children)=>({type,props,children}),View:'View',ScrollView:'ScrollView'})(props);
}
test('active gameplay has no scrolling ancestor, including between moves',()=>{
 const f=frame({active:true,busy:false,children:'board',gameStyle:{flex:1},contentStyle:{padding:18}});
 assert.equal(f.type,'View');assert.equal(f.props.testID,'game-frame');assert.equal(f.children,'board');
 assert.equal(f.props.style.flex,1);
});
test('animation and modal states never turn gameplay into a ScrollView',()=>{
 for(const busy of [true,false])assert.equal(frame({active:true,busy}).type,'View');
});
test('world catalogue can still scroll without iOS bounce',()=>{
 const f=frame({active:false,busy:false});assert.equal(f.type,'ScrollView');
 assert.equal(f.props.scrollEnabled,true);assert.equal(f.props.bounces,false);
});
test('tablet content uses the available screen rather than an iPhone-width column',()=>{
 assert.equal(typeof layout.screenMetrics,'function');
 const m=layout.screenMetrics(1032,1332);assert.equal(m.tablet,true);
 assert.equal(m.contentWidth,984);assert.equal(m.columns,3);assert.ok(m.domeSize>600);
});
test('board fits measured width AND remaining height on all device sizes',()=>{
 assert.equal(typeof layout.fitBoardSize,'function');
 for(const [w,h] of [[378,490],[284,205],[984,950],[720,330]]){
  const n=layout.fitBoardSize(w,h);assert.ok(n<=w&&n<=h&&n>0);assert.ok(n>=Math.min(w,h)-8);
 }
});
test('tablet hero reserves enough height for the play button and navigation',()=>{
 const m=layout.screenMetrics(1032,1332);
 assert.ok(m.domeSize<=732,'hero must leave space for controls rather than pushing Play under navigation');
});
