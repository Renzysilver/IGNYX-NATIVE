// IGNYX Game Store — Module 10 + Module 11 + Module 12 + Module 13
// Full state persistence. Revealed files. System degradation. Restore points.
// XP progression. Level milestones. Achievements. OS Events. The system never forgets. The operator evolves.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState, OperatorClass, ModuleId, ModuleState } from '../constants/gameState';
import { MODULE_NAMES } from '../constants/gameState';
import { getLevelFromXP, getRestorePointCost, getXPProgress } from '../constants/progression';
import type { XPBreakdown } from '../constants/progression';
import type { OSEvent } from '../constants/osEvents';

// ─── Sub-Types ────────────────────────────────────────────────

interface ActiveMission {
  missionId: string;
  moduleId: ModuleId;
  startedAt: number;
}

interface RestorePoint {
  integrity: number;
  timestamp: number;
  xp: number;
  modules: Record<ModuleId, ModuleState>;
}

// ─── Persistence Keys ─────────────────────────────────────────

const STORAGE_KEY = 'ignyx_game_state';

// ─── Store Interface ──────────────────────────────────────────

interface GameStore {
  // Operator
  operatorName: string;
  operatorClass: OperatorClass;
  xp: number;
  level: number;

  // System
  systemIntegrity: number;
  gameState: GameState;
  isEditorFocused: boolean;

  // Modules
  modules: Record<ModuleId, ModuleState>;

  // Mission
  activeMission: ActiveMission | null;
  restorePoints: RestorePoint[];

  // Revealed files — paths unlocked by mission success
  revealedFiles: string[];

  // Session
  sessionId: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;

  // Progression (Module 11)
  totalMissionsCompleted: number;
  totalMissionsFailed: number;
  lastXPGain: XPBreakdown | null;
  pendingLevelUp: number | null; // New level if level-up just occurred

  // Achievements (Module 12)
  unlockedAchievements: string[]; // IDs of unlocked achievements
  pendingAchievements: string[];  // IDs of newly unlocked (not yet shown to player)
  lastSpeedBonus: boolean;        // Was last mission completed with speed bonus?
  lastStreakBonus: boolean;       // Was last mission completed with streak bonus?

  // OS Events (Module 13)
  eventLog: OSEvent[];            // Persistent event log (last 50 events)
  lastEventTimestamp: number;     // Timestamp of last event (for ambient cooldown)

  // Boot
  hasBooted: boolean;
  hasProfiled: boolean;

  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  osVoiceText: boolean;

  // Sound
  soundEnabled: boolean;
  masterVolume: number;

  // Persistence
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;

  // Actions
  setOperatorName: (name: string) => void;
  setOperatorClass: (cls: OperatorClass) => void;
  addXP: (amount: number) => void;
  addXPWithBreakdown: (breakdown: XPBreakdown) => void;
  setSystemIntegrity: (value: number) => void;
  degradeIntegrity: (amount: number) => void;
  restoreIntegrity: (amount: number) => void;
  setGameState: (state: GameState) => void;
  setEditorFocused: (focused: boolean) => void;
  completeMission: (moduleId: ModuleId, xpBreakdown?: XPBreakdown) => void;
  failMission: (moduleId: ModuleId) => void;
  unlockModule: (moduleId: ModuleId) => void;
  setBooted: (booted: boolean) => void;
  setProfiled: (profiled: boolean) => void;
  setAccessibility: (key: string, value: boolean | string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  resetConsecutiveSuccesses: () => void;
  incrementConsecutiveSuccesses: () => void;
  startMission: (missionId: string, moduleId: ModuleId) => void;
  endMission: () => void;
  checkRestorePoints: () => void;
  loadRestorePoint: (index: number) => void;
  revealFile: (filePath: string) => void;
  isFileRevealed: (filePath: string) => boolean;
  clearPendingLevelUp: () => void;
  // Achievements (Module 12)
  unlockAchievement: (id: string) => void;
  clearPendingAchievements: () => void;
  setLastSpeedBonus: (active: boolean) => void;
  setLastStreakBonus: (active: boolean) => void;
  // OS Events (Module 13)
  addEvent: (event: OSEvent) => void;
  clearEventLog: () => void;
  getRecentEvents: (count: number) => OSEvent[];
  resetGame: () => void;
  persistState: () => Promise<void>;
  hydrateState: () => Promise<void>;
}

// ─── Initial Module State ─────────────────────────────────────

const createInitialModules = (): Record<ModuleId, ModuleState> => ({
  kernel_core: {
    id: 'kernel_core',
    name: MODULE_NAMES.kernel_core,
    unlocked: true,
    integrity: 100,
    missionsCompleted: 0,
    totalMissions: 5,
    stable: false,
  },
  app_layer: {
    id: 'app_layer',
    name: MODULE_NAMES.app_layer,
    unlocked: false,
    integrity: 100,
    missionsCompleted: 0,
    totalMissions: 5,
    stable: false,
  },
  network: {
    id: 'network',
    name: MODULE_NAMES.network,
    unlocked: false,
    integrity: 100,
    missionsCompleted: 0,
    totalMissions: 5,
    stable: false,
  },
  data_system: {
    id: 'data_system',
    name: MODULE_NAMES.data_system,
    unlocked: false,
    integrity: 100,
    missionsCompleted: 0,
    totalMissions: 5,
    stable: false,
  },
  security: {
    id: 'security',
    name: MODULE_NAMES.security,
    unlocked: false,
    integrity: 100,
    missionsCompleted: 0,
    totalMissions: 5,
    stable: false,
  },
  ai_core: {
    id: 'ai_core',
    name: MODULE_NAMES.ai_core,
    unlocked: false,
    integrity: 100,
    missionsCompleted: 0,
    totalMissions: 5,
    stable: false,
  },
});

// ─── Helpers ──────────────────────────────────────────────────

const getGameStateFromIntegrity = (integrity: number): GameState => {
  if (integrity > 75) return 'normal';
  if (integrity > 50) return 'warning';
  if (integrity > 25) return 'critical';
  return 'breakdown';
};

/**
 * Fields that should NOT be persisted across sessions.
 * Transient state resets on every app launch.
 */
const TRANSIENT_FIELDS: (keyof GameStore)[] = [
  'isEditorFocused',
  'activeMission',
  'hasHydrated',
  'lastXPGain',
  'pendingLevelUp',
];

/**
 * Serialize the current state for AsyncStorage.
 * Strips transient fields and action functions.
 */
const serializeState = (state: GameStore): string => {
  const serializable: Record<string, unknown> = {};
  const actionKeys = new Set<string>([
    'setOperatorName', 'setOperatorClass', 'addXP', 'addXPWithBreakdown', 'setSystemIntegrity',
    'degradeIntegrity', 'restoreIntegrity', 'setGameState', 'setEditorFocused',
    'completeMission', 'failMission', 'unlockModule', 'setBooted', 'setProfiled',
    'setAccessibility', 'setSoundEnabled', 'setMasterVolume',
    'resetConsecutiveSuccesses', 'incrementConsecutiveSuccesses',
    'startMission', 'endMission', 'checkRestorePoints', 'loadRestorePoint',
    'revealFile', 'isFileRevealed', 'clearPendingLevelUp', 'resetGame', 'persistState', 'hydrateState',
    'setHasHydrated',
    'unlockAchievement', 'clearPendingAchievements', 'setLastSpeedBonus', 'setLastStreakBonus',
    'addEvent', 'clearEventLog', 'getRecentEvents',
  ]);

  for (const key of Object.keys(state)) {
    if (actionKeys.has(key)) continue;
    if (TRANSIENT_FIELDS.includes(key as keyof GameStore)) continue;
    serializable[key] = state[key as keyof GameStore];
  }

  return JSON.stringify(serializable);
};

// ─── Create Store ─────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  operatorName: '',
  operatorClass: 'UNKNOWN',
  xp: 0,
  level: 1,
  systemIntegrity: 100,
  gameState: 'normal',
  isEditorFocused: false,
  modules: createInitialModules(),
  activeMission: null,
  restorePoints: [],
  revealedFiles: [],
  sessionId: 1,
  consecutiveSuccesses: 0,
  consecutiveFailures: 0,
  totalMissionsCompleted: 0,
  totalMissionsFailed: 0,
  lastXPGain: null,
  pendingLevelUp: null,
  unlockedAchievements: [],
  pendingAchievements: [],
  lastSpeedBonus: false,
  lastStreakBonus: false,
  eventLog: [],
  lastEventTimestamp: 0,
  hasBooted: false,
  hasProfiled: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  osVoiceText: false,
  soundEnabled: true,
  masterVolume: 0.7,
  hasHydrated: false,

  setHasHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),

  // ── Operator ──────────────────────────────────────────────

  setOperatorName: (name) => set({ operatorName: name }),
  setOperatorClass: (cls) => set({ operatorClass: cls }),

  addXP: (amount) => {
    const state = get();
    const newXP = state.xp + amount;
    const newLevel = getLevelFromXP(newXP);
    const prevLevel = state.level;
    set({
      xp: newXP,
      level: newLevel,
      pendingLevelUp: newLevel > prevLevel ? newLevel : state.pendingLevelUp,
    });
  },

  addXPWithBreakdown: (breakdown: XPBreakdown) => {
    const state = get();
    const newXP = state.xp + breakdown.total;
    const newLevel = getLevelFromXP(newXP);
    const prevLevel = state.level;
    set({
      xp: newXP,
      level: newLevel,
      lastXPGain: breakdown,
      pendingLevelUp: newLevel > prevLevel ? newLevel : state.pendingLevelUp,
    });
  },

  // ── System Integrity ─────────────────────────────────────

  setSystemIntegrity: (value) => {
    const clamped = Math.max(0, Math.min(100, value));
    set({ systemIntegrity: clamped, gameState: getGameStateFromIntegrity(clamped) });
  },

  degradeIntegrity: (amount) => {
    const state = get();
    const newValue = Math.max(0, state.systemIntegrity - amount);
    set({ systemIntegrity: newValue, gameState: getGameStateFromIntegrity(newValue) });
  },

  restoreIntegrity: (amount) => {
    const state = get();
    const newValue = Math.min(100, state.systemIntegrity + amount);
    set({ systemIntegrity: newValue, gameState: getGameStateFromIntegrity(newValue) });
  },

  setGameState: (gameState) => set({ gameState }),
  setEditorFocused: (focused) => set({ isEditorFocused: focused }),

  // ── Mission Completion ───────────────────────────────────

  completeMission: (moduleId, xpBreakdown) => {
    const state = get();
    const module = state.modules[moduleId];
    const newCompleted = module.missionsCompleted + 1;
    const newIntegrity = Math.min(100, module.integrity + 15);
    const isStable = newCompleted >= 4;

    const newModules = {
      ...state.modules,
      [moduleId]: {
        ...module,
        missionsCompleted: newCompleted,
        integrity: newIntegrity,
        stable: isStable,
      },
    };

    // Unlock logic — module progression chain
    if (moduleId === 'kernel_core' && newCompleted >= 2) {
      newModules.app_layer = { ...newModules.app_layer, unlocked: true };
    }
    if (moduleId === 'app_layer' && newCompleted >= 2) {
      newModules.network = { ...newModules.network, unlocked: true };
    }
    if (moduleId === 'network' && newCompleted >= 2) {
      newModules.data_system = { ...newModules.data_system, unlocked: true };
    }
    if (moduleId === 'data_system' && newCompleted >= 2) {
      newModules.security = { ...newModules.security, unlocked: true };
    }
    if (moduleId === 'security' && newCompleted >= 3 && state.systemIntegrity < 40) {
      newModules.ai_core = { ...newModules.ai_core, unlocked: true };
    }

    // XP calculation — use breakdown if provided, otherwise fallback to legacy
    const xpGain = xpBreakdown
      ? xpBreakdown.total
      : 100 + Math.floor(state.level * 10);
    const newXP = state.xp + xpGain;
    const newLevel = getLevelFromXP(newXP);
    const prevLevel = state.level;

    const restoredIntegrity = Math.min(100, state.systemIntegrity + 5);

    set({
      modules: newModules,
      xp: newXP,
      level: newLevel,
      consecutiveSuccesses: state.consecutiveSuccesses + 1,
      consecutiveFailures: 0,
      activeMission: null,
      systemIntegrity: restoredIntegrity,
      gameState: getGameStateFromIntegrity(restoredIntegrity),
      totalMissionsCompleted: state.totalMissionsCompleted + 1,
      lastXPGain: xpBreakdown ?? null,
      pendingLevelUp: newLevel > prevLevel ? newLevel : state.pendingLevelUp,
    });
  },

  failMission: (moduleId) => {
    const state = get();
    const module = state.modules[moduleId];
    const newModules = {
      ...state.modules,
      [moduleId]: {
        ...module,
        integrity: Math.max(0, module.integrity - 10),
      },
    };

    const newSystemIntegrity = Math.max(0, state.systemIntegrity - 5);

    set({
      modules: newModules,
      systemIntegrity: newSystemIntegrity,
      gameState: getGameStateFromIntegrity(newSystemIntegrity),
      consecutiveSuccesses: 0,
      consecutiveFailures: state.consecutiveFailures + 1,
      activeMission: null,
      totalMissionsFailed: state.totalMissionsFailed + 1,
    });
  },

  unlockModule: (moduleId) => {
    const state = get();
    set({
      modules: {
        ...state.modules,
        [moduleId]: { ...state.modules[moduleId], unlocked: true },
      },
    });
  },

  // ── Boot ─────────────────────────────────────────────────

  setBooted: (booted) => set({ hasBooted: booted }),
  setProfiled: (profiled) => set({ hasProfiled: profiled }),

  // ── Accessibility ────────────────────────────────────────

  setAccessibility: (key, value) => {
    if (key === 'reducedMotion') set({ reducedMotion: value as boolean });
    else if (key === 'highContrast') set({ highContrast: value as boolean });
    else if (key === 'fontSize') set({ fontSize: value as 'small' | 'medium' | 'large' });
    else if (key === 'osVoiceText') set({ osVoiceText: value as boolean });
  },

  // ── Sound ────────────────────────────────────────────────

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),

  // ── Streaks ──────────────────────────────────────────────

  resetConsecutiveSuccesses: () => set({ consecutiveSuccesses: 0 }),
  incrementConsecutiveSuccesses: () =>
    set((s) => ({ consecutiveSuccesses: s.consecutiveSuccesses + 1 })),

  // ── Mission Lifecycle ────────────────────────────────────

  startMission: (missionId, moduleId) => {
    set({
      activeMission: {
        missionId,
        moduleId,
        startedAt: Date.now(),
      },
    });
  },

  endMission: () => {
    set({ activeMission: null });
  },

  // ── Restore Points ───────────────────────────────────────

  checkRestorePoints: () => {
    const state = get();
    const integrity = state.systemIntegrity;
    const points = [...state.restorePoints];

    // Create restore points at 75%, 50%, 25% thresholds
    const thresholds = [75, 50, 25];
    for (const threshold of thresholds) {
      const alreadyExists = points.some((p) => p.integrity === threshold);
      if (!alreadyExists && integrity <= threshold) {
        points.push({
          integrity: threshold,
          timestamp: Date.now(),
          xp: state.xp,
          modules: JSON.parse(JSON.stringify(state.modules)),
        });
      }
    }

    set({ restorePoints: points });
  },

  loadRestorePoint: (index) => {
    const state = get();
    const point = state.restorePoints[index];
    if (!point) return;

    // Apply restore point with -15% integrity debuff to all modules
    const debuffedModules = JSON.parse(JSON.stringify(point.modules)) as Record<ModuleId, ModuleState>;
    for (const key of Object.keys(debuffedModules) as ModuleId[]) {
      debuffedModules[key].integrity = Math.max(0, debuffedModules[key].integrity - 15);
    }

    // Cost scales with level (Module 11)
    const xpCost = getRestorePointCost(state.level);

    set({
      systemIntegrity: point.integrity,
      gameState: getGameStateFromIntegrity(point.integrity),
      xp: Math.max(0, state.xp - xpCost),
      level: getLevelFromXP(Math.max(0, state.xp - xpCost)),
      modules: debuffedModules,
    });
  },

  // ── Revealed Files ───────────────────────────────────────

  revealFile: (filePath: string) => {
    const state = get();
    if (state.revealedFiles.includes(filePath)) return;
    set({ revealedFiles: [...state.revealedFiles, filePath] });
  },

  isFileRevealed: (filePath: string): boolean => {
    return get().revealedFiles.includes(filePath);
  },

  // ── Level-Up State (Module 11) ──────────────────────────

  clearPendingLevelUp: () => set({ pendingLevelUp: null }),

  // ── Achievements (Module 12) ────────────────────────────

  unlockAchievement: (id: string) => {
    const state = get();
    if (state.unlockedAchievements.includes(id)) return;
    set({
      unlockedAchievements: [...state.unlockedAchievements, id],
      pendingAchievements: [...state.pendingAchievements, id],
    });
  },

  clearPendingAchievements: () => set({ pendingAchievements: [] }),

  setLastSpeedBonus: (active: boolean) => set({ lastSpeedBonus: active }),

  setLastStreakBonus: (active: boolean) => set({ lastStreakBonus: active }),

  // ── OS Events (Module 13) ───────────────────────────────

  addEvent: (event: OSEvent) => {
    const state = get();
    const maxLogSize = 50;
    const newLog = [event, ...state.eventLog].slice(0, maxLogSize);
    set({ eventLog: newLog, lastEventTimestamp: event.timestamp });
  },

  clearEventLog: () => set({ eventLog: [], lastEventTimestamp: 0 }),

  getRecentEvents: (count: number): OSEvent[] => {
    return get().eventLog.slice(0, count);
  },

  // ── Nuclear Reset ────────────────────────────────────────

  resetGame: () => {
    set({
      operatorName: '',
      operatorClass: 'UNKNOWN',
      xp: 0,
      level: 1,
      systemIntegrity: 100,
      gameState: 'normal',
      isEditorFocused: false,
      modules: createInitialModules(),
      activeMission: null,
      restorePoints: [],
      revealedFiles: [],
      sessionId: 1,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      totalMissionsCompleted: 0,
      totalMissionsFailed: 0,
      lastXPGain: null,
      pendingLevelUp: null,
      unlockedAchievements: [],
      pendingAchievements: [],
      lastSpeedBonus: false,
      lastStreakBonus: false,
      eventLog: [],
      lastEventTimestamp: 0,
      hasBooted: false,
      hasProfiled: false,
    });

    // Clear persisted data
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  // ── Persistence ──────────────────────────────────────────

  persistState: async () => {
    try {
      const state = get();
      const serialized = serializeState(state);
      await AsyncStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      // Silent fail — persistence is best-effort
    }
  },

  hydrateState: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        set({ hasHydrated: true });
        return;
      }

      const parsed = JSON.parse(stored);

      // Merge stored data with current defaults (handles schema migrations)
      set({
        operatorName: parsed.operatorName ?? '',
        operatorClass: parsed.operatorClass ?? 'UNKNOWN',
        xp: parsed.xp ?? 0,
        level: parsed.level ?? 1,
        systemIntegrity: parsed.systemIntegrity ?? 100,
        gameState: parsed.gameState ?? 'normal',
        modules: parsed.modules ?? createInitialModules(),
        restorePoints: parsed.restorePoints ?? [],
        revealedFiles: parsed.revealedFiles ?? [],
        sessionId: (parsed.sessionId ?? 1) + 1, // Increment session on each launch
        consecutiveSuccesses: 0, // Reset streaks on new session
        consecutiveFailures: 0,
        totalMissionsCompleted: parsed.totalMissionsCompleted ?? 0,
        totalMissionsFailed: parsed.totalMissionsFailed ?? 0,
        lastXPGain: null,
        pendingLevelUp: null,
        unlockedAchievements: parsed.unlockedAchievements ?? [],
        pendingAchievements: [], // Always reset pending on hydration
        lastSpeedBonus: parsed.lastSpeedBonus ?? false,
        lastStreakBonus: parsed.lastStreakBonus ?? false,
        eventLog: parsed.eventLog ?? [],
        lastEventTimestamp: parsed.lastEventTimestamp ?? 0,
        hasBooted: parsed.hasBooted ?? false,
        hasProfiled: parsed.hasProfiled ?? false,
        reducedMotion: parsed.reducedMotion ?? false,
        highContrast: parsed.highContrast ?? false,
        fontSize: parsed.fontSize ?? 'medium',
        osVoiceText: parsed.osVoiceText ?? false,
        soundEnabled: parsed.soundEnabled ?? true,
        masterVolume: parsed.masterVolume ?? 0.7,
        hasHydrated: true,
      });
    } catch (e) {
      // If hydration fails, start fresh
      set({ hasHydrated: true });
    }
  },
}));

// ─── Auto-Persist Subscriber ──────────────────────────────────
// Whenever state changes (excluding transient fields), persist to AsyncStorage.
// Throttled to avoid excessive writes during rapid updates (e.g. timer ticks).

let persistTimeout: ReturnType<typeof setTimeout> | null = null;
const PERSIST_THROTTLE_MS = 2000; // 2-second debounce

useGameStore.subscribe((state, prevState) => {
  // Skip if not yet hydrated
  if (!state.hasHydrated) return;

  // Skip if only transient fields changed
  const transientKeys = new Set<string>([
    'isEditorFocused', 'activeMission', 'hasHydrated',
    'lastXPGain', 'pendingLevelUp', 'pendingAchievements',
  ]);

  const changedKeys = Object.keys(state).filter(
    (key) => !transientKeys.has(key) && state[key as keyof GameStore] !== prevState[key as keyof GameStore]
  );

  if (changedKeys.length === 0) return;

  // Throttled persist
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => {
    useGameStore.getState().persistState();
  }, PERSIST_THROTTLE_MS);
});
