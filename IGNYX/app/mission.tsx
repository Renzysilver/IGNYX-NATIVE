// IGNYX Mission Screen — Module 05 + 06 + 09 + 11 + 12
// The operator's crucible. Broken code. A countdown. No second chances.
// Full mission flow: BRIEFING → ALERT → ACTIVE → RESULT
// Every mission is a repair. Every repair has consequences. Every XP gain is earned.
// Every achievement unlocked is remembered.

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { LevelUpCelebration } from '../components/LevelUpCelebration';
import { CodeEditor } from '../components/CodeEditor';
import { MissionBriefing } from '../components/MissionBriefing';
import { MissionResult, type MissionResultType } from '../components/MissionResult';
import { Colors } from '../constants/colors';
import { useGameStore } from '../store/useGameStore';
import {
  getNextMission,
  validateCode,
  getErrorLines,
  calculateFailureConsequences,
  type Mission,
} from '../constants/missions';
import {
  calculateXPGain,
  getMilestonesForLevel,
  getClassTitle,
  getSpeedBonus,
  getStreakBonus,
  type XPBreakdown,
} from '../constants/progression';
import type { ModuleId } from '../constants/gameState';
import { useAchievements } from '../hooks/useAchievements';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  playSuccess,
  playFail,
  playTimerWarning,
  playAlert,
} from '../services/AudioEngine';

// ─── Mission Flow Stages ──────────────────────────────────────
// BRIEFING → The operator reads what's broken and decides to engage
// ALERT → Flash alert, mission timer about to start
// ACTIVE → Code editing + timer countdown
// RESULT → Success / Fail / Timeout outcome display

type MissionStage = 'briefing' | 'alert' | 'active' | 'result';

export default function MissionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Store
  const modules = useGameStore((s) => s.modules);
  const activeMission = useGameStore((s) => s.activeMission);
  const startMission = useGameStore((s) => s.startMission);
  const endMission = useGameStore((s) => s.endMission);
  const completeMission = useGameStore((s) => s.completeMission);
  const failMissionStore = useGameStore((s) => s.failMission);
  const degradeIntegrity = useGameStore((s) => s.degradeIntegrity);
  const restoreIntegrity = useGameStore((s) => s.restoreIntegrity);
  const checkRestorePoints = useGameStore((s) => s.checkRestorePoints);
  const systemIntegrity = useGameStore((s) => s.systemIntegrity);
  const revealFile = useGameStore((s) => s.revealFile);
  const osVoiceText = useGameStore((s) => s.osVoiceText);
  const operatorClass = useGameStore((s) => s.operatorClass);
  const consecutiveSuccesses = useGameStore((s) => s.consecutiveSuccesses);
  const level = useGameStore((s) => s.level);
  const pendingLevelUp = useGameStore((s) => s.pendingLevelUp);
  const clearPendingLevelUp = useGameStore((s) => s.clearPendingLevelUp);
  const setLastSpeedBonus = useGameStore((s) => s.setLastSpeedBonus);
  const setLastStreakBonus = useGameStore((s) => s.setLastStreakBonus);

  // Achievement system (Module 12)
  const { checkAndUnlock } = useAchievements();

  // Mission state
  const [stage, setStage] = useState<MissionStage>('briefing');
  const [mission, setMission] = useState<Mission | null>(null);
  const [moduleId, setModuleId] = useState<ModuleId | null>(null);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  // Result state
  const [resultType, setResultType] = useState<MissionResultType>('success');
  const [feedbackText, setFeedbackText] = useState('');
  const [xpGained, setXpGained] = useState(0);
  const [integrityDelta, setIntegrityDelta] = useState(0);
  const [newSystemIntegrity, setNewSystemIntegrity] = useState(100);
  const [unlockedModule, setUnlockedModule] = useState<ModuleId | null>(null);
  const [moduleStabilized, setModuleStabilized] = useState(false);
  const [xpBreakdown, setXpBreakdown] = useState<XPBreakdown | null>(null);

  // Level-up celebration state (Module 11)
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(1);
  const [levelUpMilestones, setLevelUpMilestones] = useState<import('../constants/progression').MilestoneReward[]>([]);

  // Editor state
  const [errorLines, setErrorLines] = useState<number[]>([]);
  const [showGlitch, setShowGlitch] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [feedbackColor, setFeedbackColor] = useState<string>(Colors.textRed);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInitializedRef = useRef(false);

  // ── Determine which module this mission is for ──────────────

  const getActiveModuleId = (): ModuleId | null => {
    // Check URL params first (from shell module tap)
    if (params.moduleId && typeof params.moduleId === 'string') {
      const mId = params.moduleId as ModuleId;
      if (modules[mId]?.unlocked && modules[mId].missionsCompleted < modules[mId].totalMissions) {
        return mId;
      }
    }

    // Fall back to first available module
    const order: ModuleId[] = ['kernel_core', 'app_layer', 'network', 'data_system', 'security', 'ai_core'];
    for (const id of order) {
      if (modules[id]?.unlocked && modules[id].missionsCompleted < modules[id].totalMissions) {
        return id;
      }
    }
    return null;
  };

  // ── Initialize mission on mount ──────────────────────────────

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

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
    // Start in briefing stage — operator reads before engaging
    setStage('briefing');
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

  // ── Handle briefing accept ───────────────────────────────────

  const handleAcceptBriefing = useCallback(() => {
    if (!mission || !moduleId) return;

    // Transition to alert stage
    setStage('alert');
    playAlert();

    // Fire the sector alert, then start the mission
    setTimeout(() => {
      AlertOverlayManager.show(
        mission.alert,
        Colors.textAmber,
        3000,
        () => {
          setStage('active');
          startMission(mission.id, moduleId);
        },
      );
    }, 300);
  }, [mission, moduleId, startMission]);

  // ── Handle retreat from briefing ─────────────────────────────

  const handleRetreat = useCallback(() => {
    router.replace('/shell');
  }, [router]);

  // ── Handle code changes ──────────────────────────────────────

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setErrorLines([]);
  }, []);

  // ── Handle code submission ───────────────────────────────────

  const handleSubmit = useCallback(() => {
    if (!mission || !moduleId || stage !== 'active') return;

    const result = validateCode(code, mission);

    if (result.correct) {
      // ── SUCCESS ──
      if (timerRef.current) clearInterval(timerRef.current);

      // Calculate XP with progression engine (Module 11)
      const timeRemainingFraction = mission.timerSeconds > 0
        ? timeLeft / mission.timerSeconds
        : 0;
      const breakdown = calculateXPGain(
        mission.xpReward,
        operatorClass,
        moduleId,
        consecutiveSuccesses + 1, // +1 because this is about to be the new streak
        timeRemainingFraction,
        level,
      );

      // Store the pre-mission integrity for delta calculation
      const preIntegrity = systemIntegrity;

      // Apply success to store with XP breakdown
      completeMission(moduleId, breakdown);
      checkRestorePoints();

      // Reveal hidden file if mission has one
      if (mission.revealsFile) {
        revealFile(mission.revealsFile);
      }

      // Calculate what happened
      const postIntegrity = useGameStore.getState().systemIntegrity;
      const delta = postIntegrity - preIntegrity;

      // Check for module unlock
      const postModules = useGameStore.getState().modules;
      let unlocked: ModuleId | null = null;
      const unlockOrder: ModuleId[] = ['app_layer', 'network', 'data_system', 'security', 'ai_core'];
      for (const mId of unlockOrder) {
        if (postModules[mId].unlocked && !modules[mId].unlocked) {
          unlocked = mId;
          break;
        }
      }

      // Check module stability
      const stabilized = postModules[moduleId].stable && !modules[moduleId].stable;

      // Check for level-up (Module 11)
      const newPendingLevelUp = useGameStore.getState().pendingLevelUp;

      // Set result state
      setResultType('success');
      setFeedbackText(mission.successMessage);
      setXpGained(breakdown.total);
      setIntegrityDelta(delta);
      setNewSystemIntegrity(postIntegrity);
      setUnlockedModule(unlocked);
      setModuleStabilized(stabilized);
      setXpBreakdown(breakdown);
      setErrorLines([]);

      Vibration.vibrate([30, 50, 30]);
      playSuccess();

      // Track speed/streak bonus flags for achievement checking (Module 12)
      const speedInfo = getSpeedBonus(timeRemainingFraction);
      const streakInfo = getStreakBonus(consecutiveSuccesses + 1);
      setLastSpeedBonus(speedInfo.multiplier > 1);
      setLastStreakBonus(streakInfo.multiplier > 1);

      // Check and unlock any newly earned achievements (Module 12)
      const newAchievements = checkAndUnlock();

      // Trigger level-up celebration if level up occurred
      if (newPendingLevelUp) {
        const milestones = getMilestonesForLevel(newPendingLevelUp);
        setLevelUpLevel(newPendingLevelUp);
        setLevelUpMilestones(milestones);
        setShowLevelUp(true);
        clearPendingLevelUp();
      }

      // Transition to result
      setStage('result');
    } else {
      // ── FAIL ──
      const lines = getErrorLines(code, mission);
      setErrorLines(lines);
      setFeedbackText(result.feedback);
      setFeedbackColor(Colors.textRed);
      setShowGlitch(true);
      setGlitchIntensity('medium');
      Vibration.vibrate([100, 50, 100]);
      playFail();

      setTimeout(() => {
        setShowGlitch(false);
      }, 600);

      setTimeout(() => {
        setFeedbackText('');
      }, 4000);

      // Apply failure consequences
      const preIntegrity = systemIntegrity;
      failMissionStore(moduleId);
      checkRestorePoints();

      const postIntegrity = useGameStore.getState().systemIntegrity;
      const delta = postIntegrity - preIntegrity;

      // Check for module unlock (failures can also unlock adjacent modules in rare cases)
      const postModules = useGameStore.getState().modules;
      let unlocked: ModuleId | null = null;
      const unlockOrder: ModuleId[] = ['app_layer', 'network', 'data_system', 'security', 'ai_core'];
      for (const mId of unlockOrder) {
        if (postModules[mId].unlocked && !modules[mId].unlocked) {
          unlocked = mId;
          break;
        }
      }

      const stabilized = postModules[moduleId].stable && !modules[moduleId].stable;

      // Prepare result data but don't transition — let operator keep trying
      // Only transition on 3rd consecutive failure
      const consecutiveFailures = useGameStore.getState().consecutiveFailures;
      if (consecutiveFailures >= 3) {
        if (timerRef.current) clearInterval(timerRef.current);
        setResultType('fail');
        setFeedbackText(mission.failMessage);
        setIntegrityDelta(delta);
        setNewSystemIntegrity(postIntegrity);
        setUnlockedModule(unlocked);
        setModuleStabilized(stabilized);
        setStage('result');
      }
    }
  }, [mission, code, stage, moduleId, completeMission, failMissionStore, checkRestorePoints, systemIntegrity, modules, revealFile, operatorClass, consecutiveSuccesses, level, clearPendingLevelUp, setLastSpeedBonus, setLastStreakBonus, checkAndUnlock, timeLeft]);

  // ── Handle timeout ───────────────────────────────────────────

  const handleTimeout = useCallback(() => {
    if (!mission || !moduleId) return;

    const preIntegrity = systemIntegrity;
    failMissionStore(moduleId);
    degradeIntegrity(mission.timeoutIntegrityLoss);
    checkRestorePoints();

    const postIntegrity = useGameStore.getState().systemIntegrity;
    const delta = postIntegrity - preIntegrity;

    const postModules = useGameStore.getState().modules;
    let unlocked: ModuleId | null = null;
    const unlockOrder: ModuleId[] = ['app_layer', 'network', 'data_system', 'security', 'ai_core'];
    for (const mId of unlockOrder) {
      if (postModules[mId].unlocked && !modules[mId].unlocked) {
        unlocked = mId;
        break;
        }
    }

    const stabilized = postModules[moduleId].stable && !modules[moduleId].stable;

    setResultType('timeout');
    setFeedbackText(mission.timeoutMessage);
    setIntegrityDelta(delta);
    setNewSystemIntegrity(postIntegrity);
    setUnlockedModule(unlocked);
    setModuleStabilized(stabilized);

    setShowGlitch(true);
    setGlitchIntensity('high');
    Vibration.vibrate([200, 100, 200, 100, 200]);
    playFail();

    setTimeout(() => {
      setShowGlitch(false);
    }, 1200);

    setStage('result');
  }, [mission, moduleId, failMissionStore, degradeIntegrity, checkRestorePoints, systemIntegrity, modules]);

  // ── Handle continue from result ──────────────────────────────

  const handleContinue = useCallback(() => {
    router.replace('/shell');
  }, [router]);

  // ── Render ───────────────────────────────────────────────────

  if (!mission) return null;

  return (
    <ShellLayout darkMode={stage === 'active'}>
      {/* ── BRIEFING STAGE ── */}
      {stage === 'briefing' && (
        <View style={styles.container}>
          <MissionBriefing
            mission={mission}
            onAccept={handleAcceptBriefing}
            onRetreat={handleRetreat}
          />
        </View>
      )}

      {/* ── ALERT STAGE (waiting for alert overlay to dismiss) ── */}
      {stage === 'alert' && (
        <View style={styles.container}>
          <View style={styles.alertWaitContainer}>
            <Text style={styles.alertWaitText}>INITIALIZING MISSION...</Text>
            {/* OS Voice Line — narrative text shown when osVoiceText is enabled */}
            {osVoiceText && mission.osVoiceLine && (
              <Text style={styles.osVoiceText}>{mission.osVoiceLine}</Text>
            )}
          </View>
        </View>
      )}

      {/* ── ACTIVE STAGE (coding + timer) ── */}
      {stage === 'active' && (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          {/* Top bar: mission info + timer */}
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

          {/* Feedback text */}
          {feedbackText ? (
            <View style={styles.feedbackBar}>
              <Text style={[styles.feedbackText, { color: feedbackColor }]}>
                {feedbackText}
              </Text>
            </View>
          ) : null}

          {/* Code Editor */}
          <CodeEditor
            code={code}
            onChangeCode={handleCodeChange}
            editable={stage === 'active'}
            language={mission.language}
            errorLines={errorLines}
          />

          {/* Submit button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <View style={styles.submitPanel}>
              <Text style={styles.submitText}>EXECUTE</Text>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}

      {/* ── RESULT STAGE ── */}
      {stage === 'result' && (
        <View style={styles.container}>
          <MissionResult
            mission={mission}
            result={resultType}
            feedback={feedbackText}
            xpGained={xpGained}
            integrityDelta={integrityDelta}
            newSystemIntegrity={newSystemIntegrity}
            unlockedModule={unlockedModule}
            moduleStabilized={moduleStabilized}
            xpBreakdown={xpBreakdown}
            onContinue={handleContinue}
          />
        </View>
      )}

      {/* ── Level-Up Celebration (Module 11) ── */}
      <LevelUpCelebration
        visible={showLevelUp}
        level={levelUpLevel}
        classTitle={getClassTitle(operatorClass, levelUpLevel)}
        milestones={levelUpMilestones}
        onComplete={() => setShowLevelUp(false)}
      />

      {/* ── Glitch overlay ── */}
      <GlitchOverlay
        intensity={glitchIntensity}
        duration={stage === 'result' && resultType === 'timeout' ? 1200 : 600}
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

  // Alert wait
  alertWaitContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertWaitText: {
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textAmber,
    letterSpacing: 4,
  },
  osVoiceText: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textCyan,
    letterSpacing: 2,
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.8,
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
});
