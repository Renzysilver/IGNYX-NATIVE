// IGNYX OS Events Hook — Module 13
// The bridge between game state changes and the event system.
// Fires events on transitions. Runs ambient event checks. Logs everything.
// The system speaks through events. The operator listens.

import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  createStateTransitionEvent,
  createModuleUnlockEvent,
  createModuleStabilizedEvent,
  createSessionStartEvent,
  createAchievementEvent,
  createIntegrityMilestoneEvent,
  AMBIENT_EVENT_RULES,
  SEVERITY_COLORS,
  type OSEvent,
  type EventSeverity,
} from '../constants/osEvents';
import { AlertOverlayManager } from '../components/AlertOverlay';
import { Colors } from '../constants/colors';
import { playAlert, playGlitchShort, playSuccess, playTimerWarning } from '../services/AudioEngine';
import { MODULE_NAMES } from '../constants/gameState';
import type { ModuleId } from '../constants/gameState';

// ─── Sound Mapping ─────────────────────────────────────────────

const TRIGGER_SOUNDS: Record<string, (() => void) | undefined> = {
  alert: playAlert,
  glitch: playGlitchShort,
  success: playSuccess,
  warning: playTimerWarning,
};

// ─── Hook Return Type ──────────────────────────────────────────

interface OSEventsState {
  /** Recent events (last N) */
  recentEvents: OSEvent[];
  /** Fire an event — logs it, shows alert, plays sound */
  fireEvent: (event: OSEvent) => void;
  /** Fire a state transition event if the state actually changed */
  checkStateTransition: (prevGameState: string, newGameState: string, integrity: number) => void;
  /** Fire a module unlock event */
  fireModuleUnlock: (moduleId: string) => void;
  /** Fire a module stabilized event */
  fireModuleStabilized: (moduleId: string) => void;
  /** Fire an integrity milestone event */
  fireIntegrityMilestone: (integrity: number, direction: 'down' | 'up') => void;
  /** Check and fire ambient events (random anomalies, etc.) */
  checkAmbientEvents: () => void;
  /** Fire session start event */
  fireSessionStart: () => void;
  /** Fire an achievement event */
  fireAchievement: (title: string, rarity: string) => void;
}

// ─── Hook ──────────────────────────────────────────────────────

export function useOSEvents(): OSEventsState {
  const eventLog = useGameStore((s) => s.eventLog);
  const addEvent = useGameStore((s) => s.addEvent);
  const lastEventTimestamp = useGameStore((s) => s.lastEventTimestamp);
  const osVoiceText = useGameStore((s) => s.osVoiceText);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const systemIntegrity = useGameStore((s) => s.systemIntegrity);

  // Track ambient event cooldowns by type
  const ambientCooldowns = useRef<Record<string, number>>({});

  // Fire an event — central dispatcher
  const fireEvent = useCallback((event: OSEvent) => {
    // Log the event
    addEvent(event);

    // Show alert overlay for warning/critical/system events
    if (event.severity === 'critical' || event.severity === 'warning') {
      const color = SEVERITY_COLORS[event.severity];
      AlertOverlayManager.show(event.title, color, 3500);
    } else if (event.severity === 'system') {
      AlertOverlayManager.show(event.title, SEVERITY_COLORS.system, 3000);
    }

    // Show OS voice line if enabled
    if (osVoiceText && event.voiceLine) {
      setTimeout(() => {
        AlertOverlayManager.show(
          event.voiceLine!,
          Colors.textCyan,
          4000,
        );
      }, 4000);
    }

    // Play trigger sound
    if (event.triggerSound) {
      const soundFn = TRIGGER_SOUNDS[event.triggerSound];
      if (soundFn) {
        setTimeout(() => soundFn(), 300);
      }
    }

    // Trigger visual glitch
    if (event.triggerGlitch && !reducedMotion) {
      // Glitch is handled by the consuming component via eventLog change
      // The AmbientOverlay/GlitchOverlay will react to the latest event
    }
  }, [addEvent, osVoiceText, reducedMotion]);

  // Check state transition
  const checkStateTransition = useCallback((prevGameState: string, newGameState: string, integrity: number) => {
    if (prevGameState === newGameState) return;
    const event = createStateTransitionEvent(
      prevGameState as any,
      newGameState as any,
      integrity,
    );
    fireEvent(event);
  }, [fireEvent]);

  // Fire module unlock
  const fireModuleUnlock = useCallback((moduleId: string) => {
    const moduleName = MODULE_NAMES[moduleId as ModuleId] ?? moduleId;
    const event = createModuleUnlockEvent(moduleId as ModuleId, moduleName);
    fireEvent(event);
  }, [fireEvent]);

  // Fire module stabilized
  const fireModuleStabilized = useCallback((moduleId: string) => {
    const moduleName = MODULE_NAMES[moduleId as ModuleId] ?? moduleId;
    const event = createModuleStabilizedEvent(moduleId as ModuleId, moduleName);
    fireEvent(event);
  }, [fireEvent]);

  // Fire integrity milestone
  const fireIntegrityMilestone = useCallback((integrity: number, direction: 'down' | 'up') => {
    const event = createIntegrityMilestoneEvent(integrity, direction);
    if (event) fireEvent(event);
  }, [fireEvent]);

  // Check ambient events — runs periodically on the shell
  const checkAmbientEvents = useCallback(() => {
    const now = Date.now();

    for (const rule of AMBIENT_EVENT_RULES) {
      // Check integrity bounds
      if (systemIntegrity < rule.minIntegrity || systemIntegrity > rule.maxIntegrity) continue;

      // Check cooldown
      const lastFire = ambientCooldowns.current[rule.create.name] ?? 0;
      const elapsed = (now - lastFire) / 1000;
      if (elapsed < rule.cooldownSeconds) continue;

      // Roll probability
      if (Math.random() > rule.probability) continue;

      // Fire the event!
      const event = rule.create();
      ambientCooldowns.current[rule.create.name] = now;
      fireEvent(event);
      break; // Only one ambient event per check
    }
  }, [systemIntegrity, fireEvent]);

  // Fire session start
  const fireSessionStart = useCallback(() => {
    const sessionId = useGameStore.getState().sessionId;
    const integrity = useGameStore.getState().systemIntegrity;
    const event = createSessionStartEvent(sessionId, integrity);
    fireEvent(event);
  }, [fireEvent]);

  // Fire achievement
  const fireAchievement = useCallback((title: string, rarity: string) => {
    const event = createAchievementEvent(title, rarity);
    fireEvent(event);
  }, [fireEvent]);

  return {
    recentEvents: eventLog.slice(0, 20),
    fireEvent,
    checkStateTransition,
    fireModuleUnlock,
    fireModuleStabilized,
    fireIntegrityMilestone,
    checkAmbientEvents,
    fireSessionStart,
    fireAchievement,
  };
}
