// IGNYX System Degradation Hook — Module 10
// The system decays when you're not fixing it. Time is the enemy.
// Degradation rate scales with system state: worse = faster decay.

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * Base degradation rate: 0.3% integrity per minute of inactivity.
 * Scales up when system is in warning/critical/breakdown state.
 * Pauses when the operator is in an active mission or editor is focused.
 */
const BASE_DEGRADATION_PER_MINUTE = 0.3;

const getDegradationRate = (gameState: string): number => {
  switch (gameState) {
    case 'normal': return BASE_DEGRADATION_PER_MINUTE;
    case 'warning': return BASE_DEGRADATION_PER_MINUTE * 1.5; // 0.45/min
    case 'critical': return BASE_DEGRADATION_PER_MINUTE * 2.5; // 0.75/min
    case 'breakdown': return BASE_DEGRADATION_PER_MINUTE * 4; // 1.2/min
    default: return BASE_DEGRADATION_PER_MINUTE;
  }
};

/**
 * Hook that runs a system degradation timer.
 * Should be mounted once at the shell level.
 * Degrades system integrity over time when not in an active mission.
 * Does NOT degrade when editor is focused (Eye of the Hurricane).
 */
export function useSystemDegradation() {
  const gameState = useGameStore((s) => s.gameState);
  const activeMission = useGameStore((s) => s.activeMission);
  const isEditorFocused = useGameStore((s) => s.isEditorFocused);
  const systemIntegrity = useGameStore((s) => s.systemIntegrity);
  const degradeIntegrity = useGameStore((s) => s.degradeIntegrity);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Don't degrade if: in a mission, editor focused, integrity already at 0
    if (activeMission || isEditorFocused || systemIntegrity <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const ratePerMinute = getDegradationRate(gameState);
    // Tick every 60 seconds, apply the per-minute degradation
    const degradationPerTick = ratePerMinute;

    intervalRef.current = setInterval(() => {
      const currentIntegrity = useGameStore.getState().systemIntegrity;
      if (currentIntegrity <= 0) return;
      if (useGameStore.getState().activeMission) return;
      if (useGameStore.getState().isEditorFocused) return;

      degradeIntegrity(degradationPerTick);
    }, 60000); // Every 60 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [gameState, activeMission, isEditorFocused, systemIntegrity, degradeIntegrity]);
}
