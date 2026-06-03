import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CircuitBackground } from '../components/CircuitBackground';
import { AlertOverlay, AlertOverlayManager } from '../components/AlertOverlay';
import { SystemStatusRing } from '../components/SystemStatusRing';
import { PlayerHUD } from '../components/PlayerHUD';
import { AchievementToast } from '../components/AchievementToast';
import { AmbientOverlay } from '../components/AmbientOverlay';
import { AudioEngine } from '../components/AudioEngine';
import { Colors } from '../constants/colors';

/**
 * ShellLayout — The 8-layer Glass Neural OS wrapper.
 * Every screen after boot/profiling lives inside this shell.
 * It must feel alive at all times.
 *
 * Layers (z-ordered bottom to top):
 * 0. Audio Engine (invisible — syncs game state to sound)
 * 1. Circuit Background (Skia animated nodes)
 * 2. Ambient Overlay (scanlines, tint, vignette — Module 13)
 * 3. Readability overlay (subtle darkening)
 * 4. System Status Ring (top bar)
 * 5. Screen content (injected via children)
 * 6. Player HUD (bottom corners)
 * 7. Alert Overlay (over everything, never blocks editor)
 * 8. Achievement Toast (top notifications for unlocked achievements)
 */
interface ShellLayoutProps {
  children: React.ReactNode;
  /** If true, adds extra darkening behind content (for editor focus) */
  darkMode?: boolean;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children, darkMode = false }) => {
  return (
    <View style={styles.root}>
      {/* LAYER 0 — Audio Engine (invisible, syncs state → sound) */}
      <AudioEngine />

      {/* LAYER 1 — Circuit Background */}
      <CircuitBackground />

      {/* LAYER 2 — Ambient Overlay (Module 13 — scanlines, tint, vignette) */}
      <AmbientOverlay />

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

      {/* LAYER 7 — Achievement Toast (Module 12) */}
      <AchievementToast />
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
