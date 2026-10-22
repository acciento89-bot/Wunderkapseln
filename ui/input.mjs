/** Convert local native coordinates into a stable, bounded 8x8 tile index. */
export function tileAt(x,y,width){
 if(![x,y,width].every(Number.isFinite)||width<=0||x<0||y<0||x>=width||y>=width)return -1;
 return Math.floor(y/width*8)*8+Math.floor(x/width*8);
}
/** A deliberate swipe moves one neighbour; a short gesture stays a tap. */
export function gestureTarget(index,dx,dy,width){
 if(!Number.isInteger(index)||index<0||index>63||![dx,dy,width].every(Number.isFinite)||width<=0)return -1;
 if(Math.max(Math.abs(dx),Math.abs(dy))<width/8*.3)return index;
 const x=index%8,y=Math.floor(index/8),horizontal=Math.abs(dx)>Math.abs(dy);
 const nx=x+(horizontal?Math.sign(dx):0),ny=y+(horizontal?0:Math.sign(dy));
 return nx<0||nx>7||ny<0||ny>7?-1:ny*8+nx;
}
