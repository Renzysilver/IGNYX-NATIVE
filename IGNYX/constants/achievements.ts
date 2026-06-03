// IGNYX Achievement System — Module 12
// Badges earned. Trophies claimed. The system remembers every milestone.
// Some are obvious. Some are hidden. Some require mastery.
// The operator's legacy is written in achievements.

import type { OperatorClass, ModuleId } from './gameState';

// ─── Achievement Types ──────────────────────────────────────────

/** Achievement rarity — determines border glow and prestige */
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Achievement category — groups achievements for filtering */
export type AchievementCategory =
  | 'combat'       // Mission-based: complete missions, modules
  | 'skill'        // Skill-based: speed, streaks, precision
  | 'exploration'  // Exploration: filesystem, terminal, files revealed
  | 'class'        // Class-specific: operator class achievements
  | 'hidden';      // Secret: unknown conditions, surprise unlocks

/** Achievement reward — what the operator gains */
export interface AchievementReward {
  type: 'xp' | 'title' | 'integrity' | 'reveal';
  value: number | string;
  description: string;
}

/** Achievement definition */
export interface Achievement {
  /** Unique identifier (e.g. 'first_patch') */
  id: string;
  /** Display title (e.g. 'FIRST PATCH') */
  title: string;
  /** Flavor text description */
  description: string;
  /** ASCII icon for display (e.g. '[+]') */
  icon: string;
  /** Category for filtering */
  category: AchievementCategory;
  /** Rarity — affects visual presentation */
  rarity: AchievementRarity;
  /** Reward granted on unlock */
  reward: AchievementReward;
  /** Whether the achievement condition is hidden from the player */
  isSecret: boolean;
  /** Condition checker — receives current game state, returns true if unlocked */
  condition: (state: AchievementCheckState) => boolean;
}

/** State snapshot passed to achievement condition checkers */
export interface AchievementCheckState {
  /** Total missions completed */
  totalMissionsCompleted: number;
  /** Total missions failed */
  totalMissionsFailed: number;
  /** Current level */
  level: number;
  /** Current XP total */
  xp: number;
  /** Current consecutive successes */
  consecutiveSuccesses: number;
  /** Current consecutive failures */
  consecutiveFailures: number;
  /** System integrity */
  systemIntegrity: number;
  /** Operator class */
  operatorClass: OperatorClass;
  /** Per-module state */
  modules: Record<ModuleId, {
    unlocked: boolean;
    missionsCompleted: number;
    integrity: number;
    stable: boolean;
  }>;
  /** Files revealed count */
  revealedFilesCount: number;
  /** Already unlocked achievement IDs */
  unlockedIds: string[];
  /** Total sessions played */
  sessionId: number;
  /** Restore points created */
  restorePointCount: number;
  /** Current game state */
  gameState: string;
  /** Has the operator completed all missions in a specific module */
  moduleFullyCompleted: (moduleId: ModuleId) => boolean;
  /** Has the operator completed any mission in a specific module */
  moduleStarted: (moduleId: ModuleId) => boolean;
  /** Was the last mission completed with speed bonus? */
  lastSpeedBonus: boolean;
  /** Was the last mission completed with streak bonus? */
  lastStreakBonus: boolean;
}

// ─── Rarity Colors ──────────────────────────────────────────────

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#8892A0',       // Steel gray
  rare: '#00F5FF',         // Cyan — the IGNYX signature
  epic: '#8B00FF',         // Purple — the breakdown color
  legendary: '#FFBF00',    // Amber — the warning glow
};

export const RARITY_GLOW: Record<AchievementRarity, string> = {
  common: 'rgba(136, 146, 160, 0.15)',
  rare: 'rgba(0, 245, 255, 0.2)',
  epic: 'rgba(139, 0, 255, 0.25)',
  legendary: 'rgba(255, 191, 0, 0.3)',
};

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
};

// ─── Category Labels ────────────────────────────────────────────

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  combat: 'COMBAT',
  skill: 'SKILL',
  exploration: 'EXPLORATION',
  class: 'CLASS',
  hidden: 'CLASSIFIED',
};

export const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  combat: '[!]',
  skill: '[*]',
  exploration: '[?]',
  class: '[=]',
  hidden: '[#]',
};

// ─── Achievement Definitions ────────────────────────────────────
// 30 achievements across 5 categories.
// Common: 10 | Rare: 10 | Epic: 7 | Legendary: 3

export const ACHIEVEMENTS: Achievement[] = [
  // ── COMBAT (Mission-based) ──────────────────────────────────
  {
    id: 'first_patch',
    title: 'FIRST PATCH',
    description: 'Complete your first mission. The system acknowledges you.',
    icon: '[+]',
    category: 'combat',
    rarity: 'common',
    reward: { type: 'xp', value: 50, description: '+50 XP' },
    isSecret: false,
    condition: (s) => s.totalMissionsCompleted >= 1,
  },
  {
    id: 'five_patches',
    title: 'SYSTEM TECHNICIAN',
    description: 'Complete 5 missions. You are learning the system\'s language.',
    icon: '[5x]',
    category: 'combat',
    rarity: 'common',
    reward: { type: 'xp', value: 100, description: '+100 XP' },
    isSecret: false,
    condition: (s) => s.totalMissionsCompleted >= 5,
  },
  {
    id: 'ten_patches',
    title: 'CORE MAINTAINER',
    description: 'Complete 10 missions. The system relies on your code.',
    icon: '[10x]',
    category: 'combat',
    rarity: 'rare',
    reward: { type: 'xp', value: 250, description: '+250 XP' },
    isSecret: false,
    condition: (s) => s.totalMissionsCompleted >= 10,
  },
  {
    id: 'twenty_patches',
    title: 'SYSTEM INTEGRITY SPECIALIST',
    description: 'Complete 20 missions. You are the reason this OS still breathes.',
    icon: '[20x]',
    category: 'combat',
    rarity: 'epic',
    reward: { type: 'title', value: 'INTEGRITY SPECIALIST', description: 'Title: INTEGRITY SPECIALIST' },
    isSecret: false,
    condition: (s) => s.totalMissionsCompleted >= 20,
  },
  {
    id: 'full_restore',
    title: 'FULL RESTORE',
    description: 'Complete all 30 missions. The system is whole again.',
    icon: '[OK]',
    category: 'combat',
    rarity: 'legendary',
    reward: { type: 'xp', value: 1000, description: '+1000 XP' },
    isSecret: false,
    condition: (s) => s.totalMissionsCompleted >= 30,
  },
  {
    id: 'kernel_master',
    title: 'KERNEL MASTERY',
    description: 'Complete all kernel core missions. The foundation is solid.',
    icon: '[KRN]',
    category: 'combat',
    rarity: 'rare',
    reward: { type: 'integrity', value: 10, description: '+10% Integrity' },
    isSecret: false,
    condition: (s) => s.moduleFullyCompleted('kernel_core'),
  },
  {
    id: 'network_master',
    title: 'NETWORK MASTERY',
    description: 'Complete all network missions. The connections hold.',
    icon: '[NET]',
    category: 'combat',
    rarity: 'rare',
    reward: { type: 'integrity', value: 10, description: '+10% Integrity' },
    isSecret: false,
    condition: (s) => s.moduleFullyCompleted('network'),
  },
  {
    id: 'security_master',
    title: 'SECURITY MASTERY',
    description: 'Complete all security missions. The walls stand firm.',
    icon: '[SEC]',
    category: 'combat',
    rarity: 'rare',
    reward: { type: 'integrity', value: 10, description: '+10% Integrity' },
    isSecret: false,
    condition: (s) => s.moduleFullyCompleted('security'),
  },

  // ── SKILL (Speed, streaks, precision) ───────────────────────
  {
    id: 'streak_three',
    title: 'MOMENTUM',
    description: 'Achieve a 3-mission streak. The code flows through you.',
    icon: '>>>',
    category: 'skill',
    rarity: 'common',
    reward: { type: 'xp', value: 75, description: '+75 XP' },
    isSecret: false,
    condition: (s) => s.consecutiveSuccesses >= 3,
  },
  {
    id: 'streak_five',
    title: 'ON FIRE',
    description: 'Achieve a 5-mission streak. The system fears nothing when you type.',
    icon: '>>>>>',
    category: 'skill',
    rarity: 'rare',
    reward: { type: 'xp', value: 150, description: '+150 XP' },
    isSecret: false,
    condition: (s) => s.consecutiveSuccesses >= 5,
  },
  {
    id: 'streak_ten',
    title: 'UNSTOPPABLE',
    description: 'Achieve a 10-mission streak. You are the storm.',
    icon: '>>>>>>>>>>',
    category: 'skill',
    rarity: 'epic',
    reward: { type: 'title', value: 'THE STORM', description: 'Title: THE STORM' },
    isSecret: false,
    condition: (s) => s.consecutiveSuccesses >= 10,
  },
  {
    id: 'swift_execution',
    title: 'SWIFT EXECUTION',
    description: 'Complete a mission with the SWIFT speed bonus.',
    icon: '[~>]',
    category: 'skill',
    rarity: 'common',
    reward: { type: 'xp', value: 50, description: '+50 XP' },
    isSecret: false,
    condition: (s) => s.lastSpeedBonus,
  },
  {
    id: 'lightning_fix',
    title: 'LIGHTNING FIX',
    description: 'Complete a mission with over 75% time remaining.',
    icon: '[!!]',
    category: 'skill',
    rarity: 'rare',
    reward: { type: 'xp', value: 100, description: '+100 XP' },
    isSecret: false,
    condition: (s) => s.lastSpeedBonus, // lastSpeedBonus is true when speed tier is active
  },
  {
    id: 'level_five',
    title: 'CERTIFIED',
    description: 'Reach level 5. You are no longer a stranger.',
    icon: '[L5]',
    category: 'skill',
    rarity: 'common',
    reward: { type: 'xp', value: 100, description: '+100 XP' },
    isSecret: false,
    condition: (s) => s.level >= 5,
  },
  {
    id: 'level_ten',
    title: 'SPECIALIST',
    description: 'Reach level 10. The system bends to your will.',
    icon: '[L10]',
    category: 'skill',
    rarity: 'rare',
    reward: { type: 'xp', value: 200, description: '+200 XP' },
    isSecret: false,
    condition: (s) => s.level >= 10,
  },
  {
    id: 'level_twenty',
    title: 'MASTER OPERATOR',
    description: 'Reach level 20. The code obeys. The system evolves around you.',
    icon: '[L20]',
    category: 'skill',
    rarity: 'epic',
    reward: { type: 'title', value: 'CODE SOVEREIGN', description: 'Title: CODE SOVEREIGN' },
    isSecret: false,
    condition: (s) => s.level >= 20,
  },
  {
    id: 'level_thirty',
    title: 'THE CONSCIOUSNESS',
    description: 'Reach level 30. Operator and system are one.',
    icon: '[L30]',
    category: 'skill',
    rarity: 'legendary',
    reward: { type: 'title', value: 'THE CONSCIOUSNESS', description: 'Title: THE CONSCIOUSNESS' },
    isSecret: false,
    condition: (s) => s.level >= 30,
  },

  // ── EXPLORATION (Filesystem, files, terminal) ──────────────
  {
    id: 'first_file',
    title: 'DATA MINER',
    description: 'Reveal your first hidden file. The filesystem has secrets.',
    icon: '[?]',
    category: 'exploration',
    rarity: 'common',
    reward: { type: 'xp', value: 50, description: '+50 XP' },
    isSecret: false,
    condition: (s) => s.revealedFilesCount >= 1,
  },
  {
    id: 'five_files',
    title: 'ARCHIVIST',
    description: 'Reveal 5 hidden files. You see what the system hides.',
    icon: '[5?]',
    category: 'exploration',
    rarity: 'rare',
    reward: { type: 'xp', value: 150, description: '+150 XP' },
    isSecret: false,
    condition: (s) => s.revealedFilesCount >= 5,
  },
  {
    id: 'ten_files',
    title: 'OMNISCIENT',
    description: 'Reveal 10 hidden files. Nothing is hidden from you.',
    icon: '[10?]',
    category: 'exploration',
    rarity: 'epic',
    reward: { type: 'title', value: 'THE OMNISCIENT', description: 'Title: THE OMNISCIENT' },
    isSecret: false,
    condition: (s) => s.revealedFilesCount >= 10,
  },
  {
    id: 'all_modules_unlocked',
    title: 'FULL ACCESS',
    description: 'Unlock all 6 system modules. Every sector is open.',
    icon: '[6M]',
    category: 'exploration',
    rarity: 'epic',
    reward: { type: 'integrity', value: 15, description: '+15% Integrity' },
    isSecret: false,
    condition: (s) => Object.values(s.modules).every((m) => m.unlocked),
  },
  {
    id: 'all_modules_stable',
    title: 'SYSTEM EQUILIBRIUM',
    description: 'Stabilize all modules. The system breathes on its own.',
    icon: '[EQ]',
    category: 'exploration',
    rarity: 'legendary',
    reward: { type: 'integrity', value: 25, description: '+25% Integrity' },
    isSecret: false,
    condition: (s) => Object.values(s.modules).every((m) => m.stable || m.missionsCompleted >= 4),
  },

  // ── CLASS (Operator-specific achievements) ──────────────────
  {
    id: 'architect_first',
    title: 'FOUNDATION LAID',
    description: 'As ARCHITECT, complete your first kernel mission.',
    icon: '[ARC]',
    category: 'class',
    rarity: 'common',
    reward: { type: 'xp', value: 75, description: '+75 XP' },
    isSecret: false,
    condition: (s) => s.operatorClass === 'ARCHITECT' && s.moduleStarted('kernel_core'),
  },
  {
    id: 'operative_first',
    title: 'FIELD DEPLOYED',
    description: 'As OPERATIVE, complete your first app layer mission.',
    icon: '[OPS]',
    category: 'class',
    rarity: 'common',
    reward: { type: 'xp', value: 75, description: '+75 XP' },
    isSecret: false,
    condition: (s) => s.operatorClass === 'OPERATIVE' && s.moduleStarted('app_layer'),
  },
  {
    id: 'ghost_first',
    title: 'SHADOW STEP',
    description: 'As GHOST, complete your first security mission.',
    icon: '[GHO]',
    category: 'class',
    rarity: 'common',
    reward: { type: 'xp', value: 75, description: '+75 XP' },
    isSecret: false,
    condition: (s) => s.operatorClass === 'GHOST' && s.moduleStarted('security'),
  },
  {
    id: 'architect_master',
    title: 'REALITY FORGE',
    description: 'As ARCHITECT, complete all kernel core missions.',
    icon: '[ARX]',
    category: 'class',
    rarity: 'epic',
    reward: { type: 'title', value: 'REALITY FORGE', description: 'Title: REALITY FORGE' },
    isSecret: false,
    condition: (s) => s.operatorClass === 'ARCHITECT' && s.moduleFullyCompleted('kernel_core'),
  },
  {
    id: 'operative_master',
    title: 'PRIME DIRECTIVE',
    description: 'As OPERATIVE, complete all app layer missions.',
    icon: '[OPX]',
    category: 'class',
    rarity: 'epic',
    reward: { type: 'title', value: 'PRIME DIRECTIVE', description: 'Title: PRIME DIRECTIVE' },
    isSecret: false,
    condition: (s) => s.operatorClass === 'OPERATIVE' && s.moduleFullyCompleted('app_layer'),
  },
  {
    id: 'ghost_master',
    title: 'VOID INCARNATE',
    description: 'As GHOST, complete all security missions.',
    icon: '[GHX]',
    category: 'class',
    rarity: 'epic',
    reward: { type: 'title', value: 'VOID INCARNATE', description: 'Title: VOID INCARNATE' },
    isSecret: false,
    condition: (s) => s.operatorClass === 'GHOST' && s.moduleFullyCompleted('security'),
  },

  // ── HIDDEN (Secret achievements — conditions not shown) ─────
  {
    id: 'breakdown_survivor',
    title: 'SURVIVED THE VOID',
    description: 'Survive a system breakdown. You stared into the abyss.',
    icon: '[!!]',
    category: 'hidden',
    rarity: 'rare',
    reward: { type: 'xp', value: 200, description: '+200 XP' },
    isSecret: true,
    condition: (s) => s.gameState === 'breakdown' || s.systemIntegrity <= 25,
  },
  {
    id: 'perfect_recovery',
    title: 'PHOENIX PROTOCOL',
    description: 'Restore system integrity from below 30% back above 80%.',
    icon: '[PHX]',
    category: 'hidden',
    rarity: 'epic',
    reward: { type: 'title', value: 'PHOENIX', description: 'Title: PHOENIX' },
    isSecret: true,
    condition: (s) => s.systemIntegrity >= 80 && s.restorePointCount > 0,
  },
  {
    id: 'unknown_operator',
    title: 'THE ANOMALY',
    description: 'Play through as UNKNOWN class. You exist outside the system.',
    icon: '[???]',
    category: 'hidden',
    rarity: 'rare',
    reward: { type: 'xp', value: 150, description: '+150 XP' },
    isSecret: true,
    condition: (s) => s.operatorClass === 'UNKNOWN' && s.totalMissionsCompleted >= 3,
  },
  {
    id: 'persistent_soul',
    title: 'ETERNAL OPERATOR',
    description: 'Return for 5 sessions. The system never forgets. Neither do you.',
    icon: '[INF]',
    category: 'hidden',
    rarity: 'rare',
    reward: { type: 'xp', value: 200, description: '+200 XP' },
    isSecret: true,
    condition: (s) => s.sessionId >= 5,
  },
];

// ─── Helper Functions ──────────────────────────────────────────

/** Get all achievement IDs */
export const getAllAchievementIds = (): string[] =>
  ACHIEVEMENTS.map((a) => a.id);

/** Get an achievement by ID */
export const getAchievementById = (id: string): Achievement | undefined =>
  ACHIEVEMENTS.find((a) => a.id === id);

/** Get achievements by category */
export const getAchievementsByCategory = (category: AchievementCategory): Achievement[] =>
  ACHIEVEMENTS.filter((a) => a.category === category);

/** Get achievements by rarity */
export const getAchievementsByRarity = (rarity: AchievementRarity): Achievement[] =>
  ACHIEVEMENTS.filter((a) => a.rarity === rarity);

/** Get total achievement count */
export const getTotalAchievementCount = (): number => ACHIEVEMENTS.length;

/**
 * Check all achievements against current state and return newly unlocked IDs.
 * Only checks achievements that are NOT already in unlockedIds.
 */
export const checkAchievements = (state: AchievementCheckState): string[] => {
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (state.unlockedIds.includes(achievement.id)) continue;

    // Check condition
    if (achievement.condition(state)) {
      newlyUnlocked.push(achievement.id);
    }
  }

  return newlyUnlocked;
};

/** Build achievement check state from game store */
export const buildCheckState = (
  totalMissionsCompleted: number,
  totalMissionsFailed: number,
  level: number,
  xp: number,
  consecutiveSuccesses: number,
  consecutiveFailures: number,
  systemIntegrity: number,
  operatorClass: OperatorClass,
  modules: Record<ModuleId, {
    unlocked: boolean;
    missionsCompleted: number;
    integrity: number;
    stable: boolean;
    totalMissions: number;
  }>,
  revealedFilesCount: number,
  unlockedIds: string[],
  sessionId: number,
  restorePointCount: number,
  gameState: string,
  lastSpeedBonus: boolean,
  lastStreakBonus: boolean,
): AchievementCheckState => ({
  totalMissionsCompleted,
  totalMissionsFailed,
  level,
  xp,
  consecutiveSuccesses,
  consecutiveFailures,
  systemIntegrity,
  operatorClass,
  modules: Object.fromEntries(
    Object.entries(modules).map(([k, v]) => [k, {
      unlocked: v.unlocked,
      missionsCompleted: v.missionsCompleted,
      integrity: v.integrity,
      stable: v.stable,
    }])
  ) as AchievementCheckState['modules'],
  revealedFilesCount,
  unlockedIds,
  sessionId,
  restorePointCount,
  gameState,
  moduleFullyCompleted: (moduleId: ModuleId) =>
    modules[moduleId]?.missionsCompleted >= (modules[moduleId]?.totalMissions ?? 5),
  moduleStarted: (moduleId: ModuleId) =>
    modules[moduleId]?.missionsCompleted >= 1,
  lastSpeedBonus,
  lastStreakBonus,
});
