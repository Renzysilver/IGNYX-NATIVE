// IGNYX Sound Definitions
// Every sound the system makes. No sound is accidental.

import type { GameState } from './gameState';

// ─── Sound IDs ─────────────────────────────────────────────────

export type SoundId =
  // Ambient
  | 'circuit_hum'
  | 'circuit_hum_warning'
  | 'circuit_hum_critical'
  | 'circuit_hum_breakdown'
  // Glitch
  | 'glitch_short'
  | 'glitch_long'
  // UI
  | 'alert_beep'
  | 'keystroke'
  // Boot
  | 'boot_flicker'
  | 'designation'
  // Mission
  | 'success_chime'
  | 'fail_buzz'
  | 'timer_warning';

// ─── Sound Categories ──────────────────────────────────────────

export type SoundCategory = 'ambient' | 'glitch' | 'ui' | 'boot' | 'mission';

// ─── Sound Definition ──────────────────────────────────────────

export interface SoundDefinition {
  id: SoundId;
  file: any; // require() path — resolved at import time
  category: SoundCategory;
  volume: number;     // 0.0 – 1.0
  loop: boolean;
  /** Milliseconds to fade in (for ambient) */
  fadeIn?: number;
  /** Milliseconds to fade out (for ambient) */
  fadeOut?: number;
}

// ─── All Sound Definitions ─────────────────────────────────────

export const SOUNDS: Record<SoundId, SoundDefinition> = {
  // Ambient — circuit hum variants
  circuit_hum: {
    id: 'circuit_hum',
    file: require('../assets/sounds/circuit_hum.wav'),
    category: 'ambient',
    volume: 0.4,
    loop: true,
    fadeIn: 2000,
    fadeOut: 1500,
  },
  circuit_hum_warning: {
    id: 'circuit_hum_warning',
    file: require('../assets/sounds/circuit_hum_warning.wav'),
    category: 'ambient',
    volume: 0.45,
    loop: true,
    fadeIn: 1500,
    fadeOut: 1000,
  },
  circuit_hum_critical: {
    id: 'circuit_hum_critical',
    file: require('../assets/sounds/circuit_hum_critical.wav'),
    category: 'ambient',
    volume: 0.5,
    loop: true,
    fadeIn: 800,
    fadeOut: 600,
  },
  circuit_hum_breakdown: {
    id: 'circuit_hum_breakdown',
    file: require('../assets/sounds/circuit_hum_breakdown.wav'),
    category: 'ambient',
    volume: 0.55,
    loop: true,
    fadeIn: 500,
    fadeOut: 400,
  },

  // Glitch — digital distortion
  glitch_short: {
    id: 'glitch_short',
    file: require('../assets/sounds/glitch_short.wav'),
    category: 'glitch',
    volume: 0.5,
    loop: false,
  },
  glitch_long: {
    id: 'glitch_long',
    file: require('../assets/sounds/glitch_long.wav'),
    category: 'glitch',
    volume: 0.6,
    loop: false,
  },

  // UI — interface feedback
  alert_beep: {
    id: 'alert_beep',
    file: require('../assets/sounds/alert_beep.wav'),
    category: 'ui',
    volume: 0.5,
    loop: false,
  },
  keystroke: {
    id: 'keystroke',
    file: require('../assets/sounds/keystroke.wav'),
    category: 'ui',
    volume: 0.15,
    loop: false,
  },

  // Boot — system startup
  boot_flicker: {
    id: 'boot_flicker',
    file: require('../assets/sounds/boot_flicker.wav'),
    category: 'boot',
    volume: 0.6,
    loop: false,
  },
  designation: {
    id: 'designation',
    file: require('../assets/sounds/designation.wav'),
    category: 'boot',
    volume: 0.5,
    loop: false,
  },

  // Mission — gameplay feedback
  success_chime: {
    id: 'success_chime',
    file: require('../assets/sounds/success_chime.wav'),
    category: 'mission',
    volume: 0.55,
    loop: false,
  },
  fail_buzz: {
    id: 'fail_buzz',
    file: require('../assets/sounds/fail_buzz.wav'),
    category: 'mission',
    volume: 0.5,
    loop: false,
  },
  timer_warning: {
    id: 'timer_warning',
    file: require('../assets/sounds/timer_warning.wav'),
    category: 'mission',
    volume: 0.45,
    loop: false,
  },
};

// ─── Category Volumes ──────────────────────────────────────────

export const CATEGORY_VOLUMES: Record<SoundCategory, number> = {
  ambient: 0.6,
  glitch: 0.7,
  ui: 0.5,
  boot: 0.7,
  mission: 0.7,
};

// ─── Ambient Sound Mapping ─────────────────────────────────────

/**
 * Get the appropriate ambient sound for the current game state.
 * The circuit hum changes character as the system degrades.
 */
export const getAmbientForState = (state: GameState): SoundId => {
  switch (state) {
    case 'normal': return 'circuit_hum';
    case 'warning': return 'circuit_hum_warning';
    case 'critical': return 'circuit_hum_critical';
    case 'breakdown': return 'circuit_hum_breakdown';
  }
};

// ─── Sound list for preloading ─────────────────────────────────

export const ALL_SOUND_IDS: SoundId[] = Object.keys(SOUNDS) as SoundId[];
