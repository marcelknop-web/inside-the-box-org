CREATE OR REPLACE FUNCTION public.ttx_enforce_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.price_cents := 75000;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ttx_enforce_price() FROM PUBLIC, anon, authenticated;