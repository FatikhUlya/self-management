-- 012_finance_expansion_v2.sql
-- Tahap 2: Manajemen Liabilitas (Utang & Cicilan)

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  monthly_installment DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  due_date TEXT,
  next_due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "debts_user_policy" ON debts;
CREATE POLICY "debts_user_policy" ON debts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
