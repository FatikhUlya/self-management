-- Add gender and goal columns to health_profiles table
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT 'maintain';
