ALTER TABLE public.ttx_registrations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ttx_registrations FROM anon, authenticated;
GRANT INSERT ON public.ttx_registrations TO anon, authenticated;
GRANT ALL ON public.ttx_registrations TO service_role;