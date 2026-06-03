// IGNYX Haptic Feedback System — Module 16
// Every interaction has weight. Every success has resonance.
// Every failure has impact. The system communicates through touch.
// expo-haptics provides platform-native haptic feedback.

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/useGameStore';

// ─── Haptic Patterns ──────────────────────────────────────────
// Each pattern maps to a specific game interaction.
// The haptic language of IGNYX:
//   Light — navigation, toggles, info
//   Medium — warnings, alerts, mission events
//   Heavy — failures, timeouts, game over
//   Success — mission complete, level up, achievement
//   Error — wrong code, submission fail

interface HapticInterface {
  /** Light tap — navigation, button press, toggle */
  light: () => void;
  /** Medium impact — alert, warning, module state change */
  medium: () => void;
  /** Heavy impact — failure, timeout, integrity critical */
  heavy: () => void;
  /** Success notification — mission complete, XP gain */
  success: () => void;
  /** Warning notification — timer low, state transition */
  warning: () => void;
  /** Error notification — code fail, wrong submission */
  error: () => void;
  /** Level-up celebration — special success pattern */
  levelUp: () => void;
  /** Achievement unlock — ascending pattern */
  achievement: () => void;
  /** Game over — descending pattern */
  gameOver: () => void;
  /** State transition — crossing integrity threshold */
  stateTransition: () => void;
  /** Boot sequence — system startup */
  boot: () => void;
  /** Keystroke feedback — very light tap */
  keystroke: () => void;
}

// ─── Hook ──────────────────────────────────────────────────────

export function useHaptics(): HapticInterface {
  const soundEnabled = useGameStore((s) => s.soundEnabled);

  // If sound is disabled, also suppress haptics (they're part of the same sensory system)
  const enabled = soundEnabled;

  const light = useCallback(() => {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [enabled]);

  const medium = useCallback(() => {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [enabled]);

  const heavy = useCallback(() => {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [enabled]);

  const success = useCallback(() => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [enabled]);

  const warning = useCallback(() => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [enabled]);

  const error = useCallback(() => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, [enabled]);

  const levelUp = useCallback(() => {
    if (!enabled) return;
    // Ascending triple tap: light → medium → heavy with success
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 150);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 300);
  }, [enabled]);

  const achievement = useCallback(() => {
    if (!enabled) return;
    // Double success pulse
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 200);
  }, [enabled]);

  const gameOver = useCallback(() => {
    if (!enabled) return;
    // Descending: heavy → medium → light → error
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 300);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }, 600);
  }, [enabled]);

  const stateTransition = useCallback(() => {
    if (!enabled) return;
    // Warning notification followed by medium impact
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 200);
  }, [enabled]);

  const boot = useCallback(() => {
    if (!enabled) return;
    // Startup sequence: light → light → medium
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 200);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 400);
  }, [enabled]);

  const keystroke = useCallback(() => {
    if (!enabled) return;
    // Very light — selection feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [enabled]);

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    levelUp,
    achievement,
    gameOver,
    stateTransition,
    boot,
    keystroke,
  };
}
