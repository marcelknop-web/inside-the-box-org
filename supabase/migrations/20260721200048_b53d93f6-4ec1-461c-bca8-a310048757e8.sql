
CREATE TABLE public.page_visits (
  page text PRIMARY KEY,
  count bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.page_visits TO anon, authenticated;
GRANT ALL ON public.page_visits TO service_role;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read page_visits" ON public.page_visits FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.increment_page_visit(p_page text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count bigint;
BEGIN
  INSERT INTO public.page_visits(page, count, updated_at)
  VALUES (p_page, 1, now())
  ON CONFLICT (page) DO UPDATE
    SET count = public.page_visits.count + 1,
        updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_page_visit(text) TO anon, authenticated;

-- Seed with a plausible starting count so day-one visitors don't see "1"
INSERT INTO public.page_visits(page, count) VALUES ('site', 13742)
ON CONFLICT (page) DO NOTHING;
