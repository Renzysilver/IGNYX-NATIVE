import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { playGlitchShort, playGlitchLong } from '../services/AudioEngine';

interface GlitchOverlayProps {
  intensity?: 'low' | 'medium' | 'high';
  duration?: number;
  onComplete?: () => void;
  active?: boolean;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({
  intensity = 'medium',
  duration = 800,
  onComplete,
  active = true,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const hasCompleted = useRef(false);

  const intensityValues = {
    low: { maxOpacity: 0.15, maxShift: 3, iterations: 4 },
    medium: { maxOpacity: 0.35, maxShift: 8, iterations: 8 },
    high: { maxOpacity: 0.6, maxShift: 15, iterations: 12 },
  };

  const config = intensityValues[intensity];

  useEffect(() => {
    if (!active) {
      opacity.value = 0;
      return;
    }

    hasCompleted.current = false;

    // Play glitch sound — short for low/medium, long for high intensity
    if (intensity === 'high') {
      playGlitchLong();
    } else {
      playGlitchShort();
    }

    // Glitch animation — rapid shifts and opacity changes
    opacity.value = withSequence(
      withTiming(config.maxOpacity, { duration: 50 }),
      withTiming(0, { duration: 80 }),
      withTiming(config.maxOpacity * 0.7, { duration: 30 }),
      withTiming(config.maxOpacity, { duration: 50 }),
      withTiming(0, { duration: 100 }),
      withTiming(config.maxOpacity * 0.5, { duration: 40 }),
      withTiming(0, { duration: 200 }),
      withTiming(config.maxOpacity, { duration: 60 }),
      withTiming(0, { duration: duration / 2, easing: Easing.out(Easing.ease) })
    );

    translateX.value = withSequence(
      withTiming(config.maxShift, { duration: 50 }),
      withTiming(-config.maxShift, { duration: 80 }),
      withTiming(config.maxShift * 0.5, { duration: 40 }),
      withTiming(0, { duration: 200 }),
      withTiming(-config.maxShift * 0.7, { duration: 60 }),
      withTiming(0, { duration: duration / 2 })
    );

    translateY.value = withSequence(
      withTiming(config.maxShift * 0.5, { duration: 60 }),
      withTiming(-config.maxShift * 0.3, { duration: 100 }),
      withTiming(config.maxShift * 0.8, { duration: 40 }),
      withTiming(0, { duration: duration / 2 })
    );

    const timer = setTimeout(() => {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        onComplete?.();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [active, intensity, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Static noise layer */}
      <Animated.View style={[styles.noiseLayer, animatedStyle]}>
        <View style={styles.scanLine} />
        <View style={[styles.scanLine, { top: '30%' }]} />
        <View style={[styles.scanLine, { top: '60%' }]} />
        <View style={[styles.scanLine, { top: '85%' }]} />
      </Animated.View>

      {/* RGB shift layer */}
      <Animated.View
        style={[
          styles.rgbShiftRed,
          { opacity: opacity.value * 0.3, transform: [{ translateX: translateX.value * 0.5 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.rgbShiftBlue,
          { opacity: opacity.value * 0.3, transform: [{ translateX: -translateX.value * 0.5 }] },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
  noiseLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 245, 255, 0.05)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.cyan,
    opacity: 0.5,
  },
  rgbShiftRed: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  rgbShiftBlue: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 255, 0.1)',
  },
});
