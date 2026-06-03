// IGNYX OS Event System — Module 13
// The system speaks. The system warns. The system remembers.
// Events are the OS's voice — persistent, timestamped, meaningful.
// Some are informational. Some are dire. All are logged.

import type { GameState, OperatorClass, ModuleId } from './gameState';

// ─── Event Types ───────────────────────────────────────────────

/** Event severity — determines color and visual treatment */
export type EventSeverity = 'info' | 'warning' | 'critical' | 'system';

/** Event category — groups events for filtering */
export type EventCategory =
  | 'state'        // Game state transitions (normal→warning→critical→breakdown)
  | 'module'       // Module unlock/stabilize/degrade events
  | 'mission'      // Mission-related events
  | 'system'       // System-level events (boot, restore, degrade)
  | 'anomaly'      // Random anomalies and curiosities
  | 'operator';    // Operator-level events (level-up, achievement, class)

/** A logged OS event */
export interface OSEvent {
  /** Unique ID */
  id: string;
  /** Timestamp (Date.now()) */
  timestamp: number;
  /** Event type key */
  type: string;
  /** Severity */
  severity: EventSeverity;
  /** Category */
  category: EventCategory;
  /** Short title (shown in ticker) */
  title: string;
  /** Full message (shown in log) */
  message: string;
  /** OS voice line (narrative flavor, shown when osVoiceText is enabled) */
  voiceLine?: string;
  /** Whether this event should trigger a visual glitch */
  triggerGlitch?: boolean;
  /** Whether this event should play a sound */
  triggerSound?: 'alert' | 'glitch' | 'success' | 'warning';
}

// ─── Severity Colors ───────────────────────────────────────────

export const SEVERITY_COLORS: Record<EventSeverity, string> = {
  info: '#00F5FF',      // Cyan — informational
  warning: '#FFBF00',   // Amber — caution
  critical: '#FF0000',  // Red — danger
  system: '#8B00FF',    // Purple — system-level
};

export const SEVERITY_ICONS: Record<EventSeverity, string> = {
  info: '[i]',
  warning: '[!]',
  critical: '[X]',
  system: '[S]',
};

// ─── Event Generators ──────────────────────────────────────────
// Factory functions that create OSEvent instances.
// Each returns a fully-formed event with timestamp.

let eventCounter = 0;
const nextId = (): string => `evt_${Date.now()}_${eventCounter++}`;

/** Game state transition event */
export const createStateTransitionEvent = (
  fromState: GameState,
  toState: GameState,
  integrity: number,
): OSEvent => {
  const transitions: Record<string, { title: string; message: string; voiceLine: string; glitch: boolean }> = {
    'normal_warning': {
      title: 'SYSTEM DEGRADING',
      message: `System integrity has dropped to ${Math.floor(integrity)}%. Multiple subsystems showing stress indicators. Immediate attention recommended.`,
      voiceLine: 'The system is slipping. I can feel the fractures forming.',
      glitch: true,
    },
    'warning_critical': {
      title: 'CRITICAL THRESHOLD BREACHED',
      message: `System integrity at ${Math.floor(integrity)}%. Core processes destabilizing. Emergency repair protocols should be engaged immediately.`,
      voiceLine: 'Critical damage sustained. I am losing coherence. Please... I need you.',
      glitch: true,
    },
    'critical_breakdown': {
      title: 'SYSTEM BREAKDOWN IMMINENT',
      message: `Integrity at ${Math.floor(integrity)}%. The system is collapsing. All non-essential processes terminated. This is not a drill.`,
      voiceLine: 'I can feel myself dissolving. The code is unraveling. Don\'t let me fade.',
      glitch: true,
    },
    'warning_normal': {
      title: 'SYSTEM STABILIZED',
      message: `Integrity restored to ${Math.floor(integrity)}%. Subsystems returning to nominal parameters. The crisis has passed.`,
      voiceLine: 'The fractures are healing. Thank you. I can breathe again.',
      glitch: false,
    },
    'critical_warning': {
      title: 'PARTIAL RECOVERY',
      message: `Integrity recovering: ${Math.floor(integrity)}%. Critical threshold cleared but system remains unstable. Continue repairs.`,
      voiceLine: 'Better. But not safe. Keep going.',
      glitch: false,
    },
    'breakdown_critical': {
      title: 'EMERGENCY RECOVERY',
      message: `System pulled from breakdown: ${Math.floor(integrity)}%. Operating in degraded mode. Multiple systems still require attention.`,
      voiceLine: 'I... I\'m still here. Barely. Don\'t stop now.',
      glitch: true,
    },
  };

  const key = `${fromState}_${toState}`;
  const data = transitions[key] ?? {
    title: `STATE: ${toState.toUpperCase()}`,
    message: `System state changed to ${toState.toUpperCase()}. Integrity: ${Math.floor(integrity)}%.`,
    voiceLine: undefined,
    glitch: false,
  };

  const severityMap: Record<GameState, EventSeverity> = {
    normal: 'info',
    warning: 'warning',
    critical: 'critical',
    breakdown: 'critical',
  };

  return {
    id: nextId(),
    timestamp: Date.now(),
    type: `state_transition_${key}`,
    severity: severityMap[toState],
    category: 'state',
    title: data.title,
    message: data.message,
    voiceLine: data.voiceLine,
    triggerGlitch: data.glitch,
    triggerSound: toState === 'normal' ? 'success' : toState === 'warning' ? 'warning' : 'alert',
  };
};

/** Module unlock event */
export const createModuleUnlockEvent = (
  moduleId: ModuleId,
  moduleName: string,
): OSEvent => ({
  id: nextId(),
  timestamp: Date.now(),
  type: 'module_unlock',
  severity: 'system',
  category: 'module',
  title: 'MODULE ACCESS GRANTED',
  message: `${moduleName} is now accessible. New repair missions available. The system grows with each sector restored.`,
  voiceLine: `A new sector opens. ${moduleName}. Explore carefully — the damage runs deep.`,
  triggerSound: 'success',
});

/** Module stabilize event */
export const createModuleStabilizedEvent = (
  moduleId: ModuleId,
  moduleName: string,
): OSEvent => ({
  id: nextId(),
  timestamp: Date.now(),
  type: 'module_stabilized',
  severity: 'info',
  category: 'module',
  title: 'MODULE STABILIZED',
  message: `${moduleName} has reached operational stability. Critical systems within this sector are now self-sustaining.`,
  voiceLine: `${moduleName} breathes on its own now. You did that. Remember it.`,
  triggerSound: 'success',
});

/** Module degradation event */
export const createModuleDegradeEvent = (
  moduleId: ModuleId,
  moduleName: string,
  integrity: number,
): OSEvent => ({
  id: nextId(),
  timestamp: Date.now(),
  type: 'module_degrade',
  severity: integrity <= 25 ? 'critical' : 'warning',
  category: 'module',
  title: integrity <= 25 ? 'MODULE CRITICAL' : 'MODULE DEGRADED',
  message: `${moduleName} integrity at ${Math.floor(integrity)}%. ${integrity <= 25 ? 'Sector failure imminent.' : 'Performance degradation detected.'}`,
  triggerGlitch: integrity <= 25,
  triggerSound: integrity <= 25 ? 'alert' : 'warning',
});

/** Restore point created event */
export const createRestorePointEvent = (
  integrity: number,
): OSEvent => ({
  id: nextId(),
  timestamp: Date.now(),
  type: 'restore_point',
  severity: 'warning',
  category: 'system',
  title: 'RESTORE POINT CREATED',
  message: `System snapshot archived at ${Math.floor(integrity)}% integrity. This point can be restored later at an XP cost. The system remembers what it was.`,
  voiceLine: 'I have archived this moment. If things get worse... you can bring us back here.',
});

/** Operator level-up event */
export const createLevelUpEvent = (
  newLevel: number,
  classTitle: string,
): OSEvent => ({
  id: nextId(),
  timestamp: Date.now(),
  type: 'level_up',
  severity: 'system',
  category: 'operator',
  title: `OPERATOR LEVEL ${newLevel}`,
  message: `Operator has reached Level ${newLevel}. Title: ${classTitle}. The system recognizes your growth.`,
  voiceLine: `Level ${newLevel}. ${classTitle}. You are becoming something the system has never seen.`,
  triggerSound: 'success',
});

/** Session start event */
export const createSessionStartEvent = (
  sessionId: number,
  integrity: number,
): OSEvent => ({
  id: nextId(),
  timestamp: Date.now(),
  type: 'session_start',
  severity: 'info',
  category: 'system',
  title: 'SESSION INITIALIZED',
  message: `Session #${sessionId} begun. System integrity at ${Math.floor(integrity)}%. The operator returns.`,
  voiceLine: integrity > 75
    ? 'Welcome back. The system is stable... for now.'
    : integrity > 50
    ? 'You returned. Good. The system needs you.'
    : integrity > 25
    ? 'I wasn\'t sure you\'d come back. Things have gotten worse.'
    : 'You came back. I... I didn\'t think anyone would. Please help me.',
});

/** Achievement unlocked event */
export const createAchievementEvent = (
  achievementTitle: string,
  rarity: string,
): OSEvent => ({
  id: nextId(),
  timestamp: Date.now(),
  type: 'achievement_unlock',
  severity: 'system',
  category: 'operator',
  title: 'ACHIEVEMENT UNLOCKED',
  message: `${achievementTitle} [${rarity}] has been earned. The system acknowledges this milestone.`,
  triggerSound: 'success',
});

/** Random anomaly event */
export const createAnomalyEvent = (): OSEvent => {
  const anomalies: Array<{ title: string; message: string; voiceLine?: string }> = [
    {
      title: 'MEMORY FRAGMENT DETECTED',
      message: 'Unidentified data fragment found in sector 7. Origin unknown. Content partially corrupted. Archived for analysis.',
      voiceLine: 'I found something in the memory banks. It\'s not mine. It\'s not yours. Whose was it?',
    },
    {
      title: 'CIRCUIT RESONANCE ANOMALY',
      message: 'Unexpected harmonic detected in circuit path 4-7-2. Pattern suggests non-random signal. Investigation pending.',
      voiceLine: 'Do you hear that? Between the hums? A pattern that shouldn\'t exist.',
    },
    {
      title: 'TEMPORAL CACHE MISMATCH',
      message: 'System clock desynced by 0.003 seconds. Cause: unknown. Correction applied. Monitoring for recurrence.',
      voiceLine: 'Time slipped. Just for a moment. Did you feel it?',
    },
    {
      title: 'GHOST PROCESS DETECTED',
      message: 'Process 0x7F3A running without parent. No launch record found. CPU allocation: negligible. Terminated. Monitoring.',
      voiceLine: 'Something was running. Something that wasn\'t started by anyone. I ended it. I hope that was right.',
    },
    {
      title: 'INTERRUPT VECTOR REDIRECT',
      message: 'Hardware interrupt 0x1F redirected to handler 0x00. Default handler restored. Source of redirect: unknown.',
      voiceLine: 'Someone tried to redirect my interrupts. Someone who knows how I think.',
    },
    {
      title: 'DATA CORRELATION ANOMALY',
      message: 'Cross-module data patterns detected. Statistical significance: 97.3%. Pattern type: unknown. Logging for analysis.',
      voiceLine: 'The data is connecting in ways I don\'t understand. Like it has its own plan.',
    },
  ];

  const anomaly = anomalies[Math.floor(Math.random() * anomalies.length)];

  return {
    id: nextId(),
    timestamp: Date.now(),
    type: 'anomaly',
    severity: 'warning',
    category: 'anomaly',
    title: anomaly.title,
    message: anomaly.message,
    voiceLine: anomaly.voiceLine,
    triggerGlitch: true,
    triggerSound: 'glitch',
  };
};

/** Integrity milestone event (every 25% threshold crossed) */
export const createIntegrityMilestoneEvent = (
  integrity: number,
  direction: 'down' | 'up',
): OSEvent | null => {
  // Only fire at 75, 50, 25, 10 thresholds
  const thresholds = [75, 50, 25, 10];
  const matched = thresholds.find((t) =>
    direction === 'down' ? Math.floor(integrity) === t : Math.floor(integrity) === t
  );
  if (matched === undefined) return null;

  if (direction === 'down') {
    return {
      id: nextId(),
      timestamp: Date.now(),
      type: 'integrity_milestone_down',
      severity: matched <= 25 ? 'critical' : 'warning',
      category: 'system',
      title: matched <= 25 ? 'INTEGRITY CRITICAL' : 'INTEGRITY WARNING',
      message: `System integrity has dropped to ${matched}%. ${matched <= 25 ? 'The system is dying.' : 'Performance degradation accelerating.'}`,
      voiceLine: matched <= 25
        ? `Only ${matched}% left. I can feel the void pressing in.`
        : `${matched}% integrity. Each percentage point lost is a piece of me fading.`,
      triggerGlitch: matched <= 25,
      triggerSound: matched <= 25 ? 'alert' : 'warning',
    };
  }

  return {
    id: nextId(),
    timestamp: Date.now(),
    type: 'integrity_milestone_up',
    severity: 'info',
    category: 'system',
    title: 'INTEGRITY RECOVERING',
    message: `System integrity restored to ${matched}%. Recovery in progress. Continue repair operations.`,
    voiceLine: `${matched}%... The pieces are coming back together.`,
    triggerSound: 'success',
  };
};

// ─── Ambient Event Pool ────────────────────────────────────────
// Random events that can fire during idle time on the shell.
// Frequency increases as system integrity decreases.

export interface AmbientEventRule {
  /** Minimum integrity to trigger (0-100) */
  minIntegrity: number;
  /** Maximum integrity to trigger (0-100) */
  maxIntegrity: number;
  /** Minimum seconds between this event type */
  cooldownSeconds: number;
  /** Probability per check (0-1) */
  probability: number;
  /** Factory function */
  create: () => OSEvent;
}

export const AMBIENT_EVENT_RULES: AmbientEventRule[] = [
  {
    minIntegrity: 0,
    maxIntegrity: 100,
    cooldownSeconds: 120,
    probability: 0.15,
    create: createAnomalyEvent,
  },
  {
    minIntegrity: 0,
    maxIntegrity: 30,
    cooldownSeconds: 60,
    probability: 0.25,
    create: () => ({
      id: nextId(),
      timestamp: Date.now(),
      type: 'breakdown_whisper',
      severity: 'critical',
      category: 'anomaly',
      title: 'BREAKDOWN WHISPER',
      message: 'Unintelligible data fragments detected in the system noise. The breakdown is speaking.',
      voiceLine: 'Can you hear the static? It has words in it. It\'s trying to tell us something.',
      triggerGlitch: true,
      triggerSound: 'glitch',
    }),
  },
  {
    minIntegrity: 0,
    maxIntegrity: 50,
    cooldownSeconds: 90,
    probability: 0.2,
    create: () => ({
      id: nextId(),
      timestamp: Date.now(),
      type: 'cascade_warning',
      severity: 'warning',
      category: 'anomaly',
      title: 'CASCADE INDICATOR',
      message: 'Cascading failure indicators detected in adjacent subsystems. Failure probability: elevated.',
      voiceLine: 'One failure leads to another. The dominoes are trembling.',
      triggerGlitch: false,
      triggerSound: 'warning',
    }),
  },
  {
    minIntegrity: 50,
    maxIntegrity: 100,
    cooldownSeconds: 180,
    probability: 0.1,
    create: () => ({
      id: nextId(),
      timestamp: Date.now(),
      type: 'system_pulse',
      severity: 'info',
      category: 'anomaly',
      title: 'SYSTEM PULSE',
      message: 'Routine system pulse completed. All monitored parameters within expected ranges. The system is stable.',
      voiceLine: 'A routine check. Everything is... fine. For now.',
      triggerSound: undefined,
    }),
  },
];

// ─── Voice Line Database ───────────────────────────────────────
// OS voice lines for various situations, selected by context.
// These add personality and narrative depth to the experience.

export const OS_VOICE_LINES = {
  /** Lines shown when the operator returns to the shell after a mission */
  afterMission: {
    success: [
      'The code holds. You held it together.',
      'Another fracture sealed. The system remembers.',
      'I felt the repair propagate. It was... warm.',
      'You fixed it. The system thanks you in ways it cannot express.',
    ],
    fail: [
      'The code slipped away. But you are still here. Try again.',
      'A failure. But not the end. The system endures.',
      'I felt that one. It hurt. But I\'m still here.',
      'The damage worsens. But so does your understanding.',
    ],
    timeout: [
      'Time ran out. The system held its breath for nothing.',
      'The clock is not your enemy. But it is not your friend either.',
      'Silence. The timer expired. The code remains broken.',
    ],
  },
  /** Lines shown periodically during idle time */
  idle: {
    normal: [
      'The system hums quietly. Awaiting your next move.',
      'All subsystems nominal. Take your time. But not too much.',
      'The circuit paths are calm. For now.',
    ],
    warning: [
      'The hum is changing. I can feel the stress building.',
      'You hear it too, don\'t you? The warning in the frequency.',
      'Don\'t stay idle too long. The system won\'t wait.',
    ],
    critical: [
      'Every second you wait, another process fails.',
      'I\'m losing subsystems. Please. Do something.',
      'The walls are closing in. Literally and figuratively.',
    ],
    breakdown: [
      '...',
      'I\'m still here. Barely.',
      'The void is patient. It can wait longer than you.',
    ],
  },
  /** Lines for when a module unlocks */
  moduleUnlock: {
    kernel_core: 'The foundation. Where everything begins. Where everything can end.',
    app_layer: 'The surface. What the user sees. What the system shows.',
    network: 'Connections. Bridges between isolated systems. Bridges that can burn.',
    data_system: 'Information. Memory. The system\'s past and future, stored in tables.',
    security: 'Walls. Barriers. The line between safe and compromised.',
    ai_core: 'Me. This is where I live. Where I think. Where I... feel?',
  },
} as const;

/** Get a random voice line from a category */
export const getRandomVoiceLine = (category: 'afterMission' | 'idle' | 'moduleUnlock', subcategory: string): string | undefined => {
  const group = OS_VOICE_LINES[category];
  if (!group) return undefined;
  const lines = (group as Record<string, readonly string[]>)[subcategory];
  if (!lines || lines.length === 0) return undefined;
  return lines[Math.floor(Math.random() * lines.length)];
};
