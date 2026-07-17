-- Migration: Create learning_schedules table
CREATE TABLE IF NOT EXISTS learning_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mon TEXT DEFAULT '',
  tue TEXT DEFAULT '',
  wed TEXT DEFAULT '',
  thu TEXT DEFAULT '',
  fri TEXT DEFAULT '',
  sat TEXT DEFAULT '',
  sun TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE learning_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_schedules_user_policy" ON learning_schedules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
