// IGNYX Settings Screen — Module 10
// The operator's control panel. Accessibility. Sound. Restore points. Nuclear reset.
// Every setting is a choice. Every choice shapes the experience.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { ShellLayout } from '../components/ShellLayout';
import { GlassPanel } from '../components/GlassPanel';
import { Colors } from '../constants/colors';
import { useGameStore } from '../store/useGameStore';
import type { ModuleId } from '../constants/gameState';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  // Store state
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const highContrast = useGameStore((s) => s.highContrast);
  const fontSize = useGameStore((s) => s.fontSize);
  const osVoiceText = useGameStore((s) => s.osVoiceText);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const masterVolume = useGameStore((s) => s.masterVolume);
  const restorePoints = useGameStore((s) => s.restorePoints);
  const systemIntegrity = useGameStore((s) => s.systemIntegrity);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const operatorName = useGameStore((s) => s.operatorName);
  const operatorClass = useGameStore((s) => s.operatorClass);
  const revealedFiles = useGameStore((s) => s.revealedFiles);

  // Actions
  const setAccessibility = useGameStore((s) => s.setAccessibility);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const setMasterVolume = useGameStore((s) => s.setMasterVolume);
  const loadRestorePoint = useGameStore((s) => s.loadRestorePoint);
  const resetGame = useGameStore((s) => s.resetGame);

  // Local state for confirm reset
  const [resetConfirmStep, setResetConfirmStep] = useState(0);

  // ── Toggle Handlers ────────────────────────────────────────

  const toggleReducedMotion = useCallback(() => {
    setAccessibility('reducedMotion', !reducedMotion);
  }, [reducedMotion, setAccessibility]);

  const toggleHighContrast = useCallback(() => {
    setAccessibility('highContrast', !highContrast);
  }, [highContrast, setAccessibility]);

  const cycleFontSize = useCallback(() => {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const nextIndex = (sizes.indexOf(fontSize) + 1) % sizes.length;
    setAccessibility('fontSize', sizes[nextIndex]);
  }, [fontSize, setAccessibility]);

  const toggleOsVoiceText = useCallback(() => {
    setAccessibility('osVoiceText', !osVoiceText);
  }, [osVoiceText, setAccessibility]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled);
  }, [soundEnabled, setSoundEnabled]);

  const adjustVolume = useCallback((delta: number) => {
    const newVol = Math.max(0, Math.min(1, masterVolume + delta));
    setMasterVolume(newVol);
  }, [masterVolume, setMasterVolume]);

  // ── Restore Point Handler ──────────────────────────────────

  const handleLoadRestorePoint = useCallback((index: number) => {
    Alert.alert(
      'LOAD RESTORE POINT',
      `This will cost 200 XP and apply -15% integrity to all modules. Continue?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'LOAD',
          style: 'destructive',
          onPress: () => {
            loadRestorePoint(index);
          },
        },
      ],
    );
  }, [loadRestorePoint]);

  // ── Reset Handler ──────────────────────────────────────────

  const handleReset = useCallback(() => {
    if (resetConfirmStep === 0) {
      setResetConfirmStep(1);
      // Auto-reset confirm step after 3 seconds
      setTimeout(() => setResetConfirmStep(0), 3000);
      return;
    }

    Alert.alert(
      'SYSTEM RESET',
      'ALL progress will be lost. The system will return to initial state. This cannot be undone.',
      [
        { text: 'CANCEL', style: 'cancel', onPress: () => setResetConfirmStep(0) },
        {
          text: 'RESET',
          style: 'destructive',
          onPress: () => {
            resetGame();
            router.replace('/boot');
          },
        },
      ],
    );
  }, [resetConfirmStep, resetGame, router]);

  // ── Format timestamp ───────────────────────────────────────

  const formatTimestamp = (ts: number): string => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // ── Volume display ─────────────────────────────────────────

  const volumePercent = Math.round(masterVolume * 100);

  return (
    <ShellLayout>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
        </View>

        {/* ── Operator Info ── */}
        <GlassPanel active style={styles.section}>
          <Text style={styles.sectionTitle}>OPERATOR</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>NAME</Text>
            <Text style={styles.infoValue}>{operatorName || 'UNASSIGNED'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CLASS</Text>
            <Text style={[styles.infoValue, { color: Colors.textCyan }]}>{operatorClass}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>LEVEL</Text>
            <Text style={styles.infoValue}>{level}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>XP</Text>
            <Text style={styles.infoValue}>{xp}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>INTEGRITY</Text>
            <Text style={[styles.infoValue, {
              color: systemIntegrity > 75 ? Colors.textCyan
                : systemIntegrity > 50 ? Colors.textAmber
                : systemIntegrity > 25 ? Colors.textRed
                : Colors.purple,
            }]}>
              {systemIntegrity}%
            </Text>
          </View>
        </GlassPanel>

        {/* ── Accessibility ── */}
        <GlassPanel active style={styles.section}>
          <Text style={styles.sectionTitle}>ACCESSIBILITY</Text>

          <TouchableOpacity onPress={toggleReducedMotion} style={styles.settingRow}>
            <Text style={styles.settingLabel}>REDUCED MOTION</Text>
            <Text style={[styles.settingValue, { color: reducedMotion ? Colors.textCyan : Colors.textDim }]}>
              {reducedMotion ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleHighContrast} style={styles.settingRow}>
            <Text style={styles.settingLabel}>HIGH CONTRAST</Text>
            <Text style={[styles.settingValue, { color: highContrast ? Colors.textCyan : Colors.textDim }]}>
              {highContrast ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={cycleFontSize} style={styles.settingRow}>
            <Text style={styles.settingLabel}>FONT SIZE</Text>
            <Text style={[styles.settingValue, { color: Colors.textCyan }]}>
              {fontSize.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleOsVoiceText} style={styles.settingRow}>
            <Text style={styles.settingLabel}>OS VOICE TEXT</Text>
            <Text style={[styles.settingValue, { color: osVoiceText ? Colors.textCyan : Colors.textDim }]}>
              {osVoiceText ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </GlassPanel>

        {/* ── Sound ── */}
        <GlassPanel active style={styles.section}>
          <Text style={styles.sectionTitle}>SOUND</Text>

          <TouchableOpacity onPress={toggleSound} style={styles.settingRow}>
            <Text style={styles.settingLabel}>AUDIO ENGINE</Text>
            <Text style={[styles.settingValue, { color: soundEnabled ? Colors.textCyan : Colors.textDim }]}>
              {soundEnabled ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </TouchableOpacity>

          {soundEnabled && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>VOLUME</Text>
              <View style={styles.volumeRow}>
                <TouchableOpacity
                  onPress={() => adjustVolume(-0.1)}
                  style={styles.volumeButton}
                >
                  <Text style={styles.volumeButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.settingValue, { color: Colors.textCyan, minWidth: 40, textAlign: 'center' }]}>
                  {volumePercent}%
                </Text>
                <TouchableOpacity
                  onPress={() => adjustVolume(0.1)}
                  style={styles.volumeButton}
                >
                  <Text style={styles.volumeButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </GlassPanel>

        {/* ── Restore Points ── */}
        <GlassPanel active={restorePoints.length > 0} style={styles.section}>
          <Text style={styles.sectionTitle}>RESTORE POINTS</Text>
          <Text style={styles.sectionDesc}>
            Load a restore point to roll back system state. Cost: 200 XP + -15% all module integrity.
          </Text>

          {restorePoints.length === 0 ? (
            <Text style={styles.emptyText}>NO RESTORE POINTS AVAILABLE</Text>
          ) : (
            restorePoints.map((point, index) => (
              <TouchableOpacity
                key={point.timestamp}
                onPress={() => handleLoadRestorePoint(index)}
                style={styles.restoreRow}
              >
                <View style={styles.restoreInfo}>
                  <Text style={styles.restoreLabel}>
                    RESTORE POINT {index + 1}
                  </Text>
                  <Text style={styles.restoreDetail}>
                    INTEGRITY: {point.integrity}% | XP: {point.xp}
                  </Text>
                  <Text style={styles.restoreTimestamp}>
                    {formatTimestamp(point.timestamp)}
                  </Text>
                </View>
                <Text style={styles.restoreAction}>LOAD</Text>
              </TouchableOpacity>
            ))
          )}
        </GlassPanel>

        {/* ── Revealed Files ── */}
        <GlassPanel active={revealedFiles.length > 0} style={styles.section}>
          <Text style={styles.sectionTitle}>REVEALED FILES</Text>
          <Text style={styles.sectionDesc}>
            Files unlocked through mission success. Hidden data surfaces when the system is repaired.
          </Text>

          {revealedFiles.length === 0 ? (
            <Text style={styles.emptyText}>NO FILES REVEALED YET</Text>
          ) : (
            revealedFiles.map((file) => (
              <View key={file} style={styles.fileRow}>
                <Text style={styles.fileIcon}>[LOG]</Text>
                <Text style={styles.filePath}>{file}</Text>
              </View>
            ))
          )}
        </GlassPanel>

        {/* ── Danger Zone ── */}
        <GlassPanel active={false} style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, { color: Colors.textRed }]}>DANGER ZONE</Text>
          <Text style={styles.sectionDesc}>
            Reset the system to factory state. All progress, XP, and unlocks will be lost. The operator will be deregistered.
          </Text>

          <TouchableOpacity
            onPress={handleReset}
            style={[styles.resetButton, resetConfirmStep === 1 && styles.resetButtonConfirm]}
          >
            <Text style={[styles.resetText, resetConfirmStep === 1 && styles.resetTextConfirm]}>
              {resetConfirmStep === 0 ? 'SYSTEM RESET' : 'CONFIRM RESET?'}
            </Text>
          </TouchableOpacity>
        </GlassPanel>
      </ScrollView>
    </ShellLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────

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

  // Sections
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 8,
  },
  sectionDesc: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    lineHeight: 14,
    marginBottom: 10,
    opacity: 0.7,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  infoLabel: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // Setting rows
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.06)',
  },
  settingLabel: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  settingValue: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },

  // Volume
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  volumeButtonText: {
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
  },

  // Empty text
  emptyText: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    opacity: 0.5,
    paddingVertical: 8,
  },

  // Restore points
  restoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.06)',
  },
  restoreInfo: {
    flex: 1,
  },
  restoreLabel: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    marginBottom: 2,
  },
  restoreDetail: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    marginBottom: 1,
  },
  restoreTimestamp: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
    opacity: 0.5,
  },
  restoreAction: {
    color: Colors.textAmber,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
    paddingHorizontal: 8,
  },

  // Revealed files
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.04)',
  },
  fileIcon: {
    color: Colors.textAmber,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  filePath: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // Danger zone
  dangerSection: {
    borderColor: 'rgba(255, 0, 0, 0.15)',
  },
  resetButton: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.2)',
  },
  resetButtonConfirm: {
    backgroundColor: 'rgba(255, 0, 0, 0.12)',
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
  resetText: {
    color: Colors.textRed,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    opacity: 0.7,
  },
  resetTextConfirm: {
    opacity: 1,
  },
});
