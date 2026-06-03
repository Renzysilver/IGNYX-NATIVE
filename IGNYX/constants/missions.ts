import type { ModuleId } from './gameState';

export interface Mission {
  id: string;
  moduleId: ModuleId;
  title: string;
  alert: string;
  language: string;
  brokenCode: string;
  correctCode: string;
  timerSeconds: number;
  successMessage: string;
  failMessage: string;
  timeoutMessage: string;
  failureFeedback: Record<string, string>;
}

// ========================
// KERNEL CORE — 5 Missions
// ========================

export const KERNEL_CORE_MISSIONS: Mission[] = [
  {
    id: 'KC-001',
    moduleId: 'kernel_core',
    title: 'LOOP REPAIR',
    alert: 'SECTOR 1 — PROCESS HANDLER: CYCLING PROCESS DETECTED. STABILIZE IMMEDIATELY.',
    language: 'python',
    brokenCode: `count = 0\nwhile count < 5\n    print(count)\n    count += 1`,
    correctCode: `count = 0\nwhile count < 5:\n    print(count)\n    count += 1`,
    timerSeconds: 120,
    successMessage: 'Loop stabilized. Process handler online.',
    failMessage: 'Loop remains broken. System still cycling.',
    timeoutMessage: 'Process handler offline. Kernel degraded.',
    failureFeedback: {
      'colon': 'Missing colon after while condition. Syntax incomplete.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'operator': 'Incorrect operator. Logic remains broken.',
    },
  },
  {
    id: 'KC-002',
    moduleId: 'kernel_core',
    title: 'VARIABLE CORRUPTION',
    alert: 'SECTOR 2 — MEMORY HANDLER: CALCULATION ERROR IN PRICE COMPUTATION.',
    language: 'python',
    brokenCode: `price = 100\ntax = 20\ntotal = price - tax\nprint(total)`,
    correctCode: `price = 100\ntax = 20\ntotal = price + tax\nprint(total)`,
    timerSeconds: 120,
    successMessage: 'Memory handler recalibrated.',
    failMessage: 'Calculation error persists. Data integrity compromised.',
    timeoutMessage: 'Memory handler offline. Data corrupted.',
    failureFeedback: {
      'operator': 'Incorrect operator. Addition, not subtraction.',
      'variable': 'Variable mismatch. Trace your references.',
      'return': 'Function returns nothing. System still offline.',
    },
  },
  {
    id: 'KC-003',
    moduleId: 'kernel_core',
    title: 'MISSING RETURN',
    alert: 'SECTOR 3 — OUTPUT HANDLER: FUNCTION RETURNS NOTHING. DATA LOST.',
    language: 'python',
    brokenCode: `def calculate_area(width, height):\n    area = width * height`,
    correctCode: `def calculate_area(width, height):\n    area = width * height\n    return area`,
    timerSeconds: 150,
    successMessage: 'Output handler restored.',
    failMessage: 'Function returns nothing. System still offline.',
    timeoutMessage: 'Output handler offline. No data flowing.',
    failureFeedback: {
      'return': 'Missing return statement. Function produces nothing.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'variable': 'Variable mismatch. Trace your references.',
    },
  },
  {
    id: 'KC-004',
    moduleId: 'kernel_core',
    title: 'INFINITE LOOP',
    alert: 'SECTOR 4 — CYCLE MANAGER: RUNAWAY PROCESS DETECTED. RESOURCE DEPLETION IMMINENT.',
    language: 'python',
    brokenCode: `i = 0\nwhile True:\n    print(i)\n    i += 1`,
    correctCode: `i = 0\nwhile True:\n    print(i)\n    i += 1\n    if i == 10:\n        break`,
    timerSeconds: 150,
    successMessage: 'Runaway process terminated. Cycle manager stable.',
    failMessage: 'Process still running. Kernel resources depleting.',
    timeoutMessage: 'Cycle manager offline. Kernel critical.',
    failureFeedback: {
      'break': 'No break condition. Process runs forever.',
      'condition': 'Missing conditional break. Add exit condition.',
      'syntax': 'Syntax invalid. System cannot parse.',
    },
  },
  {
    id: 'KC-005',
    moduleId: 'kernel_core',
    title: 'CONDITIONAL LOGIC',
    alert: 'SECTOR 5 — PERMISSION LAYER: ACCESS LOG COMPROMISED. UNAUTHORIZED ENTRY POSSIBLE.',
    language: 'python',
    brokenCode: `is_admin = False\nif is_admin = True:\n    print("ACCESS GRANTED")\nelse:\n    print("ACCESS DENIED")`,
    correctCode: `is_admin = False\nif is_admin == True:\n    print("ACCESS GRANTED")\nelse:\n    print("ACCESS DENIED")`,
    timerSeconds: 120,
    successMessage: 'Permission layer restored. Access logic functioning.',
    failMessage: 'Syntax error persists. Permission layer offline.',
    timeoutMessage: 'Permission layer offline. System vulnerable.',
    failureFeedback: {
      'operator': 'Assignment used instead of comparison. Use == not =.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'condition': 'Condition logic wrong. Check comparison operator.',
    },
  },
];

// All missions by module
export const ALL_MISSIONS: Record<ModuleId, Mission[]> = {
  kernel_core: KERNEL_CORE_MISSIONS,
  app_layer: [],      // Module 10
  network: [],        // Module 11
  data_system: [],    // Module 12
  security: [],       // Module 13
  ai_core: [],        // Module 14
};

/**
 * Get the next incomplete mission for a module
 */
export const getNextMission = (moduleId: ModuleId, missionsCompleted: number): Mission | null => {
  const missions = ALL_MISSIONS[moduleId];
  if (!missions || missionsCompleted >= missions.length) return null;
  return missions[missionsCompleted];
};

/**
 * Normalize code for comparison
 */
export const normalizeCode = (code: string): string => {
  return code
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '')
    .join('\n')
    .trim();
};

/**
 * Validate submitted code against correct code
 * Returns { correct: boolean, feedback: string }
 */
export const validateCode = (
  submitted: string,
  mission: Mission
): { correct: boolean; feedback: string } => {
  const normalizedSubmitted = normalizeCode(submitted);
  const normalizedCorrect = normalizeCode(mission.correctCode);

  if (normalizedSubmitted === normalizedCorrect) {
    return { correct: true, feedback: '' };
  }

  // Analyze diff for specific feedback
  const submittedLines = normalizedSubmitted.split('\n');
  const correctLines = normalizedCorrect.split('\n');

  // Check for missing lines
  if (submittedLines.length < correctLines.length) {
    // Check if a return statement is missing
    const hasReturnInCorrect = correctLines.some((l) => l.trim().startsWith('return'));
    const hasReturnInSubmitted = submittedLines.some((l) => l.trim().startsWith('return'));
    if (hasReturnInCorrect && !hasReturnInSubmitted) {
      return { correct: false, feedback: mission.failureFeedback['return'] || 'Missing return statement. Function produces nothing.' };
    }
    // Check if a break is missing
    const hasBreakInCorrect = correctLines.some((l) => l.trim().startsWith('break'));
    const hasBreakInSubmitted = submittedLines.some((l) => l.trim().startsWith('break'));
    if (hasBreakInCorrect && !hasBreakInSubmitted) {
      return { correct: false, feedback: mission.failureFeedback['break'] || 'No break condition. Process runs forever.' };
    }
    return { correct: false, feedback: 'Code incomplete. Missing lines detected.' };
  }

  // Line-by-line diff for specific feedback
  for (let i = 0; i < Math.max(submittedLines.length, correctLines.length); i++) {
    const subLine = submittedLines[i] || '';
    const corLine = correctLines[i] || '';

    if (subLine !== corLine) {
      // Check for operator differences
      const operators = ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>='];
      for (const op of operators) {
        if (corLine.includes(op) && !subLine.includes(op)) {
          // Specifically check = vs ==
          if (op === '==' && subLine.includes('=')) {
            return { correct: false, feedback: mission.failureFeedback['operator'] || 'Assignment used instead of comparison. Use == not =.' };
          }
          return { correct: false, feedback: mission.failureFeedback['operator'] || 'Incorrect operator. Logic remains broken.' };
        }
      }

      // Check for missing colon
      if (corLine.endsWith(':') && !subLine.endsWith(':')) {
        return { correct: false, feedback: mission.failureFeedback['colon'] || 'Missing colon after condition. Syntax incomplete.' };
      }

      // Check for missing if/break
      if (corLine.includes('if ') && !subLine.includes('if ')) {
        return { correct: false, feedback: mission.failureFeedback['condition'] || 'Missing conditional. Add exit condition.' };
      }
      if (corLine.includes('break') && !subLine.includes('break')) {
        return { correct: false, feedback: mission.failureFeedback['break'] || 'No break condition. Process runs forever.' };
      }
    }
  }

  // Generic failure
  return { correct: false, feedback: 'Syntax invalid. System cannot parse.' };
};

/**
 * Get the line indices (0-based) where submitted code differs from correct code.
 * Used by the CodeEditor to highlight error lines.
 */
export const getErrorLines = (
  submitted: string,
  mission: Mission
): number[] => {
  const normalizedSubmitted = normalizeCode(submitted);
  const normalizedCorrect = normalizeCode(mission.correctCode);

  if (normalizedSubmitted === normalizedCorrect) {
    return [];
  }

  const submittedLines = normalizedSubmitted.split('\n');
  const correctLines = normalizedCorrect.split('\n');
  const errors: number[] = [];

  // Map normalized line indices back to original line indices
  const originalLines = submitted.split('\n');
  let normalizedIdx = 0;

  for (let i = 0; i < originalLines.length; i++) {
    const trimmed = originalLines[i].trimEnd();
    if (trimmed !== '') {
      if (normalizedIdx < submittedLines.length) {
        if (
          normalizedIdx >= correctLines.length ||
          submittedLines[normalizedIdx] !== correctLines[normalizedIdx]
        ) {
          errors.push(i);
        }
      }
      normalizedIdx++;
    }
  }

  // If all lines are correct but counts differ, mark the last line
  if (errors.length === 0 && submittedLines.length !== correctLines.length) {
    errors.push(Math.max(0, originalLines.length - 1));
  }

  return errors;
};
