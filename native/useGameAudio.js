import { createNativePlayerAdapter } from './player-adapter.mjs';
import { useEffect } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { createFeedbackDriver } from '../core/feedback.mjs';
import { createVoicePool } from '../core/voice-pool.mjs';

// Static sources are resolved by Metro. Every hook is called unconditionally.
// Hook-owned native players are released on unmount; no microphone is requested.
export function useGameAudio(controller) {
  const match = useAudioPlayer(require('../assets/audio/match.wav'));
  const combo = useAudioPlayer(require('../assets/audio/combo.wav'));
  const wonder = useAudioPlayer(require('../assets/audio/wonder.wav'));
  const win = useAudioPlayer(require('../assets/audio/win.wav'));
  const lost = useAudioPlayer(require('../assets/audio/lost.wav'));
  const rocket = useAudioPlayer(require('../assets/audio/rocket.wav'));
  const bomb = useAudioPlayer(require('../assets/audio/bomb.wav'));
  const prism = useAudioPlayer(require('../assets/audio/prism.wav'));
  const mega = useAudioPlayer(require('../assets/audio/mega.wav'));
  const wind = useAudioPlayer(require('../assets/audio/wind.wav'));
  const tide = useAudioPlayer(require('../assets/audio/tide.wav'));
  const bloom = useAudioPlayer(require('../assets/audio/bloom.wav'));
  const charge = useAudioPlayer(require('../assets/audio/charge.wav'));
  const restoration = useAudioPlayer(require('../assets/audio/restoration.wav'));
  useEffect(() => {
    const players = { match, combo, wonder, win, lost, rocket, bomb, prism, mega, wind, tide, bloom, charge, restoration };
    const configured = setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false,
      allowsRecording: false, interruptionMode: 'mixWithOthers' }).then(() => true, () => false);
    const adapter = createNativePlayerAdapter(players, { configured });
    const pool = createVoicePool(adapter);
    const driver = createFeedbackDriver(pool);
    const update = () => { void driver.update(controller.getSnapshot(), controller.foreground); };
    const unsubscribe = controller.subscribe(update); update();
    return () => { unsubscribe(); driver.dispose(); pool.dispose(); adapter.dispose(); };
  }, [controller, match, combo, wonder, win, lost, rocket, bomb, prism, mega, wind, tide, bloom, charge, restoration]);
}
