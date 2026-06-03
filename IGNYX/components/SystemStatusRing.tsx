import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DimensionValue } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';
import type { ModuleId, ModuleState } from '../constants/gameState';

export const SystemStatusRing: React.FC = () => {
  const systemIntegrity = useGameStore((s) => s.systemIntegrity);
  const gameState = useGameStore((s) => s.gameState);
  const modules = useGameStore((s) => s.modules);

  // Find the current active module (first unlocked with incomplete missions)
  const activeModule = Object.values(modules as Record<ModuleId, ModuleState>).find(
    (m: ModuleState) => m.unlocked && m.missionsCompleted < m.totalMissions
  );

  const integrityColor = gameState === 'normal' ? Colors.textCyan
    : gameState === 'warning' ? Colors.textAmber
    : gameState === 'critical' ? Colors.textRed
    : Colors.purple;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Integrity bar */}
        <View style={styles.integrityBar}>
          <View style={[styles.integrityFill, { width: `${systemIntegrity}%` as DimensionValue, backgroundColor: integrityColor }]} />
        </View>
        <Text style={[styles.integrityText, { color: integrityColor }]}>
          {systemIntegrity}%
        </Text>
      </View>

      {/* Module name */}
      {activeModule && (
        <Text style={styles.moduleName}>
          {activeModule.name}
        </Text>
      )}

      {/* Mission tag */}
      <Text style={styles.missionTag}>
        {activeModule ? `SECTOR ACTIVE` : 'NO ACTIVE MISSION'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  integrityBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  integrityFill: {
    height: '100%',
    borderRadius: 1,
  },
  integrityText: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    minWidth: 32,
  },
  moduleName: {
    color: Colors.textDim,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    marginTop: 4,
  },
  missionTag: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1.5,
    marginTop: 2,
    opacity: 0.6,
  },
});
