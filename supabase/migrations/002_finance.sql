-- SQL Migration for Life OS Finance Tracker and Task Google Calendar Sync
-- Run this in your Supabase SQL Editor

-- 1. Add google_event_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_event_id TEXT DEFAULT '';

-- 2. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

-- 3. Create financial_goals table
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for goals queries
CREATE INDEX IF NOT EXISTS idx_financial_goals_user ON financial_goals(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- 5. Access control policies
DROP POLICY IF EXISTS "transactions_user_policy" ON transactions;
CREATE POLICY "transactions_user_policy" ON transactions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "financial_goals_user_policy" ON financial_goals;
CREATE POLICY "financial_goals_user_policy" ON financial_goals
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
