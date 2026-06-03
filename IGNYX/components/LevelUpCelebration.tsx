// IGNYX Level-Up Celebration — Module 11
// The system acknowledges growth. Particles burst. The level ascends.
// A flash of cyan. A pulse of amber. The operator evolves.

import React, { useEffect, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Canvas, Group, Circle, Rect, useFont } from '@shopify/react-native-skia';
import { Colors } from '../constants/colors';
import type { MilestoneReward } from '../constants/progression';

// ─── Particle System ───────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

const PARTICLE_COUNT = 40;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

const PARTICLE_COLORS = [
  Colors.cyan,
  Colors.cyanBright,
  Colors.amber,
  Colors.textPrimary,
  'rgba(0, 245, 255, 0.5)',
  'rgba(255, 191, 0, 0.5)',
];

// ─── Props ─────────────────────────────────────────────────────

interface LevelUpCelebrationProps {
  /** Whether the celebration is active */
  visible: boolean;
  /** The new level achieved */
  level: number;
  /** Class title for the new level */
  classTitle: string;
  /** Milestones earned at this level */
  milestones: MilestoneReward[];
  /** Callback when celebration animation completes */
  onComplete: () => void;
}

// ─── Component ─────────────────────────────────────────────────

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = memo(({
  visible,
  level,
  classTitle,
  milestones,
  onComplete,
}) => {
  // Opacity for the whole overlay
  const overlayOpacity = useSharedValue(0);

  // Level number scale (bouncy entrance)
  const levelScale = useSharedValue(0);

  // Title opacity
  const titleOpacity = useSharedValue(0);

  // Flash intensity
  const flashOpacity = useSharedValue(0);

  // Milestone opacity
  const milestoneOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Flash
      flashOpacity.value = withSequence(
        withTiming(0.6, { duration: 100 }),
        withTiming(0, { duration: 400 }),
      );

      // Overlay fade in
      overlayOpacity.value = withTiming(0.85, { duration: 200 });

      // Level number bounces in
      levelScale.value = withDelay(
        200,
        withSpring(1, { damping: 6, stiffness: 100 }),
      );

      // Title fades in
      titleOpacity.value = withDelay(
        600,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
      );

      // Milestones fade in
      milestoneOpacity.value = withDelay(
        1000,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
      );

      // Auto-dismiss after 4 seconds
      const timeout = setTimeout(() => {
        overlayOpacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) });
        levelScale.value = withTiming(0, { duration: 300 });
        titleOpacity.value = withTiming(0, { duration: 300 });
        milestoneOpacity.value = withTiming(0, { duration: 300 });

        setTimeout(() => {
          runOnJS(onComplete)();
        }, 500);
      }, 4000);

      return () => clearTimeout(timeout);
    } else {
      overlayOpacity.value = 0;
      levelScale.value = 0;
      titleOpacity.value = 0;
      flashOpacity.value = 0;
      milestoneOpacity.value = 0;
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const milestoneStyle = useAnimatedStyle(() => ({
    opacity: milestoneOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Background overlay */}
      <Animated.View style={[styles.backdrop, overlayStyle]} />

      {/* White flash */}
      <Animated.View style={[styles.flash, flashStyle]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Level number */}
        <Animated.View style={[styles.levelContainer, levelStyle]}>
          <Text style={styles.levelUpLabel}>LEVEL UP</Text>
          <Text style={styles.levelNumber}>{level}</Text>
        </Animated.View>

        {/* Class title */}
        <Animated.View style={titleStyle}>
          <Text style={styles.classTitle}>{classTitle}</Text>
        </Animated.View>

        {/* Milestones */}
        {milestones.length > 0 && (
          <Animated.View style={[styles.milestonesContainer, milestoneStyle]}>
            {milestones.map((milestone, idx) => (
              <View key={idx} style={styles.milestoneRow}>
                <Text style={styles.milestoneIcon}>
                  {milestone.type === 'integrity' ? '[+]' :
                   milestone.type === 'title' ? '[*]' :
                   milestone.type === 'xp' ? '[XP]' : '[~]'}
                </Text>
                <Text style={styles.milestoneText}>
                  {milestone.description}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}
      </View>

      {/* Skia particle canvas */}
      {visible && (
        <Canvas style={styles.particleCanvas} pointerEvents="none">
          <LevelUpParticles active={visible} />
        </Canvas>
      )}
    </View>
  );
});

LevelUpCelebration.displayName = 'LevelUpCelebration';

// ─── Skia Particle Renderer ────────────────────────────────────

interface ParticleRendererProps {
  active: boolean;
}

const LevelUpParticles: React.FC<ParticleRendererProps> = ({ active }) => {
  // Generate particle data deterministically for the burst effect
  // We use simple math since Skia redraws on each frame via Reanimated
  const particles: Array<{
    x: number;
    y: number;
    r: number;
    color: string;
    dx: number;
    dy: number;
    delay: number;
  }> = [];

  if (active) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      particles.push({
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        r: 2 + Math.random() * 3,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        delay: i * 15,
      });
    }
  }

  return (
    <Group>
      {particles.map((p, i) => (
        <Circle
          key={i}
          cx={p.x + p.dx}
          cy={p.y + p.dy}
          r={p.r}
          color={p.color}
          opacity={0.7}
        />
      ))}
    </Group>
  );
};

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  flash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.cyan,
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelUpLabel: {
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textAmber,
    letterSpacing: 6,
    marginBottom: 4,
  },
  levelNumber: {
    fontSize: 72,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textCyan,
    letterSpacing: 4,
    textShadowColor: Colors.cyan,
    textShadowRadius: 20,
  },
  classTitle: {
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    letterSpacing: 4,
    marginTop: 8,
  },
  milestonesContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 245, 255, 0.06)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.15)',
  },
  milestoneIcon: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textAmber,
    letterSpacing: 1,
  },
  milestoneText: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  particleCanvas: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
});
