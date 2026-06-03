// IGNYX FileTreeView — Module 08
// Recursive tree renderer. Expands directories, shows files, respects hidden/locked states.
// The filesystem is a living map of the dying OS. Navigate it. Understand what's broken.

import React, { memo, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { FILESYSTEM, type FSNode } from '../constants/filesystem';
import { FileTreeItem } from './FileTreeItem';
import { Colors } from '../constants/colors';

// ─── Types ─────────────────────────────────────────────────────

interface FileTreeViewProps {
  /** The filesystem tree to render (defaults to root) */
  node?: FSNode;
  /** Path array to the current node */
  path?: string[];
  /** Current depth in the tree */
  depth?: number;
  /** Whether a directory path is expanded */
  isExpanded: (path: string[]) => boolean;
  /** Whether a file path is the current selection */
  isSelected: (path: string[]) => boolean;
  /** Callback when a tree item is pressed */
  onItemPress: (path: string[], node: FSNode) => void;
  /** Whether to show hidden files */
  showHidden: boolean;
}

// ─── Component ─────────────────────────────────────────────────

export const FileTreeView: React.FC<FileTreeViewProps> = memo(({
  node = FILESYSTEM,
  path = [],
  depth = 0,
  isExpanded,
  isSelected,
  onItemPress,
  showHidden,
}) => {
  // Get sorted children — directories first, then files, alphabetically within each group
  const sortedChildren = useCallback((children: Record<string, FSNode>): [string, FSNode][] => {
    const entries = Object.entries(children);

    // Filter out hidden items unless showHidden
    const visible = entries.filter(([, child]) => showHidden || !child.hidden);

    // Sort: directories first, then alphabetically
    return visible.sort(([, a], [, b]) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [showHidden]);

  // Don't render if this is a file (files are leaf nodes)
  if (node.type !== 'directory' || !node.children) return null;

  const entries = sortedChildren(node.children);

  return (
    <View style={styles.container}>
      {entries.map(([name, child]) => {
        const childPath = [...path, name];
        const expanded = child.type === 'directory' && isExpanded(childPath);
        const selected = child.type === 'file' && isSelected(childPath);

        return (
          <View key={name}>
            <FileTreeItem
              node={child}
              path={childPath}
              depth={depth}
              expanded={expanded}
              selected={selected}
              onPress={onItemPress}
              showHidden={showHidden}
            />

            {/* Recursively render children if directory is expanded */}
            {expanded && child.type === 'directory' && child.children && (
              <FileTreeView
                node={child}
                path={childPath}
                depth={depth + 1}
                isExpanded={isExpanded}
                isSelected={isSelected}
                onItemPress={onItemPress}
                showHidden={showHidden}
              />
            )}
          </View>
        );
      })}
    </View>
  );
});

FileTreeView.displayName = 'FileTreeView';

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    // No extra styling — items handle their own indentation
  },
});
