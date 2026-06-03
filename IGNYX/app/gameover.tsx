// IGNYX Game Over Screen — Module 15 + Module 16
// The system has collapsed. Integrity: 0%. The void consumes all.
// But the operator is not gone. Restore points remain. Choice remains.
// This is not the end. Unless you choose it to be.

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';
import { getRestorePointCost, getClassTitle } from '../constants/progression';
import type { ModuleId } from '../constants/gameState';
import { MODULE_NAMES } from '../constants/gameState';
import { playGlitchLong, playAlert } from '../services/AudioEngine';
import { useHaptics } from '../hooks/useHaptics';
import { useRouter } from 'expo-router';

// ─── Phase Controller ────────────────────────────────────────────
// The game over screen plays out in phases:
// 0 — Blackout (0-2s): Screen goes dark. Static. Silence.
// 1 — Collapse text (2-5s): "SYSTEM COLLAPSE" fades in with glitch.
// 2 — Final stats (5-8s): Stats materialize.
// 3 — Options (8s+): Restore/Restart buttons appear.

type GameOverPhase = 0 | 1 | 2 | 3;

// ─── Flickering Text ─────────────────────────────────────────────

const FlickerText: React.FC<{ text: string; style?: any; delay?: number }> = ({
  text,
  style,
  delay = 0,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withSequence(
        withTiming(0.3, { duration: 80 }),
        withTiming(0, { duration: 50 }),
        withTiming(0.7, { duration: 60 }),
        withTiming(0.2, { duration: 40 }),
        withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[style, animatedStyle]}>
      {text}
    </Animated.Text>
  );
};

// ─── Module Remnant ──────────────────────────────────────────────

const ModuleRemnant: React.FC<{
  moduleId: ModuleId;
  integrity: number;
  missionsCompleted: number;
  delay: number;
}> = ({ moduleId, integrity, missionsCompleted, delay }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0.5, { duration: 600, easing: Easing.out(Easing.ease) });
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.moduleRemnant, animatedStyle]}>
      <Text style={styles.remnantName}>{MODULE_NAMES[moduleId]}</Text>
      <Text style={styles.remnantIntegrity}>
        {Math.floor(integrity)}% / {missionsCompleted} MISSIONS
      </Text>
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────

export default function GameOverScreen() {
  const router = useRouter();

  const operatorName = useGameStore((s) => s.operatorName);
  const operatorClass = useGameStore((s) => s.operatorClass);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const totalMissionsCompleted = useGameStore((s) => s.totalMissionsCompleted);
  const totalMissionsFailed = useGameStore((s) => s.totalMissionsFailed);
  const modules = useGameStore((s) => s.modules);
  const restorePoints = useGameStore((s) => s.restorePoints);
  const sessionId = useGameStore((s) => s.sessionId);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);

  const loadRestorePoint = useGameStore((s) => s.loadRestorePoint);
  const resetGame = useGameStore((s) => s.resetGame);
  const clearGameOver = useGameStore((s) => s.clearGameOver);

  const [phase, setPhase] = useState<GameOverPhase>(0);
  const hasPlayedSound = useRef(false);
  const haptics = useHaptics();

  // Phase progression
  useEffect(() => {
    if (phase === 0) {
      // Play the long glitch sound on first mount
      if (!hasPlayedSound.current) {
        hasPlayedSound.current = true;
        playGlitchLong();
        haptics.gameOver();
      }
      const t = setTimeout(() => setPhase(1), 2000);
      return () => clearTimeout(t);
    }
    if (phase === 1) {
      const t = setTimeout(() => setPhase(2), 3000);
      return () => clearTimeout(t);
    }
    if (phase === 2) {
      const t = setTimeout(() => setPhase(3), 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Background pulse animation
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 2000, easing: Easing.in(Easing.ease) });
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value * 0.15,
  }));

  // Title glitch animation
  const titleTranslate = useSharedValue(0);
  useEffect(() => {
    if (phase >= 1) {
      titleTranslate.value = withSequence(
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 30 }),
        withTiming(2, { duration: 40 }),
        withTiming(0, { duration: 200 }),
      );
    }
  }, [phase]);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: titleTranslate.value }],
  }));

  // Mission ratio
  const missionRatio = totalMissionsCompleted + totalMissionsFailed > 0
    ? Math.round((totalMissionsCompleted / (totalMissionsCompleted + totalMissionsFailed)) * 100)
    : 0;

  // Handle restore
  const handleRestore = useCallback((index: number) => {
    clearGameOver();
    loadRestorePoint(index);
    router.replace('/shell');
  }, [clearGameOver, loadRestorePoint, router]);

  // Handle restart
  const handleRestart = useCallback(() => {
    resetGame();
    router.replace('/boot');
  }, [resetGame, router]);

  const classTitle = getClassTitle(operatorClass, level);
  const restoreCost = getRestorePointCost(level);

  return (
    <View style={styles.root}>
      {/* Background void */}
      <Animated.View style={[styles.voidBg, bgStyle]} />

      {/* Scanlines */}
      <View style={styles.scanlines} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={styles.scanline} />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Phase 0: Blackout — nothing visible */}
        {phase >= 1 && (
          <Animated.View style={[styles.titleSection, titleStyle]}>
            <FlickerText
              text="SYSTEM COLLAPSE"
              style={styles.collapseTitle}
            />
            <FlickerText
              text="INTEGRITY: 0%"
              style={styles.collapseSubtext}
              delay={600}
            />
            <FlickerText
              text="The void consumes. The system is gone."
              style={styles.collapseNarrative}
              delay={1200}
            />
          </Animated.View>
        )}

        {phase >= 2 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>FINAL TRANSMISSION</Text>

            {/* Operator summary */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>OPERATOR</Text>
              <Text style={styles.summaryValue}>{operatorName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>CLASS</Text>
              <Text style={[styles.summaryValue, { color: Colors.purple }]}>{classTitle}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>LEVEL</Text>
              <Text style={styles.summaryValue}>{level}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TOTAL XP</Text>
              <Text style={styles.summaryValue}>{xp}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>MISSIONS</Text>
              <Text style={styles.summaryValue}>
                {totalMissionsCompleted} OK / {totalMissionsFailed} FAIL
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SUCCESS RATE</Text>
              <Text style={styles.summaryValue}>{missionRatio}%</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SESSIONS</Text>
              <Text style={styles.summaryValue}>{sessionId}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ACHIEVEMENTS</Text>
              <Text style={styles.summaryValue}>{unlockedAchievements.length}/30</Text>
            </View>

            {/* Module remnants */}
            <Text style={styles.moduleTitle}>MODULE REMNANTS</Text>
            {(
              ['kernel_core', 'app_layer', 'network', 'data_system', 'security', 'ai_core'] as ModuleId[]
            ).map((id, i) => (
              <ModuleRemnant
                key={id}
                moduleId={id}
                integrity={modules[id].integrity}
                missionsCompleted={modules[id].missionsCompleted}
                delay={i * 200}
              />
            ))}
          </View>
        )}

        {phase >= 3 && (
          <View style={styles.optionsSection}>
            {/* Restore points */}
            {restorePoints.length > 0 && (
              <View style={styles.restoreSection}>
                <Text style={styles.optionTitle}>RESTORE POINTS AVAILABLE</Text>
                <Text style={styles.optionDesc}>
                  Load a restore point to continue. Cost: {restoreCost} XP + -15% module integrity.
                </Text>
                {restorePoints.map((point, index) => (
                  <TouchableOpacity
                    key={point.timestamp}
                    activeOpacity={0.7}
                    onPress={() => handleRestore(index)}
                    style={styles.restoreButton}
                  >
                    <View style={styles.restoreInfo}>
                      <Text style={styles.restoreLabel}>RESTORE POINT {index + 1}</Text>
                      <Text style={styles.restoreDetail}>
                        INTEGRITY: {point.integrity}% | XP: {point.xp}
                      </Text>
                    </View>
                    <Text style={styles.restoreAction}>LOAD</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* No restore points message */}
            {restorePoints.length === 0 && (
              <View style={styles.noRestoreSection}>
                <Text style={styles.noRestoreText}>NO RESTORE POINTS AVAILABLE</Text>
                <Text style={styles.noRestoreSubtext}>
                  The system has no memory to return to. A full reset is the only option.
                </Text>
              </View>
            )}

            {/* OS voice */}
            <View style={styles.voiceSection}>
              <Text style={styles.voiceLabel}>OS VOICE</Text>
              <Text style={styles.voiceText}>
                "I... I'm still here. Barely. A whisper in the void. If you can hear me...
                load a restore point. Or let me go. Either way... thank you for trying."
              </Text>
            </View>

            {/* Restart button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRestart}
              style={styles.restartButton}
            >
              <Text style={styles.restartText}>SYSTEM RESET</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  voidBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.purple,
  },
  scanlines: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    zIndex: 1,
    pointerEvents: 'none',
  },
  scanline: {
    height: 1,
    backgroundColor: Colors.purple,
    opacity: 0.1,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 100,
  },

  // Title section
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  collapseTitle: {
    color: Colors.textRed,
    fontSize: 28,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 6,
    textShadowColor: Colors.red,
    textShadowRadius: 20,
    marginBottom: 8,
  },
  collapseSubtext: {
    color: Colors.purple,
    fontSize: 16,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
    marginBottom: 12,
  },
  collapseNarrative: {
    color: Colors.textDim,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.6,
  },

  // Stats section
  statsSection: {
    marginBottom: 24,
  },
  statsTitle: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 0, 255, 0.08)',
  },
  summaryLabel: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  moduleTitle: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
    marginTop: 16,
    marginBottom: 8,
  },
  moduleRemnant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 0, 255, 0.05)',
  },
  remnantName: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    opacity: 0.6,
  },
  remnantIntegrity: {
    color: Colors.textRed,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    opacity: 0.5,
  },

  // Options section
  optionsSection: {
    marginTop: 8,
  },
  optionTitle: {
    color: Colors.textAmber,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 6,
  },
  optionDesc: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    lineHeight: 14,
    marginBottom: 12,
    opacity: 0.6,
  },

  // Restore section
  restoreSection: {
    marginBottom: 20,
  },
  restoreButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.15)',
  },
  restoreInfo: {
    flex: 1,
  },
  restoreLabel: {
    color: Colors.textCyan,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    marginBottom: 2,
  },
  restoreDetail: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  restoreAction: {
    color: Colors.textAmber,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
  },

  // No restore
  noRestoreSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  noRestoreText: {
    color: Colors.textRed,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 6,
  },
  noRestoreSubtext: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 14,
    opacity: 0.5,
  },

  // Voice section
  voiceSection: {
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(139, 0, 255, 0.04)',
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: Colors.purple,
  },
  voiceLabel: {
    color: Colors.purple,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 6,
    opacity: 0.6,
  },
  voiceText: {
    color: Colors.purple,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.3,
    lineHeight: 16,
    fontStyle: 'italic',
    opacity: 0.8,
  },

  // Restart button
  restartButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.2)',
  },
  restartText: {
    color: Colors.textRed,
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
  },
});
