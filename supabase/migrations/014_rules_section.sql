-- Migration for adding custom sections to self rules
ALTER TABLE self_rules 
ADD COLUMN IF NOT EXISTS section text DEFAULT 'General';
