CREATE OR REPLACE FUNCTION public.moon_crash_trainer_action(p_session uuid, p_hash text, p_ranking jsonb DEFAULT NULL, p_reveal boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.moon_crash_sessions; n integer;
BEGIN
  SELECT * INTO s FROM public.moon_crash_sessions WHERE id = p_session FOR UPDATE;
  IF NOT FOUND OR s.trainer_hash <> p_hash OR s.revealed THEN RETURN false; END IF;
  IF p_ranking IS NOT NULL THEN
    IF jsonb_typeof(p_ranking) <> 'array' THEN RETURN false; END IF;
    IF jsonb_array_length(p_ranking) <> 15 THEN RETURN false; END IF;
    SELECT count(DISTINCT v) INTO n FROM jsonb_array_elements_text(p_ranking) AS t(v) WHERE v ~ '^([1-9]|1[0-5])$';
    IF n <> 15 THEN RETURN false; END IF;
    UPDATE public.moon_crash_sessions SET group_ranking = p_ranking WHERE id = p_session;
  END IF;
  IF p_reveal THEN
    IF NOT EXISTS (SELECT 1 FROM public.moon_crash_participants WHERE session_id = p_session AND submitted_at IS NOT NULL) THEN RETURN false; END IF;
    UPDATE public.moon_crash_sessions SET revealed = true WHERE id = p_session;
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.moon_crash_trainer_action(uuid, text, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moon_crash_trainer_action(uuid, text, jsonb, boolean) TO service_role;