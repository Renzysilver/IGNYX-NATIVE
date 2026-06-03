// IGNYX FileViewer — Module 08
// Displays file content in a monospace glass panel. Handles locked, encrypted, and corrupted files.
// Every file tells a story. Some files lie. Some files remember.

import React, { memo, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { GlassPanel } from './GlassPanel';
import { Colors } from '../constants/colors';
import type { FSNode } from '../constants/filesystem';
import { classifyFile, getFileIcon, isCorrupted, type FileKind } from '../hooks/useFileSystem';

// ─── Types ─────────────────────────────────────────────────────

interface FileViewerProps {
  /** The file node to display */
  file: FSNode;
  /** Full path to the file */
  filePath: string[];
  /** Close callback */
  onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────────

export const FileViewer: React.FC<FileViewerProps> = memo(({
  file,
  filePath,
  onClose,
}) => {
  const kind: FileKind = classifyFile(file.name, file);
  const icon = getFileIcon(kind);
  const corrupted = isCorrupted(file);
  const isEncrypted = file.name.endsWith('.enc');

  // Display path string
  const pathString = '/' + filePath.join('/');

  // Parse content into lines for rendering
  const contentLines = useMemo(() => {
    if (!file.content) return [];
    return file.content.split('\n');
  }, [file.content]);

  // Determine content color based on file state
  const contentColor = useMemo(() => {
    if (file.locked) return Colors.textRed;
    if (isEncrypted) return '#8B00FF';
    if (corrupted) return '#FF4444';
    if (kind === 'log') return Colors.textAmber;
    if (kind === 'readme') return Colors.textPrimary;
    return Colors.textCyan;
  }, [file.locked, isEncrypted, corrupted, kind]);

  return (
    <GlassPanel active style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.icon, { color: contentColor }]}>{icon}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.fileName}>{file.name}</Text>
            <Text style={styles.filePath}>{pathString}</Text>
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.6} onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>{'[X]'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Status badges ── */}
      <View style={styles.badgeRow}>
        {file.locked && (
          <View style={[styles.statusBadge, styles.badgeLocked]}>
            <Text style={styles.badgeText}>ACCESS DENIED</Text>
          </View>
        )}
        {corrupted && !file.locked && (
          <View style={[styles.statusBadge, styles.badgeCorrupt]}>
            <Text style={styles.badgeText}>CORRUPTED DATA</Text>
          </View>
        )}
        {isEncrypted && !file.locked && (
          <View style={[styles.statusBadge, styles.badgeEncrypted]}>
            <Text style={styles.badgeText}>ENCRYPTED</Text>
          </View>
        )}
        {file.hidden && (
          <View style={[styles.statusBadge, styles.badgeHidden]}>
            <Text style={styles.badgeText}>HIDDEN FILE</Text>
          </View>
        )}
      </View>

      {/* ── Content ── */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentInner}>
        {contentLines.map((line, i) => (
          <Text
            key={i}
            style={[
              styles.contentLine,
              { color: contentColor },
            ]}
            selectable
          >
            {line || ' '}
          </Text>
        ))}
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {contentLines.length} LINE{contentLines.length !== 1 ? 'S' : ''}
          {'  '}
          {file.type === 'file' ? 'READ-ONLY' : ''}
        </Text>
      </View>
    </GlassPanel>
  );
});

FileViewer.displayName = 'FileViewer';

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  filePath: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
  },
  badgeLocked: {
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderColor: 'rgba(255, 0, 0, 0.4)',
  },
  badgeCorrupt: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderColor: 'rgba(255, 68, 68, 0.4)',
  },
  badgeEncrypted: {
    backgroundColor: 'rgba(139, 0, 255, 0.15)',
    borderColor: 'rgba(139, 0, 255, 0.4)',
  },
  badgeHidden: {
    backgroundColor: 'rgba(139, 0, 255, 0.1)',
    borderColor: 'rgba(139, 0, 255, 0.3)',
  },
  badgeText: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  contentScroll: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.1)',
    paddingTop: 8,
  },
  contentInner: {
    paddingBottom: 12,
  },
  contentLine: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    lineHeight: 17,
    letterSpacing: 0.3,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.08)',
    paddingTop: 6,
    marginTop: 4,
  },
  footerText: {
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 2,
  },
});
