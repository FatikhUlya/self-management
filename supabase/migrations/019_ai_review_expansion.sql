-- Migration: 019_ai_review_expansion.sql
-- Add ai_summary column to reviews table to store AI generated reviews

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ai_summary TEXT DEFAULT '';
