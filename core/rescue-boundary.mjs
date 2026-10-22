// Runtime focus is routed to one mode. Campaign ticks never spend paid time inside rescue.
export function createRescueBoundary(campaign,rescue){
 let active=false,foreground=true;
 return {
  enter(){active=true;campaign.setForeground(false);rescue.setForeground(foreground);},
  leave(){rescue.setForeground(false);rescue.leave();active=false;campaign.setForeground(foreground);},
  setForeground(value){foreground=value;campaign.setForeground(value&&!active);rescue.setForeground(value&&active);},
  tick(){if(active)rescue.tick();else campaign.tick();},
 };
}
