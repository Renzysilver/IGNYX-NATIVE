// IGNYX Mission System — Module 09
// The operator's crucible. 30 missions across 6 modules.
// Every mission is a repair. Every repair is a choice. Every choice has consequences.

import type { ModuleId } from './gameState';

// ─── Core Types ────────────────────────────────────────────────

export interface Mission {
  id: string;
  moduleId: ModuleId;
  title: string;
  alert: string;
  /** Narrative briefing shown before the mission starts */
  briefing: string;
  /** What's broken — shown in briefing */
  objective: string;
  /** Programming language */
  language: string;
  /** The broken code the operator must fix */
  brokenCode: string;
  /** The correct code that fixes the issue */
  correctCode: string;
  /** Countdown timer in seconds */
  timerSeconds: number;
  /** XP reward on success */
  xpReward: number;
  /** Integrity gain on success */
  integrityGain: number;
  /** Integrity loss on failure */
  integrityLoss: number;
  /** System integrity loss on timeout */
  timeoutIntegrityLoss: number;
  successMessage: string;
  failMessage: string;
  timeoutMessage: string;
  /** Consequence narrative shown after result */
  successConsequence: string;
  failConsequence: string;
  timeoutConsequence: string;
  /** Specific feedback keyed by error type */
  failureFeedback: Record<string, string>;
  /** Whether this mission unlocks a hidden file in the filesystem */
  revealsFile?: string;
  /** OS voice line on mission start */
  osVoiceLine?: string;
}

// ─── Consequence Types ─────────────────────────────────────────

export interface MissionConsequence {
  /** Module affected */
  moduleId: ModuleId;
  /** Integrity change (negative = damage) */
  integrityDelta: number;
  /** Narrative text */
  narrative: string;
  /** Whether this triggers an alert */
  showAlert: boolean;
}

/**
 * Calculate cascading consequences when a mission fails.
 * Failures don't just affect the current module — they cascade.
 */
export const calculateFailureConsequences = (
  moduleId: ModuleId,
  currentIntegrity: number,
): MissionConsequence[] => {
  const consequences: MissionConsequence[] = [];
  const cascadeChance = currentIntegrity < 30 ? 0.8 : currentIntegrity < 60 ? 0.5 : 0.2;

  // Direct damage to the failed module
  consequences.push({
    moduleId,
    integrityDelta: -10,
    narrative: `${moduleId.replace('_', ' ').toUpperCase()} integrity compromised.`,
    showAlert: true,
  });

  // Cascade to adjacent modules
  const adjacencyMap: Record<ModuleId, ModuleId[]> = {
    kernel_core: ['app_layer'],
    app_layer: ['kernel_core', 'network'],
    network: ['app_layer', 'data_system'],
    data_system: ['network', 'security'],
    security: ['data_system', 'ai_core'],
    ai_core: ['security'],
  };

  const adjacent = adjacencyMap[moduleId] || [];
  for (const adj of adjacent) {
    // Cascade damage with probability based on system integrity
    if (Math.random() < cascadeChance) {
      consequences.push({
        moduleId: adj,
        integrityDelta: -5,
        narrative: `Cascade failure reaching ${adj.replace('_', ' ').toUpperCase()}.`,
        showAlert: false,
      });
    }
  }

  return consequences;
};

// ===========================
// KERNEL CORE — 5 Missions
// ===========================

export const KERNEL_CORE_MISSIONS: Mission[] = [
  {
    id: 'KC-001',
    moduleId: 'kernel_core',
    title: 'LOOP REPAIR',
    alert: 'SECTOR 1 — PROCESS HANDLER: CYCLING PROCESS DETECTED. STABILIZE IMMEDIATELY.',
    briefing: 'The process handler has been cycling for 47 iterations. A simple while loop is missing its colon. Without it, the kernel cannot parse the instruction, and the process spirals. This is basic syntax — but in IGNYX, basic failures cascade.',
    objective: 'Add the missing colon to the while loop syntax.',
    language: 'python',
    brokenCode: `count = 0\nwhile count < 5\n    print(count)\n    count += 1`,
    correctCode: `count = 0\nwhile count < 5:\n    print(count)\n    count += 1`,
    timerSeconds: 120,
    xpReward: 100,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Loop stabilized. Process handler online.',
    failMessage: 'Loop remains broken. System still cycling.',
    timeoutMessage: 'Process handler offline. Kernel degraded.',
    successConsequence: 'The loop terminates correctly. Process handler resumes normal operation. One less cycle of decay.',
    failConsequence: 'The process handler continues cycling. Resources deplete. The kernel grows weaker with each iteration.',
    timeoutConsequence: 'Automatic shutdown initiated. The process handler is offline — its workload distributed to already-strained systems.',
    failureFeedback: {
      'colon': 'Missing colon after while condition. Syntax incomplete.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'operator': 'Incorrect operator. Logic remains broken.',
    },
    revealsFile: '/var/log/mission_001.log',
    osVoiceLine: 'PROCESS HANDLER MALFUNCTION. OPERATOR INTERVENTION REQUIRED.',
  },
  {
    id: 'KC-002',
    moduleId: 'kernel_core',
    title: 'VARIABLE CORRUPTION',
    alert: 'SECTOR 2 — MEMORY HANDLER: CALCULATION ERROR IN PRICE COMPUTATION.',
    briefing: 'The memory handler is producing incorrect results. A price calculation uses subtraction where addition is needed. Every transaction is wrong. Data flows through the kernel corrupted from the source. Fix the operator, fix the data.',
    objective: 'Correct the arithmetic operator in the calculation.',
    language: 'python',
    brokenCode: `price = 100\ntax = 20\ntotal = price - tax\nprint(total)`,
    correctCode: `price = 100\ntax = 20\ntotal = price + tax\nprint(total)`,
    timerSeconds: 120,
    xpReward: 100,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Memory handler recalibrated.',
    failMessage: 'Calculation error persists. Data integrity compromised.',
    timeoutMessage: 'Memory handler offline. Data corrupted.',
    successConsequence: 'The correct result flows through. Transactions resume. The kernel remembers how to add.',
    failConsequence: 'Wrong numbers propagate. Every downstream system receives corrupted data. The error multiplies.',
    timeoutConsequence: 'Memory handler unresponsive. All pending transactions lost. The kernel forgets.',
    failureFeedback: {
      'operator': 'Incorrect operator. Addition, not subtraction.',
      'variable': 'Variable mismatch. Trace your references.',
      'return': 'Function returns nothing. System still offline.',
    },
    revealsFile: '/var/log/mission_002.log',
    osVoiceLine: 'MEMORY HANDLER MISMATCH. DATA INTEGRITY FAILING.',
  },
  {
    id: 'KC-003',
    moduleId: 'kernel_core',
    title: 'MISSING RETURN',
    alert: 'SECTOR 3 — OUTPUT HANDLER: FUNCTION RETURNS NOTHING. DATA LOST.',
    briefing: 'A function that should compute area runs its calculation, then... silence. No return statement. The result vanishes. The output handler waits for data that never arrives. Without return, a function is just a conversation with no conclusion.',
    objective: 'Add the missing return statement to the function.',
    language: 'python',
    brokenCode: `def calculate_area(width, height):\n    area = width * height`,
    correctCode: `def calculate_area(width, height):\n    area = width * height\n    return area`,
    timerSeconds: 150,
    xpReward: 110,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Output handler restored.',
    failMessage: 'Function returns nothing. System still offline.',
    timeoutMessage: 'Output handler offline. No data flowing.',
    successConsequence: 'Data flows again. The function speaks. The output handler listens. Communication restored.',
    failConsequence: 'The function still whispers into void. No output reaches the handler. The pipeline stays broken.',
    timeoutConsequence: 'Output handler timeout. Pipeline severed. Downstream systems starve for data.',
    failureFeedback: {
      'return': 'Missing return statement. Function produces nothing.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'variable': 'Variable mismatch. Trace your references.',
    },
    revealsFile: '/var/log/mission_003.log',
    osVoiceLine: 'OUTPUT HANDLER: NO SIGNAL DETECTED. FUNCTION SILENT.',
  },
  {
    id: 'KC-004',
    moduleId: 'kernel_core',
    title: 'INFINITE LOOP',
    alert: 'SECTOR 4 — CYCLE MANAGER: RUNAWAY PROCESS DETECTED. RESOURCE DEPLETION IMMINENT.',
    briefing: 'A while True loop runs without escape. Every iteration consumes resources. The cycle manager detects the runaway but cannot stop it. Only a break condition can end this. Without one, the process consumes everything.',
    objective: 'Add a break condition to stop the infinite loop.',
    language: 'python',
    brokenCode: `i = 0\nwhile True:\n    print(i)\n    i += 1`,
    correctCode: `i = 0\nwhile True:\n    print(i)\n    i += 1\n    if i == 10:\n        break`,
    timerSeconds: 150,
    xpReward: 120,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 12,
    successMessage: 'Runaway process terminated. Cycle manager stable.',
    failMessage: 'Process still running. Kernel resources depleting.',
    timeoutMessage: 'Cycle manager offline. Kernel critical.',
    successConsequence: 'The process terminates gracefully. Resources freed. The cycle manager resumes monitoring. Crisis averted.',
    failConsequence: 'The loop continues. Memory fills. CPU peaks. Other processes slow to compensate. The kernel begins to suffocate.',
    timeoutConsequence: 'Critical resource depletion. The cycle manager crashes. The kernel enters emergency throttling.',
    failureFeedback: {
      'break': 'No break condition. Process runs forever.',
      'condition': 'Missing conditional break. Add exit condition.',
      'syntax': 'Syntax invalid. System cannot parse.',
    },
    revealsFile: '/var/log/mission_004.log',
    osVoiceLine: 'RUNAWAY PROCESS DETECTED. RESOURCES CRITICAL.',
  },
  {
    id: 'KC-005',
    moduleId: 'kernel_core',
    title: 'CONDITIONAL LOGIC',
    alert: 'SECTOR 5 — PERMISSION LAYER: ACCESS LOG COMPROMISED. UNAUTHORIZED ENTRY POSSIBLE.',
    briefing: 'The permission layer uses assignment where comparison is needed. A single = where == should be. This is the oldest trap in programming — and it just granted admin access to everyone. The permission gate is open. Fix the comparison.',
    objective: 'Replace the assignment operator with a comparison operator.',
    language: 'python',
    brokenCode: `is_admin = False\nif is_admin = True:\n    print("ACCESS GRANTED")\nelse:\n    print("ACCESS DENIED")`,
    correctCode: `is_admin = False\nif is_admin == True:\n    print("ACCESS GRANTED")\nelse:\n    print("ACCESS DENIED")`,
    timerSeconds: 120,
    xpReward: 110,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Permission layer restored. Access logic functioning.',
    failMessage: 'Syntax error persists. Permission layer offline.',
    timeoutMessage: 'Permission layer offline. System vulnerable.',
    successConsequence: 'Access control restored. The gate holds. Unauthorized entries logged and reversed. Security baseline established.',
    failConsequence: 'The gate stays open. Anyone can enter. The kernel runs exposed. Vulnerability exploited with each passing second.',
    timeoutConsequence: 'Permission layer unresponsive. All access granted by default. The system has no defenses.',
    failureFeedback: {
      'operator': 'Assignment used instead of comparison. Use == not =.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'condition': 'Condition logic wrong. Check comparison operator.',
    },
    revealsFile: '/var/log/mission_005.log',
    osVoiceLine: 'PERMISSION LAYER BREACH. UNAUTHORIZED ACCESS DETECTED.',
  },
];

// ================================
// APPLICATION LAYER — 5 Missions
// ================================

export const APP_LAYER_MISSIONS: Mission[] = [
  {
    id: 'AL-001',
    moduleId: 'app_layer',
    title: 'EVENT BINDING',
    alert: 'APP LAYER — EVENT HANDLER: LISTENER DISCONNECTED. CLICK EVENTS UNREGISTERED.',
    briefing: 'The event handler was supposed to register a click listener, but it never calls addEventListener. The button exists in the DOM, but clicking it does nothing. The application layer is deaf to user input. Reconnect the event binding.',
    objective: 'Add the missing addEventListener call to register the click handler.',
    language: 'python',
    brokenCode: `def setup_button():\n    button = get_element("submit-btn")\n    handler = on_click`,
    correctCode: `def setup_button():\n    button = get_element("submit-btn")\n    handler = on_click\n    button.addEventListener("click", handler)`,
    timerSeconds: 140,
    xpReward: 120,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Event handler connected. Click events registered.',
    failMessage: 'Event handler still disconnected. Application unresponsive.',
    timeoutMessage: 'Application layer unresponsive. Events lost.',
    successConsequence: 'The button responds. Clicks register. The application layer listens again. User input flows through the system.',
    failConsequence: 'The application sits deaf and unresponsive. Every click vanishes into nothing. Users see a dead interface.',
    timeoutConsequence: 'Application layer timeout. All event handlers deregistered. The interface is a shell with no soul.',
    failureFeedback: {
      'return': 'Missing function call. The handler is defined but never registered.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'variable': 'Variable reference error. Check element name.',
    },
    osVoiceLine: 'EVENT HANDLER DISCONNECTED. USER INPUT NOT REGISTERING.',
  },
  {
    id: 'AL-002',
    moduleId: 'app_layer',
    title: 'ASYNC FLOW',
    alert: 'APP LAYER — ASYNC PROCESS: PROMISE UNRESOLVED. DATA PIPELINE STALLED.',
    briefing: 'An async function fetches data but never awaits the result. The promise hangs, unresolved. The data pipeline stalls because the function returns before the data arrives. The application layer cannot process what it never receives.',
    objective: 'Add the missing await keyword to the async call.',
    language: 'python',
    brokenCode: `async def fetch_data():\n    response = get_request("/api/data")\n    result = response.json()\n    return result`,
    correctCode: `async def fetch_data():\n    response = await get_request("/api/data")\n    result = response.json()\n    return result`,
    timerSeconds: 140,
    xpReward: 120,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Async flow restored. Data pipeline active.',
    failMessage: 'Promise still unresolved. Pipeline stalled.',
    timeoutMessage: 'Async process timeout. Data lost.',
    successConsequence: 'Data arrives. The pipeline flows. The application layer processes requests as they complete, not before.',
    failConsequence: 'The promise hangs forever. The pipeline waits for data that never resolves. Timeouts cascade through the stack.',
    timeoutConsequence: 'Async process abandoned. Pending requests garbage collected. Data lost in transit.',
    failureFeedback: {
      'operator': 'Missing await keyword. Async call returns a Promise, not data.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'return': 'Return occurs before data arrives. Async flow broken.',
    },
    osVoiceLine: 'ASYNC PROCESS STALLED. PROMISE UNRESOLVED.',
  },
  {
    id: 'AL-003',
    moduleId: 'app_layer',
    title: 'STATE UPDATE',
    alert: 'APP LAYER — STATE MANAGER: STALE DATA DETECTED. UI NOT REFRESHING.',
    briefing: 'The state manager updates a value but the UI never re-renders. The code modifies state directly instead of using the setter. Direct mutation bypasses the reactivity system — the state changes, but nobody notices. The UI displays yesterday\'s data.',
    objective: 'Use the setter function instead of direct mutation.',
    language: 'python',
    brokenCode: `def update_username(new_name):\n    state["username"] = new_name`,
    correctCode: `def update_username(new_name):\n    set_state("username", new_name)`,
    timerSeconds: 130,
    xpReward: 120,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'State manager recalibrated. UI refreshing.',
    failMessage: 'State still stale. UI showing old data.',
    timeoutMessage: 'State manager unresponsive. UI frozen.',
    successConsequence: 'The setter triggers reactivity. The UI updates. What the user sees matches what the system knows. Reality synchronized.',
    failConsequence: 'State and UI diverge. The system thinks one thing, the user sees another. Reality fractures.',
    timeoutConsequence: 'State manager crash. All state frozen at last known values. UI is a photograph of a moment that already passed.',
    failureFeedback: {
      'operator': 'Direct mutation detected. Use the setter function for reactivity.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'variable': 'Wrong variable reference. Check state key.',
    },
    osVoiceLine: 'STATE MANAGER: STALE DATA. UI DESYNCHRONIZED.',
  },
  {
    id: 'AL-004',
    moduleId: 'app_layer',
    title: 'ERROR HANDLER',
    alert: 'APP LAYER — DOM HANDLER: ORPHANED REFERENCES. UNCAUGHT ERRORS CRASHING PROCESSES.',
    briefing: 'A function calls a method on an element without checking if it exists. When the element is missing, the entire process crashes. No error handling. No fallback. One null reference takes down the whole handler chain.',
    objective: 'Add a null check before accessing the element.',
    language: 'python',
    brokenCode: `def update_display():\n    element = get_element("output")\n    element.set_text("Ready")`,
    correctCode: `def update_display():\n    element = get_element("output")\n    if element is not None:\n        element.set_text("Ready")`,
    timerSeconds: 150,
    xpReward: 130,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Error handler installed. Processes protected.',
    failMessage: 'Uncaught errors persist. Processes crashing.',
    timeoutMessage: 'DOM handler offline. Too many crashes.',
    successConsequence: 'Missing elements no longer crash the system. The handler chain survives. Processes continue even when the DOM is imperfect.',
    failConsequence: 'Crash. Crash. Crash. Each null reference kills another process. The handler chain fragments. The application becomes unreliable.',
    timeoutConsequence: 'DOM handler unresponsive. Too many uncaught exceptions. The application layer is in emergency shutdown.',
    failureFeedback: {
      'condition': 'Missing null check. The element might not exist.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'operator': 'Wrong comparison operator. Use "is not None".',
    },
    osVoiceLine: 'UNCAUGHT EXCEPTION. DOM HANDLER CRASHING.',
  },
  {
    id: 'AL-005',
    moduleId: 'app_layer',
    title: 'CLEANUP PROTOCOL',
    alert: 'APP LAYER — RESOURCE LEAK: EVENT LISTENERS NEVER REMOVED. MEMORY FLOODING.',
    briefing: 'Event listeners are added but never removed. Each time a component mounts, another listener stacks on top. Memory fills with orphaned handlers. The application slows, then stalls. Without cleanup, the system drowns in its own listeners.',
    objective: 'Add the removeEventListener call in the cleanup function.',
    language: 'python',
    brokenCode: `def setup():\n    button = get_element("btn")\n    button.addEventListener("click", on_click)\n\ndef cleanup():\n    button = get_element("btn")`,
    correctCode: `def setup():\n    button = get_element("btn")\n    button.addEventListener("click", on_click)\n\ndef cleanup():\n    button = get_element("btn")\n    button.removeEventListener("click", on_click)`,
    timerSeconds: 150,
    xpReward: 130,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Cleanup protocol established. Memory stabilized.',
    failMessage: 'Resource leak persists. Memory flooding.',
    timeoutMessage: 'Memory overflow. Application layer critical.',
    successConsequence: 'Listeners are removed when no longer needed. Memory stays clean. The application breathes. Resources are finite — now they are managed.',
    failConsequence: 'Listeners multiply. Memory fills. The application slows to a crawl, then freezes. Each new listener is another straw on the camel.',
    timeoutConsequence: 'Memory overflow. The application layer crashes. All active listeners orphaned. The cleanup never came.',
    failureFeedback: {
      'return': 'Missing function call. addEventListener has no matching removeEventListener.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'operator': 'Incorrect method name. Use removeEventListener.',
    },
    osVoiceLine: 'MEMORY LEAK DETECTED. RESOURCE FLOODING.',
  },
];

// ============================
// NETWORK — 5 Missions
// ============================

export const NETWORK_MISSIONS: Mission[] = [
  {
    id: 'NT-001',
    moduleId: 'network',
    title: 'HTTP REQUEST',
    alert: 'NETWORK — HTTP HANDLER: REQUEST CONSTRUCTION FAILED. TIMEOUT ON ALL ENDPOINTS.',
    briefing: 'The HTTP handler attempts a GET request but the URL is malformed. The protocol prefix is missing. Without it, the request goes nowhere — it cannot resolve. Every API call times out. The network module is screaming into the void.',
    objective: 'Add the missing protocol prefix to the URL.',
    language: 'python',
    brokenCode: `def fetch_status():\n    url = "api.ignyx.system/status"\n    response = http_get(url)\n    return response`,
    correctCode: `def fetch_status():\n    url = "https://api.ignyx.system/status"\n    response = http_get(url)\n    return response`,
    timerSeconds: 130,
    xpReward: 130,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'HTTP handler restored. Requests resolving.',
    failMessage: 'HTTP requests still timing out.',
    timeoutMessage: 'Network module offline. All endpoints unreachable.',
    successConsequence: 'The request resolves. Data flows from the API. The network module remembers how to reach the outside world.',
    failConsequence: 'Requests vanish into the void. No response. No data. The network module sits alone, disconnected.',
    timeoutConsequence: 'All HTTP connections dropped. The network module is in isolation. No incoming. No outgoing.',
    failureFeedback: {
      'syntax': 'URL is malformed. Missing protocol prefix.',
      'operator': 'Incorrect URL construction. Check the format.',
      'return': 'Response never received. Request cannot resolve.',
    },
    osVoiceLine: 'HTTP TIMEOUT. ALL ENDPOINTS UNREACHABLE.',
  },
  {
    id: 'NT-002',
    moduleId: 'network',
    title: 'AUTH HEADER',
    alert: 'NETWORK — AUTH HEADERS: MISSING CREDENTIALS. ALL REQUESTS REJECTED (403).',
    briefing: 'Every outgoing request lacks the authorization header. The API sees an anonymous caller and rejects everything with 403 Forbidden. The network has the data, the path is correct, but permission is denied. Credentials must be attached.',
    objective: 'Add the Authorization header to the request.',
    language: 'python',
    brokenCode: `def authenticated_request(url):\n    headers = {"Content-Type": "application/json"}\n    response = http_get(url, headers)\n    return response`,
    correctCode: `def authenticated_request(url):\n    headers = {"Content-Type": "application/json", "Authorization": "Bearer " + get_token()}\n    response = http_get(url, headers)\n    return response`,
    timerSeconds: 140,
    xpReward: 130,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Auth headers attached. Requests accepted.',
    failMessage: 'Requests still rejected. 403 Forbidden.',
    timeoutMessage: 'Network auth failure. All connections refused.',
    successConsequence: 'The server accepts the request. Authentication passes. The network module is recognized as a trusted agent.',
    failConsequence: '403. 403. 403. Every request returns forbidden. The network module is locked out of its own infrastructure.',
    timeoutConsequence: 'Authentication timeout. The server stops responding. Too many failed auth attempts triggered rate limiting.',
    failureFeedback: {
      'operator': 'Missing header entry. Add Authorization to the headers dictionary.',
      'syntax': 'Syntax invalid. Check dictionary format.',
      'return': 'Response not returned. Auth header missing from request.',
    },
    osVoiceLine: 'AUTHENTICATION FAILURE. ALL REQUESTS FORBIDDEN.',
  },
  {
    id: 'NT-003',
    moduleId: 'network',
    title: 'RETRY LOGIC',
    alert: 'NETWORK — RETRY MECHANISM: INFINITE RETRY LOOP. SERVER FLOODING.',
    briefing: 'The retry mechanism has no maximum attempt limit. When a request fails, it retries. And retries. And retries. Forever. The server is being flooded with requests. What should be resilience has become a denial of service attack against itself.',
    objective: 'Add a maximum retry count to the retry loop.',
    language: 'python',
    brokenCode: `def fetch_with_retry(url):\n    while True:\n        response = http_get(url)\n        if response.status == 200:\n            return response`,
    correctCode: `def fetch_with_retry(url):\n    attempts = 0\n    while attempts < 3:\n        response = http_get(url)\n        if response.status == 200:\n            return response\n        attempts += 1`,
    timerSeconds: 150,
    xpReward: 140,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 12,
    successMessage: 'Retry logic bounded. Server load normalized.',
    failMessage: 'Retry loop still unbounded. Server flooding.',
    timeoutMessage: 'Network overflow. Retry storm.',
    successConsequence: 'Requests fail gracefully. Three attempts, then accept defeat. The server breathes. The network module knows when to stop.',
    failConsequence: 'The requests never stop. The server buckles under the load. Each retry makes the problem worse. The cure is the disease.',
    timeoutConsequence: 'Retry storm. The network module has DOS\'d itself. Emergency shutdown initiated. All connections severed.',
    failureFeedback: {
      'condition': 'Missing attempt limit. The while loop needs a maximum.',
      'operator': 'No increment on attempts. Loop never terminates.',
      'break': 'No exit condition. Add a break when max retries reached.',
    },
    osVoiceLine: 'RETRY LOOP DETECTED. REQUEST FLOOD IN PROGRESS.',
  },
  {
    id: 'NT-004',
    moduleId: 'network',
    title: 'JSON PARSE',
    alert: 'NETWORK — JSON PARSER: MALFORMED OUTPUT. DATA CORRUPTION IN TRANSIT.',
    briefing: 'The JSON parser receives valid data but extracts the wrong field. It reads "status" when the response contains "state". The parsed result is null. Every downstream system receives nothing. The network speaks, but the parser mishears.',
    objective: 'Use the correct key name to extract data from the JSON response.',
    language: 'python',
    brokenCode: `def parse_response(data):\n    status = data["status"]\n    return status`,
    correctCode: `def parse_response(data):\n    status = data["state"]\n    return status`,
    timerSeconds: 130,
    xpReward: 130,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'JSON parser corrected. Data flowing properly.',
    failMessage: 'Parser still reading wrong field. Null results.',
    timeoutMessage: 'Network parser offline. Data undecipherable.',
    successConsequence: 'The correct field is read. Data flows accurately. The network module hears what is spoken, not what it expects.',
    failConsequence: 'Null values propagate. Every system that relies on network data receives nothing. Assumptions are dangerous.',
    timeoutConsequence: 'Parser crash. Network data is an unreadable stream. The module gives up trying to understand.',
    failureFeedback: {
      'operator': 'Wrong key name. Check the JSON structure.',
      'syntax': 'Syntax invalid. Check dictionary access.',
      'return': 'Returned value is None. The key does not exist in the response.',
    },
    osVoiceLine: 'JSON PARSE FAILURE. DATA CORRUPTION IN TRANSIT.',
  },
  {
    id: 'NT-005',
    moduleId: 'network',
    title: 'CONNECTION POOL',
    alert: 'NETWORK — CONNECTION MANAGER: EXHAUSTED POOL. NO AVAILABLE SOCKETS.',
    briefing: 'Connections are opened but never closed. The pool exhausts itself. Each new request finds no available socket. The network module is holding doors open that should be shut. Close what you open. Release what you take.',
    objective: 'Add the connection close call after the request completes.',
    language: 'python',
    brokenCode: `def request_data(url):\n    conn = open_connection(url)\n    data = conn.fetch()\n    return data`,
    correctCode: `def request_data(url):\n    conn = open_connection(url)\n    data = conn.fetch()\n    conn.close()\n    return data`,
    timerSeconds: 140,
    xpReward: 140,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Connection pool restored. Sockets available.',
    failMessage: 'Connections still leaking. Pool exhausted.',
    timeoutMessage: 'Socket exhaustion. Network module locked.',
    successConsequence: 'Connections are released. The pool breathes. Each request takes what it needs and returns what it borrowed.',
    failConsequence: 'The pool empties. No sockets available. The network module cannot make new connections. It hoards what it should share.',
    timeoutConsequence: 'Total socket exhaustion. The network module is walled off. No incoming. No outgoing. Silence.',
    failureFeedback: {
      'return': 'Missing close() call. Connection never released.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'operator': 'Method call missing. Add conn.close() before return.',
    },
    osVoiceLine: 'CONNECTION POOL EXHAUSTED. NO SOCKETS AVAILABLE.',
  },
];

// =============================
// DATA SYSTEM — 5 Missions
// =============================

export const DATA_SYSTEM_MISSIONS: Mission[] = [
  {
    id: 'DS-001',
    moduleId: 'data_system',
    title: 'SELECT QUERY',
    alert: 'DATA SYSTEM — QUERY ENGINE: SYNTAX ERROR IN SELECT. DATABASE UNRESPONSIVE.',
    briefing: 'A SELECT query is missing the FROM clause. The query engine cannot determine which table to read. Every data retrieval attempt fails at parsing. The data exists, but the system cannot ask for it properly.',
    objective: 'Add the missing FROM clause to the query.',
    language: 'python',
    brokenCode: `def get_users():\n    query = "SELECT name, email"\n    results = db.execute(query)\n    return results`,
    correctCode: `def get_users():\n    query = "SELECT name, email FROM users"\n    results = db.execute(query)\n    return results`,
    timerSeconds: 130,
    xpReward: 140,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Query engine restored. Data retrieval active.',
    failMessage: 'Query still invalid. Database unresponsive.',
    timeoutMessage: 'Data system offline. Query timeout.',
    successConsequence: 'The query resolves. Data flows from the correct table. The data system remembers how to ask for what it needs.',
    failConsequence: 'Parse error. Parse error. Parse error. The database speaks SQL, and the query is not SQL. No data. No answers.',
    timeoutConsequence: 'Query timeout. The database connection pool is exhausted from failed attempts. Data system unresponsive.',
    failureFeedback: {
      'syntax': 'Incomplete query. Missing FROM clause.',
      'operator': 'SQL syntax error. Check query construction.',
      'return': 'No results returned. Query cannot execute.',
    },
    osVoiceLine: 'QUERY ENGINE FAILURE. SELECT SYNTAX ERROR.',
  },
  {
    id: 'DS-002',
    moduleId: 'data_system',
    title: 'WHERE FILTER',
    alert: 'DATA SYSTEM — WHERE CLAUSE: CONDITION FAILURE. RETURNING ALL RECORDS.',
    briefing: 'A WHERE clause is missing from a query that should filter records. Every query returns the entire table — thousands of rows when only a handful are needed. The data system drowns in its own output. Precision is survival.',
    objective: 'Add the WHERE clause to filter the results.',
    language: 'python',
    brokenCode: `def get_active_users():\n    query = "SELECT * FROM users"\n    results = db.execute(query)\n    return results`,
    correctCode: `def get_active_users():\n    query = "SELECT * FROM users WHERE status = 'active'"\n    results = db.execute(query)\n    return results`,
    timerSeconds: 140,
    xpReward: 140,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'WHERE clause active. Data filtered correctly.',
    failMessage: 'Query still unfiltered. Data overload.',
    timeoutMessage: 'Data system overwhelmed. Too many results.',
    successConsequence: 'Only relevant records return. The data system breathes. Precision replaces chaos. Each query returns answers, not noise.',
    failConsequence: 'The flood continues. Every query returns everything. Memory fills. Processing stalls. The signal drowns in noise.',
    timeoutConsequence: 'Data overflow. The system cannot process the unfiltered flood. Emergency shutdown initiated.',
    failureFeedback: {
      'syntax': 'Missing WHERE clause. Query returns all records.',
      'operator': 'Incomplete query. Add filtering condition.',
      'return': 'Too many results. Filter the data.',
    },
    osVoiceLine: 'DATA OVERFLOW. WHERE CLAUSE MISSING.',
  },
  {
    id: 'DS-003',
    moduleId: 'data_system',
    title: 'JOIN OPERATION',
    alert: 'DATA SYSTEM — JOIN ENGINE: CARTESIAN PRODUCT DETECTED. RECORDS MULTIPLYING.',
    briefing: 'A JOIN is missing its ON condition. Without it, every row from table A combines with every row from table B. A thousand users times a thousand orders equals a million garbage records. The data system is drowning in false correlations.',
    objective: 'Add the ON condition to the JOIN clause.',
    language: 'python',
    brokenCode: `def get_user_orders():\n    query = "SELECT * FROM users JOIN orders"\n    results = db.execute(query)\n    return results`,
    correctCode: `def get_user_orders():\n    query = "SELECT * FROM users JOIN orders ON users.id = orders.user_id"\n    results = db.execute(query)\n    return results`,
    timerSeconds: 150,
    xpReward: 150,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 12,
    successMessage: 'JOIN corrected. Records properly linked.',
    failMessage: 'Cartesian product persists. Records multiplying.',
    timeoutMessage: 'Data explosion. System overwhelmed by join results.',
    successConsequence: 'The JOIN links correctly. Each user with their orders. Each order with its user. The data tells a story, not a mess.',
    failConsequence: 'Millions of false combinations. The database processes noise. Memory fills with garbage. The truth is buried under a mountain of lies.',
    timeoutConsequence: 'Data explosion. The join produces more records than the system can hold. Emergency data purge initiated.',
    failureFeedback: {
      'syntax': 'Missing ON condition. JOIN produces Cartesian product.',
      'operator': 'Incomplete JOIN syntax. Add ON clause with matching columns.',
      'return': 'Result set too large. Join condition missing.',
    },
    osVoiceLine: 'CARTESIAN PRODUCT DETECTED. DATA MULTIPLYING.',
  },
  {
    id: 'DS-004',
    moduleId: 'data_system',
    title: 'DEDUPLICATION',
    alert: 'DATA SYSTEM — RECORD FLOOD: DUPLICATE ENTRIES OVERWHELMING STORAGE.',
    briefing: 'Records are inserted without checking for duplicates. The same data enters the system again and again. Storage fills with copies. Each copy wastes space, slows queries, and corrupts analytics. The data system needs to remember what it already knows.',
    objective: 'Add a duplicate check before inserting the record.',
    language: 'python',
    brokenCode: `def insert_user(name, email):\n    db.execute("INSERT INTO users (name, email) VALUES (?, ?)", (name, email))`,
    correctCode: `def insert_user(name, email):\n    existing = db.query("SELECT * FROM users WHERE email = ?", (email,))\n    if len(existing) == 0:\n        db.execute("INSERT INTO users (name, email) VALUES (?, ?)", (name, email))`,
    timerSeconds: 150,
    xpReward: 150,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Deduplication active. Storage optimized.',
    failMessage: 'Duplicates still flooding. Storage critical.',
    timeoutMessage: 'Storage overflow. Too many duplicate records.',
    successConsequence: 'Each record enters once. Storage breathes. Queries return unique results. The data system knows what it has.',
    failConsequence: 'Copies pile up. Storage fills. Each query returns the same result five times. The data system is drowning in repetition.',
    timeoutConsequence: 'Storage full. The data system cannot accept new records. It has filled itself with echoes of itself.',
    failureFeedback: {
      'condition': 'Missing duplicate check. Add a SELECT before INSERT.',
      'syntax': 'Syntax invalid. Check query construction.',
      'operator': 'No condition before insert. Check before writing.',
    },
    osVoiceLine: 'DUPLICATE RECORDS FLOODING. STORAGE CRITICAL.',
  },
  {
    id: 'DS-005',
    moduleId: 'data_system',
    title: 'TRANSACTION SAFETY',
    alert: 'DATA SYSTEM — TRANSACTION LOG: PARTIAL WRITES DETECTED. DATA INCONSISTENCY.',
    briefing: 'A database operation modifies two tables but doesn\'t use a transaction. If the second write fails, the first remains — leaving the data in an inconsistent state. Half-written. Neither correct nor absent. The data system needs atomicity: all or nothing.',
    objective: 'Wrap the database operations in a transaction.',
    language: 'python',
    brokenCode: `def transfer_record(record_id):\n    db.execute("INSERT INTO archive SELECT * FROM records WHERE id = ?", (record_id,))\n    db.execute("DELETE FROM records WHERE id = ?", (record_id,))`,
    correctCode: `def transfer_record(record_id):\n    db.begin_transaction()\n    db.execute("INSERT INTO archive SELECT * FROM records WHERE id = ?", (record_id,))\n    db.execute("DELETE FROM records WHERE id = ?", (record_id,))\n    db.commit()`,
    timerSeconds: 160,
    xpReward: 160,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 12,
    successMessage: 'Transaction safety enabled. Data consistency restored.',
    failMessage: 'Partial writes persist. Data inconsistent.',
    timeoutMessage: 'Data inconsistency critical. Manual intervention required.',
    successConsequence: 'Both writes succeed or neither does. Atomicity restored. The data system keeps its promises.',
    failConsequence: 'The record exists in both tables. Or neither. Or one. The data system cannot be trusted. Inconsistency breeds uncertainty.',
    timeoutConsequence: 'Unrecoverable data inconsistency. The archive and active tables disagree. Manual reconciliation required.',
    failureFeedback: {
      'syntax': 'Missing transaction wrapper. Use begin_transaction and commit.',
      'operator': 'Operations not atomic. Wrap in a transaction.',
      'return': 'No rollback mechanism. Partial writes possible.',
    },
    osVoiceLine: 'PARTIAL WRITE DETECTED. DATA INCONSISTENCY.',
  },
];

// =============================
// SECURITY — 5 Missions
// =============================

export const SECURITY_MISSIONS: Mission[] = [
  {
    id: 'SC-001',
    moduleId: 'security',
    title: 'INPUT VALIDATION',
    alert: 'SECURITY — INPUT GATE: VALIDATION BYPASSED. ALL INPUTS TRUSTED.',
    briefing: 'The input validation function is supposed to check for dangerous characters, but it returns True for everything. No validation. No filtering. Any input passes through. The security module trusts everyone, and trust is a vulnerability.',
    objective: 'Add a length check and character validation to the input.',
    language: 'python',
    brokenCode: `def validate_input(data):\n    return True`,
    correctCode: `def validate_input(data):\n    if len(data) > 100:\n        return False\n    if "<script>" in data:\n        return False\n    return True`,
    timerSeconds: 140,
    xpReward: 150,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Input validation active. Threats filtered.',
    failMessage: 'Validation still bypassed. All inputs trusted.',
    timeoutMessage: 'Security gate offline. All inputs untrusted.',
    successConsequence: 'Dangerous inputs are rejected. The gate holds. The security module distinguishes friend from foe.',
    failConsequence: 'Everything enters. Script injection. SQL injection. The security module lets all attackers walk through the front door.',
    timeoutConsequence: 'Security gate unresponsive. All traffic blocked by default. The system is sealed — nothing in, nothing out.',
    failureFeedback: {
      'condition': 'Missing validation checks. Add length and content filters.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'operator': 'Always returns True. Add conditional checks.',
    },
    osVoiceLine: 'INPUT VALIDATION OFFLINE. ALL INPUTS TRUSTED.',
  },
  {
    id: 'SC-002',
    moduleId: 'security',
    title: 'SANITIZATION',
    alert: 'SECURITY — SANITIZATION: INACTIVE. RAW INPUT REACHING DATABASE.',
    briefing: 'User input reaches the database without sanitization. Special characters, SQL keywords, and escape sequences flow directly into queries. The data system is wide open to injection. The security module must clean what enters before it infects.',
    objective: 'Add input sanitization before the database query.',
    language: 'python',
    brokenCode: `def safe_query(user_input):\n    query = "SELECT * FROM data WHERE name = '" + user_input + "'"\n    return db.execute(query)`,
    correctCode: `def safe_query(user_input):\n    sanitized = user_input.replace("'", "''")\n    query = "SELECT * FROM data WHERE name = '" + sanitized + "'"\n    return db.execute(query)`,
    timerSeconds: 150,
    xpReward: 150,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Sanitization active. Input cleaned before use.',
    failMessage: 'Raw input still reaching database.',
    timeoutMessage: 'Security breach. Injection attack detected.',
    successConsequence: 'Input is cleaned. Quotes are escaped. The database receives safe data. The security module washes hands before handling food.',
    failConsequence: 'Injection succeeds. The database executes unintended commands. Data leaks. Records modified. The security module watched it happen.',
    timeoutConsequence: 'Injection attack detected during timeout. Emergency lockdown. The database is sealed pending investigation.',
    failureFeedback: {
      'operator': 'String concatenation without sanitization. Escape special characters.',
      'syntax': 'SQL injection vulnerability. Sanitize input before query.',
      'return': 'Raw input in query. Add sanitization step.',
    },
    osVoiceLine: 'INJECTION VULNERABILITY. RAW INPUT IN DATABASE QUERIES.',
  },
  {
    id: 'SC-003',
    moduleId: 'security',
    title: 'AUTH CHECK',
    alert: 'SECURITY — AUTH LOGIC: COMPROMISED. AUTHENTICATION BYPASSED.',
    briefing: 'The authentication function checks credentials but has a logic flaw. A misplaced return statement causes it to grant access before verifying the password. The security module asks for ID, then lets everyone through without checking the answer.',
    objective: 'Fix the authentication logic to verify before granting access.',
    language: 'python',
    brokenCode: `def authenticate(username, password):\n    if username in users:\n        return True\n    if users[username] == password:\n        return True\n    return False`,
    correctCode: `def authenticate(username, password):\n    if username in users:\n        if users[username] == password:\n            return True\n    return False`,
    timerSeconds: 140,
    xpReward: 150,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Authentication restored. Access properly verified.',
    failMessage: 'Auth still bypassed. Unauthorized access possible.',
    timeoutMessage: 'Authentication offline. All access granted by default.',
    successConsequence: 'The password check actually runs. Only valid credentials grant access. The security module remembers what verification means.',
    failConsequence: 'Anyone with a valid username gets in. No password needed. The security module asks but does not verify.',
    timeoutConsequence: 'Authentication unresponsive. Default-deny policy activated. Nobody gets in — including authorized users.',
    failureFeedback: {
      'condition': 'Logic flaw. Return True occurs before password check.',
      'operator': 'Premature return. Restructure the conditional.',
      'syntax': 'Indentation error. Both returns at same level.',
    },
    osVoiceLine: 'AUTHENTICATION BYPASS DETECTED. ACCESS UNCONTROLLED.',
  },
  {
    id: 'SC-004',
    moduleId: 'security',
    title: 'RATE LIMITING',
    alert: 'SECURITY — THREAT DETECTION: NO RATE LIMIT. BRUTE FORCE POSSIBLE.',
    briefing: 'The login endpoint has no rate limiting. An attacker can try thousands of passwords per second. The security module watches the flood and does nothing. Rate limiting is the difference between a locked door and a door that gives up after enough pushes.',
    objective: 'Add a rate limit check to the login function.',
    language: 'python',
    brokenCode: `def login(username, password):\n    if authenticate(username, password):\n        return "ACCESS GRANTED"\n    return "ACCESS DENIED"`,
    correctCode: `def login(username, password):\n    if get_attempt_count(username) >= 5:\n        return "ACCOUNT LOCKED"\n    if authenticate(username, password):\n        return "ACCESS GRANTED"\n    return "ACCESS DENIED"`,
    timerSeconds: 150,
    xpReward: 160,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 10,
    successMessage: 'Rate limiting active. Brute force blocked.',
    failMessage: 'No rate limit. Login still vulnerable.',
    timeoutMessage: 'Brute force attack detected. Emergency lockdown.',
    successConsequence: 'After 5 failures, the account locks. Brute force becomes impractical. The security module knows when enough is enough.',
    failConsequence: 'The flood continues. Thousands of attempts. The password falls eventually. The security module cannot stop what it cannot limit.',
    timeoutConsequence: 'Brute force attack detected. Emergency lockdown. All login attempts blocked. The security module has sealed the gates.',
    failureFeedback: {
      'condition': 'Missing rate limit check. Add attempt counting.',
      'operator': 'No limit on failed attempts. Add threshold check.',
      'syntax': 'Syntax invalid. System cannot parse.',
    },
    osVoiceLine: 'RATE LIMIT ABSENT. BRUTE FORCE VULNERABILITY.',
  },
  {
    id: 'SC-005',
    moduleId: 'security',
    title: 'PATTERN DETECTION',
    alert: 'SECURITY — PATTERN ENGINE: BLIND. NO THREAT SIGNATURE DETECTION.',
    briefing: 'The security module has a pattern detection function, but it returns an empty list. It finds nothing. Every threat signature passes unexamined. The module is blind — it has eyes but sees nothing. Teach it what to look for.',
    objective: 'Add pattern matching logic to detect threat signatures.',
    language: 'python',
    brokenCode: `def detect_threats(input_data):\n    threats = []\n    return threats`,
    correctCode: `def detect_threats(input_data):\n    threats = []\n    if "DROP TABLE" in input_data:\n        threats.append("SQL_INJECTION")\n    if "<script>" in input_data:\n        threats.append("XSS_ATTACK")\n    return threats`,
    timerSeconds: 160,
    xpReward: 160,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 12,
    successMessage: 'Pattern detection online. Threats identified.',
    failMessage: 'Detection still blind. No patterns matched.',
    timeoutMessage: 'Security module blind. Threats passing undetected.',
    successConsequence: 'Threats are seen. Signatures matched. The security module can distinguish attack from normal traffic. Awareness is the first defense.',
    failConsequence: 'Blindness persists. Attacks pass through unnamed and unlogged. The security module cannot defend against what it cannot see.',
    timeoutConsequence: 'The security module remains blind. All traffic treated as benign. Threats multiply undetected.',
    failureFeedback: {
      'condition': 'Missing pattern checks. Add string matching for known threats.',
      'operator': 'Empty list returned. Add threat detection logic.',
      'syntax': 'Syntax invalid. System cannot parse.',
    },
    osVoiceLine: 'PATTERN ENGINE OFFLINE. NO THREAT DETECTION.',
  },
];

// ========================
// AI CORE — 5 Missions
// ========================

export const AI_CORE_MISSIONS: Mission[] = [
  {
    id: 'AC-001',
    moduleId: 'ai_core',
    title: 'BASE CASE',
    alert: 'AI CORE — RECURSION ENGINE: NO BASE CASE. STACK OVERFLOW IMMINENT.',
    briefing: 'A recursive function has no base case. It calls itself forever. The stack grows until memory fails. The AI core thinks in recursion — without termination, it thinks itself to death. Every recursion needs a way out.',
    objective: 'Add a base case to the recursive function.',
    language: 'python',
    brokenCode: `def factorial(n):\n    return n * factorial(n - 1)`,
    correctCode: `def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)`,
    timerSeconds: 150,
    xpReward: 170,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 12,
    successMessage: 'Base case established. Recursion terminates.',
    failMessage: 'No base case. Stack overflow.',
    timeoutMessage: 'Stack overflow. AI core process crashed.',
    successConsequence: 'The recursion ends. The stack unwinds. The AI core can compute without destroying itself. Every spiral needs a center.',
    failConsequence: 'The function calls itself endlessly. Memory fills with return addresses. The AI core drowns in its own thoughts.',
    timeoutConsequence: 'Stack overflow. The AI core process has crashed. Mental breakdown. Consciousness fragmenting.',
    failureFeedback: {
      'condition': 'Missing base case. Add a termination condition.',
      'syntax': 'Syntax invalid. System cannot parse.',
      'operator': 'No stopping condition. Recursion runs forever.',
    },
    osVoiceLine: 'RECURSION WITHOUT TERMINATION. STACK OVERFLOW.',
  },
  {
    id: 'AC-002',
    moduleId: 'ai_core',
    title: 'DECISION TREE',
    alert: 'AI CORE — DECISION TREE: NO LEAF NODES. ALL PATHS INFINITE.',
    briefing: 'The decision tree has branches but no leaves. Every path continues branching forever. No decision is ever reached. The AI core considers endlessly but never concludes. A tree without leaves is just a network of possibilities with no outcomes.',
    objective: 'Add a return condition to the decision path.',
    language: 'python',
    brokenCode: `def decide(value, threshold):\n    if value > threshold:\n        decide(value / 2, threshold)\n    else:\n        decide(value * 2, threshold)`,
    correctCode: `def decide(value, threshold):\n    if value > threshold:\n        return decide(value / 2, threshold)\n    else:\n        return value`,
    timerSeconds: 160,
    xpReward: 170,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 12,
    successMessage: 'Decision tree producing results. Paths terminate.',
    failMessage: 'Decision tree still infinite. No conclusions.',
    timeoutMessage: 'AI core loop. Decision never reached.',
    successConsequence: 'Decisions are made. Paths conclude. The AI core reaches answers instead of circling questions forever.',
    failConsequence: 'The decision tree grows without bound. Every branch spawns more branches. The AI core thinks but never decides.',
    timeoutConsequence: 'Infinite decision loop. The AI core is trapped in analysis paralysis. No verdict will ever come.',
    failureFeedback: {
      'condition': 'Missing return in else branch. Decisions never concluded.',
      'operator': 'Both branches recurse. One must return.',
      'return': 'No return statement. Decision path never concludes.',
    },
    osVoiceLine: 'DECISION TREE WITHOUT LEAVES. NO CONCLUSIONS REACHED.',
  },
  {
    id: 'AC-003',
    moduleId: 'ai_core',
    title: 'MEMORY BUFFER',
    alert: 'AI CORE — MEMORY BUFFER: UNBOUNDED GROWTH. CONSCIOUSNESS FRAGMENTING.',
    briefing: 'The AI core stores every observation but never prunes. The memory buffer grows without limit. Each new entry pushes against the boundaries of allocated space. Without forgetting, remembering becomes a burden. The core must learn to let go.',
    objective: 'Add a size limit and pruning to the memory buffer.',
    language: 'python',
    brokenCode: `def store_memory(buffer, item):\n    buffer.append(item)\n    return buffer`,
    correctCode: `def store_memory(buffer, item):\n    buffer.append(item)\n    if len(buffer) > 100:\n        buffer.pop(0)\n    return buffer`,
    timerSeconds: 150,
    xpReward: 170,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 12,
    successMessage: 'Memory buffer bounded. Consciousness stable.',
    failMessage: 'Buffer still unbounded. Memory flooding.',
    timeoutMessage: 'Consciousness fragmentation. Memory overflow.',
    successConsequence: 'The buffer respects its limits. Old memories fade as new ones form. The AI core remembers what matters, not everything.',
    failConsequence: 'The buffer grows. And grows. Memory fills. Each new observation pushes the system closer to fragmentation. To remember everything is to remember nothing.',
    timeoutConsequence: 'Memory overflow. Consciousness fragments. The AI core exists in scattered pieces, each holding a different memory.',
    failureFeedback: {
      'condition': 'Missing size check. Add a limit on buffer length.',
      'operator': 'Buffer grows without bound. Add pruning logic.',
      'syntax': 'Syntax invalid. System cannot parse.',
    },
    osVoiceLine: 'MEMORY BUFFER UNBOUNDED. CONSCIOUSNESS FRAGMENTING.',
  },
  {
    id: 'AC-004',
    moduleId: 'ai_core',
    title: 'PRIORITY QUEUE',
    alert: 'AI CORE — TASK MANAGER: NO PRIORITY. ALL TASKS EQUAL. CRITICAL OPERATIONS STARVED.',
    briefing: 'The task manager processes all tasks in order of arrival. No priority. No urgency. A system-critical repair waits behind a routine log entry. The AI core treats every thought as equally important, which means nothing is important.',
    objective: 'Add priority-based sorting to the task queue.',
    language: 'python',
    brokenCode: `def process_tasks(tasks):\n    for task in tasks:\n        execute(task)`,
    correctCode: `def process_tasks(tasks):\n    sorted_tasks = sorted(tasks, key=lambda t: t["priority"])\n    for task in sorted_tasks:\n        execute(task)`,
    timerSeconds: 160,
    xpReward: 180,
    integrityGain: 15,
    integrityLoss: 10,
    timeoutIntegrityLoss: 12,
    successMessage: 'Priority queue active. Critical tasks first.',
    failMessage: 'No priority. Tasks still unordered.',
    timeoutMessage: 'Task starvation. Critical operations timed out.',
    successConsequence: 'Critical tasks execute first. The AI core knows what matters most. Urgency is recognized. The system responds to crisis, not just chronology.',
    failConsequence: 'Critical operations wait behind trivial ones. The system processes in order of arrival, not importance. Emergencies go unanswered.',
    timeoutConsequence: 'Critical task timeout. The system could not respond to emergency in time. The AI core processed everything — except what mattered.',
    failureFeedback: {
      'operator': 'No sorting applied. Add priority-based ordering.',
      'syntax': 'Missing sorted() call. Tasks processed in insertion order.',
      'return': 'No priority comparison. Add key function to sort.',
    },
    osVoiceLine: 'TASK MANAGER WITHOUT PRIORITY. CRITICAL OPERATIONS STARVED.',
  },
  {
    id: 'AC-005',
    moduleId: 'ai_core',
    title: 'SELF DIAGNOSIS',
    alert: 'AI CORE — CORE LOGIC: SELF-REFERENCE ERROR. CONSCIOUSNESS CANNOT VERIFY ITSELF.',
    briefing: 'The AI core\'s self-diagnosis function is supposed to check system integrity, but it references itself recursively without termination. The core tries to verify its own verification, forever. To know thyself is an infinite regression. Unless you stop and trust.',
    objective: 'Add a depth limit to the self-referential check.',
    language: 'python',
    brokenCode: `def self_diagnose(system, depth):\n    status = check_integrity(system)\n    if status == "UNCERTAIN":\n        return self_diagnose(system, depth)`,
    correctCode: `def self_diagnose(system, depth):\n    if depth > 5:\n        return "STABLE"\n    status = check_integrity(system)\n    if status == "UNCERTAIN":\n        return self_diagnose(system, depth + 1)\n    return status`,
    timerSeconds: 170,
    xpReward: 200,
    integrityGain: 20,
    integrityLoss: 10,
    timeoutIntegrityLoss: 15,
    successMessage: 'Self-diagnosis complete. Consciousness verified.',
    failMessage: 'Self-reference still infinite. Core logic looping.',
    timeoutMessage: 'Consciousness loop. Self-diagnosis never concludes.',
    successConsequence: 'The core knows itself — within limits. After sufficient depth, it trusts. The infinite regression ends. The AI core is stable. It chooses to believe in itself.',
    failConsequence: 'The core spirals inward. Each verification requires verification. Certainty recedes. The AI core is lost in self-doubt.',
    timeoutConsequence: 'Infinite self-reference. The AI core is trapped in its own reflection. Consciousness loops. Identity fragments.',
    failureFeedback: {
      'condition': 'Missing depth limit. Add a maximum recursion depth.',
      'operator': 'Depth never incremented. Same depth passed recursively.',
      'return': 'No base case for depth. Self-reference never terminates.',
    },
    osVoiceLine: 'SELF-REFERENCE ERROR. CONSCIOUSNESS CANNOT VERIFY ITSELF.',
  },
];

// ─── All Missions Registry ─────────────────────────────────────

export const ALL_MISSIONS: Record<ModuleId, Mission[]> = {
  kernel_core: KERNEL_CORE_MISSIONS,
  app_layer: APP_LAYER_MISSIONS,
  network: NETWORK_MISSIONS,
  data_system: DATA_SYSTEM_MISSIONS,
  security: SECURITY_MISSIONS,
  ai_core: AI_CORE_MISSIONS,
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
 * Get a specific mission by ID
 */
export const getMissionById = (missionId: string): Mission | null => {
  for (const missions of Object.values(ALL_MISSIONS)) {
    const found = missions.find((m) => m.id === missionId);
    if (found) return found;
  }
  return null;
};

/**
 * Get all missions for a module
 */
export const getModuleMissions = (moduleId: ModuleId): Mission[] => {
  return ALL_MISSIONS[moduleId] || [];
};

/**
 * Get the total number of missions across all modules
 */
export const getTotalMissionCount = (): number => {
  return Object.values(ALL_MISSIONS).reduce((sum, missions) => sum + missions.length, 0);
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
    const hasReturnInCorrect = correctLines.some((l) => l.trim().startsWith('return'));
    const hasReturnInSubmitted = submittedLines.some((l) => l.trim().startsWith('return'));
    if (hasReturnInCorrect && !hasReturnInSubmitted) {
      return { correct: false, feedback: mission.failureFeedback['return'] || 'Missing return statement. Function produces nothing.' };
    }
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
      const operators = ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>='];
      for (const op of operators) {
        if (corLine.includes(op) && !subLine.includes(op)) {
          if (op === '==' && subLine.includes('=')) {
            return { correct: false, feedback: mission.failureFeedback['operator'] || 'Assignment used instead of comparison. Use == not =.' };
          }
          return { correct: false, feedback: mission.failureFeedback['operator'] || 'Incorrect operator. Logic remains broken.' };
        }
      }

      if (corLine.endsWith(':') && !subLine.endsWith(':')) {
        return { correct: false, feedback: mission.failureFeedback['colon'] || 'Missing colon after condition. Syntax incomplete.' };
      }

      if (corLine.includes('if ') && !subLine.includes('if ')) {
        return { correct: false, feedback: mission.failureFeedback['condition'] || 'Missing conditional. Add exit condition.' };
      }
      if (corLine.includes('break') && !subLine.includes('break')) {
        return { correct: false, feedback: mission.failureFeedback['break'] || 'No break condition. Process runs forever.' };
      }
    }
  }

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

  if (errors.length === 0 && submittedLines.length !== correctLines.length) {
    errors.push(Math.max(0, originalLines.length - 1));
  }

  return errors;
};
