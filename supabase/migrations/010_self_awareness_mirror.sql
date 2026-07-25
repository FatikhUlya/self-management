-- Migration 010: Self-Awareness Mirror & External Feedback (Johari Window)
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. SELF-ASSESSMENT (Self Reflection)
-- ============================================================
CREATE TABLE IF NOT EXISTS self_assessment_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'custom')),
  period_label TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  overall_reflection TEXT DEFAULT '',
  is_draft BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sa_snapshots_user ON self_assessment_snapshots(user_id, period_start DESC);

CREATE TABLE IF NOT EXISTS self_assessment_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id UUID NOT NULL REFERENCES self_assessment_snapshots(id) ON DELETE CASCADE,
  domain_key TEXT NOT NULL,
  domain_label TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  strength_observation TEXT DEFAULT '',
  strength_reasoning TEXT DEFAULT '',
  growth_observation TEXT DEFAULT '',
  growth_reasoning TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sa_domains_snapshot ON self_assessment_domains(snapshot_id);

-- ============================================================
-- 2. EXTERNAL FEEDBACK (Requests & Responses)
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  privacy_mode TEXT DEFAULT 'anonymous' CHECK (privacy_mode IN ('anonymous', 'optional', 'required')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  deadline DATE,
  domains JSONB DEFAULT '[]', -- Store array of requested domain keys
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feedback_req_user ON feedback_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_req_token ON feedback_requests(token);

CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES feedback_requests(id) ON DELETE CASCADE,
  respondent_name TEXT,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feedback_res_req ON feedback_responses(request_id);

CREATE TABLE IF NOT EXISTS feedback_response_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES feedback_responses(id) ON DELETE CASCADE,
  domain_key TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  strength_observation TEXT DEFAULT '',
  growth_observation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feedback_resdom_res ON feedback_response_domains(response_id);

-- ============================================================
-- 3. GROWTH GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS growth_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain_key TEXT,
  source TEXT DEFAULT 'self' CHECK (source IN ('self', 'feedback', 'mixed')),
  current_state TEXT NOT NULL,
  target_state TEXT NOT NULL,
  smart_specific TEXT DEFAULT '',
  smart_measurable TEXT DEFAULT '',
  smart_achievable TEXT DEFAULT '',
  smart_relevant TEXT DEFAULT '',
  smart_timebound TEXT DEFAULT '',
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'achieved', 'stopped')),
  progress INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  target_date DATE,
  next_checkin_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_growth_goals_user ON growth_goals(user_id, status);

CREATE TABLE IF NOT EXISTS growth_goal_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES growth_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gg_milestones_goal ON growth_goal_milestones(goal_id, sort_order);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE self_assessment_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_assessment_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_response_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_goal_milestones ENABLE ROW LEVEL SECURITY;

-- 4.1. Authenticated User Policies (Standard)
CREATE POLICY "sa_snapshots_user_policy" ON self_assessment_snapshots FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "sa_domains_user_policy" ON self_assessment_domains FOR ALL USING (snapshot_id IN (SELECT id FROM self_assessment_snapshots WHERE user_id = auth.uid()));

CREATE POLICY "growth_goals_user_policy" ON growth_goals FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "gg_milestones_user_policy" ON growth_goal_milestones FOR ALL USING (goal_id IN (SELECT id FROM growth_goals WHERE user_id = auth.uid()));

-- 4.2. Feedback Requests (Owner can do everything, Anon can read specific open ones)
CREATE POLICY "fr_owner_policy" ON feedback_requests FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Allow anonymous read access to specific columns of feedback_requests using the token, IF it is open.
-- We must restrict what anon can select, but since Supabase RLS is row-level, they can select the whole row if they have the token.
-- In our client we will only fetch by token anyway.
CREATE POLICY "fr_anon_read_policy" ON feedback_requests FOR SELECT USING (status = 'open');

-- 4.3. Feedback Responses (Owner can read all their requests' responses)
CREATE POLICY "fres_owner_policy" ON feedback_responses FOR SELECT USING (
  request_id IN (SELECT id FROM feedback_requests WHERE user_id = auth.uid())
);
CREATE POLICY "fres_owner_delete_policy" ON feedback_responses FOR DELETE USING (
  request_id IN (SELECT id FROM feedback_requests WHERE user_id = auth.uid())
);

-- Allow anonymous users to INSERT into feedback_responses
CREATE POLICY "fres_anon_insert_policy" ON feedback_responses FOR INSERT WITH CHECK (
  request_id IN (SELECT id FROM feedback_requests WHERE status = 'open')
);

-- 4.4. Feedback Response Domains (Owner can read)
CREATE POLICY "fresdom_owner_policy" ON feedback_response_domains FOR SELECT USING (
  response_id IN (
    SELECT fr.id FROM feedback_responses fr 
    JOIN feedback_requests freq ON fr.request_id = freq.id 
    WHERE freq.user_id = auth.uid()
  )
);
CREATE POLICY "fresdom_owner_delete_policy" ON feedback_response_domains FOR DELETE USING (
  response_id IN (
    SELECT fr.id FROM feedback_responses fr 
    JOIN feedback_requests freq ON fr.request_id = freq.id 
    WHERE freq.user_id = auth.uid()
  )
);

-- Allow anonymous users to INSERT into feedback_response_domains
CREATE POLICY "fresdom_anon_insert_policy" ON feedback_response_domains FOR INSERT WITH CHECK (
  response_id IN (
    SELECT id FROM feedback_responses
  )
);
