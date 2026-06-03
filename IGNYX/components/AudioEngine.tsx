// IGNYX AudioEngine Component — Module 07
// React component that bridges Zustand state → AudioEngine service.
// Place inside ShellLayout (or _layout) to auto-sync ambient sounds
// with game state changes, editor focus, sound settings, etc.
// Renders nothing — pure side-effect component.

import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import {
  initializeAudioEngine,
  teardownAudioEngine,
  updateAmbient,
  pauseAmbientForEditor,
  resumeAmbientFromEditor,
  setSoundEnabled as setEngineSoundEnabled,
  setMasterVolume as setEngineMasterVolume,
} from '../services/AudioEngine';
import type { GameState } from '../constants/gameState';

// ─── Component ─────────────────────────────────────────────────

export const AudioEngine: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const isEditorFocused = useGameStore((s) => s.isEditorFocused);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const masterVolume = useGameStore((s) => s.masterVolume);

  const prevGameStateRef = useRef<GameState>(gameState);
  const prevEditorFocusedRef = useRef<boolean>(isEditorFocused);
  const initializedRef = useRef(false);

  // ── Initialize audio engine on mount ──────────────────────────
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initializeAudioEngine();
    }

    return () => {
      teardownAudioEngine();
      initializedRef.current = false;
    };
  }, []);

  // ── Sync game state → ambient sound ──────────────────────────
  // When the game state changes (normal → warning → critical → breakdown),
  // crossfade the ambient circuit hum to match.
  useEffect(() => {
    if (gameState !== prevGameStateRef.current) {
      prevGameStateRef.current = gameState;
      updateAmbient(gameState);
    }
  }, [gameState]);

  // ── Sync editor focus → ambient volume ───────────────────────
  // Eye of the Hurricane: when the code editor has focus,
  // the ambient dims to 10%. When focus leaves, it fades back.
  useEffect(() => {
    if (isEditorFocused !== prevEditorFocusedRef.current) {
      prevEditorFocusedRef.current = isEditorFocused;
      if (isEditorFocused) {
        pauseAmbientForEditor();
      } else {
        resumeAmbientFromEditor();
      }
    }
  }, [isEditorFocused]);

  // ── Sync sound enabled setting ───────────────────────────────
  useEffect(() => {
    setEngineSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // ── Sync master volume setting ───────────────────────────────
  useEffect(() => {
    setEngineMasterVolume(masterVolume);
  }, [masterVolume]);

  // ── Handle app background/foreground ─────────────────────────
  // Pause/resume ambient when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        // App came to foreground — restart ambient
        updateAmbient(gameState);
      } else if (nextState === 'background') {
        // App went to background — audio will be handled by OS
        // expo-av handles this automatically, but we can optimize
      }
    });

    return () => {
      subscription.remove();
    };
  }, [gameState]);

  // This component renders nothing — it's purely for side effects
  return null;
};
