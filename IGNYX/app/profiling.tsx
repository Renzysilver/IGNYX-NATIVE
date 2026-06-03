import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { CircuitBackground } from '../components/CircuitBackground';
import { GlassPanel } from '../components/GlassPanel';
import { GlitchOverlay } from '../components/GlitchOverlay';
import { Colors } from '../constants/colors';
import { useGameStore } from '../store/useGameStore';
import {
  PROFILING_CHALLENGES,
  calculateOperatorClass,
  CLASS_DISPLAY,
} from '../constants/profiling';
import type { OperatorClass } from '../constants/gameState';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProfilingStage = 'scanning' | 'challenge' | 'sealing' | 'complete';

// Tappable option node — floating glass button, not a standard radio
const OptionNode: React.FC<{
  label: string;
  index: number;
  onSelect: (index: number) => void;
  isSelected: boolean;
  isCorrect: boolean | null;
  disabled: boolean;
}> = ({ label, index, onSelect, isSelected, isCorrect, disabled }) => {
  const scale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance
    const delay = 200 + index * 120;
    const timer = setTimeout(() => {
      scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.2)) });
    }, delay);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (isSelected && isCorrect === null) {
      // Selected but not yet revealed — pulse glow
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(0.3, { duration: 200 }),
      );
    }
  }, [isSelected, isCorrect]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const getBorderColor = () => {
    if (isCorrect === true) return Colors.cyanBright;
    if (isCorrect === false) return Colors.redDim;
    if (isSelected) return Colors.cyanBright;
    return Colors.glassBorder;
  };

  const getTextColor = () => {
    if (isCorrect === true) return Colors.textCyan;
    if (isCorrect === false) return Colors.textRed;
    if (isSelected) return Colors.textCyan;
    return Colors.textDim;
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !disabled && onSelect(index)}
        disabled={disabled}
        style={[
          styles.optionNode,
          {
            borderColor: getBorderColor(),
          },
          isSelected && isCorrect === null && styles.optionNodeSelected,
          isCorrect === true && styles.optionNodeCorrect,
          isCorrect === false && styles.optionNodeWrong,
        ]}
      >
        <Text style={[styles.optionText, { color: getTextColor() }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ProfilingScreen() {
  const [stage, setStage] = useState<ProfilingStage>('scanning');
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [optionResult, setOptionResult] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [showGlitch, setShowGlitch] = useState(false);
  const [operatorClass, setOperatorClass] = useState<OperatorClass>('UNKNOWN');
  const [sealedText, setSealedText] = useState('');
  const [classRevealed, setClassRevealed] = useState(0);

  const challengeStartTime = useRef(Date.now());
  const router = useRouter();

  const setOperatorClassStore = useGameStore((s) => s.setOperatorClass);
  const setProfiled = useGameStore((s) => s.setProfiled);
  const operatorName = useGameStore((s) => s.operatorName);

  // Scanning text → first challenge
  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('challenge');
      challengeStartTime.current = Date.now();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const currentChallenge = PROFILING_CHALLENGES[currentChallengeIndex];

  // Handle option selection
  const handleOptionSelect = useCallback((index: number) => {
    if (selectedOption !== null) return; // Already answered

    setSelectedOption(index);
    const isCorrect = index === currentChallenge.correctIndex;
    setOptionResult(isCorrect);

    const responseTime = Date.now() - challengeStartTime.current;
    setResponseTimes((prev) => [...prev, responseTime]);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      Vibration.vibrate(30);
    } else {
      Vibration.vibrate([50, 50, 50]);
    }

    // Brief pause, then glitch + next
    setTimeout(() => {
      setShowGlitch(true);
      setTimeout(() => {
        setShowGlitch(false);

        if (currentChallengeIndex < PROFILING_CHALLENGES.length - 1) {
          // Next challenge
          setCurrentChallengeIndex((prev) => prev + 1);
          setSelectedOption(null);
          setOptionResult(null);
          challengeStartTime.current = Date.now();
        } else {
          // All challenges done — seal profile
          setStage('sealing');
        }
      }, 400);
    }, 800);
  }, [selectedOption, currentChallenge, currentChallengeIndex]);

  // Profile sealing
  useEffect(() => {
    if (stage !== 'sealing') return;

    const calculatedClass = calculateOperatorClass(correctCount, responseTimes);
    setOperatorClass(calculatedClass);

    const sealText = `ARCHITECTURE ANALYSIS COMPLETE.\nCLASSIFICATION: ${calculatedClass}`;
    setSealedText(sealText);

    // Typewriter reveal of sealing text
    let charIdx = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        charIdx++;
        setClassRevealed(charIdx);
        if (charIdx >= sealText.length) {
          clearInterval(interval);
          // Show class description after a pause
          setTimeout(() => {
            setStage('complete');
          }, 1500);
        }
      }, 50);
    }, 1000);

    return () => clearTimeout(timer);
  }, [stage]);

  // Complete stage — store and navigate
  useEffect(() => {
    if (stage !== 'complete') return;

    setOperatorClassStore(operatorClass);
    setProfiled(true);

    const timer = setTimeout(() => {
      router.replace('/shell');
    }, 4000);

    return () => clearTimeout(timer);
  }, [stage, operatorClass]);

  const phaseLabel = currentChallenge?.phase === 'syntax_check'
    ? 'SYNTAX ARCHITECTURE SCAN...'
    : 'SCANNING OPERATOR ARCHITECTURE...';

  const classInfo = CLASS_DISPLAY[operatorClass];

  return (
    <View style={styles.root}>
      <CircuitBackground />

      <View style={styles.darkOverlay} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* STAGE: Scanning */}
        {stage === 'scanning' && (
          <View style={styles.scanningContainer}>
            <GlassPanel active>
              <Text style={styles.scanningText}>SCANNING OPERATOR ARCHITECTURE...</Text>
            </GlassPanel>
          </View>
        )}

        {/* STAGE: Challenge */}
        {stage === 'challenge' && currentChallenge && (
          <View style={styles.challengeContainer}>
            {/* Phase label */}
            <Text style={styles.phaseLabel}>{phaseLabel}</Text>

            {/* Challenge glass panel — "corrupted system node" */}
            <GlassPanel active style={styles.challengePanel}>
              {/* Challenge prompt */}
              <Text style={styles.challengePrompt}>
                {currentChallenge.prompt}
              </Text>

              {/* Code block if present */}
              {currentChallenge.codeBlock && (
                <View style={styles.codeBlock}>
                  {currentChallenge.codeBlock.split('\n').map((line, i) => (
                    <Text key={i} style={styles.codeText}>
                      {line}
                    </Text>
                  ))}
                </View>
              )}
            </GlassPanel>

            {/* Options — floating tappable nodes */}
            <View style={styles.optionsGrid}>
              {currentChallenge.options.map((option, i) => (
                <OptionNode
                  key={`${currentChallenge.id}-${i}`}
                  label={option}
                  index={i}
                  onSelect={handleOptionSelect}
                  isSelected={selectedOption === i}
                  isCorrect={
                    selectedOption !== null
                      ? i === currentChallenge.correctIndex
                      : null
                  }
                  disabled={selectedOption !== null}
                />
              ))}
            </View>
          </View>
        )}

        {/* STAGE: Sealing */}
        {stage === 'sealing' && (
          <View style={styles.sealingContainer}>
            <GlassPanel active>
              <Text style={styles.sealingText}>
                {sealedText.slice(0, classRevealed)}
              </Text>
            </GlassPanel>
          </View>
        )}

        {/* STAGE: Complete — class revealed */}
        {stage === 'complete' && (
          <View style={styles.completeContainer}>
            <GlassPanel active style={styles.classPanel}>
              <Text style={styles.classTitle}>{classInfo.title}</Text>
              <View style={styles.classDivider} />
              <Text style={styles.classDescription}>{classInfo.description}</Text>
            </GlassPanel>

            <Text style={styles.operatorLine}>
              OPERATOR {operatorName} — {classInfo.title}
            </Text>
            <Text style={styles.proceedLine}>
              PROCEEDING TO ACTIVE SYSTEM.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Glitch overlay between challenges */}
      <GlitchOverlay
        intensity="low"
        duration={400}
        active={showGlitch}
        onComplete={() => setShowGlitch(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 80,
  },

  // Scanning
  scanningContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    minHeight: 400,
  },
  scanningText: {
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },

  // Challenge
  challengeContainer: {
    flex: 1,
  },
  phaseLabel: {
    color: Colors.textDim,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  challengePanel: {
    marginBottom: 24,
  },
  challengePrompt: {
    color: Colors.textCyan,
    fontSize: 13,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 2,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cyanFaint,
  },
  codeText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    lineHeight: 24,
    letterSpacing: 0.5,
  },

  // Options — floating nodes
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 10,
  },
  optionNode: {
    backgroundColor: 'rgba(10, 22, 40, 0.8)',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minWidth: (SCREEN_WIDTH - 80) / 2.2,
    alignItems: 'center',
  },
  optionNodeSelected: {
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  optionNodeCorrect: {
    backgroundColor: 'rgba(0, 245, 255, 0.12)',
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  optionNodeWrong: {
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // Sealing
  sealingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    minHeight: 400,
  },
  sealingText: {
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    lineHeight: 24,
  },

  // Complete
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 500,
  },
  classPanel: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  classTitle: {
    color: Colors.textCyan,
    fontSize: 24,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 6,
    textAlign: 'center',
  },
  classDivider: {
    width: 60,
    height: 1,
    backgroundColor: Colors.cyanDim,
    marginVertical: 16,
  },
  classDescription: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'SpaceMono-Regular',
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  operatorLine: {
    color: Colors.textDim,
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    marginTop: 32,
  },
  proceedLine: {
    color: Colors.textCyan,
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    marginTop: 8,
    opacity: 0.6,
  },
});
