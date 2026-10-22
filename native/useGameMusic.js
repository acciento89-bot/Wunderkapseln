import {useEffect} from 'react';
import {useAudioPlayer,setAudioModeAsync} from 'expo-audio';
import {createMusicDriver,musicAllowed} from './music-driver.mjs';

export function useGameMusic(campaign,rescue,inRescue) {
  const player=useAudioPlayer(require('../assets/music/wonder-garden.wav'));
  useEffect(()=>{
    const configured=setAudioModeAsync({playsInSilentMode:false,shouldPlayInBackground:false,
      allowsRecording:false,interruptionMode:'mixWithOthers'}).then(()=>true,()=>false);
    const driver=createMusicDriver(player,{configured});
    const update=()=>{
      const selected=inRescue?rescue:campaign;
      void driver.update(musicAllowed({campaign:campaign.getSnapshot(),rescue:rescue.getSnapshot(),
        inRescue,foreground:selected.foreground}));
    };
    const stopCampaign=campaign.subscribe(update),stopRescue=rescue.subscribe(update);update();
    return()=>{stopCampaign();stopRescue();driver.dispose();};
  },[campaign,rescue,inRescue,player]);
}
