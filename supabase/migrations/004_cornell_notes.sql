-- Migration 004: Cornell Notes Support for Learning Sessions
-- Run this in Supabase SQL Editor

-- 1. Add notes_cues to learning_sessions table
ALTER TABLE learning_sessions 
ADD COLUMN IF NOT EXISTS notes_cues TEXT DEFAULT '';

-- 2. Add notes_notes to learning_sessions table
ALTER TABLE learning_sessions 
ADD COLUMN IF NOT EXISTS notes_notes TEXT DEFAULT '';

-- 3. Add notes_summary to learning_sessions table
ALTER TABLE learning_sessions 
ADD COLUMN IF NOT EXISTS notes_summary TEXT DEFAULT '';
