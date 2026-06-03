// IGNYX MissionBriefing — Module 09
// The moment before the storm. The operator sees what's broken. They choose to engage.
// Every briefing is a contract: the system promises a problem, the operator promises to try.

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { GlassPanel } from './GlassPanel';
import { Colors } from '../constants/colors';
import type { Mission } from '../constants/missions';
import type { ModuleId } from '../constants/gameState';
import { MODULE_NAMES } from '../constants/gameState';

// ─── Types ─────────────────────────────────────────────────────

interface MissionBriefingProps {
  /** The mission to brief */
  mission: Mission;
  /** Callback when operator accepts the mission */
  onAccept: () => void;
  /** Callback when operator retreats */
  onRetreat: () => void;
}

// ─── Module color mapping ──────────────────────────────────────

const MODULE_COLORS: Record<ModuleId, string> = {
  kernel_core: Colors.textCyan,
  app_layer: Colors.textAmber,
  network: '#50FA7B',
  data_system: '#BD93F9',
  security: Colors.textRed,
  ai_core: '#8B00FF',
};

// ─── Component ─────────────────────────────────────────────────

export const MissionBriefing: React.FC<MissionBriefingProps> = memo(({
  mission,
  onAccept,
  onRetreat,
}) => {
  const moduleColor = MODULE_COLORS[mission.moduleId] || Colors.textCyan;
  const minutes = Math.floor(mission.timerSeconds / 60);
  const seconds = mission.timerSeconds % 60;
  const timerDisplay = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Mission Header ── */}
        <View style={styles.header}>
          <Text style={[styles.moduleTag, { color: moduleColor }]}>
            {MODULE_NAMES[mission.moduleId]}
          </Text>
          <Text style={styles.missionId}>{mission.id}</Text>
        </View>

        <Text style={styles.title}>{mission.title}</Text>

        {/* ── Alert Line ── */}
        <GlassPanel style={styles.alertPanel}>
          <Text style={styles.alertIcon}>{'//!'}</Text>
          <Text style={[styles.alertText, { color: Colors.textAmber }]}>
            {mission.alert}
          </Text>
        </GlassPanel>

        {/* ── Briefing ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BRIEFING</Text>
          <Text style={styles.briefingText}>{mission.briefing}</Text>
        </View>

        {/* ── Objective ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OBJECTIVE</Text>
          <Text style={styles.objectiveText}>{mission.objective}</Text>
        </View>

        {/* ── Mission Parameters ── */}
        <View style={styles.parametersRow}>
          <View style={styles.parameter}>
            <Text style={styles.paramLabel}>TIME LIMIT</Text>
            <Text style={[styles.paramValue, { color: moduleColor }]}>{timerDisplay}</Text>
          </View>
          <View style={styles.parameter}>
            <Text style={styles.paramLabel}>LANGUAGE</Text>
            <Text style={[styles.paramValue, { color: moduleColor }]}>{mission.language.toUpperCase()}</Text>
          </View>
          <View style={styles.parameter}>
            <Text style={styles.paramLabel}>XP REWARD</Text>
            <Text style={[styles.paramValue, { color: moduleColor }]}>{mission.xpReward}</Text>
          </View>
        </View>

        {/* ── Stakes ── */}
        <View style={styles.stakesContainer}>
          <View style={styles.stakeRow}>
            <Text style={styles.stakeLabel}>ON SUCCESS</Text>
            <Text style={[styles.stakeValue, { color: '#50FA7B' }]}>
              +{mission.integrityGain}% INTEGRITY
            </Text>
          </View>
          <View style={styles.stakeRow}>
            <Text style={styles.stakeLabel}>ON FAILURE</Text>
            <Text style={[styles.stakeValue, { color: Colors.textRed }]}>
              -{mission.integrityLoss}% INTEGRITY
            </Text>
          </View>
          <View style={styles.stakeRow}>
            <Text style={styles.stakeLabel}>ON TIMEOUT</Text>
            <Text style={[styles.stakeValue, { color: '#8B0000' }]}>
              -{mission.timeoutIntegrityLoss}% INTEGRITY
            </Text>
          </View>
        </View>

        {/* ── Code Preview ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CORRUPTED CODE</Text>
          <GlassPanel style={styles.codePreview}>
            {mission.brokenCode.split('\n').map((line, i) => (
              <View key={i} style={styles.codeLine}>
                <Text style={styles.lineNumber}>
                  {String(i + 1).padStart(2, ' ')}
                </Text>
                <Text style={styles.codeText}>{line || ' '}</Text>
              </View>
            ))}
          </GlassPanel>
        </View>

        {/* ── OS Voice Line ── */}
        {mission.osVoiceLine && (
          <View style={styles.osVoiceContainer}>
            <Text style={styles.osVoiceLabel}>OS VOICE</Text>
            <Text style={styles.osVoiceText}>{mission.osVoiceLine}</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Action Buttons ── */}
      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={onRetreat}
          style={styles.retreatButton}
        >
          <Text style={styles.retreatText}>RETREAT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAccept}
          style={styles.acceptButton}
        >
          <View style={[styles.acceptPanel, { borderColor: moduleColor }]}>
            <Text style={[styles.acceptText, { color: moduleColor }]}>
              ENGAGE
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

MissionBriefing.displayName = 'MissionBriefing';

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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  moduleTag: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  missionId: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    letterSpacing: 4,
    marginBottom: 12,
  },

  // Alert panel
  alertPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  alertIcon: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textAmber,
  },
  alertText: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    lineHeight: 15,
    flex: 1,
  },

  // Sections
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 3,
    marginBottom: 6,
  },
  briefingText: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  objectiveText: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textCyan,
    lineHeight: 18,
    letterSpacing: 0.3,
  },

  // Parameters
  parametersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  parameter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.08)',
  },
  paramLabel: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 2,
    marginBottom: 4,
  },
  paramValue: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // Stakes
  stakesContainer: {
    marginBottom: 14,
    gap: 4,
  },
  stakeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  stakeLabel: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 2,
  },
  stakeValue: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // Code preview
  codePreview: {
    paddingVertical: 8,
  },
  codeLine: {
    flexDirection: 'row',
    gap: 8,
  },
  lineNumber: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    width: 20,
    textAlign: 'right',
  },
  codeText: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textRed,
    lineHeight: 16,
  },

  // OS Voice
  osVoiceContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.purple,
    backgroundColor: 'rgba(139, 0, 255, 0.05)',
    marginBottom: 8,
  },
  osVoiceLabel: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: '#8B00FF',
    letterSpacing: 2,
    marginBottom: 4,
  },
  osVoiceText: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: 'rgba(139, 0, 255, 0.7)',
    letterSpacing: 1,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.06)',
  },
  retreatButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retreatText: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 2,
  },
  acceptButton: {
    flex: 1,
  },
  acceptPanel: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 245, 255, 0.06)',
    borderRadius: 4,
    borderWidth: 1,
  },
  acceptText: {
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 5,
  },
});
