// IGNYX Full Event Log Screen — Module 14
// The system's memory, unfiltered. Every state transition. Every anomaly.
// Every whisper from the void. Category filters. Severity badges. Expandable detail.
// The operator reads. The operator understands. The operator acts.

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ShellLayout } from '../components/ShellLayout';
import { GlassPanel } from '../components/GlassPanel';
import { Colors } from '../constants/colors';
import { useGameStore } from '../store/useGameStore';
import {
  SEVERITY_COLORS,
  SEVERITY_ICONS,
  type OSEvent,
  type EventSeverity,
  type EventCategory,
} from '../constants/osEvents';
import { useRouter } from 'expo-router';

// ─── Category Filter Config ──────────────────────────────────────

interface CategoryOption {
  key: EventCategory | 'all';
  label: string;
  icon: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'all', label: 'ALL', icon: '[*]' },
  { key: 'state', label: 'STATE', icon: '[S]' },
  { key: 'module', label: 'MODULE', icon: '[M]' },
  { key: 'mission', label: 'MISSION', icon: '[!]' },
  { key: 'system', label: 'SYSTEM', icon: '[SYS]' },
  { key: 'anomaly', label: 'ANOMALY', icon: '[?]' },
  { key: 'operator', label: 'OPERATOR', icon: '[OP]' },
];

// ─── Severity Badge ──────────────────────────────────────────────

const SeverityBadge: React.FC<{ severity: EventSeverity }> = ({ severity }) => {
  const color = SEVERITY_COLORS[severity];
  const icon = SEVERITY_ICONS[severity];
  const labels: Record<EventSeverity, string> = {
    info: 'INFO',
    warning: 'WARN',
    critical: 'CRIT',
    system: 'SYS',
  };

  return (
    <View style={[styles.severityBadge, { borderColor: color }]}>
      <Text style={[styles.severityBadgeIcon, { color: color }]}>{icon}</Text>
      <Text style={[styles.severityBadgeLabel, { color: color }]}>
        {labels[severity]}
      </Text>
    </View>
  );
};

// ─── Event Card (expandable) ─────────────────────────────────────

interface EventCardProps {
  event: OSEvent;
  isExpanded: boolean;
  onToggle: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isExpanded, onToggle }) => {
  const severityColor = SEVERITY_COLORS[event.severity];
  const date = new Date(event.timestamp);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      style={[styles.eventCard, { borderLeftColor: severityColor }]}
    >
      {/* Header row */}
      <View style={styles.eventHeader}>
        <SeverityBadge severity={event.severity} />
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.eventTime}>{timeStr}</Text>
      </View>

      {/* Preview message */}
      <Text style={styles.eventMessage} numberOfLines={isExpanded ? undefined : 2}>
        {event.message}
      </Text>

      {/* Expanded detail */}
      {isExpanded && (
        <View style={styles.eventDetail}>
          {/* Category */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CATEGORY</Text>
            <Text style={[styles.detailValue, { color: severityColor }]}>
              {event.category.toUpperCase()}
            </Text>
          </View>

          {/* Timestamp */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TIMESTAMP</Text>
            <Text style={styles.detailValue}>{dateStr} {timeStr}</Text>
          </View>

          {/* Event type */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TYPE</Text>
            <Text style={styles.detailValue}>{event.type}</Text>
          </View>

          {/* Triggers */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TRIGGERS</Text>
            <Text style={styles.detailValue}>
              {[
                event.triggerGlitch ? 'GLITCH' : '',
                event.triggerSound ? `SOUND:${event.triggerSound.toUpperCase()}` : '',
              ].filter(Boolean).join(' | ') || 'NONE'}
            </Text>
          </View>

          {/* Voice line */}
          {event.voiceLine && (
            <View style={styles.voiceLineContainer}>
              <Text style={styles.voiceLineLabel}>OS VOICE</Text>
              <Text style={styles.voiceLineText}>"{event.voiceLine}"</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────

export default function EventsScreen() {
  const router = useRouter();
  const eventLog = useGameStore((s) => s.eventLog);
  const clearEventLog = useGameStore((s) => s.clearEventLog);

  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Filter events by category
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return eventLog;
    return eventLog.filter((e) => e.category === selectedCategory);
  }, [eventLog, selectedCategory]);

  // Severity counts
  const severityCounts = useMemo(() => {
    const counts: Record<EventSeverity, number> = { info: 0, warning: 0, critical: 0, system: 0 };
    for (const e of filteredEvents) {
      counts[e.severity]++;
    }
    return counts;
  }, [filteredEvents]);

  const toggleExpanded = useCallback((eventId: string) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  }, []);

  const handleClear = useCallback(() => {
    clearEventLog();
  }, [clearEventLog]);

  return (
    <ShellLayout>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SYSTEM LOG</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats Summary ── */}
        <GlassPanel active style={styles.statsPanel}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{eventLog.length}</Text>
              <Text style={styles.statLabel}>TOTAL</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: SEVERITY_COLORS.info }]}>
                {severityCounts.info}
              </Text>
              <Text style={styles.statLabel}>INFO</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: SEVERITY_COLORS.warning }]}>
                {severityCounts.warning}
              </Text>
              <Text style={styles.statLabel}>WARN</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: SEVERITY_COLORS.critical }]}>
                {severityCounts.critical}
              </Text>
              <Text style={styles.statLabel}>CRIT</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: SEVERITY_COLORS.system }]}>
                {severityCounts.system}
              </Text>
              <Text style={styles.statLabel}>SYS</Text>
            </View>
          </View>
        </GlassPanel>

        {/* ── Category Filters ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {CATEGORY_OPTIONS.map((opt) => {
            const isActive = selectedCategory === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(opt.key)}
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
              >
                <Text style={[styles.filterIcon, isActive && styles.filterIconActive]}>
                  {opt.icon}
                </Text>
                <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Event List ── */}
        {filteredEvents.length === 0 ? (
          <GlassPanel style={styles.emptyPanel}>
            <Text style={styles.emptyText}>
              {selectedCategory === 'all'
                ? 'NO EVENTS RECORDED YET'
                : `NO ${selectedCategory.toUpperCase()} EVENTS`}
            </Text>
            <Text style={styles.emptySubtext}>
              Events are generated as the system operates. Complete missions and watch the log grow.
            </Text>
          </GlassPanel>
        ) : (
          <View style={styles.eventList}>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isExpanded={expandedEventId === event.id}
                onToggle={() => toggleExpanded(event.id)}
              />
            ))}
          </View>
        )}

        {/* ── Clear Log ── */}
        {eventLog.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>CLEAR LOG</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ShellLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backText: {
    color: Colors.textDim,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },

  // Stats
  statsPanel: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  statLabel: {
    color: Colors.textDim,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    marginTop: 2,
  },

  // Filters
  filterScroll: {
    marginBottom: 12,
  },
  filterRow: {
    gap: 6,
    paddingHorizontal: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(0, 245, 255, 0.12)',
    borderColor: Colors.cyan,
  },
  filterIcon: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
  },
  filterIconActive: {
    color: Colors.textCyan,
  },
  filterLabel: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  filterLabelActive: {
    color: Colors.textCyan,
  },

  // Empty state
  emptyPanel: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 8,
  },
  emptySubtext: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 14,
    paddingHorizontal: 20,
  },

  // Event list
  eventList: {
    gap: 6,
  },
  eventCard: {
    backgroundColor: 'rgba(10, 22, 40, 0.85)',
    borderRadius: 4,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.08)',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventTitle: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1.5,
    flex: 1,
  },
  eventTime: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  eventMessage: {
    color: Colors.textPrimary,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.3,
    opacity: 0.6,
    lineHeight: 12,
  },

  // Severity badge
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  severityBadgeIcon: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
  },
  severityBadgeLabel: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // Expanded detail
  eventDetail: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.08)',
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: Colors.textDim,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  voiceLineContainer: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: Colors.cyan,
  },
  voiceLineLabel: {
    color: Colors.textCyan,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    marginBottom: 3,
    opacity: 0.6,
  },
  voiceLineText: {
    color: Colors.textCyan,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.3,
    fontStyle: 'italic',
    lineHeight: 12,
    opacity: 0.8,
  },

  // Clear button
  clearButton: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.04)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.12)',
  },
  clearText: {
    color: Colors.textRed,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    opacity: 0.6,
  },
});
