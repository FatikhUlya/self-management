-- Migration to add set_type column to workout_sets table for tracking set types (Normal, Warmup, Drop, Failure)
ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS set_type VARCHAR(1) NOT NULL DEFAULT 'N';
