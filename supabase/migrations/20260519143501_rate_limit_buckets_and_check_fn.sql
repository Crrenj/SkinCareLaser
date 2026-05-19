-- Migration : rate limiting Postgres-native pour /api/contact (et autres)
--
-- Approche fixed-window : table rate_limit_buckets indexée par clé
-- (typiquement "endpoint:ip" ou "endpoint:user_id"), RPC check_rate_limit
-- qui incrémente le compteur, rotate la fenêtre si expirée, et retourne
-- (allowed, retry_after_seconds). Service-role only (RLS active sans policy).

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key          TEXT PRIMARY KEY,
  count        INT NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.rate_limit_buckets IS
  'Buckets de rate limiting (fixed window). Accessible uniquement service_role.';

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key        TEXT,
  p_max        INT,
  p_window_sec INT
) RETURNS TABLE(allowed BOOLEAN, retry_after INT) AS $$
DECLARE
  v_now          TIMESTAMPTZ := NOW();
  v_count        INT;
  v_window_start TIMESTAMPTZ;
  v_window_iv    INTERVAL    := (p_window_sec || ' seconds')::INTERVAL;
BEGIN
  INSERT INTO public.rate_limit_buckets (key, count, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN public.rate_limit_buckets.window_start + v_window_iv < v_now THEN 1
      ELSE public.rate_limit_buckets.count + 1
    END,
    window_start = CASE
      WHEN public.rate_limit_buckets.window_start + v_window_iv < v_now THEN v_now
      ELSE public.rate_limit_buckets.window_start
    END
  RETURNING public.rate_limit_buckets.count, public.rate_limit_buckets.window_start
  INTO v_count, v_window_start;

  -- Cleanup probabiliste (1% des appels) : supprime les buckets
  -- expirés depuis > 1h pour empêcher la table de gonfler.
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limit_buckets
    WHERE window_start + INTERVAL '1 hour' < v_now;
  END IF;

  allowed := v_count <= p_max;
  retry_after := GREATEST(0,
    EXTRACT(EPOCH FROM (v_window_start + v_window_iv - v_now))::INT
  );
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT) TO service_role;
