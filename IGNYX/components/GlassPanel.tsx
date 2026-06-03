// IGNYX Glass Panel — Module 03 + Module 14
// The glass aesthetic. Frosted borders. State-reactive glow.
// In Module 14: panels shift color based on system health.
// Normal = cyan. Warning = amber. Critical = red. Breakdown = purple.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/colors';
import { useGameStore } from '../store/useGameStore';
import type { GameState } from '../constants/gameState';

// ─── State-reactive border colors ────────────────────────────────

const STATE_BORDERS: Record<GameState, { active: string; inactive: string }> = {
  normal: {
    active: Colors.glassBorderActive,    // cyan glow
    inactive: Colors.glassBorder,        // dim cyan
  },
  warning: {
    active: 'rgba(255, 191, 0, 0.8)',    // amber glow
    inactive: 'rgba(255, 191, 0, 0.25)', // dim amber
  },
  critical: {
    active: 'rgba(255, 50, 50, 0.8)',    // red glow
    inactive: 'rgba(255, 50, 50, 0.25)', // dim red
  },
  breakdown: {
    active: 'rgba(139, 0, 255, 0.7)',    // purple glow
    inactive: 'rgba(139, 0, 255, 0.2)',  // dim purple
  },
};

// ─── Component ───────────────────────────────────────────────────

interface GlassPanelProps {
  children: React.ReactNode;
  active?: boolean;
  style?: any;
  testID?: string;
  /** Override: if true, ignores game state and uses standard cyan styling */
  ignoreState?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  active = false,
  style,
  testID,
  ignoreState = false,
}) => {
  const gameState = useGameStore((s) => s.gameState);

  const borderSet = ignoreState ? STATE_BORDERS.normal : STATE_BORDERS[gameState];

  const containerStyle = [
    styles.container,
    {
      borderColor: active ? borderSet.active : borderSet.inactive,
    },
    active && styles.containerActiveBg,
    style,
  ];

  const innerBorderStyle = [
    styles.innerBorder,
    {
      borderColor: active ? borderSet.active : borderSet.inactive,
    },
  ];

  return (
    <View style={containerStyle} testID={testID}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      <View style={innerBorderStyle} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.glassBg,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  containerActiveBg: {
    backgroundColor: Colors.glassBgActive,
  },
  innerBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 4,
    borderWidth: 1,
    pointerEvents: 'none',
  },
  content: {
    padding: 12,
    zIndex: 1,
  },
});
