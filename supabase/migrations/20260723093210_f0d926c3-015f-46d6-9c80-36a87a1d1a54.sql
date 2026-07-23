
REVOKE EXECUTE ON FUNCTION public.increment_page_visit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_page_visit(text) TO service_role;

-- Explicit deny policies for ai_usage_logs (service_role bypasses RLS)
CREATE POLICY "Deny select to anon" ON public.ai_usage_logs FOR SELECT TO anon USING (false);
CREATE POLICY "Deny select to authenticated" ON public.ai_usage_logs FOR SELECT TO authenticated USING (false);
