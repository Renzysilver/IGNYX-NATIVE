// IGNYX useAudio Hook — Module 07
// Bridges Zustand game state to the AudioEngine service.
// Components use this hook to trigger sounds without importing the service directly.
// The AudioEngine React component handles automatic state syncing — this hook is for manual triggers.

import { useCallback, useRef } from 'react';
import {
  playSound,
  playGlitchShort,
  playGlitchLong,
  playAlert,
  playSuccess,
  playFail,
  playTimerWarning,
  playKeystroke,
  playBootFlicker,
  playDesignation,
  updateAmbient,
  pauseAmbientForEditor,
  resumeAmbientFromEditor,
  setSoundEnabled as setEngineSoundEnabled,
  setMasterVolume as setEngineMasterVolume,
  initializeAudioEngine,
  teardownAudioEngine,
  getAudioEngineState,
} from '../services/AudioEngine';
import type { SoundId } from '../constants/sounds';
import type { GameState } from '../constants/gameState';
import { useGameStore } from '../store/useGameStore';

// ─── Keystroke throttle ────────────────────────────────────────

const KEYSTROKE_MIN_INTERVAL = 50; // ms between keystroke sounds

// ─── Hook Return Type ──────────────────────────────────────────

interface UseAudioReturn {
  // One-shot sounds
  play: (soundId: SoundId) => void;
  playGlitchShort: () => void;
  playGlitchLong: () => void;
  playAlert: () => void;
  playSuccess: () => void;
  playFail: () => void;
  playTimerWarning: () => void;
  playKeystroke: () => void;
  playBootFlicker: () => void;
  playDesignation: () => void;

  // Ambient management
  updateAmbient: (gameState: GameState) => void;
  pauseAmbientForEditor: () => void;
  resumeAmbientFromEditor: () => void;

  // Settings
  setSoundEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;

  // Lifecycle
  initialize: () => void;
  teardown: () => void;

  // State query
  getEngineState: () => ReturnType<typeof getAudioEngineState>;

  // Throttled keystroke (won't fire more than once per 50ms)
  playKeystrokeThrottled: () => void;
}

// ─── Hook ──────────────────────────────────────────────────────

export const useAudio = (): UseAudioReturn => {
  const lastKeystrokeRef = useRef(0);

  // Throttled keystroke — prevents audio spam during fast typing
  const playKeystrokeThrottled = useCallback(() => {
    const now = Date.now();
    if (now - lastKeystrokeRef.current >= KEYSTROKE_MIN_INTERVAL) {
      lastKeystrokeRef.current = now;
      playKeystroke();
    }
  }, []);

  return {
    // One-shot sounds
    play: playSound,
    playGlitchShort,
    playGlitchLong,
    playAlert,
    playSuccess,
    playFail,
    playTimerWarning,
    playKeystroke,
    playBootFlicker,
    playDesignation,

    // Ambient management
    updateAmbient,
    pauseAmbientForEditor,
    resumeAmbientFromEditor,

    // Settings
    setSoundEnabled: setEngineSoundEnabled,
    setMasterVolume: setEngineMasterVolume,

    // Lifecycle
    initialize: initializeAudioEngine,
    teardown: teardownAudioEngine,

    // State query
    getEngineState: getAudioEngineState,

    // Throttled
    playKeystrokeThrottled,
  };
};
