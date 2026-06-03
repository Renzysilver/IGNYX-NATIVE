// IGNYX Player HUD — Module 11
// The operator's status at a glance. Level. XP. Streak. Class.
// Every pixel of this bar tells a story of progression.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassPanel } from './GlassPanel';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';
import { getXPProgress, getStreakBonus, getClassTitle } from '../constants/progression';
import type { ModuleId, ModuleState, OperatorClass } from '../constants/gameState';

const MODULE_ORDER: ModuleId[] = [
  'kernel_core',
  'app_layer',
  'network',
  'data_system',
  'security',
  'ai_core',
];

// Class-specific accent colors for the level badge
const CLASS_COLORS: Record<OperatorClass, string> = {
  ARCHITECT: Colors.textCyan,
  OPERATIVE: Colors.textAmber,
  GHOST: '#50FA7B',
  UNKNOWN: Colors.textDim,
};

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
  const consecutiveSuccesses = useGameStore((s) => s.consecutiveSuccesses);

  // XP progress within current level (Module 11: uses proper curve)
  const xpProgress = getXPProgress(xp);
  const streak = getStreakBonus(consecutiveSuccesses);
  const classTitle = getClassTitle(operatorClass, level);
  const classColor = CLASS_COLORS[operatorClass] || Colors.textDim;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Bottom left: Operator info + XP */}
      <View style={styles.leftHUD}>
        <GlassPanel>
          {/* Operator name + class title */}
          <Text style={styles.operatorName}>{operatorName}</Text>
          <Text style={[
            styles.operatorClass,
            { color: gameState === 'breakdown' ? Colors.purple : classColor },
          ]}>
            {operatorClass !== 'UNKNOWN' ? classTitle : operatorClass}
          </Text>

          {/* Level badge with class color */}
          <View style={styles.levelRow}>
            <View style={[styles.levelBadge, { borderColor: classColor }]}>
              <Text style={[styles.levelText, { color: classColor }]}>{level}</Text>
            </View>

            {/* XP bar with numeric display */}
            <View style={styles.xpBarContainer}>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, {
                  width: `${xpProgress.progress * 100}%`,
                  backgroundColor: classColor,
                }]} />
              </View>
              <Text style={styles.xpText}>
                {xpProgress.current}/{xpProgress.required}
              </Text>
            </View>
          </View>

          {/* Streak indicator */}
          {consecutiveSuccesses >= 3 && (
            <View style={styles.streakRow}>
              <Text style={[styles.streakIcon, { color: streak.multiplier >= 2 ? Colors.textAmber : Colors.textCyan }]}>
                {streak.multiplier >= 2 ? '>>>' : streak.multiplier >= 1.75 ? '>>' : '>'}
              </Text>
              <Text style={[styles.streakLabel, { color: streak.multiplier >= 2 ? Colors.textAmber : Colors.textCyan }]}>
                {streak.label}
              </Text>
              <Text style={styles.streakCount}>
                x{consecutiveSuccesses}
              </Text>
            </View>
          )}
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
    maxWidth: 180,
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
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 6,
  },
  levelBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0,
  },
  xpBarContainer: {
    flex: 1,
    gap: 2,
  },
  xpBarBg: {
    height: 3,
    backgroundColor: Colors.xpEmpty,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  xpText: {
    color: Colors.textDim,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  streakIcon: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  streakLabel: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1.5,
  },
  streakCount: {
    color: Colors.textDim,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
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
