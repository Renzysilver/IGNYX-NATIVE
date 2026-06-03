// IGNYX useFileSystem Hook — Module 08
// Manages filesystem explorer navigation state: expanded dirs, selected file, breadcrumbs.
// The filesystem is the game world map. Every click reveals what's broken.

import { useState, useCallback, useMemo } from 'react';
import { FILESYSTEM, type FSNode } from '../constants/filesystem';
import { playAlert } from '../services/AudioEngine';

// ─── Types ─────────────────────────────────────────────────────

/** A single breadcrumb segment */
export interface Breadcrumb {
  name: string;
  path: string[];  // path array to this point
}

/** File type classification for icon rendering */
export type FileKind = 'directory' | 'log' | 'enc' | 'arc' | 'conf' | 'readme' | 'hidden' | 'generic';

// ─── Helpers ───────────────────────────────────────────────────

/** Convert a path array to a string key for Set operations */
const pathKey = (path: string[]): string => JSON.stringify(path);

/** Classify a file by its extension into a FileKind */
export const classifyFile = (name: string, node: FSNode): FileKind => {
  if (node.type === 'directory') return 'directory';
  if (node.hidden) return 'hidden';
  if (name === 'README') return 'readme';

  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'log': return 'log';
    case 'enc': return 'enc';
    case 'arc': return 'arc';
    case 'conf': return 'conf';
    default: return 'generic';
  }
};

/** Get the icon string for a FileKind (monospace text icons for IGNYX aesthetic) */
export const getFileIcon = (kind: FileKind): string => {
  switch (kind) {
    case 'directory': return '[DIR]';
    case 'log':      return '[LOG]';
    case 'enc':      return '[ENC]';
    case 'arc':      return '[ARC]';
    case 'conf':     return '[CFG]';
    case 'readme':   return '[DOC]';
    case 'hidden':   return '[???]';
    case 'generic':  return '[FIL]';
  }
};

/** Get the icon color for a FileKind, accounting for locked/corrupted states */
export const getFileIconColor = (kind: FileKind, locked: boolean, corrupted: boolean): string => {
  if (locked) return '#FF0000';
  if (corrupted) return '#FF4444';

  switch (kind) {
    case 'directory': return '#00F5FF';   // cyan
    case 'log':      return '#FFBF00';   // amber
    case 'enc':      return '#8B00FF';   // purple
    case 'arc':      return '#50FA7B';   // green
    case 'conf':     return '#BD93F9';   // lavender
    case 'readme':   return '#00F5FF';   // cyan
    case 'hidden':   return '#8B00FF';   // purple
    case 'generic':  return 'rgba(232, 244, 248, 0.4)'; // dim
  }
};

/** Check if a file looks corrupted (heuristic based on content keywords) */
export const isCorrupted = (node: FSNode): boolean => {
  if (node.type !== 'file') return false;
  const content = node.content ?? '';
  return (
    content.includes('CORRUPT') ||
    content.includes('CORRUPTION') ||
    content.includes('UNSTABLE') ||
    content.includes('OFFLINE') ||
    content.includes('BYPASSED') ||
    content.includes('COMPROMISED') ||
    content.includes('MALFUNCTION')
  );
};

/** Build breadcrumbs from a path array */
const buildBreadcrumbs = (path: string[]): Breadcrumb[] => {
  const crumbs: Breadcrumb[] = [{ name: '/', path: [] }];
  for (let i = 0; i < path.length; i++) {
    crumbs.push({
      name: path[i],
      path: path.slice(0, i + 1),
    });
  }
  return crumbs;
};

// ─── Hook ──────────────────────────────────────────────────────

export const useFileSystem = () => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FSNode | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string[]>([]);
  const [isViewingFile, setIsViewingFile] = useState(false);

  // Derived breadcrumbs based on the selected file's parent path
  const breadcrumbs = useMemo(() => {
    if (isViewingFile && selectedFilePath.length > 0) {
      return buildBreadcrumbs(selectedFilePath.slice(0, -1));
    }
    // Default: root
    return [{ name: '/', path: [] } as Breadcrumb];
  }, [isViewingFile, selectedFilePath]);

  /** Toggle a directory's expanded state */
  const toggleDir = useCallback((path: string[], node: FSNode) => {
    if (node.locked) {
      playAlert();
      return;
    }

    const key = pathKey(path);
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  /** Check if a directory path is expanded */
  const isExpanded = useCallback((path: string[]): boolean => {
    return expandedDirs.has(pathKey(path));
  }, [expandedDirs]);

  /** Select a file and show its content */
  const selectFile = useCallback((path: string[], node: FSNode) => {
    if (node.locked) {
      playAlert();
      return;
    }
    setSelectedFile(node);
    setSelectedFilePath(path);
    setIsViewingFile(true);
  }, []);

  /** Close the file viewer and go back to the tree */
  const closeFileViewer = useCallback(() => {
    setIsViewingFile(false);
    // Keep selectedFile for highlight state in the tree
  }, []);

  /** Clear the selection entirely */
  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setSelectedFilePath([]);
    setIsViewingFile(false);
  }, []);

  /** Collapse all directories */
  const collapseAll = useCallback(() => {
    setExpandedDirs(new Set());
    clearSelection();
  }, [clearSelection]);

  /** Expand all parent directories along a path */
  const expandToPath = useCallback((path: string[]) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      // Expand every parent directory along the path
      for (let i = 1; i <= path.length; i++) {
        next.add(pathKey(path.slice(0, i)));
      }
      return next;
    });
  }, []);

  /** Navigate to a breadcrumb — expand that path, close file viewer */
  const navigateToBreadcrumb = useCallback((path: string[]) => {
    setIsViewingFile(false);
    setSelectedFile(null);
    setSelectedFilePath([]);
    expandToPath(path);
  }, [expandToPath]);

  return {
    // State
    expandedDirs,
    selectedFile,
    selectedFilePath,
    breadcrumbs,
    isViewingFile,

    // Actions
    toggleDir,
    isExpanded,
    selectFile,
    closeFileViewer,
    clearSelection,
    collapseAll,
    expandToPath,
    navigateToBreadcrumb,
  };
};
