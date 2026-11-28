-- 026: Links between journal features + the last three paper sheets
--   * goal_targets.task_id   : a day target turned into a task stays in sync with it
--   * life_records kinds     : profile (sheet 01), milestone (sheet 09), reading (sheet 27)
-- Run after 024 and 025.

ALTER TABLE goal_targets ADD COLUMN IF NOT EXISTS task_id TEXT;
CREATE INDEX IF NOT EXISTS idx_goal_targets_task ON goal_targets(task_id) WHERE task_id IS NOT NULL;

ALTER TABLE life_records DROP CONSTRAINT IF EXISTS life_records_kind_check;
ALTER TABLE life_records ADD CONSTRAINT life_records_kind_check CHECK (kind IN (
  'decision','lesson','body','career','site_visit','case_study','meeting','period_review','daily',
  'profile','milestone','reading'
));
