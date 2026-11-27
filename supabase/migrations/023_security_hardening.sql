-- ============================================================
-- 023 — Security hardening
--  1. Enable RLS on public.users (was disabled: any anon-key holder
--     could read, edit or delete every user's profile row).
--  2. Stop anonymous listing of feedback_requests. Public feedback
--     now goes through two SECURITY DEFINER functions that require
--     the exact token and validate every field server-side.
--  3. Pin search_path on SECURITY DEFINER functions.
-- ============================================================

-- 1. USERS ---------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- No DELETE policy: rows are removed via ON DELETE CASCADE from auth.users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. PUBLIC FEEDBACK -----------------------------------------
DROP POLICY IF EXISTS "fr_anon_read_policy" ON public.feedback_requests;
DROP POLICY IF EXISTS "fres_anon_insert_policy" ON public.feedback_responses;
DROP POLICY IF EXISTS "fresdom_anon_insert_policy" ON public.feedback_response_domains;

-- Read one open request by its exact token. Never exposes user_id.
CREATE OR REPLACE FUNCTION public.get_public_feedback_request(p_token TEXT)
RETURNS TABLE (id UUID, title TEXT, privacy_mode TEXT, status TEXT, domains JSONB, deadline DATE)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fr.id, fr.title, fr.privacy_mode, fr.status, fr.domains, fr.deadline
  FROM public.feedback_requests fr
  WHERE fr.token = p_token
    AND length(p_token) BETWEEN 8 AND 128
  LIMIT 1;
$$;

-- Submit a response atomically, with validation.
-- p_domains: [{ "domain_key": text, "rating": 1..5, "strength": text, "growth": text }, ...]
CREATE OR REPLACE FUNCTION public.submit_public_feedback(
  p_token TEXT,
  p_respondent_name TEXT,
  p_domains JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.feedback_requests%ROWTYPE;
  v_response_id UUID := uuid_generate_v4();
  v_item JSONB;
  v_name TEXT := NULLIF(btrim(coalesce(p_respondent_name, '')), '');
BEGIN
  IF p_token IS NULL OR length(p_token) NOT BETWEEN 8 AND 128 THEN
    RAISE EXCEPTION 'invalid_token' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_req FROM public.feedback_requests WHERE token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token' USING ERRCODE = '22023';
  END IF;
  IF v_req.status <> 'open' OR (v_req.deadline IS NOT NULL AND v_req.deadline < current_date) THEN
    RAISE EXCEPTION 'request_closed' USING ERRCODE = '22023';
  END IF;

  IF v_req.privacy_mode = 'required' AND v_name IS NULL THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;
  IF v_req.privacy_mode = 'anonymous' THEN
    v_name := NULL;
  END IF;
  IF v_name IS NOT NULL AND length(v_name) > 120 THEN
    RAISE EXCEPTION 'name_too_long' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_domains) <> 'array'
     OR jsonb_array_length(p_domains) = 0
     OR jsonb_array_length(p_domains) > 20 THEN
    RAISE EXCEPTION 'invalid_payload' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.feedback_responses (id, request_id, respondent_name, status)
  VALUES (v_response_id, v_req.id, v_name, 'submitted');

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_domains) LOOP
    IF NOT (v_req.domains ? (v_item->>'domain_key'))
       OR (v_item->>'rating') !~ '^[1-5]$'
       OR length(coalesce(v_item->>'strength', '')) > 2000
       OR length(coalesce(v_item->>'growth', '')) > 2000 THEN
      RAISE EXCEPTION 'invalid_payload' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.feedback_response_domains
      (response_id, domain_key, rating, strength_observation, growth_observation)
    VALUES (
      v_response_id,
      v_item->>'domain_key',
      (v_item->>'rating')::INT,
      coalesce(v_item->>'strength', ''),
      coalesce(v_item->>'growth', '')
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_feedback_request(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_feedback(TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_feedback_request(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_feedback(TEXT, TEXT, JSONB) TO anon, authenticated;
