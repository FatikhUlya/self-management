-- Migration 011: Finance Expansion (Budgets, Recurring Transactions, Goal Links)
-- Run this in Supabase SQL Editor

-- 1. Transactions Expansion
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurring_interval TEXT DEFAULT 'none' CHECK (recurring_interval IN ('none', 'daily', 'weekly', 'monthly', 'yearly'));

-- 2. Budgets Entity
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  period TEXT DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_category_budget UNIQUE(user_id, category, period)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "budgets_user_policy" ON budgets;
CREATE POLICY "budgets_user_policy" ON budgets FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Financial Goals Expansion
ALTER TABLE financial_goals 
  ADD COLUMN IF NOT EXISTS linked_account_name TEXT DEFAULT '';
