DROP POLICY IF EXISTS "Anyone can register for TTX" ON public.ttx_registrations;

CREATE POLICY "ttx_registrations_public_insert"
ON public.ttx_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (price_cents = 75000);

REVOKE INSERT ON public.ttx_registrations FROM anon, authenticated;
GRANT INSERT (event_date, first_name, last_name, email, company, phone, notes)
  ON public.ttx_registrations TO anon, authenticated;
GRANT ALL ON public.ttx_registrations TO service_role;