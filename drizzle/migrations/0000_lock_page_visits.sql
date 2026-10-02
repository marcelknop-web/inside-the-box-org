DROP POLICY IF EXISTS "public read page_visits" ON public.page_visits;
REVOKE ALL ON public.page_visits FROM anon, authenticated;
GRANT ALL ON public.page_visits TO service_role;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
REVOKE EXECUTE ON FUNCTION public.increment_page_visit(text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.increment_page_visit(text) TO service_role;