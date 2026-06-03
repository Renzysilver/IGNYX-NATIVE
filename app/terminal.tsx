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

interface OutputLine {
  text: string;
  color: string;
}

const SUPPORTED_COMMANDS = ['ls', 'cd', 'cat', 'grep', 'help', 'clear'];

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
    addOutput([{
      text: 'ls    cd    cat    grep    clear    help',
      color: Colors.textCyan,
    }]);
  }, []);

  // clear — clear terminal output
  const handleClear = useCallback(() => {
    setOutput([]);
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
