---
Task ID: 06
Agent: Main Agent
Task: MODULE 06 — CODE EDITOR CORE

Work Log:
- Created `constants/syntax.ts` — Full Python syntax tokenizer with 10 token types (keyword, string, number, comment, operator, builtin, function, punctuation, identifier, whitespace), regex-based line tokenizer, IGNYX-themed color mapping (pink keywords, amber strings, cyan operators, green functions, dim comments), indentation helpers, bracket matching utilities
- Created `components/CodeEditor.tsx` — Production code editor with: layered architecture (transparent TextInput over syntax-highlighted Text view), line numbers gutter, auto-indentation on Enter (calculates indent from previous line, adds 4 spaces after colon), auto-close brackets/quotes, error line highlighting (red background + left border), active line tracking, pulsing border animation when focused, editor toolbar with TAB/colon/bracket/equals/quote/hash buttons, iOS InputAccessoryView support, Eye of the Hurricane integration (sets isEditorFocused in Zustand store, editor darkening when focused), high contrast mode support
- Updated `app/mission.tsx` — Replaced basic TextInput with CodeEditor component, added error line tracking via getErrorLines, timer urgency animation (scale pulse at 10s), improved feedback bar styling, removed direct editor focus management (now handled by CodeEditor)
- Updated `constants/missions.ts` — Added getErrorLines() helper that computes 0-based line indices where submitted code differs from correct code, used by CodeEditor for error highlighting
- Verified TypeScript compilation passes with zero errors

Stage Summary:
- 3 new/modified files: constants/syntax.ts, components/CodeEditor.tsx, app/mission.tsx
- 1 file updated: constants/missions.ts (added getErrorLines)
- Total project source files: 22 (up from 20)
- All TypeScript checks pass
- Key architectural decision: Layered editor approach (transparent TextInput captures events, syntax-highlighted Text view renders underneath) chosen for real-time syntax highlighting while maintaining native cursor/selection behavior
