// IGNYX MissionResult — Module 09
// The aftermath. The operator sees what they've done — or failed to do.
// Success is relief. Failure is consequence. Timeout is silence.
// Every result changes the system. Every change is remembered.

import React, { memo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { GlassPanel } from './GlassPanel';
import { Colors } from '../constants/colors';
import type { Mission } from '../constants/missions';
import type { ModuleId } from '../constants/gameState';
import { MODULE_NAMES } from '../constants/gameState';

// ─── Types ─────────────────────────────────────────────────────

export type MissionResultType = 'success' | 'fail' | 'timeout';

interface MissionResultProps {
  /** The mission that just ended */
  mission: Mission;
  /** The result type */
  result: MissionResultType;
  /** The feedback text (from validation or timeout message) */
  feedback: string;
  /** XP gained (only for success) */
  xpGained: number;
  /** Integrity change amount */
  integrityDelta: number;
  /** New total system integrity */
  newSystemIntegrity: number;
  /** Whether a new module was unlocked */
  unlockedModule: ModuleId | null;
  /** Whether the module is now stable */
  moduleStabilized: boolean;
  /** Callback to continue / return to shell */
  onContinue: () => void;
}

// ─── Component ─────────────────────────────────────────────────

export const MissionResult: React.FC<MissionResultProps> = memo(({
  mission,
  result,
  feedback,
  xpGained,
  integrityDelta,
  newSystemIntegrity,
  unlockedModule,
  moduleStabilized,
  onContinue,
}) => {
  const isSuccess = result === 'success';
  const isTimeout = result === 'timeout';

  // Result color
  const resultColor = isSuccess ? Colors.textCyan : Colors.textRed;
  const resultLabel = isSuccess ? 'PROCESS STABILIZED' : isTimeout ? 'PROCESS TIMEOUT' : 'PROCESS FAILURE';

  // Consequence text
  const consequenceText = isSuccess
    ? mission.successConsequence
    : isTimeout
    ? mission.timeoutConsequence
    : mission.failConsequence;

  // Entrance animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Pulse animation for success
  const glowScale = useSharedValue(1);
  useEffect(() => {
    if (isSuccess) {
      glowScale.value = withSequence(
        withTiming(1.05, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      );
    }
  }, [isSuccess]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Result Header ── */}
        <Animated.View style={[styles.resultHeader, glowStyle]}>
          <View style={[styles.resultIconContainer, { borderColor: resultColor }]}>
            <Text style={[styles.resultIcon, { color: resultColor }]}>
              {isSuccess ? '[OK]' : '[XX]'}
            </Text>
          </View>
          <Text style={[styles.resultLabel, { color: resultColor }]}>
            {resultLabel}
          </Text>
          <Text style={styles.missionTitle}>{mission.title}</Text>
        </Animated.View>

        {/* ── Feedback / Message ── */}
        <GlassPanel style={styles.feedbackPanel}>
          <Text style={[styles.feedbackText, { color: resultColor }]}>
            {feedback || (isSuccess ? mission.successMessage : isTimeout ? mission.timeoutMessage : mission.failMessage)}
          </Text>
        </GlassPanel>

        {/* ── Consequence Narrative ── */}
        <View style={styles.consequenceSection}>
          <Text style={styles.consequenceLabel}>SYSTEM LOG</Text>
          <Text style={styles.consequenceText}>{consequenceText}</Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>INTEGRITY</Text>
            <Text style={[styles.statValue, { color: integrityDelta >= 0 ? '#50FA7B' : Colors.textRed }]}>
              {integrityDelta >= 0 ? '+' : ''}{integrityDelta}%
            </Text>
            <Text style={styles.statSub}>{newSystemIntegrity}% TOTAL</Text>
          </View>

          {isSuccess && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>XP GAINED</Text>
              <Text style={[styles.statValue, { color: Colors.textCyan }]}>
                +{xpGained}
              </Text>
            </View>
          )}

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MODULE</Text>
            <Text style={[styles.statValue, { color: Colors.textAmber, fontSize: 9 }]}>
              {MODULE_NAMES[mission.moduleId]}
            </Text>
          </View>
        </View>

        {/* ── Unlock Notification ── */}
        {unlockedModule && isSuccess && (
          <GlassPanel active style={styles.unlockPanel}>
            <Text style={styles.unlockIcon}>{'>>'}</Text>
            <View style={styles.unlockText}>
              <Text style={styles.unlockLabel}>MODULE UNLOCKED</Text>
              <Text style={styles.unlockName}>{MODULE_NAMES[unlockedModule]}</Text>
            </View>
          </GlassPanel>
        )}

        {/* ── Stabilization Notification ── */}
        {moduleStabilized && isSuccess && (
          <View style={styles.stablePanel}>
            <Text style={styles.stableIcon}>{'##'}</Text>
            <Text style={styles.stableText}>
              {MODULE_NAMES[mission.moduleId]} — STABLE
            </Text>
          </View>
        )}

        {/* ── File Revealed ── */}
        {mission.revealsFile && isSuccess && (
          <View style={styles.fileRevealRow}>
            <Text style={styles.fileRevealLabel}>FILE DISCOVERED</Text>
            <Text style={styles.fileRevealPath}>{mission.revealsFile}</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Continue Button ── */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onContinue}
        style={styles.continueButton}
      >
        <View style={[styles.continuePanel, { borderColor: resultColor }]}>
          <Text style={[styles.continueText, { color: resultColor }]}>
            CONTINUE
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

MissionResult.displayName = 'MissionResult';

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Result header
  resultHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 16,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  resultLabel: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
    marginBottom: 4,
  },
  missionTitle: {
    fontSize: 16,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    letterSpacing: 3,
  },

  // Feedback
  feedbackPanel: {
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    lineHeight: 17,
  },

  // Consequence
  consequenceSection: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  consequenceLabel: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 3,
    marginBottom: 6,
  },
  consequenceText: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    lineHeight: 16,
    letterSpacing: 0.3,
    opacity: 0.85,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 245, 255, 0.03)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.06)',
  },
  statLabel: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 2,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  statSub: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 1,
    marginTop: 2,
  },

  // Unlock
  unlockPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  unlockIcon: {
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textCyan,
    letterSpacing: 1,
  },
  unlockText: {
    flex: 1,
  },
  unlockLabel: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textCyan,
    letterSpacing: 3,
    marginBottom: 2,
  },
  unlockName: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },

  // Stable
  stablePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(80, 250, 123, 0.06)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(80, 250, 123, 0.2)',
    marginBottom: 10,
  },
  stableIcon: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    color: '#50FA7B',
  },
  stableText: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: '#50FA7B',
    letterSpacing: 2,
  },

  // File revealed
  fileRevealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderLeftWidth: 2,
    borderLeftColor: Colors.purple,
    backgroundColor: 'rgba(139, 0, 255, 0.04)',
    marginBottom: 8,
  },
  fileRevealLabel: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: '#8B00FF',
    letterSpacing: 2,
  },
  fileRevealPath: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: '#8B00FF',
    letterSpacing: 0.5,
  },

  // Continue
  continueButton: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.06)',
  },
  continuePanel: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
    borderRadius: 4,
    borderWidth: 1,
  },
  continueText: {
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
  },
});
