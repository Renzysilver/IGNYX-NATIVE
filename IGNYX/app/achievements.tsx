// IGNYX Achievements Gallery — Module 12
// The operator's trophy wall. Every badge earned. Every milestone reached.
// Locked achievements tease. Unlocked achievements glow.
// The system remembers what you've done. The system shows what's left.

import React, { useState, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ShellLayout } from '../components/ShellLayout';
import { GlassPanel } from '../components/GlassPanel';
import { Colors } from '../constants/colors';
import { useAchievements } from '../hooks/useAchievements';
import { useGameStore } from '../store/useGameStore';
import {
  ACHIEVEMENTS,
  RARITY_COLORS,
  RARITY_GLOW,
  RARITY_LABELS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  getAchievementById,
  type Achievement,
  type AchievementCategory,
  type AchievementRarity,
} from '../constants/achievements';
import { getClassTitle } from '../constants/progression';
import { useRouter } from 'expo-router';

// ─── Category Tabs ─────────────────────────────────────────────

const CATEGORIES: AchievementCategory[] = ['combat', 'skill', 'exploration', 'class', 'hidden'];

// ─── Achievement Card ──────────────────────────────────────────

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  index: number;
}

const AchievementCard: React.FC<AchievementCardProps> = memo(({
  achievement,
  isUnlocked,
  index,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  // Staggered entrance animation
  React.useEffect(() => {
    opacity.value = withDelay(
      index * 60,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
    );
    translateY.value = withDelay(
      index * 60,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }),
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const rarityColor = RARITY_COLORS[achievement.rarity];
  const rarityGlow = RARITY_GLOW[achievement.rarity];
  const rarityLabel = RARITY_LABELS[achievement.rarity];
  const isSecret = achievement.isSecret && !isUnlocked;

  return (
    <Animated.View style={animatedStyle}>
      <GlassPanel
        active={isUnlocked}
        style={[styles.card, isUnlocked && { borderColor: rarityColor, borderWidth: 1 }]}
      >
        {/* Rarity glow for unlocked */}
        {isUnlocked && (
          <View style={[styles.cardGlow, { backgroundColor: rarityGlow }]} />
        )}

        <View style={styles.cardContent}>
          {/* Icon */}
          <View style={[
            styles.iconContainer,
            isUnlocked && { borderColor: rarityColor },
            !isUnlocked && styles.iconContainerLocked,
          ]}>
            <Text style={[
              styles.icon,
              isUnlocked && { color: rarityColor },
              !isUnlocked && styles.iconLocked,
            ]}>
              {isSecret ? '[?]' : achievement.icon}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={[
                styles.cardTitle,
                isUnlocked && { color: rarityColor },
                !isUnlocked && styles.cardTitleLocked,
              ]} numberOfLines={1}>
                {isSecret ? 'CLASSIFIED' : achievement.title}
              </Text>
              {!isSecret && (
                <Text style={[styles.rarityTag, { color: rarityColor }]}>
                  {rarityLabel}
                </Text>
              )}
            </View>
            <Text style={[
              styles.cardDescription,
              !isUnlocked && styles.cardDescriptionLocked,
            ]} numberOfLines={2}>
              {isSecret ? 'Condition unknown. Keep operating.' : achievement.description}
            </Text>
            {isUnlocked && (
              <Text style={[styles.cardReward, { color: Colors.textCyan }]}>
                {achievement.reward.description}
              </Text>
            )}
            {!isUnlocked && !isSecret && (
              <Text style={styles.cardLockedLabel}>
                LOCKED
              </Text>
            )}
          </View>
        </View>
      </GlassPanel>
    </Animated.View>
  );
});

AchievementCard.displayName = 'AchievementCard';

// ─── Main Screen ───────────────────────────────────────────────

export default function AchievementsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');
  const achievements = useAchievements();
  const operatorClass = useGameStore((s) => s.operatorClass);
  const level = useGameStore((s) => s.level);
  const classTitle = getClassTitle(operatorClass, level);

  // Filter achievements
  const filteredAchievements = activeCategory === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === activeCategory);

  // Category stats
  const getCategoryCount = (cat: AchievementCategory | 'all') => {
    if (cat === 'all') return { unlocked: achievements.unlockedCount, total: achievements.totalCount };
    return achievements.countByCategory(cat);
  };

  const handleBack = useCallback(() => {
    router.replace('/shell');
  }, [router]);

  return (
    <ShellLayout>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ACHIEVEMENTS</Text>
          <Text style={styles.headerSubtitle}>
            {achievements.unlockedCount}/{achievements.totalCount} UNLOCKED
          </Text>
        </View>

        {/* ── Progress Bar ── */}
        <GlassPanel style={styles.progressPanel}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>COMPLETION</Text>
            <Text style={[styles.progressValue, { color: Colors.textCyan }]}>
              {Math.floor(achievements.completionPct * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[
              styles.progressBarFill,
              { width: `${achievements.completionPct * 100}%` },
            ]} />
          </View>

          {/* Rarity breakdown */}
          <View style={styles.rarityRow}>
            {(['common', 'rare', 'epic', 'legendary'] as AchievementRarity[]).map((rarity) => {
              const count = achievements.countByRarity(rarity);
              return (
                <View key={rarity} style={styles.rarityStat}>
                  <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] }]} />
                  <Text style={[styles.rarityCount, { color: RARITY_COLORS[rarity] }]}>
                    {count.unlocked}/{count.total}
                  </Text>
                  <Text style={styles.rarityName}>{RARITY_LABELS[rarity]}</Text>
                </View>
              );
            })}
          </View>
        </GlassPanel>

        {/* ── Category Filter Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveCategory('all')}
            style={[styles.tab, activeCategory === 'all' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeCategory === 'all' && styles.tabTextActive]}>
              ALL
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => {
            const count = achievements.countByCategory(cat);
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.7}
                onPress={() => setActiveCategory(cat)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                </Text>
                <Text style={[styles.tabCount, isActive && styles.tabCountActive]}>
                  {count.unlocked}/{count.total}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Achievement Cards ── */}
        <View style={styles.achievementsList}>
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isUnlocked={achievements.unlockedIds.includes(achievement.id)}
              index={index}
            />
          ))}
        </View>

        {/* ── Empty State ── */}
        {filteredAchievements.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>NO ACHIEVEMENTS IN THIS CATEGORY</Text>
          </View>
        )}

        {/* ── Back Button ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          style={styles.backButton}
        >
          <View style={styles.backPanel}>
            <Text style={styles.backText}>RETURN TO SHELL</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </ShellLayout>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textCyan,
    letterSpacing: 6,
  },
  headerSubtitle: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 3,
    marginTop: 4,
  },

  // Progress panel
  progressPanel: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 3,
  },
  progressValue: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.cyan,
    borderRadius: 2,
  },
  rarityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rarityStat: {
    alignItems: 'center',
    gap: 2,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rarityCount: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
  },
  rarityName: {
    fontSize: 6,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 1,
  },

  // Category tabs
  tabsScroll: {
    marginBottom: 14,
    maxHeight: 50,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.1)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderColor: Colors.cyan,
  },
  tabText: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: Colors.textCyan,
  },
  tabCount: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  tabCountActive: {
    color: Colors.textCyan,
    opacity: 0.7,
  },

  // Achievement cards list
  achievementsList: {
    gap: 8,
  },

  // Achievement card
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlow: {
    ...StyleSheet.absoluteFill,
    borderRadius: 4,
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  iconContainerLocked: {
    borderColor: 'rgba(232, 244, 248, 0.15)',
  },
  icon: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  iconLocked: {
    color: 'rgba(232, 244, 248, 0.2)',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    flex: 1,
  },
  cardTitleLocked: {
    color: 'rgba(232, 244, 248, 0.3)',
  },
  rarityTag: {
    fontSize: 6,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  cardDescription: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    opacity: 0.7,
    lineHeight: 12,
  },
  cardDescriptionLocked: {
    color: 'rgba(232, 244, 248, 0.25)',
  },
  cardReward: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    marginTop: 2,
  },
  cardLockedLabel: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: 'rgba(232, 244, 248, 0.2)',
    letterSpacing: 2,
    marginTop: 2,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 3,
  },

  // Back button
  backButton: {
    marginTop: 16,
  },
  backPanel: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  backText: {
    color: Colors.textCyan,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
  },
});
