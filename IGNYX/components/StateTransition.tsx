// IGNYX State Transition Cutscene — Module 16
// When the system crosses a state boundary, the world changes.
// Normal → Warning: Amber flash. The system stutters.
// Warning → Critical: Red pulse. The system screams.
// Critical → Breakdown: Purple cascade. The system fractures.
// These are not notifications. They are events. The operator feels them.

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';
import type { GameState } from '../constants/gameState';

// ─── Transition Definitions ────────────────────────────────────

interface TransitionDef {
  fromState: GameState;
  toState: GameState;
  color: string;
  text: string;
  subtitle: string;
  duration: number;
}

const TRANSITIONS: TransitionDef[] = [
  {
    fromState: 'normal',
    toState: 'warning',
    color: Colors.amber,
    text: 'WARNING',
    subtitle: 'System integrity degrading. Multiple sectors affected.',
    duration: 2500,
  },
  {
    fromState: 'warning',
    toState: 'critical',
    color: Colors.red,
    text: 'CRITICAL',
    subtitle: 'Core systems failing. Immediate action required.',
    duration: 3000,
  },
  {
    fromState: 'critical',
    toState: 'breakdown',
    color: Colors.purple,
    text: 'BREAKDOWN',
    subtitle: 'System collapse imminent. Final defenses failing.',
    duration: 3500,
  },
  // Recovery transitions (less dramatic)
  {
    fromState: 'breakdown',
    toState: 'critical',
    color: Colors.cyan,
    text: 'RECOVERING',
    subtitle: 'Systems stabilizing. Hold the line.',
    duration: 2000,
  },
  {
    fromState: 'critical',
    toState: 'warning',
    color: Colors.cyan,
    text: 'IMPROVING',
    subtitle: 'Integrity rising. The system breathes easier.',
    duration: 2000,
  },
  {
    fromState: 'warning',
    toState: 'normal',
    color: Colors.cyan,
    text: 'STABLE',
    subtitle: 'All sectors nominal. The system is whole.',
    duration: 1500,
  },
];

// ─── Component ─────────────────────────────────────────────────

export const StateTransition: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const isEditorFocused = useGameStore((s) => s.isEditorFocused);

  const [active, setActive] = useState(false);
  const [transition, setTransition] = useState<TransitionDef | null>(null);
  const prevGameStateRef = useRef<GameState>(gameState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated values
  const overlayOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.8);
  const subtitleOpacity = useSharedValue(0);

  // Detect state transitions
  useEffect(() => {
    const prevState = prevGameStateRef.current;
    prevGameStateRef.current = gameState;

    if (prevState === gameState) return;
    if (isEditorFocused) return; // Don't interrupt editor focus

    // Find matching transition definition
    const matched = TRANSITIONS.find(
      (t) => t.fromState === prevState && t.toState === gameState
    );

    if (!matched) return;
    if (reducedMotion) return; // Respect accessibility

    // Clear any existing transition
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Play the cutscene
    setTransition(matched);
    setActive(true);

    // Phase 1: Flash overlay
    overlayOpacity.value = withSequence(
      withTiming(0.6, { duration: 200, easing: Easing.out(Easing.ease) }),
      withDelay(
        matched.duration - 800,
        withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) })
      ),
    );

    // Phase 2: Title text
    textOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
        withDelay(
          matched.duration - 1200,
          withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) })
        ),
      ),
    );
    textScale.value = withDelay(
      300,
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
        withDelay(
          matched.duration - 1200,
          withTiming(0.9, { duration: 400 })
        ),
      ),
    );

    // Phase 3: Subtitle
    subtitleOpacity.value = withDelay(
      800,
      withSequence(
        withTiming(0.7, { duration: 300, easing: Easing.out(Easing.ease) }),
        withDelay(
          matched.duration - 1400,
          withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
        ),
      ),
    );

    // Auto-dismiss
    timeoutRef.current = setTimeout(() => {
      setActive(false);
      setTransition(null);
      overlayOpacity.value = 0;
      textOpacity.value = 0;
      subtitleOpacity.value = 0;
    }, matched.duration + 200);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [gameState, reducedMotion, isEditorFocused]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  if (!active || !transition) return null;

  return (
    <View style={styles.root} pointerEvents="none">
      {/* Color flash overlay */}
      <Animated.View
        style={[
          styles.flashOverlay,
          { backgroundColor: transition.color },
          overlayStyle,
        ]}
      />

      {/* Scanlines */}
      <View style={styles.scanlines}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.scanline,
              { backgroundColor: transition.color },
            ]}
          />
        ))}
      </View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, titleStyle]}>
        <Text style={[styles.titleText, { color: transition.color }]}>
          {transition.text}
        </Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={[styles.subtitleContainer, subtitleStyle]}>
        <Text style={styles.subtitleText}>
          {transition.subtitle}
        </Text>
      </Animated.View>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 999, // Above everything except alerts
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFill,
  },
  scanlines: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    opacity: 0.15,
  },
  scanline: {
    height: 1,
    opacity: 0.3,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowRadius: 10,
  },
  subtitleContainer: {
    marginTop: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  subtitleText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
});
