-- 025: Journal notebooks & daily checks (Personal Life Journal, phase 2 + 3)
-- One flexible table for the structured notebooks. `kind` decides the form:
--   decision        sheet 04  Decision log
--   lesson          sheet 15  Lessons learned & debrief
--   body            sheet 17  Body progress (measurements, photo)
--   career          sheet 20  Career roadmap milestones
--   site_visit      sheet 22  Work & site visit notes
--   case_study      sheet 23  Portfolio case study
--   meeting         sheet 24  Meeting & feedback notes
--   period_review   sheets 03 + 12  Monthly (stop/continue/start) and quarterly evaluation
--   daily           sheets 07, 10, 14, 18  Water, five daily prayers, energy drains, stress triggers
-- Form fields live in `data` (JSONB); the app defines them in src/lib/recordKinds.ts.

CREATE TABLE IF NOT EXISTS life_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'decision','lesson','body','career','site_visit','case_study','meeting','period_review','daily'
  )),
  date DATE,
  title TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_life_records_user_kind ON life_records(user_id, kind, date);

ALTER TABLE life_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS life_records_owner ON life_records;
CREATE POLICY life_records_owner ON life_records FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
