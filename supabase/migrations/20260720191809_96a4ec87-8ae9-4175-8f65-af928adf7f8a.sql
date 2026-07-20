
CREATE TABLE public.ai_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name text NOT NULL,
  model text NOT NULL,
  status integer NOT NULL DEFAULT 200,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  duration_ms integer NOT NULL DEFAULT 0,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_usage_logs TO service_role;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX ai_usage_logs_created_at_idx ON public.ai_usage_logs (created_at DESC);
CREATE INDEX ai_usage_logs_fn_model_idx ON public.ai_usage_logs (function_name, model, created_at DESC);
