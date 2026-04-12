
CREATE TABLE public.ttx_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  notes TEXT,
  price_cents INTEGER NOT NULL DEFAULT 75000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ttx_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register for TTX"
  ON public.ttx_registrations
  FOR INSERT
  WITH CHECK (true);
