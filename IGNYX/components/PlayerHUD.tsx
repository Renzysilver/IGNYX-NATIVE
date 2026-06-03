import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassPanel } from './GlassPanel';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';
import type { ModuleId, ModuleState } from '../constants/gameState';

const MODULE_ORDER: ModuleId[] = [
  'kernel_core',
  'app_layer',
  'network',
  'data_system',
  'security',
  'ai_core',
];

const getDotColor = (module: ModuleState): string => {
  if (!module.unlocked) return Colors.dotOffline;
  if (module.integrity <= 25) return Colors.dotCritical;
  if (module.integrity <= 50) return Colors.dotWarning;
  if (module.stable) return Colors.cyanBright;
  return Colors.dotHealthy;
};

export const PlayerHUD: React.FC = () => {
  const operatorName = useGameStore((s) => s.operatorName);
  const operatorClass = useGameStore((s) => s.operatorClass);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const modules = useGameStore((s) => s.modules);
  const gameState = useGameStore((s) => s.gameState);

  // XP progress to next level
  const xpInLevel = xp % 500;
  const xpProgress = xpInLevel / 500;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Bottom left: Operator info + XP */}
      <View style={styles.leftHUD}>
        <GlassPanel>
          <Text style={styles.operatorName}>{operatorName}</Text>
          <Text style={[
            styles.operatorClass,
            { color: gameState === 'breakdown' ? Colors.purple : Colors.textDim },
          ]}>
            {operatorClass}
          </Text>
          <View style={styles.xpBarContainer}>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]} />
            </View>
            <Text style={styles.xpText}>LV{level}</Text>
          </View>
        </GlassPanel>
      </View>

      {/* Bottom right: Module health dots */}
      <View style={styles.rightHUD}>
        <GlassPanel>
          <View style={styles.dotsRow}>
            {MODULE_ORDER.map((id) => {
              const mod = modules[id];
              return (
                <View
                  key={id}
                  style={[styles.dot, { backgroundColor: getDotColor(mod) }]}
                />
              );
            })}
          </View>
        </GlassPanel>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 16,
    zIndex: 200,
  },
  leftHUD: {
    maxWidth: 160,
  },
  rightHUD: {
    maxWidth: 120,
  },
  operatorName: {
    color: Colors.textCyan,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  operatorClass: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  xpBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  xpBarBg: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.xpEmpty,
    borderRadius: 1,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.xpFill,
    borderRadius: 1,
  },
  xpText: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
