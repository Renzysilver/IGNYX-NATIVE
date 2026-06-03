// IGNYX Event Log Panel — Module 13
// The system's memory. A scrolling record of everything that happened.
// State transitions. Module unlocks. Anomalies. The system speaks here.
// The operator reads. The operator learns. The operator acts.

import React, { memo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GlassPanel } from './GlassPanel';
import { Colors } from '../constants/colors';
import { useGameStore } from '../store/useGameStore';
import {
  SEVERITY_COLORS,
  SEVERITY_ICONS,
  type OSEvent,
  type EventSeverity,
} from '../constants/osEvents';

// ─── Event Row ─────────────────────────────────────────────────

interface EventRowProps {
  event: OSEvent;
  index: number;
}

const EventRow: React.FC<EventRowProps> = memo(({ event, index }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Only animate the first 3 newest events
    if (index < 3) {
      opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    } else {
      opacity.value = 1;
    }
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const severityColor = SEVERITY_COLORS[event.severity];
  const severityIcon = SEVERITY_ICONS[event.severity];

  // Format timestamp
  const date = new Date(event.timestamp);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  return (
    <Animated.View style={[styles.eventRow, animatedStyle]}>
      <View style={styles.eventLeft}>
        <Text style={[styles.eventIcon, { color: severityColor }]}>
          {severityIcon}
        </Text>
        <Text style={styles.eventTime}>{timeStr}</Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={[styles.eventTitle, { color: severityColor }]} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.eventMessage} numberOfLines={2}>
          {event.message}
        </Text>
      </View>
    </Animated.View>
  );
});

EventRow.displayName = 'EventRow';

// ─── Event Log Panel ───────────────────────────────────────────

interface EventLogProps {
  /** Max number of events to show */
  maxEvents?: number;
  /** Whether to show the full log or compact view */
  compact?: boolean;
}

export const EventLog: React.FC<EventLogProps> = memo(({ maxEvents = 8, compact = false }) => {
  const eventLog = useGameStore((s) => s.eventLog);
  const scrollViewRef = useRef<ScrollView>(null);

  const displayEvents = eventLog.slice(0, maxEvents);

  if (eventLog.length === 0) {
    return (
      <GlassPanel style={styles.container}>
        <Text style={styles.headerTitle}>SYSTEM LOG</Text>
        <Text style={styles.emptyText}>NO EVENTS RECORDED</Text>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SYSTEM LOG</Text>
        <Text style={styles.headerCount}>{eventLog.length} EVENTS</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={compact ? styles.compactScroll : styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {displayEvents.map((event, index) => (
          <EventRow key={event.id} event={event} index={index} />
        ))}
      </ScrollView>
    </GlassPanel>
  );
});

EventLog.displayName = 'EventLog';

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 3,
  },
  headerCount: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 1,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 2,
    textAlign: 'center',
    paddingVertical: 16,
    opacity: 0.5,
  },
  scroll: {
    maxHeight: 200,
  },
  compactScroll: {
    maxHeight: 120,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  eventRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 245, 255, 0.04)',
  },
  eventLeft: {
    width: 36,
    alignItems: 'center',
    gap: 2,
  },
  eventIcon: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0,
  },
  eventTime: {
    fontSize: 6,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  eventContent: {
    flex: 1,
    gap: 1,
  },
  eventTitle: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1.5,
  },
  eventMessage: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    opacity: 0.6,
    lineHeight: 10,
  },
});
