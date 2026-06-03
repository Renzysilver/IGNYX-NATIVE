// IGNYX Shell Layout — Module 03 + Module 14
// The 8-layer Glass Neural OS wrapper. Every screen lives here.
// Module 14: LevelUpCelebration wired to store. Periodic glitch pulse
// scales with game state. The system breathes. The system warns.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { CircuitBackground } from '../components/CircuitBackground';
import { AlertOverlay, AlertOverlayManager } from '../components/AlertOverlay';
import { SystemStatusRing } from '../components/SystemStatusRing';
import { PlayerHUD } from '../components/PlayerHUD';
import { AchievementToast } from '../components/AchievementToast';
import { AmbientOverlay } from '../components/AmbientOverlay';
import { GlitchOverlay } from '../components/GlitchOverlay';
import { AudioEngine } from '../components/AudioEngine';
import { LevelUpCelebration } from '../components/LevelUpCelebration';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';
import { getClassTitle, getMilestonesForLevel } from '../constants/progression';
import type { GameState } from '../constants/gameState';

/**
 * ShellLayout — The 9-layer Glass Neural OS wrapper.
 * Every screen after boot/profiling lives inside this shell.
 * It must feel alive at all times.
 *
 * Layers (z-ordered bottom to top):
 * 0. Audio Engine (invisible — syncs game state to sound)
 * 1. Circuit Background (Skia animated nodes)
 * 2. Ambient Overlay (scanlines, tint, vignette)
 * 3. Readability overlay (subtle darkening)
 * 4. System Status Ring (top bar)
 * 5. Screen content (injected via children)
 * 6. Player HUD (bottom corners)
 * 7. Alert Overlay (over everything, never blocks editor)
 * 8. Achievement Toast (top notifications for unlocked achievements)
 * 9. Level Up Celebration (full-screen overlay, auto-dismisses)
 * + Periodic Glitch Pulse (state-reactive random glitch)
 */
interface ShellLayoutProps {
  children: React.ReactNode;
  /** If true, adds extra darkening behind content (for editor focus) */
  darkMode?: boolean;
}

// ─── Glitch pulse intervals by game state ────────────────────────
// How often (in ms) the ambient glitch fires. 0 = disabled.
const GLITCH_INTERVALS: Record<GameState, number> = {
  normal: 0,       // No random glitch in normal state
  warning: 25000,  // Every ~25 seconds
  critical: 12000, // Every ~12 seconds
  breakdown: 6000, // Every ~6 seconds
};

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children, darkMode = false }) => {
  const gameState = useGameStore((s) => s.gameState);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const isEditorFocused = useGameStore((s) => s.isEditorFocused);

  // Level-up celebration state
  const pendingLevelUp = useGameStore((s) => s.pendingLevelUp);
  const operatorClass = useGameStore((s) => s.operatorClass);
  const clearPendingLevelUp = useGameStore((s) => s.clearPendingLevelUp);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(1);
  const [levelUpMilestones, setLevelUpMilestones] = useState<any[]>([]);

  // Watch for pending level-up
  useEffect(() => {
    if (pendingLevelUp !== null) {
      setLevelUpLevel(pendingLevelUp);
      setLevelUpMilestones(getMilestonesForLevel(pendingLevelUp));
      setShowLevelUp(true);
    }
  }, [pendingLevelUp]);

  const handleLevelUpComplete = useCallback(() => {
    setShowLevelUp(false);
    clearPendingLevelUp();
  }, [clearPendingLevelUp]);

  // Periodic glitch pulse
  const [glitchActive, setGlitchActive] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState<'low' | 'medium' | 'high'>('low');
  const glitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glitchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear previous interval
    if (glitchIntervalRef.current) {
      clearInterval(glitchIntervalRef.current);
      glitchIntervalRef.current = null;
    }

    // Don't glitch if reduced motion or editor focused
    if (reducedMotion || isEditorFocused) return;

    const interval = GLITCH_INTERVALS[gameState];
    if (interval === 0) return;

    // Set intensity based on game state
    const intensityMap: Record<GameState, 'low' | 'medium' | 'high'> = {
      normal: 'low',
      warning: 'low',
      critical: 'medium',
      breakdown: 'high',
    };
    const intensity = intensityMap[gameState];

    glitchIntervalRef.current = setInterval(() => {
      // Random chance to skip (30% skip rate so it's not too frequent)
      if (Math.random() < 0.3) return;

      setGlitchIntensity(intensity);
      setGlitchActive(true);

      // Auto-clear after glitch completes
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
      glitchTimeoutRef.current = setTimeout(() => {
        setGlitchActive(false);
      }, 800);
    }, interval);

    return () => {
      if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    };
  }, [gameState, reducedMotion, isEditorFocused]);

  return (
    <View style={styles.root}>
      {/* LAYER 0 — Audio Engine (invisible, syncs state → sound) */}
      <AudioEngine />

      {/* LAYER 1 — Circuit Background */}
      <CircuitBackground />

      {/* LAYER 2 — Ambient Overlay (scanlines, tint, vignette) */}
      <AmbientOverlay />

      {/* LAYER 2.5 — Periodic Glitch Pulse (Module 14) */}
      <GlitchOverlay
        active={glitchActive}
        intensity={glitchIntensity}
        duration={800}
        onComplete={() => setGlitchActive(false)}
      />

      {/* LAYER 3 — Readability overlay */}
      <View style={[
        styles.readabilityOverlay,
        darkMode && styles.readabilityOverlayDark,
      ]} />

      {/* LAYER 3 — System Status Ring (top) */}
      <View style={styles.statusRingContainer}>
        <SystemStatusRing />
      </View>

      {/* LAYER 4 — Screen Content */}
      <View style={styles.contentContainer}>
        {children}
      </View>

      {/* LAYER 5 — Player HUD (bottom) */}
      <PlayerHUD />

      {/* LAYER 6 — Alert Overlay (z-ordered highest) */}
      <AlertOverlay />

      {/* LAYER 7 — Achievement Toast */}
      <AchievementToast />

      {/* LAYER 8 — Level Up Celebration (Module 14) */}
      <LevelUpCelebration
        visible={showLevelUp}
        level={levelUpLevel}
        classTitle={getClassTitle(operatorClass, levelUpLevel)}
        milestones={levelUpMilestones}
        onComplete={handleLevelUpComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  readabilityOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 3,
  },
  readabilityOverlayDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  statusRingContainer: {
    zIndex: 100,
  },
  contentContainer: {
    flex: 1,
    zIndex: 50,
  },
});
