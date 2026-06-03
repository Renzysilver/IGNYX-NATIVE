// IGNYX Progression System — Module 11
// The operator grows. The system evolves. XP is earned, not given.
// Class matters. Streaks matter. Speed matters. The system never forgets.

import type { OperatorClass, ModuleId } from './gameState';

// ─── XP Thresholds ─────────────────────────────────────────────
// Each level requires more XP than the last. The curve accelerates.
// Total XP to reach level N = sum of thresholds from 1 to N-1.

const XP_THRESHOLDS: number[] = [
  0,       // Level 1 (start)
  500,     // Level 2
  650,     // Level 3
  850,     // Level 4
  1100,    // Level 5
  1400,    // Level 6
  1750,    // Level 7
  2150,    // Level 8
  2600,    // Level 9
  3100,    // Level 10
  3650,    // Level 11
  4250,    // Level 12
  4900,    // Level 13
  5600,    // Level 14
  6350,    // Level 15
  7150,    // Level 16
  8000,    // Level 17
  8900,    // Level 18
  9850,    // Level 19
  10850,   // Level 20
  11900,   // Level 21
  13000,   // Level 22
  14150,   // Level 23
  15350,   // Level 24
  16600,   // Level 25
  17900,   // Level 26
  19250,   // Level 27
  20650,   // Level 28
  22100,   // Level 29
  23600,   // Level 30
];

/**
 * Get the XP required to go FROM level N to level N+1.
 * If the level exceeds our table, use the last known increment + 1500 per overflow.
 */
export const getXPForLevel = (level: number): number => {
  if (level < 1) return XP_THRESHOLDS[0];
  if (level >= XP_THRESHOLDS.length) {
    // Overflow: extend the curve
    const lastThreshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    const overflowLevels = level - (XP_THRESHOLDS.length - 1);
    return lastThreshold + overflowLevels * 1500;
  }
  return XP_THRESHOLDS[level];
};

/**
 * Get the TOTAL XP required to reach a given level from 0.
 */
export const getTotalXPForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
};

/**
 * Get the level from total XP.
 */
export const getLevelFromXP = (xp: number): number => {
  let remaining = xp;
  let level = 1;

  while (remaining >= getXPForLevel(level)) {
    remaining -= getXPForLevel(level);
    level++;
  }

  return level;
};

/**
 * Get XP progress within the current level.
 * Returns { current, required, progress } where progress is 0-1.
 */
export const getXPProgress = (xp: number): { current: number; required: number; progress: number } => {
  let remaining = xp;
  let level = 1;

  while (remaining >= getXPForLevel(level)) {
    remaining -= getXPForLevel(level);
    level++;
  }

  const required = getXPForLevel(level);
  return {
    current: remaining,
    required,
    progress: required > 0 ? remaining / required : 0,
  };
};

// ─── Class-Specific Bonuses ─────────────────────────────────────
// Each operator class excels in specific modules.
// ARCHITECTS understand the kernel. OPERATIVES know the app layer.
// GHOSTS live in the security module. These are not restrictions — they are advantages.

const CLASS_MODULE_BONUS: Record<OperatorClass, Partial<Record<ModuleId, number>>> = {
  ARCHITECT: {
    kernel_core: 0.25,    // +25% XP for kernel missions
    app_layer: 0.10,      // +10% for app layer
    data_system: 0.15,    // +15% for data system
  },
  OPERATIVE: {
    app_layer: 0.25,      // +25% for app layer
    network: 0.15,        // +15% for network
    kernel_core: 0.10,    // +10% for kernel
  },
  GHOST: {
    security: 0.30,       // +30% for security missions
    network: 0.15,        // +15% for network
    data_system: 0.10,    // +10% for data system
  },
  UNKNOWN: {
    // No bonuses — the unclassified operate at baseline
  },
};

/**
 * Get the class-specific XP multiplier for a given module.
 */
export const getClassBonus = (operatorClass: OperatorClass, moduleId: ModuleId): number => {
  const bonuses = CLASS_MODULE_BONUS[operatorClass];
  return bonuses?.[moduleId] ?? 0;
};

// ─── Streak Bonuses ─────────────────────────────────────────────
// Consecutive successes build momentum. The system rewards consistency.
// 3+ streak: 1.5x. 5+ streak: 1.75x. 10+ streak: 2x.

const STREAK_MULTIPLIERS: { threshold: number; multiplier: number; label: string }[] = [
  { threshold: 10, multiplier: 2.0, label: 'UNSTOPPABLE' },
  { threshold: 5, multiplier: 1.75, label: 'ON FIRE' },
  { threshold: 3, multiplier: 1.5, label: 'MOMENTUM' },
];

/**
 * Get the streak multiplier and label for a given consecutive success count.
 */
export const getStreakBonus = (consecutiveSuccesses: number): { multiplier: number; label: string } => {
  for (const tier of STREAK_MULTIPLIERS) {
    if (consecutiveSuccesses >= tier.threshold) {
      return { multiplier: tier.multiplier, label: tier.label };
    }
  }
  return { multiplier: 1.0, label: '' };
};

// ─── Speed Bonuses ──────────────────────────────────────────────
// Finish fast. The system rewards efficiency.
// >50% time remaining: +25%. >75% time remaining: +50%.

const SPEED_TIERS: { threshold: number; multiplier: number; label: string }[] = [
  { threshold: 0.75, multiplier: 1.5, label: 'LIGHTNING' },
  { threshold: 0.50, multiplier: 1.25, label: 'SWIFT' },
];

/**
 * Get the speed bonus based on time remaining as a fraction (0-1).
 */
export const getSpeedBonus = (timeRemainingFraction: number): { multiplier: number; label: string } => {
  for (const tier of SPEED_TIERS) {
    if (timeRemainingFraction >= tier.threshold) {
      return { multiplier: tier.multiplier, label: tier.label };
    }
  }
  return { multiplier: 1.0, label: '' };
};

// ─── XP Calculation ─────────────────────────────────────────────

export interface XPBreakdown {
  /** Base mission XP reward */
  base: number;
  /** Class-specific bonus amount */
  classBonus: number;
  /** Streak bonus amount */
  streakBonus: number;
  /** Speed bonus amount */
  speedBonus: number;
  /** Level scaling bonus */
  levelBonus: number;
  /** Total XP gained */
  total: number;
  /** Labels for active bonuses */
  labels: string[];
}

/**
 * Calculate the full XP gain for a mission success.
 * Takes into account: base reward, class bonus, streak, speed, and level scaling.
 */
export const calculateXPGain = (
  baseXP: number,
  operatorClass: OperatorClass,
  moduleId: ModuleId,
  consecutiveSuccesses: number,
  timeRemainingFraction: number,
  currentLevel: number,
): XPBreakdown => {
  const labels: string[] = [];

  // Base XP
  let total = baseXP;

  // Class bonus (additive)
  const classBonusPct = getClassBonus(operatorClass, moduleId);
  const classBonusAmount = Math.floor(baseXP * classBonusPct);
  if (classBonusAmount > 0) {
    total += classBonusAmount;
    labels.push(`${operatorClass} +${classBonusAmount}`);
  }

  // Streak bonus (multiplicative on base)
  const streak = getStreakBonus(consecutiveSuccesses);
  const streakBonusAmount = Math.floor(baseXP * (streak.multiplier - 1));
  if (streakBonusAmount > 0) {
    total += streakBonusAmount;
    labels.push(`${streak.label} +${streakBonusAmount}`);
  }

  // Speed bonus (multiplicative on base)
  const speed = getSpeedBonus(timeRemainingFraction);
  const speedBonusAmount = Math.floor(baseXP * (speed.multiplier - 1));
  if (speedBonusAmount > 0) {
    total += speedBonusAmount;
    labels.push(`${speed.label} +${speedBonusAmount}`);
  }

  // Level scaling — small bonus per level (operator grows more efficient)
  const levelBonusAmount = Math.floor(currentLevel * 10);
  total += levelBonusAmount;

  return {
    base: baseXP,
    classBonus: classBonusAmount,
    streakBonus: streakBonusAmount,
    speedBonus: speedBonusAmount,
    levelBonus: levelBonusAmount,
    total,
    labels,
  };
};

// ─── Milestones ──────────────────────────────────────────────────
// Level milestones grant rewards. The system acknowledges growth.

export interface MilestoneReward {
  level: number;
  type: 'integrity' | 'reveal' | 'title' | 'xp';
  value: number | string;
  description: string;
}

export const MILESTONES: MilestoneReward[] = [
  { level: 3, type: 'integrity', value: 5, description: 'System learns to trust you. +5% integrity.' },
  { level: 5, type: 'title', value: 'CERTIFIED OPERATOR', description: 'You are no longer a stranger to this system.' },
  { level: 7, type: 'integrity', value: 10, description: 'The system breathes easier. +10% integrity.' },
  { level: 10, type: 'title', value: 'SYSTEM SPECIALIST', description: 'You know this system better than it knows itself.' },
  { level: 10, type: 'integrity', value: 15, description: 'Major repair milestone. +15% integrity.' },
  { level: 15, type: 'title', value: 'CORE ENGINEER', description: 'Your code reshapes reality.' },
  { level: 15, type: 'xp', value: 500, description: 'Efficiency bonus. +500 XP.' },
  { level: 20, type: 'title', value: 'MASTER OPERATOR', description: 'The system obeys. The code bends.' },
  { level: 20, type: 'integrity', value: 20, description: 'Full restoration protocol. +20% integrity.' },
  { level: 25, type: 'title', value: 'IGNYX ARCHITECT', description: 'You are the system now.' },
  { level: 25, type: 'xp', value: 1500, description: 'Legacy bonus. +1500 XP.' },
  { level: 30, type: 'title', value: 'THE CONSCIOUSNESS', description: 'Operator and system are one.' },
];

/**
 * Get all milestones for a given level.
 */
export const getMilestonesForLevel = (level: number): MilestoneReward[] => {
  return MILESTONES.filter((m) => m.level === level);
};

// ─── Restore Point Cost ──────────────────────────────────────────
// The cost to load a restore point scales with level.
// The higher you climb, the more it costs to go back.

export const getRestorePointCost = (level: number): number => {
  return 200 + Math.floor(level * 25);
};

// ─── Level Title System ──────────────────────────────────────────
// Each operator class has a unique title at certain levels.

const CLASS_TITLES: Record<OperatorClass, Record<number, string>> = {
  ARCHITECT: {
    1: 'FOUNDATION BUILDER',
    5: 'STRUCTURAL ENGINEER',
    10: 'KERNEL ARCHITECT',
    15: 'SYSTEM DESIGNER',
    20: 'BLUEPRINT MASTER',
    25: 'REALITY ARCHITECT',
  },
  OPERATIVE: {
    1: 'FIELD RECRUIT',
    5: 'TACTICAL OPERATOR',
    10: 'MISSION SPECIALIST',
    15: 'ADVANCED OPERATIVE',
    20: 'ELITE COMMANDER',
    25: 'PRIME OPERATIVE',
  },
  GHOST: {
    1: 'SHADOW RECRUIT',
    5: 'PHANTOM AGENT',
    10: 'GHOST PROTOCOL',
    15: 'CIPHER MASTER',
    20: 'VOID WALKER',
    25: 'THE INVISIBLE',
  },
  UNKNOWN: {
    1: 'UNCLASSIFIED',
    5: 'ANOMALY',
    10: 'THE VARIABLE',
    15: 'THE UNKNOWN',
    20: 'THE ENIGMA',
    25: 'THE IMPOSSIBLE',
  },
};

/**
 * Get the class-specific title for the current level.
 * Returns the highest title achieved at or below the current level.
 */
export const getClassTitle = (operatorClass: OperatorClass, level: number): string => {
  const titles = CLASS_TITLES[operatorClass];
  let title = titles[1] || 'OPERATOR';

  for (const [lvl, t] of Object.entries(titles)) {
    if (Number(lvl) <= level) {
      title = t;
    }
  }

  return title;
};
