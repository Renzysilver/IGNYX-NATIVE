// IGNYX Mission Screen — Module 05 + Module 06
// The operator's crucible. Broken code. A countdown. No second chances.
// Integrated with the CodeEditor for syntax highlighting, line numbers, and Eye of the Hurricane.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ShellLayout } from '../components/ShellLayout';
import { GlassPanel } from '../components/GlassPanel';
import { GlitchOverlay } from '../components/GlitchOverlay';
import { AlertOverlayManager } from '../components/AlertOverlay';
import { CodeEditor } from '../components/CodeEditor';
import { Colors } from '../constants/colors';
import { useGameStore } from '../store/useGameStore';
import {
  getNextMission,
  validateCode,
  getErrorLines,
  type Mission,
} from '../constants/missions';
import type { ModuleId } from '../constants/gameState';
import { useRouter } from 'expo-router';
import {
  updateAmbient,
  playSuccess,
  playFail,
  playGlitchShort,
  playGlitchLong,
  playTimerWarning,
  playAlert,
  pauseAmbientForEditor,
  resumeAmbientFromEditor,
} from '../services/AudioEngine';

type MissionStage = 'alert' | 'active' | 'success' | 'fail' | 'timeout';

export default function MissionScreen() {
  const router = useRouter();
  const modules = useGameStore((s) => s.modules);
  const activeMission = useGameStore((s) => s.activeMission);
  const startMission = useGameStore((s) => s.startMission);
  const endMission = useGameStore((s) => s.endMission);
  const completeMission = useGameStore((s) => s.completeMission);
  const failMissionStore = useGameStore((s) => s.failMission);
  const degradeIntegrity = useGameStore((s) => s.degradeIntegrity);
  const checkRestorePoints = useGameStore((s) => s.checkRestorePoints);
  const gameState = useGameStore((s) => s.gameState);

  const [stage, setStage] = useState<MissionStage>('alert');
  const [mission, setMission] = useState<Mission | null>(null);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackColor, setFeedbackColor] = useState<string>(Colors.textRed);
  const [showGlitch, setShowGlitch] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [errorLines, setErrorLines] = useState<number[]>([]);
  const [moduleId, setModuleId] = useState<ModuleId | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);

  // ── Determine which module to show missions for ──────────────

  const getActiveModuleId = (): ModuleId | null => {
    const order: ModuleId[] = ['kernel_core', 'app_layer', 'network', 'data_system', 'security', 'ai_core'];
    for (const id of order) {
      if (modules[id]?.unlocked && modules[id].missionsCompleted < modules[id].totalMissions) {
        return id;
      }
    }
    return null;
  };

  // ── Error lines computed via getErrorLines from constants/missions ──

  // ── Initialize mission on mount ──────────────────────────────

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const mId = getActiveModuleId();
    if (!mId) {
      router.replace('/shell');
      return;
    }

    setModuleId(mId);
    const mod = modules[mId];
    const nextMission = getNextMission(mId, mod.missionsCompleted);
    if (!nextMission) {
      router.replace('/shell');
      return;
    }

    setMission(nextMission);
    setCode(nextMission.brokenCode);
    setTimeLeft(nextMission.timerSeconds);
    setStage('alert');

    // Fire the sector alert
    setTimeout(() => {
      AlertOverlayManager.show(
        nextMission.alert,
        Colors.textAmber,
        3000,
        () => {
          setStage('active');
          startMission(nextMission.id, mId);
          // Start ambient for current game state
          updateAmbient(gameState);
        },
      );
    }, 500);
    playAlert();
  }, []);

  // ── Timer countdown ──────────────────────────────────────────

  useEffect(() => {
    if (stage !== 'active') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }

        // Timer warnings at 30s and 10s
        if (prev === 31) {
          AlertOverlayManager.show(
            '30 seconds remaining. Stabilize immediately.',
            Colors.textAmber,
            2000,
          );
          playTimerWarning();
        }
        if (prev === 11) {
          AlertOverlayManager.show(
            '10 seconds. Do not fail.',
            Colors.textRed,
            1500,
          );
          playTimerWarning();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  // ── Format time as MM:SS ─────────────────────────────────────

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Timer color based on remaining time ──────────────────────

  const getTimerColor = (): string => {
    if (timeLeft > 30) return Colors.textCyan;
    if (timeLeft > 10) return Colors.textAmber;
    return Colors.textRed;
  };

  // ── Timer urgency animation ──────────────────────────────────

  const timerScale = useSharedValue(1);

  useEffect(() => {
    if (stage === 'active' && timeLeft <= 10 && timeLeft > 0) {
      timerScale.value = withSequence(
        withTiming(1.15, { duration: 200 }),
        withTiming(1, { duration: 200 }),
      );
    }
  }, [timeLeft, stage]);

  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
  }));

  // ── Handle code changes ──────────────────────────────────────

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    // Clear error lines when code changes
    setErrorLines([]);
  }, []);

  // ── Handle code submission ───────────────────────────────────

  const handleSubmit = useCallback(() => {
    if (!mission || stage !== 'active') return;

    const result = validateCode(code, mission);

    if (result.correct) {
      // Success
      if (timerRef.current) clearInterval(timerRef.current);
      setStage('success');
      setFeedbackText(mission.successMessage);
      setFeedbackColor(Colors.textCyan);
      setErrorLines([]);
      completeMission(mission.moduleId);
      checkRestorePoints();
      Vibration.vibrate([30, 50, 30]);
      playSuccess();

      setTimeout(() => {
        router.replace('/shell');
      }, 3000);
    } else {
      // Fail — show feedback + error lines + glitch
      const lines = getErrorLines(code, mission);
      setErrorLines(lines);
      setFeedbackText(result.feedback);
      setFeedbackColor(Colors.textRed);
      setShowGlitch(true);
      setGlitchIntensity('medium');
      Vibration.vibrate([100, 50, 100]);
      playGlitchShort();
      playFail();

      setTimeout(() => {
        setShowGlitch(false);
      }, 600);

      // Clear feedback after delay
      setTimeout(() => {
        setFeedbackText('');
      }, 4000);
    }
  }, [mission, code, stage, completeMission, checkRestorePoints, getErrorLines]);

  // ── Handle timeout ───────────────────────────────────────────

  const handleTimeout = useCallback(() => {
    if (!mission) return;
    setStage('timeout');
    setFeedbackText(mission.timeoutMessage);
    setFeedbackColor(Colors.textRed);
    failMissionStore(mission.moduleId);
    degradeIntegrity(10);
    checkRestorePoints();

    setShowGlitch(true);
    setGlitchIntensity('high');
    Vibration.vibrate([200, 100, 200, 100, 200]);
    playGlitchLong();
    playFail();

    setTimeout(() => {
      setShowGlitch(false);
    }, 1200);

    setTimeout(() => {
      router.replace('/shell');
    }, 4000);
  }, [mission]);

  // ── Render ───────────────────────────────────────────────────

  if (!mission) return null;

  return (
    <ShellLayout darkMode>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        {/* ── Top bar: mission info + timer ── */}
        <View style={styles.topBar}>
          <View style={styles.missionInfo}>
            <Text style={styles.missionId}>{mission.id}</Text>
            <Text style={styles.missionTitle}>{mission.title}</Text>
          </View>
          <Animated.View style={[styles.timerContainer, timerAnimatedStyle]}>
            <Text style={[styles.timer, { color: getTimerColor() }]}>
              {formatTime(timeLeft)}
            </Text>
          </Animated.View>
        </View>

        {/* ── Feedback text ── */}
        {feedbackText ? (
          <View style={styles.feedbackBar}>
            <Text style={[styles.feedbackText, { color: feedbackColor }]}>
              {feedbackText}
            </Text>
          </View>
        ) : null}

        {/* ── Code Editor (Module 06) ── */}
        <CodeEditor
          code={code}
          onChangeCode={handleCodeChange}
          editable={stage === 'active'}
          language={mission.language}
          errorLines={errorLines}
        />

        {/* ── Submit button ── */}
        {stage === 'active' && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <View style={styles.submitPanel}>
              <Text style={styles.submitText}>EXECUTE</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Success overlay ── */}
        {stage === 'success' && (
          <View style={styles.resultOverlay}>
            <Text style={styles.successText}>{mission.successMessage}</Text>
          </View>
        )}

        {/* ── Timeout overlay ── */}
        {stage === 'timeout' && (
          <View style={styles.resultOverlay}>
            <Text style={styles.failText}>{mission.timeoutMessage}</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Glitch overlay ── */}
      <GlitchOverlay
        intensity={glitchIntensity}
        duration={stage === 'timeout' ? 1200 : 600}
        active={showGlitch}
        onComplete={() => setShowGlitch(false)}
      />
    </ShellLayout>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 100,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  missionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  missionId: {
    color: Colors.textDim,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  missionTitle: {
    color: Colors.textCyan,
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  timerContainer: {
    // Timer display
  },
  timer: {
    fontSize: 18,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },

  // Feedback
  feedbackBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 0, 0, 0.4)',
  },
  feedbackText: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // Submit
  submitButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  submitPanel: {
    minWidth: 160,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cyan,
  },
  submitText: {
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
  },

  // Result overlays
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 500,
  },
  successText: {
    color: Colors.textCyan,
    fontSize: 16,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    textAlign: 'center',
  },
  failText: {
    color: Colors.textRed,
    fontSize: 16,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    textAlign: 'center',
  },
});
