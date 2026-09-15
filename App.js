import { createScreenFrame } from './native/screen-frame.mjs';
import { screenMetrics, fitBoardSize } from './ui/layout.mjs';
import { createGameModal } from './native/modal.mjs';
import { attachNativeRuntime } from './native/runtime.mjs';
import { useGameAudio } from './native/useGameAudio.js';
import { restorationFor } from './core/restoration.mjs';
import React, { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal, StatusBar, AppState, PanResponder, Animated, AccessibilityInfo, Vibration, BackHandler, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SvgXml } from 'react-native-svg';
import { GameController } from './core/controller.mjs';
import { WORLDS, levelFor } from './core/levels.mjs';
import { goalProgress, starsFor } from './core/game.mjs';
import { remainingLifeSeconds } from './core/profile.mjs';
import { domeSvg, boardSvg, gemSvg, uiIcon } from './ui/art.mjs';
import { tileAt, gestureTarget } from './ui/input.mjs';
import { t, SHAPES, clock } from './ui/strings.mjs';

const GameModal=createGameModal({createElement:React.createElement,View,Modal,platform:Platform.OS});
const ScreenFrame=createScreenFrame({createElement:React.createElement,View,ScrollView});
const palette={bg:'#10343e',panel:'#1a414a',cream:'#f7f0d9',muted:'#a1bebb',gold:'#f5cf87',ink:'#385b58',line:'#31545b'};
const deviceLocale=()=>{try{return Intl.DateTimeFormat().resolvedOptions().locale;}catch{return 'en';}};
const controller=new GameController({storage:AsyncStorage,locale:deviceLocale()});
const Art=memo(({xml,size=24,height=size})=><SvgXml xml={xml} width={size} height={height}/>);
const Icon=({name,color=palette.cream,size=24})=><Art xml={uiIcon(name,color,size)} size={size}/>;
function Action({label,onPress,icon,secondary=false,disabled=false,small=false,style}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[styles.action,secondary&&styles.secondary,small&&styles.small,disabled&&styles.disabled,pressed&&styles.pressed,style]}>
  {icon&&<Icon name={icon} color={secondary?palette.cream:palette.ink}/>}
  <Text style={[styles.actionText,secondary&&styles.secondaryText]}>{label}</Text>
 </Pressable>;
}
function Circle({label,icon,onPress}){return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.circle}><Icon name={icon}/></Pressable>;}
function Dome({world,progress,size,reduce}){
 const offset=useRef(new Animated.Value(0)).current;
 useEffect(()=>{if(reduce){offset.setValue(0);return;}const loop=Animated.loop(Animated.sequence([Animated.timing(offset,{toValue:-5,duration:2200,useNativeDriver:true}),Animated.timing(offset,{toValue:0,duration:2200,useNativeDriver:true})]));loop.start();return()=>loop.stop();},[offset,reduce]);
 const xml=useMemo(()=>domeSvg(world,progress),[world,progress]);
 return <Animated.View accessible={false} importantForAccessibility="no-hide-descendants" style={{transform:[{translateY:offset}]}}><Art xml={xml} size={size} height={size*.95}/></Animated.View>;
}
const completedIn=(p,w)=>restorationFor(p,w).completed;
function Restoration({profile,world,tr}){
 const r=restorationFor(profile,world);
 return <View style={styles.restorationCard}><View style={styles.row}><Text style={styles.caption}>{tr(r.detail||'worldComplete')}</Text><Text style={styles.caption}>{tr('milestoneProgress',{n:r.stage})}</Text></View><View style={styles.milestoneTrack} accessibilityLabel={tr('milestoneProgress',{n:r.stage})}>{[1,2,3,4,5].map(i=><View key={i} style={[styles.milestoneDot,i<=r.stage&&styles.milestoneActive]}/>)}</View></View>;
}
function Board({state,width,tr}){
 const latest=useRef(state);latest.current=state;
 const start=useRef(-1);
 const feedback=()=>{if(latest.current.session.profile.haptics)Vibration.vibrate(10);};
 const pan=useMemo(()=>PanResponder.create({
  onStartShouldSetPanResponder:()=>!latest.current.busy&&!latest.current.modal,
  onMoveShouldSetPanResponder:()=>!latest.current.busy&&!latest.current.modal,
  onPanResponderGrant:event=>{start.current=tileAt(event.nativeEvent.locationX,event.nativeEvent.locationY,width);},
  onPanResponderRelease:(_event,gesture)=>{
   const from=start.current;start.current=-1;if(from<0)return;
   const to=gestureTarget(from,gesture.dx,gesture.dy,width);if(to<0)return;
   const previous=latest.current.session.game.moves;
   const operation=to===from?controller.tap(from):controller.move(from,to);
   Promise.resolve(operation).then(()=>{if(controller.getSnapshot().session.game?.moves<previous)feedback();});
  },onPanResponderTerminate:()=>{start.current=-1;},
  onPanResponderTerminationRequest:()=>false,
 }),[width]);
 const g=state.visual||state.session.game;
 const xml=useMemo(()=>boardSvg(g,{selected:state.selected,hint:state.hint,...state.animation}),[g,state.selected,state.hint,state.animation]);
 return <View testID="match-board" collapsable={false} style={[styles.board,{width,height:width}]} {...pan.panHandlers}>
  <View pointerEvents="none" accessible={false}><Art xml={xml} size={width}/></View>
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
   {g.board.map((cell,i)=><View key={i} accessible accessibilityRole="button" accessibilityLabel={`${tr('cell',{r:Math.floor(i/8)+1,c:i%8+1})}, ${tr(cell.special||SHAPES[cell.color])}${g.frost[i]?`, ${tr('frost')}`:''}`} accessibilityState={{disabled:state.busy,selected:i===state.selected}} accessibilityActions={[{name:'activate',label:tr('choose')}]} onAccessibilityAction={()=>controller.tap(i)} style={{position:'absolute',left:i%8*width/8,top:Math.floor(i/8)*width/8,width:width/8,height:width/8}}/>)}
  </View>
 </View>;
}
function Experience(){
 useGameAudio(controller);
 const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
 const insets=useSafeAreaInsets(),{width:screenWidth,height:screenHeight}=useWindowDimensions();
 const layout=screenMetrics(screenWidth,Math.max(1,screenHeight-insets.top-insets.bottom)),width=layout.contentWidth;
 const [boardBounds,setBoardBounds]=useState({width:0,height:0});
 const boardSize=fitBoardSize(boardBounds.width,boardBounds.height);
 const measureBoard=event=>{const {width,height}=event.nativeEvent.layout;setBoardBounds(old=>old.width===width&&old.height===height?old:{width,height});};
 const [systemReduce,setSystemReduce]=useState(false);
 const {session}=state,p=session.profile,g=session.game,lang=p.language,tr=(key,values)=>t(lang,key,values);
 const reduce=p.reducedMotion||systemReduce;
 useEffect(()=>{
  let mounted=true;
  const stopRuntime=attachNativeRuntime({controller,appState:AppState,platform:Platform.OS});
  controller.initialize();
  AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(mounted)setSystemReduce(value);}).catch(()=>{});
  const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',setSystemReduce);
  const back=BackHandler.addEventListener('hardwareBackPress',()=>controller.back());
  return()=>{mounted=false;stopRuntime();motion.remove();back.remove();};
 },[]);
 // Respect the platform animation preference, including when it changes while playing.
 useEffect(()=>{controller.setSystemReducedMotion(systemReduce);},[systemReduce]);
 const active=state.screen==='game',world=g&&active?g.world:state.world,w=WORLDS[world],done=completedIn(p,world),restoration=restorationFor(p,world);
 const subtitle=state.notice?tr(state.notice):session.protectedAttempt?tr('protected'):'';
 const progress=<View style={styles.progress}><View style={[styles.progressFill,{width:`${done/40*100}%`}]}/></View>;
 const heading=(eyebrow,title)=><View style={layout.tablet&&styles.tabletHeading}><Text style={[styles.eyebrow,layout.tablet&&styles.tabletEyebrow]}>{eyebrow}</Text><Text style={[styles.headline,layout.tablet&&styles.tabletHeadline]}>{title}</Text></View>;
 const footer=<View style={styles.nav}>{[['home','capsule','explore'],['atlas','atlas','atlas'],['treasures','gift','treasures']].map(([screen,icon,label])=><Pressable key={screen} accessibilityRole="tab" accessibilityState={{selected:state.screen===screen}} onPress={()=>controller.navigate(screen)} style={styles.navItem}><Icon name={icon} size={28} color={state.screen===screen?palette.gold:palette.muted}/><Text style={[styles.navText,state.screen===screen&&{color:palette.gold}]}>{tr(label)}</Text></Pressable>)}</View>;
 function renderScreen(){
  if(state.screen==='home')return <>
   {heading(tr('tagline'),tr('headline'))}
   <View style={styles.domeRegion}><Dome world={world} progress={done/40} size={layout.domeSize} reduce={reduce}/></View>
   <View style={styles.row}><Text style={styles.title}>{w[lang]}</Text><Text style={styles.badge}>{tr('world')} {world+1}/12</Text></View>
   <Text style={styles.muted}>{tr('restoration')}</Text>{progress}
   <View style={styles.row}><Text style={styles.caption}>{done===40?tr('worldComplete'):tr('nextDetail',{n:restoration.remaining})}</Text><Text style={styles.caption}>{done}/40</Text></View>
   <Restoration profile={p} world={world} tr={tr}/>
   <Action style={styles.mainPlay} icon="play" label={`${tr(g?.status==='playing'?'resume':'play')}  \u2605  ${tr('level')} ${g?.status==='playing'?g.levelId:p.unlocked}`} onPress={()=>controller.play()}/>
   <Text style={styles.fine}>{tr('offline')}  /  {tr('alpha')}</Text>
  </>;
  if(state.screen==='atlas')return <>{heading(tr('atlasIntro'),tr('allWorlds'))}<View style={styles.cards}>{WORLDS.map((item,i)=>{const count=completedIn(p,i),size=(width-12*(layout.columns-1))/layout.columns;return <Pressable key={i} accessibilityRole="button" accessibilityLabel={`${item[lang]}, ${count}/40`} onPress={()=>controller.world(i)} style={[styles.worldCard,{width:size}]}><Dome world={i} progress={count/40} size={size-8} reduce={reduce}/><Text style={styles.cardTitle}>{item[lang]}</Text><Text style={styles.caption}>{p.unlocked<i*40+1?tr('unlocks',{n:i*40+1}):`${count}/40`}</Text></Pressable>;})}</View></>;
  if(state.screen==='levels')return <>
   <View style={styles.row}><Circle label={tr('atlas')} icon="back" onPress={()=>controller.navigate('atlas')}/><Text style={styles.title}>{w[lang]}</Text><View style={{width:44}}/></View>
   <View style={styles.domeRegion}><Dome world={world} progress={done/40} size={layout.domeSize} reduce={reduce}/></View><Restoration profile={p} world={world} tr={tr}/><Text style={styles.eyebrow}>{tr('chooseLevel')}</Text>
   <View style={styles.levels}>{Array.from({length:40},(_,i)=>{const id=world*40+i+1,locked=id>p.unlocked;return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`${tr('level')} ${id}${locked?`, ${tr('locked')}`:''}`} accessibilityState={{disabled:locked}} disabled={locked} onPress={()=>controller.play(id)} style={[styles.level,{width:(width-10*(layout.levelColumns-1))/layout.levelColumns},id===p.unlocked&&styles.currentLevel,locked&&styles.disabled]}><Text style={[styles.levelNumber,id===p.unlocked&&{color:palette.ink}]}>{id}</Text><Text style={styles.stars}>{p.stars[id]?'\u2605'.repeat(p.stars[id]):''}</Text></Pressable>;})}</View>
  </>;
  if(active&&g){const shown=state.visual||g;return <View style={[styles.gameScreen,{paddingHorizontal:layout.padding}]} testID="game-screen">
   <View style={styles.row}><Circle label={tr('pause')} icon="back" onPress={()=>controller.pause()}/><View style={styles.center}><Text style={styles.eyebrow}>{w[lang]}</Text><Text style={styles.title}>{tr('level')} {g.levelId}</Text></View><Circle label={tr('pause')} icon="pause" onPress={()=>controller.pause()}/></View>
   {screenHeight>=720&&<View style={[styles.miniBanner,styles.gameBanner,layout.tablet&&styles.tabletGameBanner]}><Art xml={domeSvg(world,done/40)} size={layout.tablet?96:64} height={layout.tablet?88:60}/><Text style={[styles.muted,{flex:1}]}>{tr(g.levelId<=3?'tutorial':`${w.wonder}Help`)}</Text></View>}
   <View style={[styles.row,{marginBottom:8}]}><View style={styles.moves}><Text style={styles.movesNumber}>{g.moves}</Text><Text style={styles.movesLabel}>{tr('moves').toUpperCase()}</Text></View><View style={styles.targets}>{g.targets.map((target,i)=><View key={i} style={styles.target} accessibilityLabel={target.kind==='frost'?tr('frostGoal',{n:target.amount}):tr('collect',{n:target.amount,shape:tr(SHAPES[target.color])})}>{target.kind==='frost'?<Icon name="frost" size={32}/>:<Art xml={gemSvg({color:target.color,special:''})} size={36}/>}<Text style={styles.targetText}>{goalProgress(g,target)}/{target.amount}</Text></View>)}</View></View>
   <View style={styles.boardRegion} onLayout={measureBoard} testID="board-region">{boardSize>0&&<Board state={state} width={boardSize} tr={tr}/>}</View>
   <Text style={styles.gameNotice} accessibilityLiveRegion="polite">{state.wonder?tr('wonderSelect'):subtitle||' '}</Text>
   <View style={styles.row}><Action style={{flex:1}} secondary icon="star" disabled={shown.charge<100||shown.wonderUsed||state.busy} label={`${tr('wonder')}  ${shown.wonderUsed?'\u2605':`${Math.floor(shown.charge)}%`}`} onPress={()=>controller.wonder()}/><Circle label={tr('hint')} icon="hint" onPress={()=>controller.hint()}/></View>
   <Text style={[styles.caption,styles.gameRules]} numberOfLines={2}>{tr('rulesBody')}</Text>
  </View>;}
  if(state.screen==='treasures')return <>
   {heading(tr('inventory'),tr('treasures'))}<View style={styles.giftCard}><Icon name="gift" size={52} color={palette.gold}/><Text style={styles.title}>{tr('gift')}</Text><Text style={styles.muted}>{tr('giftBody')}</Text><Action label={tr(p.inventory.time10?'activate':'giftUsed')} disabled={!p.inventory.time10} onPress={()=>controller.activate('time10')}/></View>
   <View style={styles.panel}><Text style={styles.title}>{tr('reserveLives')}</Text><Text style={styles.bigClock} accessibilityLabel={tr('reserveCount',{n:p.reserveLives})}>{p.reserveLives}</Text><Text style={styles.muted}>{tr('reserveBody')}</Text></View>
   {[['lives5','packLives'],['time60','packHour'],['time240','packFour']].filter(([key])=>p.inventory[key]>0).map(([key,label])=><View style={styles.panel} key={key}><Text style={styles.eyebrow}>{tr('ownedPacks')}</Text><Text style={styles.title}>{tr(label)}</Text><Text style={styles.muted}>{tr('packCount',{n:p.inventory[key]})}</Text><Action label={tr('activate')} onPress={()=>controller.activate(key)}/></View>)}
   <View style={styles.panel}><Text style={styles.eyebrow}>{tr('activeTime')}</Text><Text style={styles.bigClock}>{clock(p.unlimitedSeconds)}</Text><Text style={styles.muted}>{tr('timeRule')}</Text></View>
   <Text style={styles.title}>{tr('futureShop')}</Text><Text style={styles.muted}>{tr('shopNotice')}</Text>
   {['packLives','packHour','packFour'].map(key=><View style={styles.shopRow} key={key}><Text style={styles.label}>{tr(key)}</Text><Text style={styles.caption}>{tr('notAvailable')}</Text></View>)}
  </>;
  if(state.screen==='settings')return <>
   {heading(tr('alpha'),tr('settings'))}<View style={styles.panel}><Text style={styles.title}>{tr('language')}</Text><View style={styles.row}>{['de','en'].map(code=><Action key={code} style={{flex:1}} small secondary={lang!==code} label={tr(code==='de'?'german':'english')} onPress={()=>controller.preference('language',code)}/>)}</View></View>
   {[['sound','sound'],['reducedMotion','motion'],['haptics','haptics']].map(([key,label])=><Pressable accessibilityRole="switch" accessibilityState={{checked:p[key]}} accessibilityLabel={tr(label)} key={key} onPress={()=>controller.preference(key,!p[key])} style={styles.setting}><Text style={styles.label}>{tr(label)}</Text><View style={[styles.switch,p[key]&&styles.switchOn]}><View style={[styles.switchKnob,p[key]&&{alignSelf:'flex-end'}]}/></View></Pressable>)}
   <View style={styles.panel}><Text style={styles.muted}>{tr('localPrivacy')}</Text></View>
  </>;
  return null;
 }
 function modalContent(){
  if(state.modal==='result'&&g){const won=g.status==='won';return <><Art xml={domeSvg(world,done/40)} size={Math.min(width-44,270)} height={190}/><Text style={styles.modalTitle}>{tr(won?(g.levelId===480?'campaignWon':'won'):'lost')}</Text>{won&&<Text style={styles.winStars}>{'\u2605'.repeat(starsFor(g))}</Text>}{won&&state.milestone&&<View style={styles.restorationCard}><Text style={styles.eyebrow}>{tr('milestoneWon')}</Text><Text style={styles.title}>{tr(state.milestone.detail)}</Text></View>}<Text style={styles.muted}>{tr(won?(g.levelId===480?'campaignBody':'wonBody'):'lostBody')}</Text><Action label={tr(won?'next':'retry')} icon="play" onPress={()=>won?controller.next():controller.retry()}/><Action secondary label={tr('backWorld')} onPress={()=>controller.navigate('home')}/></>;}
  if(state.modal==='pause')return <><Icon name="pause" size={42} color={palette.gold}/><Text style={styles.modalTitle}>{tr('pause')}</Text><Text style={styles.muted}>{tr('pauseBody')}</Text><Action label={tr('resume')} icon="play" onPress={()=>controller.resume()}/><Action secondary label={tr('backWorld')} onPress={()=>controller.navigate('home')}/><Action secondary label={tr('abandon')} onPress={()=>controller.requestAbandon()}/></>;
  if(state.modal==='abandon')return <><Text style={styles.modalTitle}>{tr('abandonTitle')}</Text><Text style={styles.muted}>{tr(session.protectedAttempt?'protectedBody':'abandonBody')}</Text><Action label={tr('cancel')} onPress={()=>controller.pause()}/><Action secondary label={tr('confirm')} onPress={()=>controller.abandon()}/></>;
  if(state.modal==='noLives')return <><Icon name="heart" color="#efb5ac" size={48}/><Text style={styles.modalTitle}>{tr('noLives')}</Text><Text style={styles.bigClock}>{clock(remainingLifeSeconds(p,Date.now()))}</Text><Text style={styles.muted}>{tr('noLivesBody')}</Text><Action label={tr('treasures')} onPress={()=>controller.navigate('treasures')}/><Action secondary label={tr('close')} onPress={()=>controller.closeModal()}/></>;
  return null;
 }
 return <View style={[styles.background,{paddingTop:insets.top,paddingBottom:insets.bottom}]}><StatusBar barStyle="light-content"/>
  <View style={styles.shell} importantForAccessibility={state.modal?'no-hide-descendants':'auto'} accessibilityElementsHidden={Boolean(state.modal)}>{!active&&<View style={[styles.header,layout.tablet&&styles.tabletHeader]}><Icon name="capsule" color={palette.gold} size={26}/><Text style={styles.brand} numberOfLines={1}>WUNDERKAPSELN</Text><Pressable accessibilityRole="button" accessibilityLabel={`${p.lives} ${tr('lives')}, ${tr('reserveCount',{n:p.reserveLives})}`} onPress={()=>controller.navigate('treasures')} style={styles.hearts}><Icon name="heart" color="#efb5ac" size={20}/><Text style={styles.heartCount}>{p.lives}/5{p.reserveLives>0?` +${p.reserveLives}`:''}</Text>{p.unlimitedSeconds>0&&<Text style={styles.timer}>{clock(p.unlimitedSeconds)}</Text>}</Pressable><Circle label={tr('settings')} icon="settings" onPress={()=>controller.navigate('settings')}/></View>}
   {(state.saveError||['recovered','corrupt','packCapacity','notAvailable'].includes(state.notice))&&<Text accessibilityRole="alert" style={styles.alert}>{tr(state.saveError?'saveError':state.notice)}</Text>}
   <ScreenFrame active={active} busy={state.busy} gameStyle={styles.gameFrame} contentStyle={[styles.content,{paddingHorizontal:layout.padding},layout.tablet&&state.screen==='home'&&styles.tabletHomeContent]} key={`${state.screen}-${world}`}>{state.loaded?renderScreen():state.loadError?<View style={styles.panel} accessibilityRole="alert"><Text style={styles.title}>{tr('saveTitle')}</Text><Text style={styles.muted}>{tr(state.loadError)}</Text><Text style={styles.muted}>{tr('saveProtected')}</Text><Action label={tr('loadRetry')} onPress={()=>controller.initialize()}/></View>:<Text style={styles.fine}>{tr('loading')}</Text>}</ScreenFrame>
   {state.loaded&&!active&&footer}
  </View>
  <GameModal visible={Boolean(state.modal)} transparent animationType={reduce?'none':'fade'} onRequestClose={()=>controller.back()}><View style={[styles.scrim,{paddingTop:insets.top,paddingBottom:insets.bottom}]}><View accessibilityViewIsModal style={styles.modal}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalInner}>{modalContent()}</ScrollView></View></View></GameModal>
 </View>;
}
export default function App(){return <SafeAreaProvider><Experience/></SafeAreaProvider>;}
const styles=StyleSheet.create({
 gameFrame:{flex:1,overflow:'hidden'},gameScreen:{flex:1,paddingTop:6,paddingBottom:8},
 boardRegion:{flex:1,minHeight:0,alignItems:'center',justifyContent:'center'},
 gameBanner:{marginVertical:8,minHeight:60},tabletGameBanner:{minHeight:88,marginVertical:12},
 gameRules:{textAlign:'center',marginTop:6},domeRegion:{alignItems:'center',justifyContent:'center'},
 tabletHeader:{minHeight:88,paddingHorizontal:24},tabletHomeContent:{flexGrow:1},
 tabletHeading:{paddingTop:12},tabletHeadline:{fontSize:46,lineHeight:52,marginBottom:16},
 tabletEyebrow:{fontSize:13,letterSpacing:3},

 restorationCard:{marginTop:12,gap:8},milestoneTrack:{flexDirection:'row',gap:6},milestoneDot:{height:5,flex:1,borderRadius:4,backgroundColor:palette.line},milestoneActive:{backgroundColor:palette.gold},
 background:{flex:1,backgroundColor:palette.bg},shell:{width:'100%',alignSelf:'stretch',flex:1},header:{minHeight:70,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:9},brand:{color:palette.cream,fontSize:12,letterSpacing:2,fontWeight:'800',flex:1},hearts:{flexDirection:'row',gap:5,alignItems:'center',backgroundColor:palette.panel,borderRadius:25,paddingHorizontal:9,minHeight:40,flexWrap:'wrap',maxWidth:110},heartCount:{color:palette.cream,fontSize:14,fontWeight:'800'},timer:{color:palette.gold,fontSize:10},circle:{width:44,height:44,borderRadius:24,borderWidth:1,borderColor:palette.line,justifyContent:'center',alignItems:'center'},content:{padding:18,paddingBottom:28},headline:{color:palette.cream,fontSize:34,lineHeight:39,fontWeight:'800',letterSpacing:-1,marginBottom:10},eyebrow:{color:'#bad0c7',fontSize:10,letterSpacing:2,fontWeight:'700',marginBottom:8,marginTop:8},title:{color:palette.cream,fontSize:22,fontWeight:'800',flexShrink:1},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},center:{alignItems:'center'},muted:{color:palette.muted,fontSize:14,lineHeight:21,marginVertical:8},caption:{color:palette.muted,fontSize:11,lineHeight:17,flexShrink:1},badge:{color:palette.gold,borderColor:palette.line,borderWidth:1,borderRadius:18,paddingHorizontal:10,paddingVertical:6,fontSize:11},progress:{height:5,borderRadius:3,backgroundColor:palette.line,marginVertical:12,overflow:'hidden'},progressFill:{height:5,backgroundColor:palette.gold},action:{minHeight:54,borderRadius:23,paddingHorizontal:18,paddingVertical:13,backgroundColor:palette.gold,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,borderBottomWidth:5,borderColor:'#b0874d'},actionText:{color:palette.ink,fontSize:17,fontWeight:'800',textAlign:'center',flexShrink:1},secondary:{backgroundColor:palette.panel,borderWidth:1,borderBottomWidth:1,borderColor:palette.line},secondaryText:{color:palette.cream,fontSize:15},small:{minHeight:48,paddingHorizontal:12},pressed:{opacity:.8,transform:[{translateY:1}]},disabled:{opacity:.45},mainPlay:{marginTop:18,minHeight:65},fine:{fontSize:10,letterSpacing:1,color:palette.muted,textAlign:'center',marginVertical:16},nav:{flexDirection:'row',borderTopColor:palette.line,borderTopWidth:1,paddingVertical:12},navItem:{flex:1,alignItems:'center',gap:5,minHeight:48},navText:{color:palette.muted,fontSize:11},cards:{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:16},worldCard:{backgroundColor:palette.panel,borderRadius:24,padding:4,paddingBottom:16,alignItems:'center'},cardTitle:{color:palette.cream,fontSize:15,fontWeight:'700',textAlign:'center',marginBottom:6},levels:{flexDirection:'row',flexWrap:'wrap',gap:10,marginVertical:18},level:{height:62,borderRadius:20,backgroundColor:palette.panel,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:palette.line},currentLevel:{backgroundColor:palette.gold},levelNumber:{fontSize:19,color:palette.cream,fontWeight:'800'},stars:{color:'#edbb63',fontSize:20,height:20,lineHeight:20},miniBanner:{backgroundColor:'#315853',borderRadius:24,flexDirection:'row',alignItems:'center',paddingRight:12,marginVertical:15,overflow:'hidden'},moves:{width:70,minHeight:66,alignItems:'center',justifyContent:'center',backgroundColor:palette.gold,borderRadius:22},movesNumber:{fontSize:32,color:palette.ink,fontWeight:'800'},movesLabel:{fontSize:9,color:palette.ink,letterSpacing:1},targets:{flex:1,minHeight:66,flexDirection:'row',gap:12,alignItems:'center',flexWrap:'wrap',padding:10,borderRadius:24,borderWidth:1,borderColor:palette.line},target:{flexDirection:'row',gap:3,alignItems:'center'},targetText:{color:palette.cream,fontSize:14,fontWeight:'800'},board:{borderRadius:22,overflow:'hidden',alignSelf:'center',backgroundColor:'#092d37'},gameNotice:{minHeight:37,textAlign:'center',color:palette.gold,fontSize:12,lineHeight:18,paddingTop:9},rules:{textAlign:'center',marginTop:20},giftCard:{gap:12,backgroundColor:palette.panel,padding:22,borderRadius:28,marginVertical:16},panel:{padding:20,borderRadius:24,backgroundColor:palette.panel,marginVertical:16,gap:8},bigClock:{color:palette.gold,fontSize:38,fontWeight:'800'},shopRow:{padding:17,borderRadius:20,borderWidth:1,borderColor:palette.line,marginTop:12,gap:6},label:{color:palette.cream,fontSize:15,flexShrink:1},setting:{flexDirection:'row',gap:20,alignItems:'center',justifyContent:'space-between',paddingVertical:20,borderBottomColor:palette.line,borderBottomWidth:1},switch:{width:48,height:28,borderRadius:16,backgroundColor:palette.line,padding:3},switchOn:{backgroundColor:palette.gold},switchKnob:{height:22,width:22,borderRadius:12,backgroundColor:palette.cream},scrim:{flex:1,backgroundColor:'#031c26dd',alignItems:'center',justifyContent:'center',paddingHorizontal:20},modal:{width:'100%',maxWidth:410,maxHeight:'90%',backgroundColor:palette.panel,borderRadius:32,borderWidth:1,borderColor:palette.line},modalInner:{padding:25,gap:14,alignItems:'stretch'},modalTitle:{fontSize:28,fontWeight:'800',color:palette.cream},winStars:{color:palette.gold,fontSize:44,lineHeight:56,letterSpacing:14},alert:{color:'#ffccc1',backgroundColor:'#4c373e',padding:12,fontSize:12,lineHeight:18},
});
