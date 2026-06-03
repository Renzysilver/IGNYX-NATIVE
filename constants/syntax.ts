// IGNYX Syntax Tokenizer — Python
// Tokenizes code lines for syntax highlighting in the CodeEditor.
// Priority: comments > strings > numbers > keywords > builtins > operators > punctuation > identifiers > whitespace

import { Colors } from './colors';

// ─── Token Types ───────────────────────────────────────────────

export type TokenType =
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'operator'
  | 'builtin'
  | 'function'
  | 'punctuation'
  | 'identifier'
  | 'whitespace';

export interface Token {
  type: TokenType;
  text: string;
}

// ─── Python Keyword & Built-in Sets ────────────────────────────

const KEYWORDS = new Set([
  'if', 'else', 'elif', 'while', 'for', 'in', 'def', 'return',
  'break', 'continue', 'pass', 'True', 'False', 'None',
  'and', 'or', 'not', 'is', 'with', 'as',
  'try', 'except', 'finally', 'raise',
  'import', 'from', 'class', 'yield', 'lambda',
  'global', 'nonlocal', 'assert', 'del',
]);

const BUILTINS = new Set([
  'print', 'len', 'range', 'input', 'int', 'str', 'float',
  'list', 'dict', 'set', 'tuple', 'type', 'abs', 'max', 'min',
  'sum', 'round', 'open', 'bool', 'bytes', 'super', 'self',
  'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed',
  'append', 'extend', 'insert', 'remove', 'pop', 'index',
  'count', 'sort', 'reverse', 'copy', 'clear', 'items', 'keys',
  'values', 'get', 'update', 'join', 'split', 'strip', 'replace',
]);

// ─── Token Patterns (order matters — first match wins) ─────────

const PATTERNS: [TokenType, RegExp][] = [
  // Comments: # to end of line
  ['comment', /^#.*$/],

  // Triple-quoted strings (single-line only; multi-line handled by state)
  ['string', /^"""[\s\S]*?"""|^'''[\s\S]*?'''/],

  // Double-quoted strings
  ['string', /^"(?:[^"\\]|\\.)*"/],

  // Single-quoted strings
  ['string', /^'(?:[^'\\]|\\.)*'/],

  // Numbers (hex first, then float/int)
  ['number', /^\b0x[0-9a-fA-F]+\b/],
  ['number', /^\b\d+\.?\d*(?:e[+-]?\d+)?\b/],

  // Keywords
  ['keyword', new RegExp(`^\\b(${[...KEYWORDS].join('|')})\\b`)],

  // Built-in functions and methods
  ['builtin', new RegExp(`^\\b(${[...BUILTINS].join('|')})\\b`)],

  // Operators (longest first to avoid partial matches)
  ['operator', /^(===|!==|<>|<<=|>>=|<<|>>|\*\*|\/\/|<=|>=|==|!=|[+\-*/%=<>!&|^~])/],

  // Punctuation
  ['punctuation', /^[(){}\[\]:;,\.@]/],

  // Whitespace
  ['whitespace', /^[ \t]+/],

  // Identifiers (variable names, function names)
  ['identifier', /^[a-zA-Z_][a-zA-Z0-9_]*/],
];

// ─── Tokenizer ─────────────────────────────────────────────────

/**
 * Tokenize a single line of Python code.
 * Returns an array of Token objects with type and text.
 */
export const tokenizeLine = (line: string): Token[] => {
  const tokens: Token[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    let matched = false;

    for (const [type, regex] of PATTERNS) {
      const match = remaining.match(regex);
      if (match && match.index === 0) {
        // Check if identifier is actually a function call (followed by `(`)
        if (type === 'identifier') {
          const afterIdentifier = remaining.slice(match[0].length);
          if (afterIdentifier.startsWith('(')) {
            tokens.push({ type: 'function', text: match[0] });
          } else {
            tokens.push({ type, text: match[0] });
          }
        } else {
          tokens.push({ type, text: match[0] });
        }
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Fallback: treat unknown character as identifier
      tokens.push({ type: 'identifier', text: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
};

/**
 * Tokenize full code into per-line token arrays.
 */
export const tokenizeCode = (code: string): Token[][] => {
  return code.split('\n').map(tokenizeLine);
};

// ─── Syntax Color Mapping ──────────────────────────────────────

/**
 * IGNYX Syntax Colors — extends the base color system.
 * Designed for the cold, terminal aesthetic:
 * - Keywords burn hot pink (control flow commands the eye)
 * - Strings glow amber (data is precious)
 * - Operators pulse cyan (system signals)
 * - Comments fade dim (noise, not signal)
 * - Functions bloom green (your tools)
 */
export const SyntaxColors: Record<TokenType, string> = {
  keyword: '#FF79C6',       // Hot pink — control flow
  string: Colors.textAmber, // Amber — data
  number: '#BD93F9',        // Lavender — numeric
  comment: Colors.textDim,  // Dim — noise
  operator: Colors.cyan,    // Cyan — system signal
  builtin: '#8BE9FD',       // Light cyan — built-in tools
  function: '#50FA7B',      // Green — user tools
  punctuation: 'rgba(232, 244, 248, 0.7)', // Muted white
  identifier: Colors.textPrimary, // Bright white — identity
  whitespace: 'transparent',
};

/**
 * Get the display color for a token type.
 */
export const getTokenColor = (type: TokenType): string => {
  return SyntaxColors[type] || Colors.textPrimary;
};

// ─── Indentation Helpers ───────────────────────────────────────

/**
 * Detect the indentation of a line (leading spaces/tabs).
 */
export const getLineIndent = (line: string): string => {
  const match = line.match(/^\s*/);
  return match ? match[0] : '';
};

/**
 * Calculate the indent for a new line after the given line.
 * Python: increase indent after lines ending with `:`.
 */
export const calculateNewLineIndent = (previousLine: string): string => {
  const currentIndent = getLineIndent(previousLine);
  const trimmed = previousLine.trimEnd();

  // Lines ending with `:` get an extra level of indent
  if (trimmed.endsWith(':')) {
    return currentIndent + '    '; // 4 spaces
  }

  // Dedent after certain keywords
  const dedentKeywords = ['return', 'break', 'continue', 'pass', 'raise'];
  const lastWord = trimmed.split(/\s+/).pop() || '';
  if (dedentKeywords.includes(lastWord)) {
    // Dedent one level (remove 4 spaces)
    return currentIndent.length >= 4
      ? currentIndent.slice(0, -4)
      : '';
  }

  return currentIndent;
};

// ─── Bracket Matching ──────────────────────────────────────────

const OPEN_TO_CLOSE: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

const CLOSE_TO_OPEN: Record<string, string> = {
  ')': '(',
  ']': '[',
  '}': '{',
};

/**
 * Check if a character is an opening bracket.
 */
export const isOpenBracket = (char: string): boolean => {
  return char in OPEN_TO_CLOSE;
};

/**
 * Get the closing bracket for an opening bracket.
 */
export const getClosingBracket = (open: string): string | null => {
  return OPEN_TO_CLOSE[open] || null;
};

/**
 * Quote characters that auto-close.
 */
export const isQuoteChar = (char: string): boolean => {
  return char === '"' || char === "'";
};
