REVOKE ALL ON public.compliance_intake_drafts FROM anon, authenticated;
GRANT ALL ON public.compliance_intake_drafts TO service_role;
ALTER TABLE public.compliance_intake_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_intake_drafts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No client access to intake drafts" ON public.compliance_intake_drafts;
CREATE POLICY "No client access to intake drafts"
  ON public.compliance_intake_drafts
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
COMMENT ON TABLE public.compliance_intake_drafts IS 'Draft intake data. Accessible only via the intake-draft edge function (service role) which requires the exact secret draft code. Direct client access is denied by policy and by absent grants.';