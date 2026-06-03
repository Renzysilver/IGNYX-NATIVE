// IGNYX Audio Engine — Module 07
// The system breathes through sound. Circuit hum. Glitch crackle. Warning pulse.
// When the editor has focus, the system holds its breath.
// This is a singleton service — import and use everywhere.

import { Audio } from 'expo-av';
import { SOUNDS, CATEGORY_VOLUMES, getAmbientForState } from '../constants/sounds';
import type { SoundId, SoundCategory } from '../constants/sounds';
import type { GameState } from '../constants/gameState';

// ─── Engine State ──────────────────────────────────────────────

interface EngineState {
  initialized: boolean;
  soundEnabled: boolean;
  masterVolume: number;
  categoryVolumes: Record<SoundCategory, number>;
  loadedSounds: Map<SoundId, Audio.Sound>;
  currentAmbient: SoundId | null;
  currentGameState: GameState;
  isEditorFocused: boolean;
  ambientPaused: boolean;
}

const state: EngineState = {
  initialized: false,
  soundEnabled: true,
  masterVolume: 0.7,
  categoryVolumes: { ...CATEGORY_VOLUMES },
  loadedSounds: new Map(),
  currentAmbient: null,
  currentGameState: 'normal',
  isEditorFocused: false,
  ambientPaused: false,
};

// ─── Initialization ────────────────────────────────────────────

/**
 * Initialize the audio engine. Call once on app startup.
 * Sets audio mode and preloads all sound effects.
 */
export const initializeAudioEngine = async (): Promise<void> => {
  if (state.initialized) return;

  try {
    // Configure audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,    // Play even with silent switch
      interruptionModeIOS: 1,        // Duck others
      interruptionModeAndroid: 1,    // Duck others
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Preload all sounds
    const loadPromises = Object.values(SOUNDS).map(async (def) => {
      try {
        const { sound } = await Audio.Sound.createAsync(def.file, {
          shouldPlay: false,
          isLooping: def.loop,
          volume: calculateVolume(def.id, def.volume),
        });
        state.loadedSounds.set(def.id, sound);
      } catch (e) {
        // Silent fail — audio is nice-to-have, not critical
        console.warn(`[IGNYX Audio] Failed to load ${def.id}:`, e);
      }
    });

    await Promise.all(loadPromises);
    state.initialized = true;
  } catch (e) {
    console.warn('[IGNYX Audio] Initialization failed:', e);
  }
};

/**
 * Teardown the audio engine. Call on app unmount.
 */
export const teardownAudioEngine = async (): Promise<void> => {
  // Stop and unload all sounds
  for (const [id, sound] of state.loadedSounds) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (e) {
      // Silent
    }
  }
  state.loadedSounds.clear();
  state.currentAmbient = null;
  state.initialized = false;
};

// ─── Volume Calculation ────────────────────────────────────────

/**
 * Calculate effective volume for a sound.
 * masterVolume × categoryVolume × soundVolume
 */
const calculateVolume = (soundId: SoundId, baseVolume: number): number => {
  const def = SOUNDS[soundId];
  if (!def) return 0;
  const catVol = state.categoryVolumes[def.category] ?? 1;
  return state.masterVolume * catVol * baseVolume;
};

// ─── Volume Fade Helper ────────────────────────────────────────

/**
 * Smoothly fade volume from `from` to `to` over `durationMs`.
 * expo-av doesn't support native volume fading, so we step it manually.
 */
const fadeVolume = (
  sound: Audio.Sound,
  from: number,
  to: number,
  durationMs: number,
): Promise<void> => {
  return new Promise((resolve) => {
    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeStep = (to - from) / steps;
    let currentStep = 0;

    const interval = setInterval(async () => {
      currentStep++;
      const vol = from + volumeStep * currentStep;
      try {
        await sound.setVolumeAsync(Math.max(0, Math.min(1, vol)));
      } catch (e) {
        // Silent
      }
      if (currentStep >= steps) {
        clearInterval(interval);
        resolve();
      }
    }, stepDuration);
  });
};

// ─── Play Sound ────────────────────────────────────────────────

/**
 * Play a one-shot sound effect.
 * Safe to call rapidly — handles re-triggering gracefully.
 */
export const playSound = async (soundId: SoundId): Promise<void> => {
  if (!state.initialized || !state.soundEnabled) return;

  const sound = state.loadedSounds.get(soundId);
  if (!sound) return;

  try {
    // For one-shot sounds, reset to beginning
    await sound.stopAsync();
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(calculateVolume(soundId, SOUNDS[soundId].volume));
    await sound.playAsync();
  } catch (e) {
    // Silent — sound is not critical
  }
};

// ─── Ambient Sound Management ──────────────────────────────────

/**
 * Start or transition the ambient circuit hum based on game state.
 * Transitions crossfade: old hum fades out, new hum fades in.
 */
export const updateAmbient = async (gameState: GameState): Promise<void> => {
  if (!state.initialized || !state.soundEnabled) {
    // If sound is disabled, stop any playing ambient
    if (state.currentAmbient) {
      await stopAmbient();
    }
    return;
  }

  state.currentGameState = gameState;
  const targetSound = getAmbientForState(gameState);

  // Already playing the right ambient
  if (state.currentAmbient === targetSound && !state.ambientPaused) return;

  // Crossfade to new ambient
  const oldAmbient = state.currentAmbient;
  state.currentAmbient = targetSound;

  // Fade out old
  if (oldAmbient && oldAmbient !== targetSound) {
    const oldSound = state.loadedSounds.get(oldAmbient);
    if (oldSound) {
      try {
        const def = SOUNDS[oldAmbient];
        const fadeOutMs = def.fadeOut ?? 1000;
        await oldSound.stopAsync();
      } catch (e) {
        // Silent
      }
    }
  }

  // Fade in new
  const newSound = state.loadedSounds.get(targetSound);
  if (newSound) {
    try {
      const def = SOUNDS[targetSound];
      await newSound.setVolumeAsync(0);
      await newSound.setIsLoopingAsync(true);
      await newSound.setPositionAsync(0);
      await newSound.playAsync();

      // Fade in (expo-av doesn't support volume fade natively)
      const fadeInMs = def.fadeIn ?? 1500;
      const targetVol = calculateVolume(targetSound, def.volume);
      await fadeVolume(newSound, 0, targetVol, fadeInMs);

      state.ambientPaused = false;
    } catch (e) {
      // Silent
    }
  }
};

/**
 * Stop the current ambient sound with fade-out.
 */
const stopAmbient = async (): Promise<void> => {
  if (!state.currentAmbient) return;

  const sound = state.loadedSounds.get(state.currentAmbient);
  if (sound) {
    try {
      await sound.stopAsync();
    } catch (e) {
      // Silent
    }
  }
  state.currentAmbient = null;
  state.ambientPaused = false;
};

/**
 * Pause ambient when editor gains focus (Eye of the Hurricane).
 * The system holds its breath.
 */
export const pauseAmbientForEditor = async (): Promise<void> => {
  if (state.isEditorFocused || !state.currentAmbient) return;
  state.isEditorFocused = true;

  const sound = state.loadedSounds.get(state.currentAmbient);
  if (sound) {
    try {
      const def = SOUNDS[state.currentAmbient];
      const fadeOutMs = 800;
      const currentVol = calculateVolume(state.currentAmbient, def.volume);
      // Fade to 10% volume — never fully silent (the system still breathes)
      const quietVol = currentVol * 0.1;
      await fadeVolume(sound, currentVol, quietVol, fadeOutMs);
      state.ambientPaused = false; // Still playing, just quiet
    } catch (e) {
      // Silent
    }
  }
};

/**
 * Resume ambient when editor loses focus.
 * The system exhales.
 */
export const resumeAmbientFromEditor = async (): Promise<void> => {
  if (!state.isEditorFocused || !state.currentAmbient) return;
  state.isEditorFocused = false;

  const sound = state.loadedSounds.get(state.currentAmbient);
  if (sound) {
    try {
      const def = SOUNDS[state.currentAmbient];
      const fadeInMs = 1200;
      const targetVol = calculateVolume(state.currentAmbient, def.volume);
      const quietVol = targetVol * 0.1;
      await fadeVolume(sound, quietVol, targetVol, fadeInMs);
    } catch (e) {
      // Silent
    }
  }
};

// ─── Settings ──────────────────────────────────────────────────

/**
 * Enable or disable all sound.
 */
export const setSoundEnabled = async (enabled: boolean): Promise<void> => {
  state.soundEnabled = enabled;

  if (!enabled) {
    // Stop all sounds
    for (const [id, sound] of state.loadedSounds) {
      try {
        await sound.stopAsync();
      } catch (e) {}
    }
    state.currentAmbient = null;
  } else {
    // Restart ambient for current game state
    await updateAmbient(state.currentGameState);
  }
};

/**
 * Set master volume (0.0 – 1.0).
 */
export const setMasterVolume = async (volume: number): Promise<void> => {
  state.masterVolume = Math.max(0, Math.min(1, volume));

  // Update ambient volume if playing
  if (state.currentAmbient && !state.ambientPaused) {
    const sound = state.loadedSounds.get(state.currentAmbient);
    if (sound) {
      const def = SOUNDS[state.currentAmbient];
      const targetVol = calculateVolume(state.currentAmbient, def.volume);
      await sound.setVolumeAsync(targetVol);
    }
  }
};

/**
 * Set volume for a specific category.
 */
export const setCategoryVolume = (category: SoundCategory, volume: number): void => {
  state.categoryVolumes[category] = Math.max(0, Math.min(1, volume));
};

/**
 * Get current engine state (for debugging or UI display).
 */
export const getAudioEngineState = (): Readonly<EngineState> => {
  return { ...state };
};

// ─── Convenience Functions ─────────────────────────────────────

/** Play the short glitch sound */
export const playGlitchShort = () => playSound('glitch_short');
/** Play the long glitch sound */
export const playGlitchLong = () => playSound('glitch_long');
/** Play the alert beep */
export const playAlert = () => playSound('alert_beep');
/** Play the success chime */
export const playSuccess = () => playSound('success_chime');
/** Play the fail buzz */
export const playFail = () => playSound('fail_buzz');
/** Play the timer warning pulse */
export const playTimerWarning = () => playSound('timer_warning');
/** Play the keystroke click */
export const playKeystroke = () => playSound('keystroke');
/** Play the boot flicker snap */
export const playBootFlicker = () => playSound('boot_flicker');
/** Play the designation tone */
export const playDesignation = () => playSound('designation');
