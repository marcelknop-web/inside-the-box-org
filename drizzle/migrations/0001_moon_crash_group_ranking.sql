ALTER TABLE public.moon_crash_sessions ADD COLUMN group_ranking jsonb;
COMMENT ON COLUMN public.moon_crash_sessions.group_ranking IS 'Jointly agreed group ranking entered by the authorized trainer; hidden from participants until reveal.';
GRANT ALL ON public.moon_crash_sessions TO service_role;
REVOKE ALL ON public.moon_crash_sessions FROM anon, authenticated;