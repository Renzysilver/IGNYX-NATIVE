import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ShellLayout } from '../components/ShellLayout';
import { GlassPanel } from '../components/GlassPanel';
import { Colors } from '../constants/colors';
import {
  FILESYSTEM,
  resolvePath,
  resolvePathArray,
  type FSNode,
} from '../constants/filesystem';
import { useGameStore } from '../store/useGameStore';
import { SEVERITY_COLORS } from '../constants/osEvents';

interface OutputLine {
  text: string;
  color: string;
}

const SUPPORTED_COMMANDS = ['ls', 'cd', 'cat', 'grep', 'help', 'clear', 'status', 'log', 'whoami', 'scan', 'uptime'];

export default function TerminalScreen() {
  const [currentPath, setCurrentPath] = useState<string[]>(['home', 'operator']);
  const [output, setOutput] = useState<OutputLine[]>([
    { text: 'IGNYX TERMINAL v4.7.2', color: Colors.textCyan },
    { text: 'Type "help" for available commands.', color: Colors.textDim },
    { text: '', color: Colors.textDim },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const isEditorFocused = useGameStore((s) => s.isEditorFocused);
  const setEditorFocused = useGameStore((s) => s.setEditorFocused);

  const pathString = '/' + currentPath.join('/');

  const addOutput = useCallback((lines: OutputLine[]) => {
    setOutput((prev) => [...prev, ...lines]);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 50);
  }, []);

  // Handle focus for Eye of the Hurricane
  const handleFocus = useCallback(() => {
    setEditorFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setEditorFocused(false);
  }, []);

  // Process a command
  const processCommand = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add command to output
    addOutput([{ text: `${pathString} > ${trimmed}`, color: Colors.textDim }]);

    // Save to history
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Check if command is supported
    if (!SUPPORTED_COMMANDS.includes(command)) {
      addOutput([{ text: 'UNAUTHORIZED COMMAND. DESIST.', color: Colors.textRed }]);
      return;
    }

    switch (command) {
      case 'ls':
        handleLs(args);
        break;
      case 'cd':
        handleCd(args);
        break;
      case 'cat':
        handleCat(args);
        break;
      case 'grep':
        handleGrep(args);
        break;
      case 'help':
        handleHelp();
        break;
      case 'clear':
        handleClear();
        break;
      case 'status':
        handleStatus();
        break;
      case 'log':
        handleLog(args);
        break;
      case 'whoami':
        handleWhoami();
        break;
      case 'scan':
        handleScan();
        break;
      case 'uptime':
        handleUptime();
        break;
    }
  }, [currentPath, pathString]);

  // ls — list directory contents
  const handleLs = useCallback((args: string[]) => {
    const showHidden = args.includes('-a');
    const targetPath = args.filter((a) => a !== '-a')[0];

    let node: FSNode;
    if (targetPath) {
      const resolved = resolvePath(currentPath, targetPath);
      if (!resolved) {
        addOutput([{ text: 'PATH NOT FOUND.', color: Colors.textRed }]);
        return;
      }
      if (resolved.type !== 'directory') {
        addOutput([{ text: 'NOT A DIRECTORY.', color: Colors.textRed }]);
        return;
      }
      node = resolved;
    } else {
      node = resolvePath(currentPath, '.') || FILESYSTEM;
      // Navigate to current path
      let current: FSNode = FILESYSTEM;
      for (const seg of currentPath) {
        if (current.children?.[seg]) {
          current = current.children[seg];
        }
      }
      node = current;
    }

    if (node.locked) {
      addOutput([{ text: 'ACCESS DENIED. YOUR CLEARANCE IS INSUFFICIENT. ATTEMPT LOGGED.', color: Colors.textRed }]);
      return;
    }

    const children = node.children;
    if (!children) {
      addOutput([{ text: 'EMPTY DIRECTORY.', color: Colors.textDim }]);
      return;
    }

    const lines: OutputLine[] = [];
    for (const [name, child] of Object.entries(children)) {
      // Skip hidden files unless -a
      if (child.hidden && !showHidden) continue;

      if (child.type === 'directory') {
        lines.push({ text: `${name}/`, color: Colors.textCyan });
      } else {
        lines.push({ text: name, color: Colors.textCyan });
      }
    }

    if (lines.length === 0) {
      addOutput([{ text: 'EMPTY DIRECTORY.', color: Colors.textDim }]);
    } else {
      addOutput(lines);
    }
  }, [currentPath]);

  // cd — change directory
  const handleCd = useCallback((args: string[]) => {
    if (args.length === 0) {
      // cd with no args — go to home
      setCurrentPath(['home', 'operator']);
      return;
    }

    const target = args[0];

    // Special case: cd / goes to root
    if (target === '/') {
      setCurrentPath([]);
      return;
    }

    const resolved = resolvePathArray(currentPath, target);
    if (!resolved) {
      addOutput([{ text: 'PATH NOT FOUND.', color: Colors.textRed }]);
      return;
    }

    // Check if the target is a directory
    const node = resolvePath(currentPath, target);
    if (!node) {
      addOutput([{ text: 'PATH NOT FOUND.', color: Colors.textRed }]);
      return;
    }

    if (node.type !== 'directory') {
      addOutput([{ text: 'NOT A DIRECTORY.', color: Colors.textRed }]);
      return;
    }

    if (node.locked) {
      addOutput([{ text: 'ACCESS DENIED. YOUR CLEARANCE IS INSUFFICIENT. ATTEMPT LOGGED.', color: Colors.textRed }]);
      return;
    }

    setCurrentPath(resolved);
  }, [currentPath]);

  // cat — read file contents
  const handleCat = useCallback((args: string[]) => {
    if (args.length === 0) {
      addOutput([{ text: 'SPECIFY A FILE.', color: Colors.textRed }]);
      return;
    }

    const target = args[0];
    const node = resolvePath(currentPath, target);

    if (!node) {
      addOutput([{ text: 'FILE NOT FOUND.', color: Colors.textRed }]);
      return;
    }

    if (node.type === 'directory') {
      addOutput([{ text: 'IS A DIRECTORY.', color: Colors.textRed }]);
      return;
    }

    if (node.locked) {
      addOutput([{ text: 'ACCESS DENIED. YOUR CLEARANCE IS INSUFFICIENT. ATTEMPT LOGGED.', color: Colors.textRed }]);
      return;
    }

    // Output file content line by line
    const lines = (node.content || '').split('\n');
    addOutput(lines.map((line) => ({ text: line, color: Colors.textCyan })));
  }, [currentPath]);

  // grep — search file for term
  const handleGrep = useCallback((args: string[]) => {
    if (args.length < 2) {
      addOutput([{ text: 'USAGE: grep [TERM] [FILENAME]', color: Colors.textAmber }]);
      return;
    }

    const term = args[0].toLowerCase();
    const filename = args[1];
    const node = resolvePath(currentPath, filename);

    if (!node) {
      addOutput([{ text: 'FILE NOT FOUND.', color: Colors.textRed }]);
      return;
    }

    if (node.type === 'directory') {
      addOutput([{ text: 'IS A DIRECTORY.', color: Colors.textRed }]);
      return;
    }

    if (node.locked) {
      addOutput([{ text: 'ACCESS DENIED. YOUR CLEARANCE IS INSUFFICIENT. ATTEMPT LOGGED.', color: Colors.textRed }]);
      return;
    }

    const content = node.content || '';
    const lines = content.split('\n');
    const matches = lines.filter((line) => line.toLowerCase().includes(term));

    if (matches.length === 0) {
      addOutput([{ text: 'NO MATCH FOUND.', color: Colors.textDim }]);
    } else {
      addOutput(matches.map((line) => ({ text: line, color: Colors.textAmber })));
    }
  }, [currentPath]);

  // help — list commands
  const handleHelp = useCallback(() => {
    addOutput([
      { text: 'FILE SYSTEM:', color: Colors.textDim },
      { text: '  ls    cd    cat    grep', color: Colors.textCyan },
      { text: 'SYSTEM:', color: Colors.textDim },
      { text: '  status    log    whoami    scan    uptime', color: Colors.textCyan },
      { text: 'UI:', color: Colors.textDim },
      { text: '  clear    help', color: Colors.textCyan },
    ]);
  }, []);

  // clear — clear terminal output
  const handleClear = useCallback(() => {
    setOutput([]);
  }, []);

  // status — show system status overview (Module 13)
  const handleStatus = useCallback(() => {
    const state = useGameStore.getState();
    const integrity = Math.floor(state.systemIntegrity);
    const modules = state.modules;
    const unlocked = Object.values(modules).filter((m) => m.unlocked).length;
    const total = Object.keys(modules).length;

    addOutput([
      { text: '=== SYSTEM STATUS ===', color: Colors.textCyan },
      { text: `INTEGRITY: ${integrity}%`, color: integrity > 75 ? Colors.textCyan : integrity > 50 ? Colors.textAmber : integrity > 25 ? Colors.textRed : Colors.purple },
      { text: `STATE: ${state.gameState.toUpperCase()}`, color: integrity > 75 ? Colors.textCyan : integrity > 50 ? Colors.textAmber : Colors.textRed },
      { text: `OPERATOR: ${state.operatorName} [${state.operatorClass}]`, color: Colors.textPrimary },
      { text: `LEVEL: ${state.level}  XP: ${state.xp}`, color: Colors.textCyan },
      { text: `MODULES: ${unlocked}/${total} UNLOCKED`, color: Colors.textAmber },
      { text: `MISSIONS: ${state.totalMissionsCompleted} COMPLETED  ${state.totalMissionsFailed} FAILED`, color: Colors.textPrimary },
      { text: `STREAK: ${state.consecutiveSuccesses} SUCCESS  ${state.consecutiveFailures} FAIL`, color: state.consecutiveSuccesses >= 3 ? Colors.textCyan : Colors.textDim },
      { text: `SESSION: #${state.sessionId}`, color: Colors.textDim },
    ]);
  }, []);

  // log — show recent system events (Module 13)
  const handleLog = useCallback((args: string[]) => {
    const state = useGameStore.getState();
    const count = args[0] ? Math.min(parseInt(args[0]) || 5, 20) : 5;
    const events = state.eventLog.slice(0, count);

    if (events.length === 0) {
      addOutput([{ text: 'NO EVENTS RECORDED.', color: Colors.textDim }]);
      return;
    }

    const lines: OutputLine[] = [
      { text: `=== LAST ${events.length} EVENTS ===`, color: Colors.textCyan },
    ];

    for (const event of events) {
      const date = new Date(event.timestamp);
      const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      const color = SEVERITY_COLORS[event.severity];
      lines.push({ text: `[${time}] ${event.title}`, color });
      lines.push({ text: `  ${event.message.substring(0, 80)}${event.message.length > 80 ? '...' : ''}`, color: Colors.textDim });
    }

    addOutput(lines);
  }, []);

  // whoami — show operator info (Module 13)
  const handleWhoami = useCallback(() => {
    const state = useGameStore.getState();
    const { getClassTitle } = require('../constants/progression');
    const classTitle = getClassTitle(state.operatorClass, state.level);

    addOutput([
      { text: `OPERATOR: ${state.operatorName}`, color: Colors.textCyan },
      { text: `CLASS: ${state.operatorClass}`, color: Colors.textAmber },
      { text: `TITLE: ${classTitle}`, color: Colors.textCyan },
      { text: `LEVEL: ${state.level}`, color: Colors.textPrimary },
      { text: `XP: ${state.xp}`, color: Colors.textPrimary },
      { text: `ACHIEVEMENTS: ${state.unlockedAchievements.length}`, color: Colors.textAmber },
    ]);
  }, []);

  // scan — scan system modules (Module 13)
  const handleScan = useCallback(() => {
    const state = useGameStore.getState();
    const modules = state.modules;

    const lines: OutputLine[] = [
      { text: '=== MODULE SCAN ===', color: Colors.textCyan },
    ];

    for (const [id, mod] of Object.entries(modules)) {
      const status = !mod.unlocked ? 'LOCKED' : mod.stable ? 'STABLE' : `${Math.floor(mod.integrity)}%`;
      const color = !mod.unlocked ? Colors.textDim : mod.stable ? '#50FA7B' : mod.integrity > 50 ? Colors.textCyan : Colors.textRed;
      lines.push({ text: `  ${id.padEnd(15)} ${status.padEnd(8)} ${mod.missionsCompleted}/${mod.totalMissions}`, color });
    }

    addOutput(lines);
  }, []);

  // uptime — show session info (Module 13)
  const handleUptime = useCallback(() => {
    const state = useGameStore.getState();
    const now = Date.now();

    addOutput([
      { text: `SESSION: #${state.sessionId}`, color: Colors.textCyan },
      { text: `TOTAL MISSIONS: ${state.totalMissionsCompleted + state.totalMissionsFailed}`, color: Colors.textPrimary },
      { text: `SUCCESS RATE: ${state.totalMissionsCompleted + state.totalMissionsFailed > 0 ? Math.floor(state.totalMissionsCompleted / (state.totalMissionsCompleted + state.totalMissionsFailed) * 100) : 0}%`, color: Colors.textAmber },
      { text: `FILES REVEALED: ${state.revealedFiles.length}`, color: Colors.textDim },
      { text: `RESTORE POINTS: ${state.restorePoints.length}`, color: Colors.textDim },
    ]);
  }, []);

  // Handle command submission
  const handleSubmit = useCallback(() => {
    processCommand(inputValue);
    setInputValue('');
    scrollToBottom();
  }, [inputValue, processCommand]);

  // Handle keyboard history navigation
  const handleKeyDown = useCallback((e: any) => {
    // Up arrow — previous command
    if (e.nativeEvent?.key === 'ArrowUp') {
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1
          ? historyIndex + 1
          : historyIndex;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      }
      return;
    }
    // Down arrow — next command
    if (e.nativeEvent?.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInputValue('');
      }
      return;
    }
  }, [commandHistory, historyIndex]);

  return (
    <ShellLayout>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <GlassPanel active style={styles.terminalPanel}>
          {/* Output area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.outputScroll}
            contentContainerStyle={styles.outputContent}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
          >
            {output.map((line, i) => (
              <Text
                key={i}
                style={[styles.outputLine, { color: line.color }]}
                selectable
              >
                {line.text}
              </Text>
            ))}
          </ScrollView>

          {/* Input row */}
          <View style={styles.inputRow}>
            <Text style={styles.promptPrefix}>{pathString} &gt; </Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSubmit}
              onFocus={handleFocus}
              onBlur={handleBlur}
              returnKeyType="send"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={Colors.cyan}
              cursorColor={Colors.cyan}
              keyboardAppearance="dark"
            />
          </View>
        </GlassPanel>
      </KeyboardAvoidingView>
    </ShellLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 100,
  },
  terminalPanel: {
    flex: 1,
  },
  outputScroll: {
    flex: 1,
    minHeight: 300,
  },
  outputContent: {
    paddingBottom: 12,
  },
  outputLine: {
    fontSize: 13,
    fontFamily: 'SpaceMono-Regular',
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.cyanFaint,
    paddingTop: 8,
    marginTop: 4,
  },
  promptPrefix: {
    color: Colors.textCyan,
    fontSize: 13,
    fontFamily: 'SpaceMono-Regular',
    opacity: 0.7,
  },
  input: {
    flex: 1,
    color: Colors.textCyan,
    fontSize: 13,
    fontFamily: 'SpaceMono-Regular',
    paddingVertical: 2,
  },
});
