import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';
import { playAlert } from '../services/AudioEngine';
import type { GameState } from '../constants/gameState';
import type { ModuleId } from '../constants/gameState';

interface AlertOverlayProps {
  message: string;
  color?: string;
  duration?: number;
  onDismiss?: () => void;
}

// Global alert state — any component can fire an alert
let alertQueue: {
  message: string;
  color: string;
  duration: number;
  onDismiss?: () => void;
}[] = [];

let setAlertVisible: (alert: {
  message: string;
  color: string;
  duration: number;
  onDismiss?: () => void;
} | null) => void = () => {};

export const AlertOverlayManager = {
  show: (message: string, color?: string, duration = 3000, onDismiss?: () => void) => {
    const alertColor = color || Colors.textCyan;
    setAlertVisible({ message, color: alertColor, duration, onDismiss });
  },
};

export const AlertOverlay: React.FC = () => {
  const [activeAlert, setActiveAlert] = React.useState<{
    message: string;
    color: string;
    duration: number;
    onDismiss?: () => void;
  } | null>(null);

  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register the setter so AlertOverlayManager can fire alerts
  useEffect(() => {
    setAlertVisible = (alert) => {
      setActiveAlert(alert);
    };
    return () => {
      setAlertVisible = () => {};
    };
  }, []);

  useEffect(() => {
    if (activeAlert) {
      // Play alert beep sound
      playAlert();

      // Fade in (200ms)
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
      backdropOpacity.value = withTiming(0.4, { duration: 200 });

      // Auto-dismiss after duration
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Fade out (500ms)
        opacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) });
        backdropOpacity.value = withTiming(0, { duration: 500 });

        setTimeout(() => {
          activeAlert.onDismiss?.();
          setActiveAlert(null);
        }, 500);
      }, activeAlert.duration);
    } else {
      opacity.value = 0;
      backdropOpacity.value = 0;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeAlert]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Dark backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      {/* Alert text — centered, uppercase, Space Mono */}
      {activeAlert && (
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={[styles.alertText, { color: activeAlert.color }]}>
            {activeAlert.message}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.black,
  },
  textContainer: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    maxWidth: '85%',
  },
  alertText: {
    fontSize: 16,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 26,
  },
});
