// IGNYX Code Editor Core — Module 06
// The operator's instrument. Syntax-highlighted, line-numbered, pressure-driven.
// When focused: circuits freeze. Glitch suppresses. The system holds its breath.

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  InputAccessoryView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import {
  tokenizeLine,
  getTokenColor,
  calculateNewLineIndent,
  getClosingBracket,
  isOpenBracket,
  isQuoteChar,
  type Token,
} from '../constants/syntax';
import { useGameStore } from '../store/useGameStore';

// ─── Layout Constants ──────────────────────────────────────────

const LINE_HEIGHT = 22;
const FONT_SIZE = 13;
const GUTTER_WIDTH = 38;
const MIN_EDITOR_HEIGHT = 180;
const INDENT_SIZE = 4;

// ─── Props ─────────────────────────────────────────────────────

interface CodeEditorProps {
  /** Current code content */
  code: string;
  /** Callback when code changes */
  onChangeCode: (code: string) => void;
  /** Whether the editor is editable */
  editable?: boolean;
  /** Programming language for display */
  language?: string;
  /** Line indices with errors (0-based) */
  errorLines?: number[];
  /** Callback when editor gains focus */
  onFocus?: () => void;
  /** Callback when editor loses focus */
  onBlur?: () => void;
}

// ─── Component ─────────────────────────────────────────────────

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChangeCode,
  editable = true,
  language = 'python',
  errorLines = [],
  onFocus,
  onBlur,
}) => {
  const setEditorFocused = useGameStore((s) => s.setEditorFocused);
  const highContrast = useGameStore((s) => s.highContrast);

  const [isFocused, setIsFocused] = useState(false);
  const [activeLine, setActiveLine] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const prevCodeRef = useRef(code);

  // Pulse animation for focused border
  const borderPulse = useSharedValue(0.3);

  // Split code into lines
  const lines = useMemo(() => code.split('\n'), [code]);
  const lineCount = lines.length;

  // Calculate editor content height
  const editorContentHeight = useMemo(
    () => Math.max(lineCount * LINE_HEIGHT + 20, MIN_EDITOR_HEIGHT),
    [lineCount],
  );

  // ─── Border Pulse Animation ──────────────────────────────────

  useEffect(() => {
    if (isFocused) {
      borderPulse.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, // infinite
        false,
      );
    } else {
      borderPulse.value = withTiming(0.3, { duration: 300 });
    }
  }, [isFocused]);

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(0, 245, 255, ${borderPulse.value})`,
  }));

  // ─── Selection Tracking ──────────────────────────────────────

  const handleSelectionChange = useCallback(
    (event: { nativeEvent: { selection: { start: number; end: number } } }) => {
      const { start, end } = event.nativeEvent.selection;
      selectionRef.current = { start, end };

      // Calculate active line from cursor position
      const textBeforeCursor = code.substring(0, start);
      const currentLine = textBeforeCursor.split('\n').length - 1;
      setActiveLine(currentLine);
    },
    [code],
  );

  // ─── Auto-indent & Auto-close ────────────────────────────────

  const handleChange = useCallback(
    (newText: string) => {
      const prevText = prevCodeRef.current;
      const cursor = selectionRef.current.start;

      // ── Auto-indent on newline ──
      const prevLineCount = prevText.split('\n').length;
      const newLineCount = newText.split('\n').length;

      if (newLineCount > prevLineCount && editable) {
        // Find the line the cursor was on before the change
        const textBeforeCursor = prevText.substring(0, cursor);
        const currentLineIdx = textBeforeCursor.split('\n').length - 1;
        const prevLines = prevText.split('\n');
        const currentLine = prevLines[currentLineIdx] || '';

        // Calculate proper indent for the new line
        const newIndent = calculateNewLineIndent(currentLine);

        if (newIndent.length > 0) {
          // Find the position right after the inserted newline
          // The newline was inserted at the cursor position
          const beforeNewline = newText.substring(0, cursor + 1);
          const afterNewline = newText.substring(cursor + 1);

          // Check if the line after the newline already has some indent
          const afterLines = afterNewline.split('\n');
          const firstAfterLine = afterLines[0] || '';
          const existingIndent = firstAfterLine.match(/^\s*/)?.[0] || '';

          // Replace any existing indent with the calculated one
          const adjustedAfterLine = newIndent + firstAfterLine.trimStart();
          afterLines[0] = adjustedAfterLine;
          const adjustedText = beforeNewline + afterLines.join('\n');

          prevCodeRef.current = adjustedText;
          onChangeCode(adjustedText);

          // Position cursor after the indent
          const newCursorPos = cursor + 1 + newIndent.length;
          // Use setNativeProps for immediate cursor positioning
          setTimeout(() => {
            inputRef.current?.setNativeProps({
              selection: { start: newCursorPos, end: newCursorPos },
            });
          }, 50);
          return;
        }
      }

      // ── Auto-close brackets ──
      if (newText.length > prevText.length && editable) {
        // Find what character was inserted at the cursor position
        const insertedChar = newText[cursor - 1] || newText[newText.indexOf(prevText.substring(cursor, cursor + 10)) - 1];

        // Check if it's an opening bracket
        if (isOpenBracket(insertedChar)) {
          const closingBracket = getClosingBracket(insertedChar);
          if (closingBracket) {
            const before = newText.substring(0, cursor);
            const after = newText.substring(cursor);
            const adjustedText = before + closingBracket + after;

            prevCodeRef.current = adjustedText;
            onChangeCode(adjustedText);

            // Position cursor between the brackets
            setTimeout(() => {
              inputRef.current?.setNativeProps({
                selection: { start: cursor, end: cursor },
              });
            }, 50);
            return;
          }
        }

        // Auto-close quotes
        if (isQuoteChar(insertedChar)) {
          // Only auto-close if there's no matching quote already
          const before = newText.substring(0, cursor);
          const after = newText.substring(cursor);

          // Check if the next char is already the same quote (don't double-close)
          if (after.length > 0 && after[0] === insertedChar) {
            // User typed a closing quote that we auto-inserted — just move cursor forward
            prevCodeRef.current = newText;
            onChangeCode(newText);
            setTimeout(() => {
              inputRef.current?.setNativeProps({
                selection: { start: cursor + 1, end: cursor + 1 },
              });
            }, 50);
            return;
          }

          const adjustedText = before + insertedChar + after;
          prevCodeRef.current = adjustedText;
          onChangeCode(adjustedText);

          // Position cursor between the quotes
          setTimeout(() => {
            inputRef.current?.setNativeProps({
              selection: { start: cursor, end: cursor },
            });
          }, 50);
          return;
        }
      }

      prevCodeRef.current = newText;
      onChangeCode(newText);
    },
    [editable, onChangeCode],
  );

  // ─── Focus / Blur ────────────────────────────────────────────

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setEditorFocused(true);
    onFocus?.();
  }, [setEditorFocused, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setEditorFocused(false);
    onBlur?.();
  }, [setEditorFocused, onBlur]);

  // ─── Keyboard Accessory ──────────────────────────────────────

  const insertText = useCallback(
    (text: string) => {
      if (!editable) return;
      const cursor = selectionRef.current.start;
      const before = code.substring(0, cursor);
      const after = code.substring(cursor);
      const newCode = before + text + after;
      prevCodeRef.current = newCode;
      onChangeCode(newCode);

      // Move cursor after inserted text
      const newCursor = cursor + text.length;
      setTimeout(() => {
        inputRef.current?.setNativeProps({
          selection: { start: newCursor, end: newCursor },
        });
      }, 50);
    },
    [code, editable, onChangeCode],
  );

  const insertTab = useCallback(() => {
    insertText('    '); // 4 spaces for Python
  }, [insertText]);

  const ACCESSORY_ID = 'ignyx-editor-accessory';

  // ─── Render Tokenized Line ───────────────────────────────────

  const renderTokens = useCallback(
    (tokens: Token[], lineIdx: number) => {
      const hasContent = tokens.some((t) => t.text.trim().length > 0);

      return (
        <View
          key={lineIdx}
          style={[
            styles.codeLine,
            errorLines.includes(lineIdx) && styles.codeLineError,
            isFocused && activeLine === lineIdx && styles.codeLineActive,
          ]}
        >
          {hasContent ? (
            tokens.map((token, j) => (
              <Text
                key={`${lineIdx}-${j}`}
                style={[
                  styles.codeText,
                  { color: getTokenColor(token.type) },
                  highContrast && token.type === 'comment' && styles.commentHighContrast,
                ]}
                allowFontScaling={false}
              >
                {token.text}
              </Text>
            ))
          ) : (
            // Empty line needs a space to maintain height
            <Text style={styles.codeText} allowFontScaling={false}>
              {' '}
            </Text>
          )}
        </View>
      );
    },
    [errorLines, isFocused, activeLine, highContrast],
  );

  // ─── Render ──────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── Header: Language tag + line count ── */}
      <View style={styles.header}>
        <Text style={styles.langTag}>{language.toUpperCase()}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.lineCount}>
            {lineCount} {lineCount === 1 ? 'LINE' : 'LINES'}
          </Text>
          {isFocused && (
            <View style={styles.focusIndicator}>
              <View style={styles.focusDot} />
              <Text style={styles.focusLabel}>EDITING</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Editor Body ── */}
      <Animated.View
        style={[
          styles.editorBody,
          borderAnimatedStyle,
          isFocused && styles.editorBodyFocused,
        ]}
      >
        <View style={styles.editorRow}>
          {/* ── Gutter: Line numbers ── */}
          <ScrollView
            style={styles.gutterScroll}
            contentContainerStyle={styles.gutterContent}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          >
            {lines.map((_, i) => (
              <Text
                key={i}
                style={[
                  styles.lineNumber,
                  errorLines.includes(i) && styles.lineNumberError,
                  isFocused && activeLine === i && styles.lineNumberActive,
                ]}
                allowFontScaling={false}
              >
                {i + 1}
              </Text>
            ))}
          </ScrollView>

          {/* ── Gutter border ── */}
          <View style={styles.gutterBorder} />

          {/* ── Code Area ── */}
          <View style={[styles.codeArea, { minHeight: editorContentHeight }]}>
            {/* Error line backgrounds */}
            {errorLines.map((lineIdx) => (
              <View
                key={`err-${lineIdx}`}
                style={[
                  styles.errorLineBg,
                  { top: lineIdx * LINE_HEIGHT + 8 },
                ]}
                pointerEvents="none"
              />
            ))}

            {/* Active line background */}
            {isFocused && (
              <View
                style={[
                  styles.activeLineBg,
                  { top: activeLine * LINE_HEIGHT + 8 },
                ]}
                pointerEvents="none"
              />
            )}

            {/* Syntax highlight layer */}
            <View style={styles.highlightLayer} pointerEvents="none">
              {lines.map((line, i) => renderTokens(tokenizeLine(line), i))}
            </View>

            {/* TextInput layer — transparent text, captures all events */}
            <TextInput
              ref={inputRef}
              style={[
                styles.inputLayer,
                !editable && styles.inputLayerDisabled,
              ]}
              value={code}
              onChangeText={handleChange}
              multiline
              scrollEnabled={false}
              editable={editable}
              selectionColor={Colors.cyan}
              cursorColor={Colors.cyan}
              onSelectionChange={handleSelectionChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              keyboardAppearance="dark"
              inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
              textAlignVertical="top"
              allowFontScaling={false}
            />
          </View>
        </View>
      </Animated.View>

      {/* ── Editor Toolbar ── */}
      {editable && (
        <View style={styles.toolbar}>
          {[
            { label: 'TAB', action: insertTab },
            { label: ':', action: () => insertText(':') },
            { label: '(', action: () => insertText('(') },
            { label: ')', action: () => insertText(')') },
            { label: '=', action: () => insertText('=') },
            { label: '==', action: () => insertText('==') },
            { label: '""', action: () => insertText('""') },
            { label: '#', action: () => insertText('#') },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.label}
              onPress={btn.action}
              activeOpacity={0.6}
              style={styles.toolbarBtn}
            >
              <Text style={styles.toolbarBtnText} allowFontScaling={false}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── iOS InputAccessoryView ── */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          <View style={styles.iosAccessory}>
            {[
              { label: 'TAB', action: insertTab },
              { label: ':', action: () => insertText(':') },
              { label: '(', action: () => insertText('(') },
              { label: ')', action: () => insertText(')') },
              { label: '==', action: () => insertText('==') },
              { label: '""', action: () => insertText('""') },
              { label: '#', action: () => insertText('#') },
            ].map((btn) => (
              <TouchableOpacity
                key={`ios-${btn.label}`}
                onPress={btn.action}
                style={styles.iosAccessoryBtn}
              >
                <Text style={styles.iosAccessoryBtnText} allowFontScaling={false}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  langTag: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineCount: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
  focusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  focusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.cyan,
  },
  focusLabel: {
    color: Colors.cyan,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 2,
  },

  // Editor body
  editorBody: {
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(5, 12, 24, 0.95)',
  },
  editorBodyFocused: {
    backgroundColor: 'rgba(3, 8, 18, 0.98)',
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  // Editor row (gutter + code)
  editorRow: {
    flexDirection: 'row',
    minHeight: MIN_EDITOR_HEIGHT,
  },

  // Gutter
  gutterScroll: {
    width: GUTTER_WIDTH,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  gutterContent: {
    paddingVertical: 8,
    paddingRight: 6,
    alignItems: 'flex-end',
  },
  lineNumber: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 10,
    lineHeight: LINE_HEIGHT,
    color: 'rgba(232, 244, 248, 0.2)',
    textAlign: 'right',
  },
  lineNumberError: {
    color: 'rgba(255, 0, 0, 0.6)',
  },
  lineNumberActive: {
    color: Colors.cyan,
  },

  // Gutter border
  gutterBorder: {
    width: 1,
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
  },

  // Code area
  codeArea: {
    flex: 1,
    position: 'relative',
  },

  // Error line background
  errorLineBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: LINE_HEIGHT,
    backgroundColor: 'rgba(255, 0, 0, 0.06)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 0, 0, 0.4)',
  },

  // Active line background
  activeLineBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: LINE_HEIGHT,
    backgroundColor: 'rgba(0, 245, 255, 0.03)',
  },

  // Highlight layer
  highlightLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingHorizontal: 10,
    zIndex: 1,
  },
  codeLine: {
    height: LINE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLineError: {
    // Error lines get the errorLineBg behind them
  },
  codeLineActive: {
    // Active line gets the activeLineBg behind it
  },
  codeText: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    includeFontPadding: false,
  },
  commentHighContrast: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },

  // Input layer (transparent text, captures events)
  inputLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    color: 'transparent',
    fontFamily: 'SpaceMono-Regular',
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  inputLayerDisabled: {
    color: 'transparent',
    opacity: 0.6,
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(0, 245, 255, 0.15)',
  },
  toolbarBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  toolbarBtnText: {
    color: Colors.textCyan,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },

  // iOS accessory
  iosAccessory: {
    flexDirection: 'row',
    backgroundColor: 'rgba(5, 12, 24, 0.98)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 255, 0.2)',
  },
  iosAccessoryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  iosAccessoryBtnText: {
    color: Colors.textCyan,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 1,
  },
});
