CREATE OR REPLACE FUNCTION public.ttx_enforce_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.price_cents := 75000;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ttx_registrations_enforce_price ON public.ttx_registrations;
CREATE TRIGGER ttx_registrations_enforce_price
BEFORE INSERT ON public.ttx_registrations
FOR EACH ROW EXECUTE FUNCTION public.ttx_enforce_price();

REVOKE INSERT ON public.ttx_registrations FROM anon, authenticated;
GRANT INSERT (event_date, first_name, last_name, email, company, phone, notes) ON public.ttx_registrations TO anon, authenticated;
GRANT ALL ON public.ttx_registrations TO service_role;