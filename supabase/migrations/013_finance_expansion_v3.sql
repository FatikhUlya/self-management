-- 013_finance_expansion_v3.sql
-- Tahap 3: Pelacakan Aset & Kekayaan Bersih (Net Worth)

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assets_user_policy" ON assets;
CREATE POLICY "assets_user_policy" ON assets
  FOR ALL USING (auth.uid() = user_id);
