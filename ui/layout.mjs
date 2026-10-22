/** Safe-area dimensions are provided by the native caller. No fixed phone-width cap. */
export function screenMetrics(width,height){
 if(![width,height].every(Number.isFinite)||width<=0||height<=0)throw new RangeError('invalid_viewport');
 const tablet=width>=700,padding=tablet?24:18,contentWidth=Math.max(0,width-padding*2);
 return {tablet,padding,contentWidth,columns:tablet?(width>=1200?4:3):2,
  domeSize:tablet?Math.min(contentWidth,Math.max(0,height-600)):contentWidth,
  levelColumns:tablet?8:5};
}
/** Fit the board inside its measured flex region; use whole-pixel tile sizes. */
export function fitBoardSize(width,height){
 if(![width,height].every(Number.isFinite)||width<=0||height<=0)return 0;
 return Math.floor(Math.min(width,height)/8)*8;
}
