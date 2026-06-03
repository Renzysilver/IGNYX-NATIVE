// IGNYX FileTreeItem — Module 08
// A single row in the file tree. Icon, name, chevron, status badges.
// Every file has a story. Every directory holds secrets.

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import type { FSNode } from '../constants/filesystem';
import {
  classifyFile,
  getFileIcon,
  getFileIconColor,
  isCorrupted,
  type FileKind,
} from '../hooks/useFileSystem';

// ─── Types ─────────────────────────────────────────────────────

interface FileTreeItemProps {
  /** The filesystem node to render */
  node: FSNode;
  /** Full path array to this node (e.g. ['system', 'kernel']) */
  path: string[];
  /** Depth in the tree (0 = root children) */
  depth: number;
  /** Whether this directory is expanded (only for dirs) */
  expanded: boolean;
  /** Whether this item is currently selected */
  selected: boolean;
  /** Tap handler */
  onPress: (path: string[], node: FSNode) => void;
  /** Whether to show hidden files */
  showHidden: boolean;
}

// ─── Component ─────────────────────────────────────────────────

export const FileTreeItem: React.FC<FileTreeItemProps> = memo(({
  node,
  path,
  depth,
  expanded,
  selected,
  onPress,
  showHidden,
}) => {
  // Skip hidden files unless showHidden
  if (node.hidden && !showHidden) return null;

  const kind: FileKind = classifyFile(node.name, node);
  const icon = getFileIcon(kind);
  const corrupted = isCorrupted(node);
  const iconColor = getFileIconColor(kind, !!node.locked, corrupted);
  const isDir = node.type === 'directory';

  const handlePress = () => {
    onPress(path, node);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={handlePress}
      style={[
        styles.row,
        selected && styles.rowSelected,
        { paddingLeft: 12 + depth * 20 },
      ]}
    >
      {/* Expand/collapse chevron for directories */}
      <View style={styles.chevronContainer}>
        {isDir && (
          <Text style={[styles.chevron, { color: iconColor }]}>
            {expanded ? '▾' : '▸'}
          </Text>
        )}
      </View>

      {/* File type icon */}
      <Text style={[styles.icon, { color: iconColor }]}>
        {icon}
      </Text>

      {/* File/directory name */}
      <Text
        style={[
          styles.name,
          node.locked && styles.nameLocked,
          corrupted && styles.nameCorrupted,
          selected && styles.nameSelected,
          node.hidden && styles.nameHidden,
        ]}
        numberOfLines={1}
      >
        {node.name}
        {isDir ? '/' : ''}
      </Text>

      {/* Status badges */}
      {node.locked && (
        <View style={styles.badge}>
          <Text style={styles.badgeLocked}>LOCKED</Text>
        </View>
      )}
      {corrupted && !node.locked && (
        <View style={styles.badge}>
          <Text style={styles.badgeCorrupted}>CORRUPT</Text>
        </View>
      )}
      {node.hidden && (
        <View style={styles.badge}>
          <Text style={styles.badgeHidden}>HIDDEN</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

FileTreeItem.displayName = 'FileTreeItem';

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 12,
    minHeight: 36,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 245, 255, 0.04)',
  },
  rowSelected: {
    backgroundColor: 'rgba(0, 245, 255, 0.06)',
  },
  chevronContainer: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
  },
  icon: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    marginRight: 8,
    width: 36,
  },
  name: {
    fontSize: 12,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textPrimary,
    flex: 1,
  },
  nameLocked: {
    color: 'rgba(255, 0, 0, 0.5)',
  },
  nameCorrupted: {
    color: '#FF4444',
  },
  nameSelected: {
    color: Colors.textCyan,
  },
  nameHidden: {
    color: '#8B00FF',
    opacity: 0.7,
  },
  badge: {
    marginLeft: 6,
  },
  badgeLocked: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: '#FF0000',
    letterSpacing: 1.5,
  },
  badgeCorrupted: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: '#FF4444',
    letterSpacing: 1.5,
  },
  badgeHidden: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: '#8B00FF',
    letterSpacing: 1.5,
  },
});
