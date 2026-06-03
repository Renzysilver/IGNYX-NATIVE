export type GameState = 'normal' | 'warning' | 'critical' | 'breakdown';

export type OperatorClass = 'ARCHITECT' | 'OPERATIVE' | 'GHOST' | 'UNKNOWN';

export type ModuleId = 'kernel_core' | 'app_layer' | 'network' | 'data_system' | 'security' | 'ai_core';

export interface ModuleState {
  id: ModuleId;
  name: string;
  unlocked: boolean;
  integrity: number;
  missionsCompleted: number;
  totalMissions: number;
  stable: boolean;
}

export const MODULE_NAMES: Record<ModuleId, string> = {
  kernel_core: 'KERNEL CORE',
  app_layer: 'APPLICATION LAYER',
  network: 'NETWORK MODULE',
  data_system: 'DATA SYSTEM',
  security: 'SECURITY MODULE',
  ai_core: 'AI CORE',
};
