-- Migration 003: Goals Hierarchy Support
-- Run this in Supabase SQL Editor

-- 1. Add goal_id to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- 2. Add goal_id to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_goal ON projects(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks(goal_id);
