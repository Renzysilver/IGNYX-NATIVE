import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState, OperatorClass, ModuleId, ModuleState } from '../constants/gameState';
import { MODULE_NAMES } from '../constants/gameState';

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

  // Session
  sessionId: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;

  // Boot
  hasBooted: boolean;
  hasProfiled: boolean;

  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  osVoiceText: boolean;

  // Actions
  setOperatorName: (name: string) => void;
  setOperatorClass: (cls: OperatorClass) => void;
  addXP: (amount: number) => void;
  setSystemIntegrity: (value: number) => void;
  degradeIntegrity: (amount: number) => void;
  restoreIntegrity: (amount: number) => void;
  setGameState: (state: GameState) => void;
  setEditorFocused: (focused: boolean) => void;
  completeMission: (moduleId: ModuleId) => void;
  failMission: (moduleId: ModuleId) => void;
  unlockModule: (moduleId: ModuleId) => void;
  setBooted: (booted: boolean) => void;
  setProfiled: (profiled: boolean) => void;
  setAccessibility: (key: string, value: boolean | string) => void;
  resetConsecutiveSuccesses: () => void;
  incrementConsecutiveSuccesses: () => void;
  startMission: (missionId: string, moduleId: ModuleId) => void;
  endMission: () => void;
  checkRestorePoints: () => void;
  loadRestorePoint: (index: number) => void;
  saveRestorePoints: () => Promise<void>;
  loadRestorePoints: () => Promise<void>;
}

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

const getGameStateFromIntegrity = (integrity: number): GameState => {
  if (integrity > 75) return 'normal';
  if (integrity > 50) return 'warning';
  if (integrity > 25) return 'critical';
  return 'breakdown';
};

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
  sessionId: 1,
  consecutiveSuccesses: 0,
  consecutiveFailures: 0,
  hasBooted: false,
  hasProfiled: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  osVoiceText: false,

  setOperatorName: (name) => set({ operatorName: name }),
  setOperatorClass: (cls) => set({ operatorClass: cls }),

  addXP: (amount) => {
    const state = get();
    const newXP = state.xp + amount;
    const newLevel = Math.floor(newXP / 500) + 1;
    set({ xp: newXP, level: newLevel });
  },

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

  completeMission: (moduleId) => {
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

    // Unlock logic
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

    const xpGain = 100 + Math.floor(state.level * 10);
    const newXP = state.xp + xpGain;
    const newLevel = Math.floor(newXP / 500) + 1;

    set({
      modules: newModules,
      xp: newXP,
      level: newLevel,
      consecutiveSuccesses: state.consecutiveSuccesses + 1,
      consecutiveFailures: 0,
      activeMission: null,
    });

    // Restore integrity on success
    const restoredIntegrity = Math.min(100, state.systemIntegrity + 5);
    set({ systemIntegrity: restoredIntegrity, gameState: getGameStateFromIntegrity(restoredIntegrity) });
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

  setBooted: (booted) => set({ hasBooted: booted }),
  setProfiled: (profiled) => set({ hasProfiled: profiled }),

  setAccessibility: (key, value) => {
    if (key === 'reducedMotion') set({ reducedMotion: value as boolean });
    else if (key === 'highContrast') set({ highContrast: value as boolean });
    else if (key === 'fontSize') set({ fontSize: value as 'small' | 'medium' | 'large' });
    else if (key === 'osVoiceText') set({ osVoiceText: value as boolean });
  },

  resetConsecutiveSuccesses: () => set({ consecutiveSuccesses: 0 }),
  incrementConsecutiveSuccesses: () =>
    set((s) => ({ consecutiveSuccesses: s.consecutiveSuccesses + 1 })),

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

  checkRestorePoints: () => {
    const state = get();
    const integrity = state.systemIntegrity;
    const points = [...state.restorePoints];

    // Create restore points at 75%, 50%, 25%
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

    // Apply restore point with debuffs
    const debuffedModules = JSON.parse(JSON.stringify(point.modules)) as Record<ModuleId, ModuleState>;

    // Apply -15% integrity debuff to adjacent modules
    for (const key of Object.keys(debuffedModules) as ModuleId[]) {
      debuffedModules[key].integrity = Math.max(0, debuffedModules[key].integrity - 15);
    }

    set({
      systemIntegrity: point.integrity,
      gameState: getGameStateFromIntegrity(point.integrity),
      xp: Math.max(0, state.xp - 200),
      modules: debuffedModules,
    });
  },

  saveRestorePoints: async () => {
    const state = get();
    try {
      await AsyncStorage.setItem(
        'ignyx_restore_points',
        JSON.stringify(state.restorePoints)
      );
    } catch (e) {
      // Silent fail — restore points are nice-to-have
    }
  },

  loadRestorePoints: async () => {
    try {
      const stored = await AsyncStorage.getItem('ignyx_restore_points');
      if (stored) {
        const points = JSON.parse(stored) as RestorePoint[];
        set({ restorePoints: points });
      }
    } catch (e) {
      // Silent fail
    }
  },
}));
