const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Self Management', 'src', 'lib', 'hooks', 'useLifeOSState.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update Idea
content = content.replace(
  /(export interface Idea \{[\s\S]*?status: [^;]+;\n)/g,
  '$1  captureType?: string;\n'
);

// 2. Update Project
content = content.replace(
  /(export interface Project \{[\s\S]*?createdAt: string;\n\})/g,
  `export interface Project {
  id: string;
  name: string;
  area: string;
  status: 'active' | 'paused' | 'done';
  goalId?: string;
  objectiveId?: string;
  createdAt: string;
}`
);

// 3. Update Task
const taskReplacement = `export interface Task {
  id: string;
  projectId: string;
  goalId?: string;
  objectiveId?: string;
  title: string;
  description?: string;
  due: string;
  priority: 'Low' | 'Medium' | 'High' | 'P1' | 'P2' | 'P3';
  status: 'todo' | 'doing' | 'done' | 'inbox' | 'planned' | 'today' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  estimatedMinutes?: number;
  definitionOfDone?: string;
  expectedOutput?: string;
  actualOutput?: string;
  energyRequirement?: 'low' | 'medium' | 'high';
  context?: string;
  workCategory?: string;
  completedAt: string;
  googleEventId?: string;
  createdAt: string;
}`;
content = content.replace(/export interface Task \{[\s\S]*?\n\}/g, taskReplacement);

// 4. Update Habit
content = content.replace(
  /(export interface Habit \{[\s\S]*?frequency: [^;]+;\n)/g,
  '$1  isCore?: boolean;\n'
);

// 5. Update Review
content = content.replace(
  /(export interface Review \{[\s\S]*?aiSummary\?: string;\n)/g,
  '$1  mitCompleted?: boolean;\n  outputs?: string;\n  remainingTasks?: string;\n  distraction?: string;\n  tomorrowMit?: string;\n  selfMirror?: any;\n'
);

// 6. Update SelfRule and add new interfaces
const selfRuleReplacement = `export interface SelfRule {
  id: string;
  rule_text: string;
  section?: string;
  orderIndex?: number;
  title?: string;
  category?: string;
  ruleType?: string;
  description?: string;
  reason?: string;
  startTime?: string;
  endTime?: string;
  activeDays?: string[];
  exception?: string;
  severity?: string;
  isActive?: boolean;
  recoveryAction?: string;
  createdAt: string;
}

export interface Objective {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyPlan {
  id: string;
  date: string;
  mitTaskId?: string;
  secondaryTaskIds?: string[];
  dayStatus: 'not_started' | 'in_progress' | 'day_closed';
  dayMode: 'normal' | 'low_energy' | 'sick' | 'emergency';
  morningCheckin?: any;
  dailyReview?: any;
  distractionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  startedAt: string;
  endedAt?: string;
  plannedMinutes: number;
  actualMinutes: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface SleepLog {
  id: string;
  date: string;
  targetSleepTime?: string;
  actualSleepTime?: string;
  actualWakeTime?: string;
  durationMinutes: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleComplianceLog {
  id: string;
  ruleId: string;
  date: string;
  status: 'followed' | 'missed' | 'exempt' | 'not_applicable';
  reason?: string;
  improvement?: string;
  createdAt: string;
}`;
content = content.replace(/export interface SelfRule \{[\s\S]*?\n\}/g, selfRuleReplacement);

// 7. Update LifeOSState
content = content.replace(
  /(export interface LifeOSState \{)/g,
  '$1\n  objectives: Objective[];\n  dailyPlans: DailyPlan[];\n  focusSessions: FocusSession[];\n  sleepLogs: SleepLog[];\n  ruleComplianceLogs: RuleComplianceLog[];'
);

// 8. Update initialDefaultState
content = content.replace(
  /(const initialDefaultState = \(today: string\): LifeOSState => \(\{)/g,
  '$1\n  objectives: [],\n  dailyPlans: [],\n  focusSessions: [],\n  sleepLogs: [],\n  ruleComplianceLogs: [],'
);

// 9. Update LifeOSContextProps
const contextPropsAdditions = `
  // Objectives
  addObjective: (objective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateObjective: (id: string, updates: Partial<Objective>) => Promise<void>;
  deleteObjective: (id: string) => Promise<void>;

  // Daily Plans
  saveDailyPlan: (plan: Omit<DailyPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDailyPlan: (date: string, updates: Partial<DailyPlan>) => Promise<void>;

  // Focus Sessions
  saveFocusSession: (session: Omit<FocusSession, 'id' | 'createdAt'>) => Promise<void>;

  // Sleep Logs
  saveSleepLog: (log: Omit<SleepLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;

  // Rule Compliance Logs
  addRuleComplianceLog: (log: Omit<RuleComplianceLog, 'id' | 'createdAt'>) => Promise<void>;
`;
content = content.replace(
  /(interface LifeOSContextProps \{[\s\S]*?)(  \/\/ Self Awareness Mirror)/g,
  `$1${contextPropsAdditions}\n$2`
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Done updating types!');
