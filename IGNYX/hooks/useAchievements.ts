// IGNYX Achievements Hook — Module 12
// The bridge between game state and the achievement engine.
// Checks conditions. Queues toasts. Applies rewards.
// The system watches. The system rewards.

import { useCallback, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  checkAchievements,
  buildCheckState,
  getAchievementById,
  getTotalAchievementCount,
  getAchievementsByCategory,
  getAchievementsByRarity,
  type AchievementCategory,
  type AchievementRarity,
  type Achievement,
} from '../constants/achievements';
import { achievementToastQueue } from '../components/AchievementToast';
import { playSuccess, playAlert } from '../services/AudioEngine';

// ─── Hook Return Type ──────────────────────────────────────────

interface AchievementsState {
  /** Number of unlocked achievements */
  unlockedCount: number;
  /** Total number of achievements */
  totalCount: number;
  /** Completion percentage (0-1) */
  completionPct: number;
  /** IDs of unlocked achievements */
  unlockedIds: string[];
  /** IDs of pending (newly unlocked, not yet shown) achievements */
  pendingIds: string[];
  /** Check and unlock any newly earned achievements */
  checkAndUnlock: () => string[];
  /** Clear pending achievements after showing */
  clearPending: () => void;
  /** Get achievement by ID */
  getById: (id: string) => Achievement | undefined;
  /** Get achievements by category */
  getByCategory: (category: AchievementCategory) => Achievement[];
  /** Get achievements by rarity */
  getByRarity: (rarity: AchievementRarity) => Achievement[];
  /** Count unlocked by category */
  countByCategory: (category: AchievementCategory) => { unlocked: number; total: number };
  /** Count unlocked by rarity */
  countByRarity: (rarity: AchievementRarity) => { unlocked: number; total: number };
}

// ─── Hook ──────────────────────────────────────────────────────

export function useAchievements(): AchievementsState {
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const pendingAchievements = useGameStore((s) => s.pendingAchievements);
  const unlockAchievement = useGameStore((s) => s.unlockAchievement);
  const clearPendingAchievements = useGameStore((s) => s.clearPendingAchievements);
  const addXP = useGameStore((s) => s.addXP);
  const restoreIntegrity = useGameStore((s) => s.restoreIntegrity);
  const revealFile = useGameStore((s) => s.revealFile);

  // Track which achievements we've already queued to prevent double-queue
  const queuedRef = useRef<Set<string>>(new Set());

  const totalCount = getTotalAchievementCount();
  const unlockedCount = unlockedAchievements.length;
  const completionPct = totalCount > 0 ? unlockedCount / totalCount : 0;

  // Check and unlock any newly earned achievements
  const checkAndUnlock = useCallback((): string[] => {
    const state = useGameStore.getState();

    const checkState = buildCheckState(
      state.totalMissionsCompleted,
      state.totalMissionsFailed,
      state.level,
      state.xp,
      state.consecutiveSuccesses,
      state.consecutiveFailures,
      state.systemIntegrity,
      state.operatorClass,
      state.modules,
      state.revealedFiles.length,
      state.unlockedAchievements,
      state.sessionId,
      state.restorePoints.length,
      state.gameState,
      state.lastSpeedBonus,
      state.lastStreakBonus,
    );

    const newlyUnlocked = checkAchievements(checkState);

    // Unlock each new achievement
    for (const id of newlyUnlocked) {
      unlockAchievement(id);

      const ach = getAchievementById(id);
      if (!ach) continue;

      // Apply reward
      if (ach.reward.type === 'xp' && typeof ach.reward.value === 'number') {
        addXP(ach.reward.value);
      }
      if (ach.reward.type === 'integrity' && typeof ach.reward.value === 'number') {
        restoreIntegrity(ach.reward.value);
      }
      if (ach.reward.type === 'reveal' && typeof ach.reward.value === 'string') {
        revealFile(ach.reward.value);
      }

      // Queue toast notification (only once per achievement)
      if (!queuedRef.current.has(id)) {
        queuedRef.current.add(id);
        achievementToastQueue.enqueue(id);
      }

      // Play achievement sound
      playSuccess();
      setTimeout(() => playAlert(), 400);
    }

    return newlyUnlocked;
  }, [unlockAchievement, addXP, restoreIntegrity, revealFile]);

  // Clear pending
  const clearPending = useCallback(() => {
    clearPendingAchievements();
  }, [clearPendingAchievements]);

  // Get by ID
  const getById = useCallback((id: string) => getAchievementById(id), []);

  // Get by category
  const getByCategory = useCallback((category: AchievementCategory) => {
    return getAchievementsByCategory(category);
  }, []);

  // Get by rarity
  const getByRarity = useCallback((rarity: AchievementRarity) => {
    return getAchievementsByRarity(rarity);
  }, []);

  // Count by category
  const countByCategory = useCallback((category: AchievementCategory) => {
    const all = getAchievementsByCategory(category);
    const unlocked = all.filter((a) => unlockedAchievements.includes(a.id)).length;
    return { unlocked, total: all.length };
  }, [unlockedAchievements]);

  // Count by rarity
  const countByRarity = useCallback((rarity: AchievementRarity) => {
    const all = getAchievementsByRarity(rarity);
    const unlocked = all.filter((a) => unlockedAchievements.includes(a.id)).length;
    return { unlocked, total: all.length };
  }, [unlockedAchievements]);

  return {
    unlockedCount,
    totalCount,
    completionPct,
    unlockedIds: unlockedAchievements,
    pendingIds: pendingAchievements,
    checkAndUnlock,
    clearPending,
    getById,
    getByCategory,
    getByRarity,
    countByCategory,
    countByRarity,
  };
}
