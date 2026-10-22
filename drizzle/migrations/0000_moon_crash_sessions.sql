CREATE TABLE public.moon_crash_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text UNIQUE NOT NULL,
 trainer_hash text NOT NULL,
 title text NOT NULL,
 revealed boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.moon_crash_sessions TO service_role;
ALTER TABLE public.moon_crash_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access" ON public.moon_crash_sessions FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE TABLE public.moon_crash_participants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 session_id uuid NOT NULL REFERENCES public.moon_crash_sessions(id) ON DELETE CASCADE,
 slot integer NOT NULL CHECK (slot BETWEEN 1 AND 15),
 name text NOT NULL,
 token_hash text,
 ranking jsonb,
 submitted_at timestamptz,
 UNIQUE(session_id, slot)
);
GRANT ALL ON public.moon_crash_participants TO service_role;
ALTER TABLE public.moon_crash_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access" ON public.moon_crash_participants FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE FUNCTION public.moon_crash_claim(p_session uuid, p_slot integer, p_hash text) RETURNS boolean LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 PERFORM 1 FROM public.moon_crash_sessions WHERE id=p_session AND NOT revealed FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.moon_crash_participants SET token_hash=p_hash WHERE session_id=p_session AND slot=p_slot AND token_hash IS NULL;
 RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.moon_crash_claim(uuid,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moon_crash_claim(uuid,integer,text) TO service_role;
CREATE FUNCTION public.moon_crash_submit(p_session uuid, p_slot integer, p_hash text, p_ranking jsonb) RETURNS boolean LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 PERFORM 1 FROM public.moon_crash_sessions WHERE id=p_session AND NOT revealed FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.moon_crash_participants SET ranking=p_ranking, submitted_at=now() WHERE session_id=p_session AND slot=p_slot AND token_hash=p_hash;
 RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.moon_crash_submit(uuid,integer,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moon_crash_submit(uuid,integer,text,jsonb) TO service_role;