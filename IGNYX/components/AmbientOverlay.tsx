// IGNYX Ambient Overlay — Module 13
// The system's visual pulse. Scanlines that intensify with damage.
// Tint that shifts with state. A subtle breathing rhythm.
// The operator sees the system's health before reading any number.

import React, { useEffect, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';
import type { GameState } from '../constants/gameState';

// ─── State Visual Profiles ─────────────────────────────────────

interface VisualProfile {
  /** Scanline opacity (0-1) */
  scanlineOpacity: number;
  /** Tint color (rgba) */
  tintColor: string;
  /** Tint opacity (0-1) */
  tintOpacity: number;
  /** Pulse speed (ms per cycle) — 0 = no pulse */
  pulseSpeed: number;
  /** Vignette intensity (0-1) */
  vignetteIntensity: number;
}

const PROFILES: Record<GameState, VisualProfile> = {
  normal: {
    scanlineOpacity: 0.03,
    tintColor: 'rgba(0, 245, 255, 0.02)',
    tintOpacity: 0.02,
    pulseSpeed: 0,
    vignetteIntensity: 0.1,
  },
  warning: {
    scanlineOpacity: 0.06,
    tintColor: 'rgba(255, 191, 0, 0.04)',
    tintOpacity: 0.04,
    pulseSpeed: 4000,
    vignetteIntensity: 0.2,
  },
  critical: {
    scanlineOpacity: 0.1,
    tintColor: 'rgba(255, 0, 0, 0.06)',
    tintOpacity: 0.06,
    pulseSpeed: 2500,
    vignetteIntensity: 0.35,
  },
  breakdown: {
    scanlineOpacity: 0.15,
    tintColor: 'rgba(139, 0, 255, 0.08)',
    tintOpacity: 0.08,
    pulseSpeed: 1500,
    vignetteIntensity: 0.5,
  },
};

// ─── Component ─────────────────────────────────────────────────

export const AmbientOverlay: React.FC = memo(() => {
  const gameState = useGameStore((s) => s.gameState);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const isEditorFocused = useGameStore((s) => s.isEditorFocused);

  const profile = PROFILES[gameState];

  // Scanline opacity animation (subtle pulse for warning+)
  const scanlineOpacity = useSharedValue(profile.scanlineOpacity);
  const tintOpacity = useSharedValue(profile.tintOpacity);
  const pulseValue = useSharedValue(0);

  // Update profile when game state changes
  useEffect(() => {
    cancelAnimation(scanlineOpacity);
    cancelAnimation(tintOpacity);
    cancelAnimation(pulseValue);

    scanlineOpacity.value = withTiming(profile.scanlineOpacity, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });

    tintOpacity.value = withTiming(profile.tintOpacity, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });

    // Start pulse animation for warning+ states
    if (profile.pulseSpeed > 0 && !reducedMotion) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: profile.pulseSpeed / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: profile.pulseSpeed / 2, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, // infinite
        false,
      );
    } else {
      pulseValue.value = 0;
    }
  }, [gameState, reducedMotion]);

  const scanlineStyle = useAnimatedStyle(() => ({
    opacity: scanlineOpacity.value + pulseValue.value * 0.02,
  }));

  const tintStyle = useAnimatedStyle(() => ({
    opacity: tintOpacity.value + pulseValue.value * 0.02,
  }));

  const vignetteStyle = useAnimatedStyle(() => {
    const intensity = profile.vignetteIntensity + pulseValue.value * 0.05;
    return { opacity: intensity };
  });

  // Dim when editor is focused (Eye of the Hurricane)
  const containerOpacity = useSharedValue(1);
  useEffect(() => {
    containerOpacity.value = withTiming(isEditorFocused ? 0.3 : 1, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
  }, [isEditorFocused]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Scanlines */}
      <Animated.View style={[styles.scanlines, scanlineStyle]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={styles.scanline} />
        ))}
      </Animated.View>

      {/* State tint */}
      <Animated.View style={[styles.tint, tintStyle, { backgroundColor: profile.tintColor }]} />

      {/* Vignette */}
      <Animated.View style={[styles.vignette, vignetteStyle]} />
    </Animated.View>
  );
});

AmbientOverlay.displayName = 'AmbientOverlay';

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 2, // Above circuit background, below content
    pointerEvents: 'none',
  },
  scanlines: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  scanline: {
    height: 1,
    backgroundColor: Colors.textPrimary,
    opacity: 0.15,
  },
  tint: {
    ...StyleSheet.absoluteFill,
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    // Radial vignette approximation — darker edges
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 0,
  },
});
