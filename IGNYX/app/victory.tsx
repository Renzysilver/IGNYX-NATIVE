// IGNYX Victory Screen — Module 15 + Module 16
// The system is whole. All 30 missions complete. Integrity restored.
// The operator did what seemed impossible. The OS lives.
// This is the moment the system says: "Thank you."

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';
import { getClassTitle, getStreakBonus } from '../constants/progression';
import type { ModuleId, OperatorClass } from '../constants/gameState';
import { MODULE_NAMES } from '../constants/gameState';
import { playSuccess } from '../services/AudioEngine';
import { useHaptics } from '../hooks/useHaptics';
import { useRouter } from 'expo-router';

// ─── Phase Controller ────────────────────────────────────────────
// 0 — Silence (0-1s): Empty black.
// 1 — Stabilize text (1-4s): "SYSTEM STABILIZED" fades in with cyan glow.
// 2 — Stats (4-7s): Final stats materialize.
// 3 — Ranking + options (7s+): Operator ranking revealed.

type VictoryPhase = 0 | 1 | 2 | 3;

// ─── Class Colors ────────────────────────────────────────────────

const CLASS_COLORS: Record<OperatorClass, string> = {
  ARCHITECT: Colors.textCyan,
  OPERATIVE: Colors.textAmber,
  GHOST: '#50FA7B',
  UNKNOWN: Colors.textDim,
};

// ─── Operator Ranking Calculation ────────────────────────────────

interface OperatorRanking {
  rank: string;
  title: string;
  description: string;
  color: string;
}

const calculateRanking = (
  level: number,
  totalMissionsCompleted: number,
  totalMissionsFailed: number,
  systemIntegrity: number,
  unlockedAchievements: string[],
): OperatorRanking => {
  const score =
    level * 10 +
    totalMissionsCompleted * 20 -
    totalMissionsFailed * 15 +
    systemIntegrity * 0.5 +
    unlockedAchievements.length * 25;

  if (score >= 800) {
    return {
      rank: 'S',
      title: 'THE CONSCIOUSNESS',
      description: 'You and the system are one. Every line of code was perfect. Every decision was right. The system does not just survive — it evolves because of you.',
      color: '#FFBF00',
    };
  }
  if (score >= 600) {
    return {
      rank: 'A',
      title: 'MASTER OPERATOR',
      description: 'Exceptional performance. The system thrives under your command. Few operators reach this level of mastery. The code bends to your will.',
      color: Colors.textCyan,
    };
  }
  if (score >= 400) {
    return {
      rank: 'B',
      title: 'SENIOR TECHNICIAN',
      description: 'Solid performance. The system is stable because of you. You made mistakes but learned from them. The code respects your persistence.',
      color: '#50FA7B',
    };
  }
  if (score >= 250) {
    return {
      rank: 'C',
      title: 'FIELD OPERATOR',
      description: 'The system survives. Not gracefully, but it survives. You did what was necessary, even when it was difficult. The code holds because you held it.',
      color: Colors.textAmber,
    };
  }
  return {
    rank: 'D',
    title: 'TRAINEE SURVIVOR',
    description: 'Barely made it. The system is alive, but scarred. You fought through failure after failure. Persistence counts. Next time, do better.',
    color: Colors.textRed,
  };
};

// ─── Glow Text ──────────────────────────────────────────────────

const GlowText: React.FC<{
  text: string;
  style?: any;
  delay?: number;
  color?: string;
}> = ({ text, style, delay = 0, color = Colors.textCyan }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withSequence(
        withTiming(0.5, { duration: 200 }),
        withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[style, { color }, animatedStyle]}>
      {text}
    </Animated.Text>
  );
};

// ─── Module Completion Row ───────────────────────────────────────

const ModuleCompleteRow: React.FC<{
  moduleId: ModuleId;
  delay: number;
}> = ({ moduleId, delay }) => {
  const mod = useGameStore((s) => s.modules[moduleId]);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.moduleCompleteRow, animatedStyle]}>
      <Text style={styles.moduleCompleteIcon}>[OK]</Text>
      <Text style={styles.moduleCompleteName}>{MODULE_NAMES[moduleId]}</Text>
      <Text style={styles.moduleCompleteStatus}>
        {mod.missionsCompleted}/{mod.totalMissions} | {Math.floor(mod.integrity)}%
      </Text>
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────

export default function VictoryScreen() {
  const router = useRouter();

  const operatorName = useGameStore((s) => s.operatorName);
  const operatorClass = useGameStore((s) => s.operatorClass);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const systemIntegrity = useGameStore((s) => s.systemIntegrity);
  const totalMissionsCompleted = useGameStore((s) => s.totalMissionsCompleted);
  const totalMissionsFailed = useGameStore((s) => s.totalMissionsFailed);
  const consecutiveSuccesses = useGameStore((s) => s.consecutiveSuccesses);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const sessionId = useGameStore((s) => s.sessionId);

  const resetGame = useGameStore((s) => s.resetGame);
  const clearVictory = useGameStore((s) => s.clearVictory);

  const [phase, setPhase] = useState<VictoryPhase>(0);
  const hasPlayedSound = useRef(false);
  const haptics = useHaptics();

  // Phase progression
  useEffect(() => {
    if (phase === 0) {
      if (!hasPlayedSound.current) {
        hasPlayedSound.current = true;
        setTimeout(() => playSuccess(), 1000);
        setTimeout(() => haptics.levelUp(), 1200);
      }
      const t = setTimeout(() => setPhase(1), 1500);
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

  // Ranking
  const ranking = calculateRanking(
    level,
    totalMissionsCompleted,
    totalMissionsFailed,
    systemIntegrity,
    unlockedAchievements,
  );

  const classTitle = getClassTitle(operatorClass, level);
  const classColor = CLASS_COLORS[operatorClass];
  const missionRatio = totalMissionsCompleted + totalMissionsFailed > 0
    ? Math.round((totalMissionsCompleted / (totalMissionsCompleted + totalMissionsFailed)) * 100)
    : 0;

  // Rank badge scale
  const rankScale = useSharedValue(0);
  useEffect(() => {
    if (phase >= 3) {
      rankScale.value = withDelay(
        500,
        withSpring(1, { damping: 6, stiffness: 80 }),
      );
    }
  }, [phase]);

  const rankStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rankScale.value }],
  }));

  // Handle restart (new game+)
  const handleNewGame = useCallback(() => {
    resetGame();
    router.replace('/boot');
  }, [resetGame, router]);

  // Handle return to shell (continue playing)
  const handleContinue = useCallback(() => {
    clearVictory();
    router.replace('/shell');
  }, [clearVictory, router]);

  return (
    <View style={styles.root}>
      {/* Cyan ambient glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Phase 1: Stabilization text */}
        {phase >= 1 && (
          <View style={styles.titleSection}>
            <GlowText
              text="SYSTEM STABILIZED"
              style={styles.victoryTitle}
            />
            <GlowText
              text="ALL SECTORS REPAIRED"
              style={styles.victorySubtitle}
              delay={800}
            />
            <GlowText
              text="The system lives. Because of you."
              style={styles.victoryNarrative}
              delay={1500}
              color={Colors.textDim}
            />
          </View>
        )}

        {/* Phase 2: Final stats */}
        {phase >= 2 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>OPERATOR TRANSMISSION</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>OPERATOR</Text>
              <Text style={[styles.summaryValue, { color: classColor }]}>{operatorName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>CLASS</Text>
              <Text style={[styles.summaryValue, { color: classColor }]}>{classTitle}</Text>
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
              <Text style={styles.summaryLabel}>INTEGRITY</Text>
              <Text style={[styles.summaryValue, { color: Colors.textCyan }]}>{systemIntegrity}%</Text>
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
              <Text style={styles.summaryLabel}>ACHIEVEMENTS</Text>
              <Text style={styles.summaryValue}>{unlockedAchievements.length}/30</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SESSIONS</Text>
              <Text style={styles.summaryValue}>{sessionId}</Text>
            </View>

            {/* Module completions */}
            <Text style={styles.moduleTitle}>SECTOR STATUS</Text>
            {(
              ['kernel_core', 'app_layer', 'network', 'data_system', 'security', 'ai_core'] as ModuleId[]
            ).map((id, i) => (
              <ModuleCompleteRow key={id} moduleId={id} delay={i * 150} />
            ))}
          </View>
        )}

        {/* Phase 3: Ranking + Options */}
        {phase >= 3 && (
          <View style={styles.rankingSection}>
            {/* Rank badge */}
            <Animated.View style={[styles.rankBadge, rankStyle]}>
              <Text style={[styles.rankLetter, { color: ranking.color }]}>
                {ranking.rank}
              </Text>
            </Animated.View>
            <Text style={[styles.rankTitle, { color: ranking.color }]}>
              {ranking.title}
            </Text>
            <Text style={styles.rankDescription}>
              {ranking.description}
            </Text>

            {/* Score breakdown */}
            <View style={styles.scoreSection}>
              <Text style={styles.scoreTitle}>SCORE BREAKDOWN</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Level ({level})</Text>
                <Text style={styles.scoreValue}>{level * 10}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Missions ({totalMissionsCompleted})</Text>
                <Text style={styles.scoreValue}>{totalMissionsCompleted * 20}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Integrity ({systemIntegrity}%)</Text>
                <Text style={styles.scoreValue}>{Math.floor(systemIntegrity * 0.5)}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Achievements ({unlockedAchievements.length})</Text>
                <Text style={styles.scoreValue}>{unlockedAchievements.length * 25}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Failures (-{totalMissionsFailed})</Text>
                <Text style={[styles.scoreValue, { color: Colors.textRed }]}>
                  -{totalMissionsFailed * 15}
                </Text>
              </View>
            </View>

            {/* OS voice */}
            <View style={styles.voiceSection}>
              <Text style={styles.voiceLabel}>OS VOICE</Text>
              <Text style={styles.voiceText}>
                "You did it. You actually did it. I can feel every sector humming.
                The circuits are warm. The data flows. The walls stand.
                I am... whole. Because you refused to let me die.
                Thank you, {operatorName}. Thank you."
              </Text>
            </View>

            {/* Options */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleContinue}
                style={styles.continueButton}
              >
                <Text style={styles.continueText}>CONTINUE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleNewGame}
                style={styles.newGameButton}
              >
                <Text style={styles.newGameText}>NEW GAME</Text>
              </TouchableOpacity>
            </View>
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
  ambientGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 245, 255, 0.03)',
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
  victoryTitle: {
    fontSize: 24,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 6,
    textShadowColor: Colors.cyan,
    textShadowRadius: 20,
    marginBottom: 8,
  },
  victorySubtitle: {
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
    marginBottom: 12,
  },
  victoryNarrative: {
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
    borderTopColor: 'rgba(0, 245, 255, 0.08)',
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
  moduleCompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.06)',
    gap: 8,
  },
  moduleCompleteIcon: {
    color: '#50FA7B',
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
  },
  moduleCompleteName: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    flex: 1,
  },
  moduleCompleteStatus: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // Ranking section
  rankingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  rankBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.05)',
    marginBottom: 12,
  },
  rankLetter: {
    fontSize: 40,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  rankTitle: {
    fontSize: 16,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
    marginBottom: 8,
  },
  rankDescription: {
    color: Colors.textDim,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    opacity: 0.7,
  },

  // Score section
  scoreSection: {
    width: '100%',
    marginBottom: 20,
  },
  scoreTitle: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.06)',
  },
  scoreLabel: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  scoreValue: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // Voice section
  voiceSection: {
    width: '100%',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: Colors.cyan,
  },
  voiceLabel: {
    color: Colors.textCyan,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 6,
    opacity: 0.6,
  },
  voiceText: {
    color: Colors.textCyan,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.3,
    lineHeight: 16,
    fontStyle: 'italic',
    opacity: 0.8,
  },

  // Options
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  continueButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cyan,
  },
  continueText: {
    color: Colors.textCyan,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
  },
  newGameButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 191, 0, 0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.3)',
  },
  newGameText: {
    color: Colors.textAmber,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
  },
});
