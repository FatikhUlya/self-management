import re
import sys

with open(r'c:\Self Management\src\lib\hooks\useLifeOSState.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Idea
content = re.sub(
    r'(export interface Idea \{[^}]*?status: [^;]+;\n)',
    r'\1  captureType?: string;\n',
    content
)

# 2. Update Project
content = re.sub(
    r'(export interface Project \{[^}]*?createdAt: string;\n\})',
    r'export interface Project {\n  id: string;\n  name: string;\n  area: string;\n  status: \'active\' | \'paused\' | \'done\';\n  goalId?: string;\n  objectiveId?: string;\n  createdAt: string;\n}',
    content
)

# 3. Update Task
task_replacement = """export interface Task {
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
}"""
content = re.sub(r'export interface Task \{[^}]*?\n\}', task_replacement, content)

# 4. Update Habit
content = re.sub(
    r'(export interface Habit \{[^}]*?frequency: [^;]+;\n)',
    r'\1  isCore?: boolean;\n',
    content
)

# 5. Update Review
content = re.sub(
    r'(export interface Review \{[^}]*?aiSummary\?: string;\n)',
    r'\1  mitCompleted?: boolean;\n  outputs?: string;\n  remainingTasks?: string;\n  distraction?: string;\n  tomorrowMit?: string;\n  selfMirror?: any;\n',
    content
)

# 6. Update SelfRule and add new interfaces
self_rule_replacement = """export interface SelfRule {
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
}"""
content = re.sub(r'export interface SelfRule \{[^}]*?\n\}', self_rule_replacement, content)

# 7. Update LifeOSState
content = re.sub(
    r'(export interface LifeOSState \{)',
    r'\1\n  objectives: Objective[];\n  dailyPlans: DailyPlan[];\n  focusSessions: FocusSession[];\n  sleepLogs: SleepLog[];\n  ruleComplianceLogs: RuleComplianceLog[];',
    content
)

# 8. Update initialDefaultState
content = re.sub(
    r'(const initialDefaultState = \(today: string\): LifeOSState => \(\{)',
    r'\1\n  objectives: [],\n  dailyPlans: [],\n  focusSessions: [],\n  sleepLogs: [],\n  ruleComplianceLogs: [],',
    content
)

# 9. Update LifeOSContextProps
context_props_additions = """
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
"""
content = re.sub(
    r'(interface LifeOSContextProps \{[^}]*?)(  // Self Awareness Mirror)',
    r'\1' + context_props_additions + r'\n\2',
    content
)

with open(r'c:\Self Management\src\lib\hooks\useLifeOSState.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating types!")
