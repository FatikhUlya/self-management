-- SQL Migration for Life OS Dictionary
-- Run this in your Supabase SQL Editor

-- 1. Create dictionary table
CREATE TABLE IF NOT EXISTS dictionary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  indonesian TEXT NOT NULL,
  translation TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for dictionary queries
CREATE INDEX IF NOT EXISTS idx_dictionary_user ON dictionary(user_id);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE dictionary ENABLE ROW LEVEL SECURITY;

-- 3. Access control policies
DROP POLICY IF EXISTS "dictionary_user_policy" ON dictionary;
CREATE POLICY "dictionary_user_policy" ON dictionary
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
