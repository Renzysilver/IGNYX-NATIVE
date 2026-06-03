import type { OperatorClass } from './gameState';

export interface ProfilingChallenge {
  id: string;
  phase: 'logic_scan' | 'syntax_check';
  prompt: string;
  codeBlock?: string;
  options: string[];
  correctIndex: number;
}

export const PROFILING_CHALLENGES: ProfilingChallenge[] = [
  // Phase 1 — Logic Scan
  {
    id: 'logic_1',
    phase: 'logic_scan',
    prompt: 'CORRUPTED SEQUENCE NODE — PATTERN RECOVERY REQUIRED',
    codeBlock: '2    8    32    [?]    512',
    options: ['64', '128', '96', '256'],
    correctIndex: 1, // 128 (multiply by 4)
  },
  {
    id: 'logic_2',
    phase: 'logic_scan',
    prompt: 'LOGIC GATE INTEGRITY CHECK',
    codeBlock: 'A AND (B OR C)\nA = 0   B = 1   C = 1\nEVALUATE OUTPUT',
    options: ['TRUE', 'FALSE', 'UNDEFINED', 'ERROR'],
    correctIndex: 1, // 0 AND (1 OR 1) = 0 AND 1 = 0 = FALSE
  },
  {
    id: 'logic_3',
    phase: 'logic_scan',
    prompt: 'SYSTEM DEPENDENCY RESOLUTION',
    codeBlock: 'Process A requires output from B.\nProcess B has crashed.\nProcess A is still running.\nCorrect protocol?',
    options: ['RUN A ANYWAY', 'RESTART B FIRST', 'TERMINATE A', 'IGNORE'],
    correctIndex: 1, // RESTART B FIRST
  },
  // Phase 2 — Syntax Check
  {
    id: 'syntax_1',
    phase: 'syntax_check',
    prompt: 'SYNTAX ARCHITECTURE SCAN',
    codeBlock: 'x = 2 + 3\nprint(x)',
    options: ['5', '"5"', 'x', 'None'],
    correctIndex: 0, // 5
  },
];

export const calculateOperatorClass = (
  correctCount: number,
  responseTimes: number[]
): OperatorClass => {
  // Check for erratic behavior: very fast wrong answers or very slow
  const avgTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;
  const isErratic = avgTime < 2000 || avgTime > 30000;

  if (isErratic && correctCount <= 2) return 'UNKNOWN';
  if (correctCount === 4) return 'ARCHITECT';
  if (correctCount === 3) return 'OPERATIVE';
  return 'GHOST';
};

export const CLASS_DISPLAY: Record<OperatorClass, { title: string; description: string }> = {
  ARCHITECT: {
    title: 'ARCHITECT',
    description: 'Full system comprehension detected.\nOperational capacity: MAXIMUM.\nYou will be given no advantage for this.',
  },
  OPERATIVE: {
    title: 'OPERATIVE',
    description: 'Partial system comprehension detected.\nOperational capacity: MODERATE.\nThe system will adjust accordingly.',
  },
  GHOST: {
    title: 'GHOST',
    description: 'Minimal comprehension detected.\nOperational capacity: UNSTABLE.\nThe system will not slow down for you.',
  },
  UNKNOWN: {
    title: 'UNKNOWN',
    description: 'Erratic response pattern detected.\nOperational capacity: UNVERIFIED.\nThe system cannot predict your behavior.',
  },
};
