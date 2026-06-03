import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Keyboard,
  Dimensions,
  Vibration,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GlitchOverlay } from '../components/GlitchOverlay';
import { CircuitBackground } from '../components/CircuitBackground';
import { GlassPanel } from '../components/GlassPanel';
import { Colors } from '../constants/colors';
import { useGameStore } from '../store/useGameStore';
import { useRouter } from 'expo-router';
import { initializeAudioEngine, playBootFlicker, playGlitchLong, playDesignation } from '../services/AudioEngine';

type BootStage = 'black' | 'flicker' | 'first_text' | 'rejection' | 'question' | 'input' | 'designation' | 'integration';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sequential typewriter that renders lines one after another
const SequentialTypewriter: React.FC<{
  lines: { text: string; color: string }[];
  speed: number;
  fontSize: number;
  onComplete: () => void;
}> = ({ lines, speed, fontSize, onComplete }) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (currentLine >= lines.length) {
      onComplete();
      return;
    }

    const line = lines[currentLine];
    setCurrentChar(0);

    intervalRef.current = setInterval(() => {
      setCurrentChar((prev) => {
        if (prev >= line.text.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setCompletedLines((prevLines) => [...prevLines, line.text]);
          setCurrentLine((prevLine) => prevLine + 1);
          return 0;
        }
        return prev + 1;
      });
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentLine]);

  return (
    <View>
      {completedLines.map((line, i) => (
        <Text
          key={`done-${i}`}
          style={{
            color: lines[i].color,
            fontSize,
            fontFamily: 'SpaceMono-Regular',
            lineHeight: 22,
          }}
        >
          {line}
        </Text>
      ))}
      {currentLine < lines.length && (
        <Text
          style={{
            color: lines[currentLine].color,
            fontSize,
            fontFamily: 'SpaceMono-Regular',
            lineHeight: 22,
          }}
        >
          {lines[currentLine].text.slice(0, currentChar + 1)}
        </Text>
      )}
    </View>
  );
};

export default function BootScreen() {
  const [stage, setStage] = useState<BootStage>('black');
  const [nameInput, setNameInput] = useState('');
  const [showGlitch, setShowGlitch] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [circuitVisible, setCircuitVisible] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [silenceWarning, setSilenceWarning] = useState(false);
  const [designationText, setDesignationText] = useState('');
  const [designationRevealed, setDesignationRevealed] = useState(0);

  const inputRef = useRef<TextInput>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const setOperatorName = useGameStore((s) => s.setOperatorName);
  const setBooted = useGameStore((s) => s.setBooted);

  const flickerOpacity = useSharedValue(0);
  const circuitOpacity = useSharedValue(0);
  const terminalTranslateY = useSharedValue(SCREEN_HEIGHT);

  const flickerStyle = useAnimatedStyle(() => ({
    opacity: flickerOpacity.value,
  }));

  const circuitStyle = useAnimatedStyle(() => ({
    opacity: circuitOpacity.value,
  }));

  const terminalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: terminalTranslateY.value }],
  }));

  // Initialize audio engine on mount
  useEffect(() => {
    initializeAudioEngine();
  }, []);

  // STAGE 1: Black + Noise (0-3s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('flicker');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // STAGE 2: Red Flicker (3-6s) — 3 irregular flashes
  useEffect(() => {
    if (stage !== 'flicker') return;

    const flash1 = setTimeout(() => {
      flickerOpacity.value = withSequence(
        withTiming(0.6, { duration: 80 }),
        withTiming(0, { duration: 80 })
      );
      Vibration.vibrate(50);
      playBootFlicker();
    }, 200);

    const flash2 = setTimeout(() => {
      flickerOpacity.value = withSequence(
        withTiming(0.6, { duration: 80 }),
        withTiming(0, { duration: 80 })
      );
      Vibration.vibrate(50);
      playBootFlicker();
    }, 680);

    const flash3 = setTimeout(() => {
      flickerOpacity.value = withSequence(
        withTiming(0.6, { duration: 80 }),
        withTiming(0, { duration: 80 })
      );
      Vibration.vibrate(50);
      playBootFlicker();
    }, 1010);

    const done = setTimeout(() => {
      setStage('first_text');
    }, 3000);

    return () => {
      clearTimeout(flash1);
      clearTimeout(flash2);
      clearTimeout(flash3);
      clearTimeout(done);
    };
  }, [stage]);

  // STAGE 3: First text complete → glitch → rejection
  const handleFirstTextComplete = useCallback(() => {
    setShowGlitch(true);
    setGlitchIntensity('high');
    playGlitchLong();
    setTimeout(() => {
      setShowGlitch(false);
      setStage('rejection');
    }, 800);
  }, []);

  // STAGE 4: Rejection — single long red flash + slow typewriter
  useEffect(() => {
    if (stage !== 'rejection') return;
    flickerOpacity.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(0, { duration: 300 })
    );
    Vibration.vibrate(100);
  }, [stage]);

  const handleRejectionComplete = useCallback(() => {
    // 2 seconds of silence, then question
    setTimeout(() => {
      setStage('question');
    }, 2000);
  }, []);

  // STAGE 5: Question complete → input
  const handleQuestionComplete = useCallback(() => {
    setTimeout(() => {
      setStage('input');
    }, 1000);
  }, []);

  // Auto-focus input
  useEffect(() => {
    if (stage === 'input') {
      setTimeout(() => inputRef.current?.focus(), 300);

      silenceTimer.current = setTimeout(() => {
        setSilenceWarning(true);
        setShowGlitch(true);
        setGlitchIntensity('low');
        setTimeout(() => {
          setShowGlitch(false);
          inputRef.current?.focus();
        }, 600);
      }, 60000);
    }
    return () => {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, [stage]);

  // Handle name submission
  const handleSubmitName = useCallback(() => {
    if (!nameInput.trim()) return;
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    Keyboard.dismiss();
    playDesignation();
    setDesignationText(`DESIGNATION ACCEPTED: ${nameInput.trim().toUpperCase()}`);
    setStage('designation');
  }, [nameInput]);

  // Designation typewriter
  useEffect(() => {
    if (stage !== 'designation') return;

    const fullText = designationText;
    let charIndex = 0;

    const timer1 = setTimeout(() => {
      const interval = setInterval(() => {
        charIndex++;
        setDesignationRevealed(charIndex);
        if (charIndex >= fullText.length) {
          clearInterval(interval);
          // Move to integration after text completes
          setTimeout(() => {
            setStage('integration');
          }, 1500);
        }
      }, 60);
    }, 1500);

    return () => clearTimeout(timer1);
  }, [stage, designationText]);

  // Integration: shell materializes
  useEffect(() => {
    if (stage !== 'integration') return;

    setCircuitVisible(true);
    circuitOpacity.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) });
    terminalTranslateY.value = withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) });
    setTerminalVisible(true);

    const navTimer = setTimeout(() => {
      setOperatorName(nameInput.trim().toUpperCase());
      setBooted(true);
      router.replace('/profiling');
    }, 3500);

    return () => clearTimeout(navTimer);
  }, [stage]);

  // Boot lines
  const bootLines = [
    { text: 'IGNYX OS v4.7.2 — KERNEL INITIALIZATION', color: Colors.textCyan },
    { text: 'Scanning system architecture...', color: Colors.textCyan },
    { text: 'WARNING: 7 critical process failures detected', color: Colors.textAmber },
    { text: 'WARNING: Memory allocation table corrupted', color: Colors.textAmber },
    { text: 'WARNING: Neural bridge unstable', color: Colors.textAmber },
    { text: 'Attempting automatic recovery...', color: Colors.textCyan },
    { text: 'RECOVERY FAILED. MANUAL INTERVENTION REQUIRED.', color: Colors.textAmber },
  ];

  const rejectionLines = [
    { text: 'UNAUTHORIZED ACCESS DETECTED.', color: Colors.textRed },
    { text: 'AUTO-RECOVERY: DENIED.', color: Colors.textRed },
  ];

  return (
    <View style={styles.root}>
      {/* Circuit background (integration only) */}
      {circuitVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, circuitStyle]}>
          <CircuitBackground />
        </Animated.View>
      )}

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        ref={(ref) => {
          // Auto-scroll to bottom
          if (ref) {
            setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
          }
        }}
      >
        {/* STAGE 3: Sequential typewriter */}
        {stage === 'first_text' && (
          <SequentialTypewriter
            lines={bootLines}
            speed={40}
            fontSize={14}
            onComplete={handleFirstTextComplete}
          />
        )}

        {/* STAGE 4: Rejection */}
        {stage === 'rejection' && (
          <SequentialTypewriter
            lines={rejectionLines}
            speed={80}
            fontSize={14}
            onComplete={handleRejectionComplete}
          />
        )}

        {/* STAGE 5: The Question */}
        {stage === 'question' && (
          <SequentialTypewriter
            lines={[{ text: 'DESIGNATE YOURSELF.', color: Colors.textPrimary }]}
            speed={120}
            fontSize={18}
            onComplete={handleQuestionComplete}
          />
        )}

        {/* STAGE 6: Input */}
        {stage === 'input' && (
          <View style={styles.inputBlock}>
            {silenceWarning && (
              <Text style={styles.silenceWarning}>
                SILENCE WILL NOT SAVE YOU. DESIGNATE YOURSELF.
              </Text>
            )}
            <View style={styles.inputRow}>
              <Text style={styles.cursorPrefix}>{'>'} </Text>
              <TextInput
                ref={inputRef}
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                onSubmitEditing={handleSubmitName}
                returnKeyType="done"
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
                selectionColor={Colors.cyan}
              />
            </View>
          </View>
        )}

        {/* Designation accepted */}
        {stage === 'designation' && (
          <Text style={styles.designationText}>
            {designationText.slice(0, designationRevealed)}
          </Text>
        )}
      </ScrollView>

      {/* Terminal panel (integration) */}
      {terminalVisible && (
        <Animated.View style={[styles.terminalPanel, terminalStyle]}>
          <GlassPanel active>
            <Text style={styles.terminalText}>IGNYX NEURAL SHELL v4.7.2</Text>
            <Text style={styles.terminalTextDim}>
              OPERATOR: {nameInput.trim().toUpperCase()}
            </Text>
          </GlassPanel>
        </Animated.View>
      )}

      {/* Red flicker overlay */}
      <Animated.View style={[styles.redFlicker, flickerStyle]} pointerEvents="none" />

      {/* Glitch overlay */}
      <GlitchOverlay
        intensity={glitchIntensity}
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 100,
    zIndex: 10,
  },
  inputBlock: {
    marginTop: 20,
  },
  silenceWarning: {
    color: Colors.textRed,
    fontSize: 13,
    fontFamily: 'SpaceMono-Regular',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cursorPrefix: {
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
  },
  nameInput: {
    flex: 1,
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 245, 255, 0.2)',
    paddingBottom: 2,
  },
  designationText: {
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    lineHeight: 22,
  },
  redFlicker: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.darkRedOpacity,
    zIndex: 999,
  },
  terminalPanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  terminalText: {
    color: Colors.textCyan,
    fontSize: 13,
    fontFamily: 'SpaceMono-Regular',
  },
  terminalTextDim: {
    color: Colors.textDim,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    marginTop: 4,
  },
});
