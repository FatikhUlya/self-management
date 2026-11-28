-- 024: Personal Life Journal features
--   life_goals      : goal library per category; one priority per category per year
--   goal_targets    : cascade of a priority goal into quarter / month / week / day targets
--   wishlist_items  : wishlist & purchase decisions
-- Monthly planner entries reuse the existing tasks table (tasks.due).

CREATE TABLE IF NOT EXISTS life_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'finance','health','career','business','relationship','spiritual','learning','lifestyle'
  )),
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  -- year this goal is the category's priority; NULL = in the library only
  priority_year INT,
  why TEXT DEFAULT '',
  success_metric TEXT DEFAULT '',
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea','active','achieved','dropped')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_life_goals_user ON life_goals(user_id);
-- one priority per category per year
CREATE UNIQUE INDEX IF NOT EXISTS uq_life_goals_priority
  ON life_goals(user_id, category, priority_year) WHERE priority_year IS NOT NULL;

CREATE TABLE IF NOT EXISTS goal_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  life_goal_id UUID NOT NULL REFERENCES life_goals(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('quarter','month','week','day')),
  period_start DATE NOT NULL,            -- first day of the period (week = Monday)
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goal_targets_user ON goal_targets(user_id, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_goal_targets_goal ON goal_targets(life_goal_id);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(14,2) DEFAULT 0,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low','medium','high')),
  store TEXT DEFAULT '',
  benefit TEXT DEFAULT '',
  alternative TEXT DEFAULT '',
  target_date DATE,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','bought','postponed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);

ALTER TABLE life_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS life_goals_owner ON life_goals;
CREATE POLICY life_goals_owner ON life_goals FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS goal_targets_owner ON goal_targets;
CREATE POLICY goal_targets_owner ON goal_targets FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS wishlist_items_owner ON wishlist_items;
CREATE POLICY wishlist_items_owner ON wishlist_items FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
