/** Cosmetic playback only: no clock, RNG, gameplay, purchase or reward operations. */
export function musicAllowed({campaign,rescue,inRescue,foreground}) {
  if (!foreground || !campaign.loaded || campaign.session.profile.music === false) return false;
  if (inRescue) return Boolean(rescue.loaded && !rescue.error && (rescue.screen === 'list' || !rescue.paused));
  return !campaign.modal;
}

/** A hook owns the native player. We only play/pause it; never release it here. */
export function createMusicDriver(player,{configured=Promise.resolve(true)}={}) {
  let wanted=false,playing=false,disposed=false,generation=0;
  const pause=()=>{try {player.pause();} catch {/* Native output may already be gone. */} playing=false;};
  // Android may restore native playback on foreground return after our earlier
  // AppState pause. Enforce the current policy without rerendering the game.
  const statusSubscription=typeof player.addListener==='function'
    ?player.addListener('playbackStatusUpdate',status=>{
      if(!disposed&&status.playing&&(!wanted||!playing))pause();
    }):null;
  return {
    async update(allowed) {
      if (disposed) return false;
      const next=Boolean(allowed);
      if (next===wanted) return playing;
      wanted=next;const request=++generation;
      if (!next) {pause();return false;}
      try {
        if (!await configured || disposed || !wanted || request!==generation) return false;
        player.loop=true;player.volume=0.18;playing=true;player.play();return true;
      } catch {playing=false;return false;}
    },
    dispose(){if(disposed)return;disposed=true;wanted=false;generation++;
      try{statusSubscription?.remove();}catch{/* Hook teardown may already have removed native output. */}
      pause();},
  };
}
