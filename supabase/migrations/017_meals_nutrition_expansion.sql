-- Add carbs, fat, portion, and image support to meals table
ALTER TABLE meals ADD COLUMN IF NOT EXISTS carbs INT DEFAULT 0 CHECK (carbs >= 0);
ALTER TABLE meals ADD COLUMN IF NOT EXISTS fat INT DEFAULT 0 CHECK (fat >= 0);
ALTER TABLE meals ADD COLUMN IF NOT EXISTS portion TEXT DEFAULT '';
ALTER TABLE meals ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
