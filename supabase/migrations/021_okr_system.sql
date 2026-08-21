ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS key_results JSONB DEFAULT '[]'::jsonb;
