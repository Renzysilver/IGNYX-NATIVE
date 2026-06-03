// IGNYX Achievement Toast — Module 12
// The system announces what the operator has earned. A flash of rarity.
// Common fades quickly. Legendary lingers. The toast never lies.

import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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
import { GlassPanel } from './GlassPanel';
import { Colors } from '../constants/colors';
import {
  getAchievementById,
  RARITY_COLORS,
  RARITY_GLOW,
  RARITY_LABELS,
  type Achievement,
  type AchievementRarity,
} from '../constants/achievements';

// ─── Toast Queue Manager ───────────────────────────────────────
// Achievements can unlock in bursts. We queue them and show one at a time.

interface ToastEntry {
  achievementId: string;
  timestamp: number;
}

const TOAST_DURATION = 3500; // ms per toast
const TOAST_GAP = 500;      // ms between toasts

class AchievementToastQueue {
  private queue: ToastEntry[] = [];
  private isShowing: boolean = false;
  private onShow: ((id: string) => void) | null = null;
  private onDismiss: (() => void) | null = null;

  setCallbacks(onShow: (id: string) => void, onDismiss: () => void) {
    this.onShow = onShow;
    this.onDismiss = onDismiss;
  }

  enqueue(achievementId: string) {
    // Prevent duplicates in queue
    if (this.queue.some((t) => t.achievementId === achievementId)) return;
    this.queue.push({ achievementId, timestamp: Date.now() });
    if (!this.isShowing) {
      this.showNext();
    }
  }

  private showNext() {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const entry = this.queue.shift()!;

    if (this.onShow) {
      this.onShow(entry.achievementId);
    }

    // Auto-dismiss after duration
    setTimeout(() => {
      if (this.onDismiss) {
        this.onDismiss();
      }
      // Show next after gap
      setTimeout(() => {
        this.showNext();
      }, TOAST_GAP);
    }, TOAST_DURATION);
  }
}

export const achievementToastQueue = new AchievementToastQueue();

// ─── Component ─────────────────────────────────────────────────

export const AchievementToast: React.FC = memo(() => {
  const [visible, setVisible] = useState(false);
  const [achievement, setAchievement] = useState<Achievement | null>(null);

  // Animation values
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const show = useCallback((id: string) => {
    const ach = getAchievementById(id);
    if (!ach) return;
    setAchievement(ach);
    setVisible(true);

    // Animate in
    translateY.value = withSpring(0, { damping: 12, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    iconScale.value = withDelay(
      200,
      withSpring(1, { damping: 6, stiffness: 100 }),
    );
    glowOpacity.value = withSequence(
      withTiming(0.8, { duration: 200 }),
      withTiming(0.3, { duration: 800 }),
    );
  }, []);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(-120, { duration: 300, easing: Easing.in(Easing.ease) });
    opacity.value = withTiming(0, { duration: 250 });
    iconScale.value = withTiming(0, { duration: 200 });
    glowOpacity.value = withTiming(0, { duration: 200 });

    setTimeout(() => {
      setVisible(false);
      setAchievement(null);
    }, 350);
  }, []);

  // Register callbacks with queue
  useEffect(() => {
    achievementToastQueue.setCallbacks(show, dismiss);
  }, [show, dismiss]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!visible || !achievement) return null;

  const rarityColor = RARITY_COLORS[achievement.rarity];
  const rarityGlow = RARITY_GLOW[achievement.rarity];
  const rarityLabel = RARITY_LABELS[achievement.rarity];

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Rarity glow backdrop */}
        <Animated.View style={[styles.glowBackdrop, glowStyle, { backgroundColor: rarityGlow }]} />

        <GlassPanel active style={styles.panel}>
          <View style={styles.content}>
            {/* Achievement icon */}
            <Animated.View style={[styles.iconContainer, iconStyle, { borderColor: rarityColor }]}>
              <Text style={[styles.icon, { color: rarityColor }]}>
                {achievement.icon}
              </Text>
            </Animated.View>

            {/* Achievement info */}
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: rarityColor }]}>
                  {achievement.title}
                </Text>
                <Text style={[styles.rarityBadge, { color: rarityColor }]}>
                  {rarityLabel}
                </Text>
              </View>
              <Text style={styles.description} numberOfLines={2}>
                {achievement.description}
              </Text>
              <Text style={[styles.reward, { color: Colors.textCyan }]}>
                {achievement.reward.description}
              </Text>
            </View>
          </View>
        </GlassPanel>
      </Animated.View>
    </View>
  );
});

AchievementToast.displayName = 'AchievementToast';

// ─── Styles ────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 900,
    pointerEvents: 'none',
  },
  container: {
    width: SCREEN_WIDTH - 24,
    maxWidth: 400,
  },
  glowBackdrop: {
    ...StyleSheet.absoluteFill,
    borderRadius: 6,
  },
  panel: {
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  icon: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  rarityBadge: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  description: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    opacity: 0.7,
    lineHeight: 12,
  },
  reward: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    marginTop: 1,
  },
});
