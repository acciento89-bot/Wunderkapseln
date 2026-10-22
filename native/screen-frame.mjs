/** Gameplay must have no scroll recognizer competing with tile swipes. */
export function createScreenFrame({createElement,View,ScrollView}){
 return function ScreenFrame({active,busy,children,gameStyle,contentStyle}){
  if(active)return createElement(View,{testID:'game-frame',style:gameStyle},children);
  return createElement(ScrollView,{testID:'menu-scroll',style:{flex:1},
   contentContainerStyle:contentStyle,scrollEnabled:!busy,bounces:false,
   alwaysBounceVertical:false,overScrollMode:'never',showsVerticalScrollIndicator:false},children);
 };
}
