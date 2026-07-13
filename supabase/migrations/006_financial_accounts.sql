-- Migration to create financial_accounts table for custom wallets/bank accounts
CREATE TABLE IF NOT EXISTS financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_account_name UNIQUE(user_id, name)
);

-- Enable Row Level Security (RLS)
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and create
DROP POLICY IF EXISTS "financial_accounts_user_policy" ON financial_accounts;
CREATE POLICY "financial_accounts_user_policy" ON financial_accounts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
