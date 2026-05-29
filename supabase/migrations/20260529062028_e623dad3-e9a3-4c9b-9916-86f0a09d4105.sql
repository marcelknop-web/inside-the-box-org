CREATE TABLE public.compliance_intake_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  tool text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Access only via the edge function using the service role.
GRANT ALL ON public.compliance_intake_drafts TO service_role;

ALTER TABLE public.compliance_intake_drafts ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies for anon/authenticated: drafts are reachable
-- only through the secured edge function (service role) using a code.