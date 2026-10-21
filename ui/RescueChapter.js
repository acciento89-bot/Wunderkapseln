import React,{useState,useSyncExternalStore} from 'react';
import {View,Text,Pressable,ScrollView,StyleSheet,useWindowDimensions,StatusBar} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SvgXml} from 'react-native-svg';
import {RESCUE_LEVELS} from '../core/rescue-levels.mjs';
import {t} from './strings.mjs';
import {rescuePresentation} from './rescue-view.mjs';
import {rescueBoardSvg} from './rescue-svg.mjs';
const h=React.createElement;
function Button({label,onPress,disabled=false}){return h(Pressable,{onPress,disabled,accessibilityRole:'button',accessibilityLabel:label,accessibilityState:{disabled},style:[styles.button,disabled&&{opacity:.45}]},h(Text,{style:styles.buttonText},label));}
export function RescueChapter({controller,language,onExit}){
 const s=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot),tr=(key,values)=>t(language,key,values);
 const insets=useSafeAreaInsets(),window=useWindowDimensions(),p=rescuePresentation(s,language,Math.max(1,window.width-insets.left-insets.right),Math.max(1,window.height-insets.top-insets.bottom));
 const [confirm,setConfirm]=useState(false);const g=s.journal.game;
 const game=s.screen==='game'&&g;
 const action=(label,onPress,disabled=false)=>h(Button,{key:label,label,onPress,disabled});
 const content=[h(Text,{key:'title',style:styles.title,accessibilityRole:'header'},tr('rescueTitle')),h(Text,{key:'separate',style:styles.text},tr('rescueSeparate'))];
 if(!s.loaded){content.push(h(Text,{key:'load',style:styles.text,accessibilityRole:s.error?'alert':'text'},s.error?p.error:tr('loading')),action(tr('loadRetry'),()=>controller.initialize(),s.busy));}
 else if(game){
  const l=RESCUE_LEVELS.find(l=>l.id===g.rescueId),n=RESCUE_LEVELS.indexOf(l)+1;
  content.push(h(Text,{key:'level',style:styles.subtitle},tr('rescuePuzzle',{n})),h(Text,{key:'lesson',style:styles.text},tr('rescueLesson'+l.lesson[0].toUpperCase()+l.lesson.slice(1))),h(Text,{key:'counts',style:styles.text},`${tr('moves')}: ${g.moves} · ${tr('rescueCount',{n:g.rescued.length,total:g.companionIds.length})}`));
  content.push(h(View,{key:'board',testID:'rescue-board',style:{width:p.boardSize,height:p.boardSize,alignSelf:'center'}},h(View,{pointerEvents:'none',accessible:false,importantForAccessibility:'no-hide-descendants'},h(SvgXml,{xml:rescueBoardSvg(g,s.selected),width:p.boardSize,height:p.boardSize})),...p.tiles.map(tile=>h(Pressable,{key:tile.index,testID:`rescue-cell-${tile.index}`,disabled:tile.disabled,accessibilityRole:'button',accessibilityLabel:tile.label,accessibilityState:{disabled:tile.disabled,selected:s.selected===tile.index},onPress:()=>controller.tap(tile.index),style:{position:'absolute',left:tile.index%8*p.boardSize/8,top:Math.floor(tile.index/8)*p.boardSize/8,width:p.boardSize/8,height:p.boardSize/8}}))));
  content.push(h(Text,{key:'status',style:styles.text,accessibilityLiveRegion:'polite'},p.status));
  if(s.paused&&g.status==='playing')content.push(action(tr('resume'),()=>controller.resume(),Boolean(s.pending)||s.busy));
  if(!s.paused&&g.status==='playing')content.push(action(tr('pause'),()=>controller.pause(),s.busy));
  if(g.status==='playing')content.push(h(Text,{key:'wonderHelp',style:styles.text},tr('rescueWonderHelp')),action(tr('wonder'),()=>controller.wonder(s.selected),s.selected<0||Boolean(g.board[s.selected]?.companion)||g.charge<100||g.wonderUsed||s.paused||s.busy||Boolean(s.pending)));
  if(confirm){content.push(h(Text,{key:'confirm',style:styles.text},tr('rescueRestartConfirm')),action(tr('confirm'),()=>{setConfirm(false);void controller.restart();},s.busy||Boolean(s.pending)),action(tr('cancel'),()=>setConfirm(false)));}
  else content.push(action(tr('rescueRestart'),()=>{controller.pause();setConfirm(true);},s.busy||Boolean(s.pending)));
  content.push(action(tr('rescueBack'),()=>{setConfirm(false);controller.leave();}));
 }else{
  content.push(h(Text,{key:'intro',style:styles.text},tr('rescueIntro')),h(Text,{key:'progress',style:styles.subtitle},tr('rescueProgress',{n:s.journal.completed.length})));
  for(let i=0;i<RESCUE_LEVELS.length;i++){const l=RESCUE_LEVELS[i],best=s.journal.bests[l.id];content.push(action(`${tr('rescuePuzzle',{n:i+1})}${best!==undefined?' · '+tr('rescueBest',{n:best}):''}`,()=>{setConfirm(false);void controller.start(l.id);},i>s.journal.completed.length||s.busy||Boolean(s.pending)));}
 }
 if(p.error)content.push(h(Text,{key:'error',style:styles.error,accessibilityRole:'alert'},p.error));
 if(p.canRetry)content.push(action(tr('rescueRetrySave'),()=>controller.retry()));
 content.push(action(tr('rescueCampaign'),onExit));
 return h(View,{style:[styles.background,{paddingTop:insets.top,paddingBottom:insets.bottom,paddingLeft:insets.left,paddingRight:insets.right}]},h(StatusBar,{barStyle:'light-content'}),h(ScrollView,{bounces:false,contentContainerStyle:styles.content},...content));
}
const styles=StyleSheet.create({background:{flex:1,backgroundColor:'#10343e'},content:{padding:12,gap:12,alignSelf:'center',width:'100%',maxWidth:900,paddingBottom:32},title:{fontSize:28,fontWeight:'800',color:'#f7f0d9'},subtitle:{fontSize:20,fontWeight:'700',color:'#f5cf87'},text:{fontSize:16,lineHeight:23,color:'#d7e6df',flexShrink:1},error:{fontSize:16,lineHeight:23,color:'#ffccc1'},button:{minHeight:48,padding:14,borderRadius:16,backgroundColor:'#f5cf87',justifyContent:'center'},buttonText:{fontSize:16,fontWeight:'700',textAlign:'center',color:'#173d49'}});
