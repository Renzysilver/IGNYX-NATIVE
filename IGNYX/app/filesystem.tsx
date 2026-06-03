// IGNYX Filesystem Explorer Screen — Module 08
// The visual file tree browser. Where the operator explores the dying OS.
// Every directory is a sector. Every file is a clue. Some files fight back.

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ShellLayout } from '../components/ShellLayout';
import { GlassPanel } from '../components/GlassPanel';
import { FileTreeView } from '../components/FileTreeView';
import { FileViewer } from '../components/FileViewer';
import { Colors } from '../constants/colors';
import { FILESYSTEM, type FSNode } from '../constants/filesystem';
import { useFileSystem } from '../hooks/useFileSystem';
import type { Breadcrumb } from '../hooks/useFileSystem';
import { useRouter } from 'expo-router';

export default function FilesystemScreen() {
  const router = useRouter();
  const {
    selectedFile,
    selectedFilePath,
    isViewingFile,
    isExpanded,
    toggleDir,
    selectFile,
    closeFileViewer,
    collapseAll,
    navigateToBreadcrumb,
  } = useFileSystem();

  const [showHidden, setShowHidden] = useState(false);

  // Handle item press — different behavior for dirs vs files
  const handleItemPress = useCallback((path: string[], node: FSNode) => {
    if (node.type === 'directory') {
      toggleDir(path, node);
    } else {
      selectFile(path, node);
    }
  }, [toggleDir, selectFile]);

  // Check if a path is selected
  const isSelected = useCallback((path: string[]): boolean => {
    if (!selectedFile) return false;
    return JSON.stringify(path) === JSON.stringify(selectedFilePath);
  }, [selectedFile, selectedFilePath]);

  return (
    <ShellLayout>
      <View style={styles.container}>
        {/* ── Header Bar ── */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => router.push('/shell')}
            style={styles.backButton}
          >
            <Text style={styles.backText}>{'< SHELL'}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>FILESYSTEM</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => setShowHidden((prev) => !prev)}
              style={styles.actionButton}
            >
              <Text style={[styles.actionText, showHidden && styles.actionTextActive]}>
                {showHidden ? '[HID*]' : '[HIDE]'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={collapseAll}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>[COL]</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Breadcrumb Bar ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.breadcrumbScroll}
          contentContainerStyle={styles.breadcrumbContent}
        >
          <BreadcrumbBar
            breadcrumbs={
              isViewingFile && selectedFilePath.length > 0
                ? buildBreadcrumbsForFile(selectedFilePath)
                : [{ name: '/', path: [] }]
            }
            onNavigate={navigateToBreadcrumb}
          />
        </ScrollView>

        {/* ── Main Content Area ── */}
        {isViewingFile && selectedFile ? (
          // File viewer mode
          <View style={styles.fileViewerContainer}>
            <FileViewer
              file={selectedFile}
              filePath={selectedFilePath}
              onClose={closeFileViewer}
            />
          </View>
        ) : (
          // Tree browsing mode
          <GlassPanel active style={styles.treePanel}>
            <ScrollView
              style={styles.treeScroll}
              contentContainerStyle={styles.treeContent}
              keyboardShouldPersistTaps="handled"
            >
              <FileTreeView
                node={FILESYSTEM}
                path={[]}
                depth={0}
                isExpanded={isExpanded}
                isSelected={isSelected}
                onItemPress={handleItemPress}
                showHidden={showHidden}
              />
            </ScrollView>

            {/* ── Tree footer info ── */}
            <View style={styles.treeFooter}>
              <Text style={styles.treeFooterText}>
                TAP DIRECTORY TO EXPAND  |  TAP FILE TO VIEW
                {showHidden ? '  |  HIDDEN FILES VISIBLE' : ''}
              </Text>
            </View>
          </GlassPanel>
        )}
      </View>
    </ShellLayout>
  );
}

// ─── Breadcrumb Bar Sub-component ──────────────────────────────

interface BreadcrumbBarProps {
  breadcrumbs: Breadcrumb[];
  onNavigate: (path: string[]) => void;
}

const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({ breadcrumbs, onNavigate }) => {
  return (
    <>
      {breadcrumbs.map((crumb, i) => (
        <View key={i} style={styles.breadcrumbItem}>
          {i > 0 && (
            <Text style={styles.breadcrumbSeparator}>/</Text>
          )}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => onNavigate(crumb.path)}
          >
            <Text
              style={[
                styles.breadcrumbText,
                i === breadcrumbs.length - 1 && styles.breadcrumbTextActive,
              ]}
            >
              {crumb.name}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
};

// ─── Helper ────────────────────────────────────────────────────

/** Build breadcrumb trail from a file path */
const buildBreadcrumbsForFile = (filePath: string[]): Breadcrumb[] => {
  const crumbs: Breadcrumb[] = [{ name: '/', path: [] }];
  for (let i = 0; i < filePath.length; i++) {
    crumbs.push({
      name: filePath[i],
      path: filePath.slice(0, i + 1),
    });
  }
  return crumbs;
};

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 100,
  },

  // Header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 1,
  },
  title: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textCyan,
    letterSpacing: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 1,
  },
  actionTextActive: {
    color: Colors.textCyan,
  },

  // Breadcrumbs
  breadcrumbScroll: {
    maxHeight: 24,
    marginBottom: 6,
  },
  breadcrumbContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbSeparator: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    marginHorizontal: 3,
  },
  breadcrumbText: {
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 0.5,
  },
  breadcrumbTextActive: {
    color: Colors.textCyan,
  },

  // File viewer
  fileViewerContainer: {
    flex: 1,
  },

  // Tree panel
  treePanel: {
    flex: 1,
  },
  treeScroll: {
    flex: 1,
  },
  treeContent: {
    paddingBottom: 12,
  },
  treeFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.06)',
    paddingTop: 6,
    marginTop: 4,
  },
  treeFooterText: {
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    color: Colors.textDim,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
