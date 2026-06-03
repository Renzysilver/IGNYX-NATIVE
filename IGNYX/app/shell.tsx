// IGNYX Shell Hub — Module 03 + Module 07 + Module 08 + Module 10
// The operator's command center. System status. Module navigation. Mission access.
// The circuit hum breathes here. The system lives here.

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ShellLayout } from '../components/ShellLayout';
import { GlassPanel } from '../components/GlassPanel';
import { Colors } from '../constants/colors';
import { useGameStore } from '../store/useGameStore';
import type { ModuleId } from '../constants/gameState';
import { MODULE_NAMES } from '../constants/gameState';
import { getNextMission } from '../constants/missions';
import { playAlert } from '../services/AudioEngine';
import { useSystemDegradation } from '../hooks/useSystemDegradation';
import { useRouter } from 'expo-router';

const MODULE_ORDER: ModuleId[] = ['kernel_core', 'app_layer', 'network', 'data_system', 'security', 'ai_core'];

const MODULE_ICONS: Record<ModuleId, string> = {
  kernel_core: '[KRN]',
  app_layer: '[APP]',
  network: '[NET]',
  data_system: '[DAT]',
  security: '[SEC]',
  ai_core: '[AIC]',
};

export default function ShellScreen() {
  const router = useRouter();
  const modules = useGameStore((s) => s.modules);
  const systemIntegrity = useGameStore((s) => s.systemIntegrity);
  const gameState = useGameStore((s) => s.gameState);
  const operatorName = useGameStore((s) => s.operatorName);
  const operatorClass = useGameStore((s) => s.operatorClass);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);

  // System degradation — the system decays while the operator hesitates
  useSystemDegradation();

  // Note: AudioEngine component in ShellLayout auto-syncs ambient to game state

  // Handle module tap
  const handleModulePress = useCallback((moduleId: ModuleId) => {
    const mod = modules[moduleId];
    if (!mod.unlocked) {
      playAlert();
      return;
    }

    const nextMission = getNextMission(moduleId, mod.missionsCompleted);
    if (nextMission) {
      router.push({ pathname: '/mission', params: { moduleId } });
    }
  }, [modules, router]);

  // Handle terminal tap
  const handleTerminalPress = useCallback(() => {
    router.push('/terminal');
  }, [router]);

  // Handle filesystem tap
  const handleFilesystemPress = useCallback(() => {
    router.push('/filesystem');
  }, [router]);

  // Handle settings tap
  const handleSettingsPress = useCallback(() => {
    router.push('/settings');
  }, [router]);

  // Get integrity bar color
  const getIntegrityColor = (): string => {
    if (systemIntegrity > 75) return Colors.textCyan;
    if (systemIntegrity > 50) return Colors.textAmber;
    if (systemIntegrity > 25) return Colors.textRed;
    return Colors.purple;
  };

  return (
    <ShellLayout>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* ── System Status Summary ── */}
        <GlassPanel active style={styles.statusPanel}>
          <Text style={styles.panelTitle}>SYSTEM STATUS</Text>
          <View style={styles.integrityRow}>
            <Text style={styles.integrityLabel}>INTEGRITY</Text>
            <View style={styles.integrityBarBg}>
              <View
                style={[
                  styles.integrityBarFill,
                  {
                    width: `${systemIntegrity}%`,
                    backgroundColor: getIntegrityColor(),
                  },
                ]}
              />
            </View>
            <Text style={[styles.integrityValue, { color: getIntegrityColor() }]}>
              {systemIntegrity}%
            </Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>STATE</Text>
            <Text style={[styles.stateValue, { color: getIntegrityColor() }]}>
              {gameState.toUpperCase()}
            </Text>
          </View>
        </GlassPanel>

        {/* ── Module Navigation Grid ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MODULES</Text>
        </View>

        <View style={styles.moduleGrid}>
          {MODULE_ORDER.map((moduleId) => {
            const mod = modules[moduleId];
            const hasMissions = mod.unlocked && mod.missionsCompleted < mod.totalMissions;
            const isLocked = !mod.unlocked;

            return (
              <TouchableOpacity
                key={moduleId}
                activeOpacity={0.7}
                onPress={() => handleModulePress(moduleId)}
                style={styles.moduleCardWrapper}
              >
                <GlassPanel
                  active={hasMissions}
                  style={[
                    styles.moduleCard,
                    isLocked && styles.moduleCardLocked,
                  ]}
                >
                  <View style={styles.moduleCardHeader}>
                    <Text style={styles.moduleIcon}>
                      {MODULE_ICONS[moduleId]}
                    </Text>
                    {isLocked && (
                      <Text style={styles.lockedTag}>LOCKED</Text>
                    )}
                    {mod.stable && (
                      <Text style={styles.stableTag}>STABLE</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.moduleName,
                      isLocked && styles.moduleNameLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {mod.name}
                  </Text>

                  {!isLocked && (
                    <View style={styles.moduleProgress}>
                      <View style={styles.moduleIntegrityBarBg}>
                        <View
                          style={[
                            styles.moduleIntegrityBarFill,
                            {
                              width: `${mod.integrity}%`,
                              backgroundColor:
                                mod.integrity > 70
                                  ? Colors.textCyan
                                  : mod.integrity > 40
                                  ? Colors.textAmber
                                  : Colors.textRed,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.moduleMissionCount}>
                        {mod.missionsCompleted}/{mod.totalMissions}
                      </Text>
                    </View>
                  )}
                </GlassPanel>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── System Tools ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SYSTEM TOOLS</Text>
        </View>

        <View style={styles.toolsRow}>
          {/* Terminal */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleTerminalPress}
            style={styles.toolButton}
          >
            <GlassPanel active style={styles.toolPanel}>
              <Text style={styles.toolIcon}>{'>'}_</Text>
              <Text style={styles.toolLabel}>TERMINAL</Text>
            </GlassPanel>
          </TouchableOpacity>

          {/* Filesystem Explorer */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleFilesystemPress}
            style={styles.toolButton}
          >
            <GlassPanel active style={styles.toolPanel}>
              <Text style={styles.toolIcon}>{'[FS]'}</Text>
              <Text style={styles.toolLabel}>FILES</Text>
            </GlassPanel>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSettingsPress}
            style={styles.toolButton}
          >
            <GlassPanel active style={styles.toolPanel}>
              <Text style={styles.toolIcon}>{'[CF]'}</Text>
              <Text style={styles.toolLabel}>CONFIG</Text>
            </GlassPanel>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ShellLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // Status panel
  statusPanel: {
    marginBottom: 16,
  },
  panelTitle: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 10,
  },
  integrityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  integrityLabel: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    width: 70,
  },
  integrityBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  integrityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  integrityValue: {
    fontSize: 13,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    width: 45,
    textAlign: 'right',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stateLabel: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    width: 70,
  },
  stateValue: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
  },

  // Section header
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
  },

  // Module grid (2 columns)
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  moduleCardWrapper: {
    width: '48%',
  },
  moduleCard: {
    minHeight: 80,
  },
  moduleCardLocked: {
    opacity: 0.4,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  moduleIcon: {
    color: Colors.textCyan,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  lockedTag: {
    color: Colors.textRed,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  stableTag: {
    color: '#50FA7B',
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  moduleName: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    marginBottom: 6,
  },
  moduleNameLocked: {
    color: Colors.textDim,
  },
  moduleProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleIntegrityBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  moduleIntegrityBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  moduleMissionCount: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // System tools row
  toolsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  toolButton: {
    flex: 1,
  },
  toolPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolIcon: {
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
  },
  toolLabel: {
    color: Colors.textCyan,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
  },
});
