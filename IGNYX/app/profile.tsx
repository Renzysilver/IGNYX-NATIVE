// IGNYX Operator Profile Screen — Module 14
// The operator's dossier. Every stat. Every milestone. Every scar.
// Class title. XP curve. Mission ratio. Streak history. Module breakdown.
// The system knows who you are. Now you will too.

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { DimensionValue } from 'react-native';
import { ShellLayout } from '../components/ShellLayout';
import { GlassPanel } from '../components/GlassPanel';
import { Colors } from '../constants/colors';
import { useGameStore } from '../store/useGameStore';
import {
  getXPProgress,
  getStreakBonus,
  getClassTitle,
  getClassBonus,
  getMilestonesForLevel,
  MILESTONES,
  getTotalXPForLevel,
} from '../constants/progression';
import type { OperatorClass, ModuleId } from '../constants/gameState';
import { MODULE_NAMES } from '../constants/gameState';
import { useRouter } from 'expo-router';

// ─── Class Accent Colors ─────────────────────────────────────────

const CLASS_COLORS: Record<OperatorClass, string> = {
  ARCHITECT: Colors.textCyan,
  OPERATIVE: Colors.textAmber,
  GHOST: '#50FA7B',
  UNKNOWN: Colors.textDim,
};

const CLASS_DESCRIPTIONS: Record<OperatorClass, string> = {
  ARCHITECT: 'You understand the foundations. The kernel bends to your logic. System design is your language.',
  OPERATIVE: 'You move fast and precise. The application layer is your domain. Efficiency is your weapon.',
  GHOST: 'You exist in the shadows. Security and networks yield to your touch. Stealth is your nature.',
  UNKNOWN: 'You operate outside classification. The system cannot predict you. You are the variable.',
};

const CLASS_ICONS: Record<OperatorClass, string> = {
  ARCHITECT: '[ARC]',
  OPERATIVE: '[OPS]',
  GHOST: '[GHO]',
  UNKNOWN: '[???]',
};

// ─── Module Order ────────────────────────────────────────────────

const MODULE_ORDER: ModuleId[] = [
  'kernel_core', 'app_layer', 'network', 'data_system', 'security', 'ai_core',
];

// ─── XP Curve Visualization ──────────────────────────────────────
// A simple bar chart showing XP required per level (last 10 levels)

const XPCurve: React.FC<{ currentLevel: number }> = ({ currentLevel }) => {
  const startLevel = Math.max(1, currentLevel - 4);
  const endLevel = Math.min(30, currentLevel + 5);
  const bars: { level: number; xp: number; isCurrent: boolean }[] = [];

  let maxXP = 0;
  for (let l = startLevel; l <= endLevel; l++) {
    const xp = getTotalXPForLevel(l);
    if (xp > maxXP) maxXP = xp;
    bars.push({ level: l, xp, isCurrent: l === currentLevel });
  }

  return (
    <View style={styles.xpCurveContainer}>
      <Text style={styles.xpCurveTitle}>XP CURVE</Text>
      <View style={styles.xpCurveBars}>
        {bars.map((bar) => {
          const heightPct = maxXP > 0 ? (bar.xp / maxXP) * 100 : 0;
          const color = bar.isCurrent ? Colors.textCyan : 'rgba(0, 245, 255, 0.2)';
          return (
            <View key={bar.level} style={styles.xpCurveBarWrapper}>
              <View style={styles.xpCurveBarTrack}>
                <View
                  style={[
                    styles.xpCurveBarFill,
                    {
                      height: `${heightPct}%` as DimensionValue,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.xpCurveBarLabel, bar.isCurrent && { color: Colors.textCyan }]}>
                {bar.level}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ─── Module Breakdown Row ────────────────────────────────────────

const ModuleRow: React.FC<{
  moduleId: ModuleId;
  operatorClass: OperatorClass;
}> = ({ moduleId, operatorClass }) => {
  const mod = useGameStore((s) => s.modules[moduleId]);
  const classBonus = getClassBonus(operatorClass, moduleId);
  const integrityColor =
    mod.integrity > 70 ? Colors.textCyan
    : mod.integrity > 40 ? Colors.textAmber
    : mod.integrity > 15 ? Colors.textRed
    : Colors.purple;

  return (
    <View style={styles.moduleRow}>
      <View style={styles.moduleRowHeader}>
        <Text style={[styles.moduleRowName, !mod.unlocked && { opacity: 0.3 }]}>
          {MODULE_NAMES[moduleId]}
        </Text>
        <View style={styles.moduleRowTags}>
          {!mod.unlocked && <Text style={styles.moduleRowTagLocked}>LOCKED</Text>}
          {mod.stable && <Text style={styles.moduleRowTagStable}>STABLE</Text>}
          {classBonus > 0 && (
            <Text style={styles.moduleRowTagBonus}>+{Math.floor(classBonus * 100)}% XP</Text>
          )}
        </View>
      </View>

      {mod.unlocked && (
        <View style={styles.moduleRowProgress}>
          {/* Integrity bar */}
          <View style={styles.moduleRowIntegrityBg}>
            <View
              style={[
                styles.moduleRowIntegrityFill,
                { width: `${mod.integrity}%` as DimensionValue, backgroundColor: integrityColor },
              ]}
            />
          </View>
          <Text style={[styles.moduleRowIntegrityText, { color: integrityColor }]}>
            {Math.floor(mod.integrity)}%
          </Text>
          <Text style={styles.moduleRowMissionCount}>
            {mod.missionsCompleted}/{mod.totalMissions}
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();

  const operatorName = useGameStore((s) => s.operatorName);
  const operatorClass = useGameStore((s) => s.operatorClass);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const systemIntegrity = useGameStore((s) => s.systemIntegrity);
  const gameState = useGameStore((s) => s.gameState);
  const totalMissionsCompleted = useGameStore((s) => s.totalMissionsCompleted);
  const totalMissionsFailed = useGameStore((s) => s.totalMissionsFailed);
  const consecutiveSuccesses = useGameStore((s) => s.consecutiveSuccesses);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const revealedFiles = useGameStore((s) => s.revealedFiles);
  const sessionId = useGameStore((s) => s.sessionId);

  const classColor = CLASS_COLORS[operatorClass];
  const classTitle = getClassTitle(operatorClass, level);
  const xpProgress = getXPProgress(xp);
  const streak = getStreakBonus(consecutiveSuccesses);

  // Derived stats
  const missionRatio = totalMissionsCompleted + totalMissionsFailed > 0
    ? Math.round((totalMissionsCompleted / (totalMissionsCompleted + totalMissionsFailed)) * 100)
    : 0;

  const nextMilestones = useMemo(() => {
    // Find next 3 upcoming milestones
    return MILESTONES.filter((m) => m.level > level).slice(0, 3);
  }, [level]);

  const achievedMilestones = useMemo(() => {
    return MILESTONES.filter((m) => m.level <= level);
  }, [level]);

  const integrityColor =
    systemIntegrity > 75 ? Colors.textCyan
    : systemIntegrity > 50 ? Colors.textAmber
    : systemIntegrity > 25 ? Colors.textRed
    : Colors.purple;

  return (
    <ShellLayout>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>OPERATOR PROFILE</Text>
          <Text onPress={() => router.back()} style={styles.backText}>
            BACK
          </Text>
        </View>

        {/* ── Identity Card ── */}
        <GlassPanel active style={styles.identityCard}>
          <View style={styles.identityTop}>
            <View style={styles.identityIcon}>
              <Text style={[styles.classIcon, { color: classColor }]}>
                {CLASS_ICONS[operatorClass]}
              </Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.operatorName}>{operatorName || 'UNASSIGNED'}</Text>
              <Text style={[styles.classTitle, { color: classColor }]}>{classTitle}</Text>
              <Text style={styles.classLabel}>{operatorClass} CLASS</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={[styles.levelNumber, { color: classColor }]}>{level}</Text>
              <Text style={styles.levelLabel}>LEVEL</Text>
            </View>
          </View>

          {/* XP Progress bar */}
          <View style={styles.xpBarSection}>
            <View style={styles.xpBarLabels}>
              <Text style={styles.xpBarLabelLeft}>XP</Text>
              <Text style={styles.xpBarLabelRight}>
                {xpProgress.current}/{xpProgress.required}
              </Text>
            </View>
            <View style={styles.xpBarBg}>
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${xpProgress.progress * 100}%` as DimensionValue, backgroundColor: classColor },
                ]}
              />
            </View>
          </View>

          {/* Class description */}
          <Text style={styles.classDescription}>
            {CLASS_DESCRIPTIONS[operatorClass]}
          </Text>
        </GlassPanel>

        {/* ── Core Stats ── */}
        <GlassPanel active style={styles.section}>
          <Text style={styles.sectionTitle}>CORE STATISTICS</Text>
          <View style={styles.statGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statCellValue}>{totalMissionsCompleted}</Text>
              <Text style={styles.statCellLabel}>MISSIONS OK</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statCellValue, { color: Colors.textRed }]}>{totalMissionsFailed}</Text>
              <Text style={styles.statCellLabel}>MISSIONS FAIL</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statCellValue}>{missionRatio}%</Text>
              <Text style={styles.statCellLabel}>SUCCESS RATE</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statCellValue, { color: integrityColor }]}>{systemIntegrity}%</Text>
              <Text style={styles.statCellLabel}>INTEGRITY</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statCellValue}>{xp}</Text>
              <Text style={styles.statCellLabel}>TOTAL XP</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statCellValue}>{sessionId}</Text>
              <Text style={styles.statCellLabel}>SESSIONS</Text>
            </View>
          </View>
        </GlassPanel>

        {/* ── Streak ── */}
        <GlassPanel active={consecutiveSuccesses >= 3} style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVE STREAK</Text>
          <View style={styles.streakDisplay}>
            <Text style={[styles.streakCount, { color: classColor }]}>
              {consecutiveSuccesses}
            </Text>
            <View style={styles.streakInfo}>
              <Text style={[styles.streakLabel, { color: classColor }]}>
                {streak.label || 'NO ACTIVE STREAK'}
              </Text>
              {streak.multiplier > 1 && (
                <Text style={styles.streakMultiplier}>
                  {streak.multiplier}x XP MULTIPLIER
                </Text>
              )}
            </View>
          </View>
          {consecutiveSuccesses < 3 && (
            <Text style={styles.streakHint}>
              Complete 3 missions in a row to activate a streak bonus.
            </Text>
          )}
        </GlassPanel>

        {/* ── Exploration ── */}
        <GlassPanel active style={styles.section}>
          <Text style={styles.sectionTitle}>EXPLORATION</Text>
          <View style={styles.explorationRow}>
            <Text style={styles.explorationLabel}>FILES REVEALED</Text>
            <Text style={styles.explorationValue}>{revealedFiles.length}</Text>
          </View>
          <View style={styles.explorationRow}>
            <Text style={styles.explorationLabel}>ACHIEVEMENTS</Text>
            <Text style={styles.explorationValue}>{unlockedAchievements.length}/30</Text>
          </View>
          <View style={styles.explorationRow}>
            <Text style={styles.explorationLabel}>SYSTEM STATE</Text>
            <Text style={[styles.explorationValue, { color: integrityColor }]}>
              {gameState.toUpperCase()}
            </Text>
          </View>
        </GlassPanel>

        {/* ── Module Breakdown ── */}
        <GlassPanel active style={styles.section}>
          <Text style={styles.sectionTitle}>MODULE BREAKDOWN</Text>
          <Text style={styles.sectionDesc}>
            Your class gains bonus XP in highlighted modules.
          </Text>
          {MODULE_ORDER.map((id) => (
            <ModuleRow key={id} moduleId={id} operatorClass={operatorClass} />
          ))}
        </GlassPanel>

        {/* ── XP Curve ── */}
        <GlassPanel active style={styles.section}>
          <XPCurve currentLevel={level} />
        </GlassPanel>

        {/* ── Milestones ── */}
        <GlassPanel active style={styles.section}>
          <Text style={styles.sectionTitle}>MILESTONES</Text>

          {/* Achieved milestones */}
          {achievedMilestones.length > 0 && (
            <View style={styles.milestoneGroup}>
              <Text style={styles.milestoneGroupLabel}>EARNED</Text>
              {achievedMilestones.slice(-3).map((m, i) => (
                <View key={`earned-${i}`} style={styles.milestoneRow}>
                  <Text style={styles.milestoneIconEarned}>
                    {m.type === 'integrity' ? '[+]' : m.type === 'title' ? '[*]' : m.type === 'xp' ? '[XP]' : '[~]'}
                  </Text>
                  <View style={styles.milestoneTextContainer}>
                    <Text style={styles.milestoneTitleEarned}>LEVEL {m.level}</Text>
                    <Text style={styles.milestoneDescEarned}>{m.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Next milestones */}
          {nextMilestones.length > 0 && (
            <View style={styles.milestoneGroup}>
              <Text style={styles.milestoneGroupLabel}>UPCOMING</Text>
              {nextMilestones.map((m, i) => (
                <View key={`next-${i}`} style={styles.milestoneRow}>
                  <Text style={styles.milestoneIconNext}>
                    {m.type === 'integrity' ? '[+]' : m.type === 'title' ? '[*]' : m.type === 'xp' ? '[XP]' : '[~]'}
                  </Text>
                  <View style={styles.milestoneTextContainer}>
                    <Text style={styles.milestoneTitleNext}>LEVEL {m.level}</Text>
                    <Text style={styles.milestoneDescNext}>{m.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassPanel>
      </ScrollView>
    </ShellLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
  },
  backText: {
    color: Colors.textDim,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  // Identity card
  identityCard: {
    marginBottom: 12,
  },
  identityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  identityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.05)',
  },
  classIcon: {
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  identityInfo: {
    flex: 1,
  },
  operatorName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  classTitle: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    marginTop: 2,
  },
  classLabel: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    marginTop: 1,
  },
  levelBadge: {
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 28,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  levelLabel: {
    color: Colors.textDim,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginTop: -2,
  },

  // XP bar
  xpBarSection: {
    marginBottom: 10,
  },
  xpBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  xpBarLabelLeft: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  xpBarLabelRight: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  xpBarBg: {
    height: 4,
    backgroundColor: Colors.xpEmpty,
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Class description
  classDescription: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    lineHeight: 14,
    opacity: 0.7,
  },

  // Section
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 8,
  },
  sectionDesc: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    marginBottom: 8,
    opacity: 0.5,
  },

  // Stat grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  statCell: {
    width: '33%',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 245, 255, 0.02)',
    borderRadius: 3,
  },
  statCellValue: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  statCellLabel: {
    color: Colors.textDim,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1.5,
    marginTop: 2,
  },

  // Streak
  streakDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakCount: {
    fontSize: 36,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  streakMultiplier: {
    color: Colors.textAmber,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    marginTop: 2,
  },
  streakHint: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    marginTop: 6,
    opacity: 0.5,
  },

  // Exploration
  explorationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.06)',
  },
  explorationLabel: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  explorationValue: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // Module row
  moduleRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.06)',
  },
  moduleRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  moduleRowName: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  moduleRowTags: {
    flexDirection: 'row',
    gap: 6,
  },
  moduleRowTagLocked: {
    color: Colors.textRed,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  moduleRowTagStable: {
    color: '#50FA7B',
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  moduleRowTagBonus: {
    color: Colors.textAmber,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  moduleRowProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleRowIntegrityBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  moduleRowIntegrityFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  moduleRowIntegrityText: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    width: 35,
  },
  moduleRowMissionCount: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    width: 30,
    textAlign: 'right',
  },

  // XP Curve
  xpCurveContainer: {
    alignItems: 'center',
  },
  xpCurveTitle: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  xpCurveBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 4,
    width: '100%',
  },
  xpCurveBarWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  xpCurveBarTrack: {
    width: '100%',
    height: 50,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 245, 255, 0.03)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpCurveBarFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 2,
  },
  xpCurveBarLabel: {
    color: Colors.textDim,
    fontSize: 6,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    marginTop: 3,
  },

  // Milestones
  milestoneGroup: {
    marginBottom: 10,
  },
  milestoneGroupLabel: {
    color: Colors.textDim,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 6,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.04)',
  },
  milestoneIconEarned: {
    color: Colors.textCyan,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  milestoneIconNext: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    opacity: 0.4,
  },
  milestoneTextContainer: {
    flex: 1,
  },
  milestoneTitleEarned: {
    color: Colors.textCyan,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  milestoneDescEarned: {
    color: Colors.textPrimary,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.3,
    opacity: 0.7,
    lineHeight: 12,
    marginTop: 1,
  },
  milestoneTitleNext: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    opacity: 0.5,
  },
  milestoneDescNext: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.3,
    opacity: 0.3,
    lineHeight: 12,
    marginTop: 1,
  },
});
