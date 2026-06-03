// IGNYX Progression Hook — Module 11
// The bridge between game state and the progression engine.
// Calculates XP, detects level-ups, triggers milestones.
// The system grows with every mission. The operator evolves.

import { useCallback, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  calculateXPGain,
  getXPProgress,
  getLevelFromXP,
  getMilestonesForLevel,
  getStreakBonus,
  getClassTitle,
  type XPBreakdown,
  type MilestoneReward,
} from '../constants/progression';
import type { OperatorClass, ModuleId } from '../constants/gameState';
import { AlertOverlayManager } from '../components/AlertOverlay';
import { Colors } from '../constants/colors';
import { playSuccess, playAlert } from '../services/AudioEngine';

// ─── Hook Return Type ──────────────────────────────────────────

interface ProgressionState {
  /** Current level */
  level: number;
  /** Current XP total */
  xp: number;
  /** XP progress within current level */
  xpProgress: { current: number; required: number; progress: number };
  /** Operator class */
  operatorClass: OperatorClass;
  /** Class title for current level */
  classTitle: string;
  /** Current streak info */
  streak: { multiplier: number; label: string; count: number };
  /** Preview XP for a mission (doesn't apply it) */
  previewXP: (
    baseXP: number,
    moduleId: ModuleId,
    timeRemainingFraction: number,
  ) => XPBreakdown;
  /** Apply XP gain and handle level-up + milestones */
  applyXPGain: (
    breakdown: XPBreakdown,
  ) => void;
  /** Clear level-up notification state */
  clearLevelUp: () => void;
}

// ─── Level-up State Tracker ────────────────────────────────────

interface LevelUpState {
  justLeveledUp: boolean;
  newLevel: number | null;
  milestones: MilestoneReward[];
}

// ─── Hook ──────────────────────────────────────────────────────

export function useProgression(): ProgressionState {
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const operatorClass = useGameStore((s) => s.operatorClass);
  const consecutiveSuccesses = useGameStore((s) => s.consecutiveSuccesses);
  const addXP = useGameStore((s) => s.addXP);
  const restoreIntegrity = useGameStore((s) => s.restoreIntegrity);
  const revealFile = useGameStore((s) => s.revealFile);

  // Level-up tracking via ref (not React state — avoid re-renders)
  const levelUpState = useRef<LevelUpState>({
    justLeveledUp: false,
    newLevel: null,
    milestones: [],
  });

  // Computed values
  const xpProgress = getXPProgress(xp);
  const streak = getStreakBonus(consecutiveSuccesses);
  const classTitle = getClassTitle(operatorClass, level);

  // Preview XP for a mission (no side effects)
  const previewXP = useCallback(
    (baseXP: number, moduleId: ModuleId, timeRemainingFraction: number): XPBreakdown => {
      return calculateXPGain(
        baseXP,
        operatorClass,
        moduleId,
        consecutiveSuccesses,
        timeRemainingFraction,
        level,
      );
    },
    [operatorClass, consecutiveSuccesses, level],
  );

  // Apply XP gain and detect level-up
  const applyXPGain = useCallback(
    (breakdown: XPBreakdown) => {
      const prevLevel = level;

      // Add XP to store
      addXP(breakdown.total);

      // Check for level-up
      const newXP = xp + breakdown.total;
      const newLevel = getLevelFromXP(newXP);

      if (newLevel > prevLevel) {
        // Level up detected!
        levelUpState.current = {
          justLeveledUp: true,
          newLevel,
          milestones: [],
        };

        // Check milestones for ALL new levels gained
        for (let lvl = prevLevel + 1; lvl <= newLevel; lvl++) {
          const milestones = getMilestonesForLevel(lvl);
          levelUpState.current.milestones.push(...milestones);

          // Apply milestone rewards
          for (const milestone of milestones) {
            if (milestone.type === 'integrity' && typeof milestone.value === 'number') {
              restoreIntegrity(milestone.value as number);
            }
            if (milestone.type === 'xp' && typeof milestone.value === 'number') {
              addXP(milestone.value as number);
            }
            if (milestone.type === 'reveal' && typeof milestone.value === 'string') {
              revealFile(milestone.value as string);
            }
          }
        }

        // Show level-up alert
        const milestoneText = levelUpState.current.milestones.length > 0
          ? levelUpState.current.milestones
              .map((m) => m.description)
              .join(' | ')
          : '';

        AlertOverlayManager.show(
          `LEVEL ${newLevel} — ${getClassTitle(operatorClass, newLevel)}`,
          Colors.textCyan,
          4000,
        );

        if (milestoneText) {
          setTimeout(() => {
            AlertOverlayManager.show(
              milestoneText,
              Colors.textAmber,
              4000,
            );
          }, 4500);
        }

        // Play level-up sound sequence
        playSuccess();
        setTimeout(() => playAlert(), 600);
      }
    },
    [level, xp, operatorClass, addXP, restoreIntegrity, revealFile],
  );

  // Clear level-up state
  const clearLevelUp = useCallback(() => {
    levelUpState.current = {
      justLeveledUp: false,
      newLevel: null,
      milestones: [],
    };
  }, []);

  return {
    level,
    xp,
    xpProgress,
    operatorClass,
    classTitle,
    streak: { ...streak, count: consecutiveSuccesses },
    previewXP,
    applyXPGain,
    clearLevelUp,
  };
}
