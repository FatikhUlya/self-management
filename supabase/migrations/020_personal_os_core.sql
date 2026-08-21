-- Migration 020: Personal Operating System Core
-- ADDITIVE ONLY — no DROP, no data loss.

-- ============================================================
-- 1. OBJECTIVES (layer between Goals and Projects)
-- ============================================================
CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  progress INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_objectives_user ON objectives(user_id);
CREATE INDEX IF NOT EXISTS idx_objectives_goal ON objectives(goal_id);

ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "objectives_user_policy" ON objectives;
CREATE POLICY "objectives_user_policy" ON objectives
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 2. EXTEND TASKS — new fields for Personal OS
-- ============================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes INT DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS definition_of_done TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS expected_output TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_output TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS energy_requirement TEXT DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_category TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL;

-- Widen status constraint to support new statuses (backward compatible)
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo', 'doing', 'done', 'inbox', 'planned', 'today', 'in_progress', 'blocked', 'completed', 'cancelled'));

-- Widen priority constraint to support P1/P2/P3 alongside old values
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
  CHECK (priority IN ('Low', 'Medium', 'High', 'P1', 'P2', 'P3'));

-- Index for objective lookups
CREATE INDEX IF NOT EXISTS idx_tasks_objective ON tasks(objective_id);

-- ============================================================
-- 3. EXTEND PROJECTS — link to objectives
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_objective ON projects(objective_id);

-- ============================================================
-- 4. DAILY PLANS (MIT, day status, morning check-in, daily review)
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mit_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  secondary_task_ids JSONB DEFAULT '[]',
  day_status TEXT DEFAULT 'not_started' CHECK (day_status IN ('not_started', 'in_progress', 'day_closed')),
  day_mode TEXT DEFAULT 'normal' CHECK (day_mode IN ('normal', 'low_energy', 'sick', 'emergency')),
  morning_checkin JSONB DEFAULT NULL,
  daily_review JSONB DEFAULT NULL,
  distraction_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans(user_id, date DESC);

ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_plans_user_policy" ON daily_plans;
CREATE POLICY "daily_plans_user_policy" ON daily_plans
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. FOCUS SESSIONS (deep work tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  planned_minutes INT DEFAULT 25,
  actual_minutes INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id, started_at DESC);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "focus_sessions_user_policy" ON focus_sessions;
CREATE POLICY "focus_sessions_user_policy" ON focus_sessions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 6. SLEEP LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  target_sleep_time TIME,
  actual_sleep_time TIME,
  actual_wake_time TIME,
  duration_minutes INT DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date DESC);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sleep_logs_user_policy" ON sleep_logs;
CREATE POLICY "sleep_logs_user_policy" ON sleep_logs
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 7. EXTEND SELF_RULES — full Rule Engine
-- ============================================================
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS rule_type TEXT DEFAULT 'must';
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS reason TEXT DEFAULT '';
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS active_days JSONB DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]';
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS exception TEXT DEFAULT '';
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE self_rules ADD COLUMN IF NOT EXISTS recovery_action TEXT DEFAULT '';

-- ============================================================
-- 8. RULE COMPLIANCE LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS rule_compliance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES self_rules(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('followed', 'missed', 'exempt', 'not_applicable')),
  reason TEXT DEFAULT '',
  improvement TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rule_compliance_user_date ON rule_compliance_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_rule_compliance_rule ON rule_compliance_logs(rule_id, date DESC);

ALTER TABLE rule_compliance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rule_compliance_logs_user_policy" ON rule_compliance_logs;
CREATE POLICY "rule_compliance_logs_user_policy" ON rule_compliance_logs
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 9. EXTEND IDEAS — capture types
-- ============================================================
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS capture_type TEXT DEFAULT 'idea';

-- ============================================================
-- 10. EXTEND HABITS — core flag
-- ============================================================
ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_core BOOLEAN DEFAULT false;

-- ============================================================
-- 11. EXTEND REVIEWS — daily review fields
-- ============================================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS mit_completed BOOLEAN;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS outputs TEXT DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS remaining_tasks TEXT DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS distraction TEXT DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tomorrow_mit TEXT DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS self_mirror JSONB DEFAULT '{}';
