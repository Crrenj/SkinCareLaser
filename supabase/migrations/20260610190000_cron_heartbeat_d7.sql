-- G-4a + D-7 (plan de remédiation 2026-06-10) :
-- heartbeat du cron expire-stale-reservations + cadence */5 → */15.
--
-- Problème : le job pg_cron échoue EN SILENCE (aucune trace exploitable) →
-- des réservations pending ne s'expirent plus sans que personne ne le voie.
-- 1) Table de heartbeat (service-role only) : chaque exécution upsert sa
--    ligne → l'endpoint /api/health détecte une non-exécution (> 35 min).
-- 2) expire_stale_reservations enregistre le heartbeat à chaque run.
-- 3) D-7 : cadence */15 (TTL des réservations en heures, granularité 15 min
--    largement suffisante ; 3× moins de réveils).

CREATE TABLE IF NOT EXISTS public.cron_heartbeats (
  job_name    text PRIMARY KEY,
  last_run_at timestamptz NOT NULL DEFAULT now(),
  last_result text
);

-- Service-role only : RLS sans policy + revoke explicite des rôles API
-- (même pattern accepté que admin_users / rate_limit_buckets — l'advisor
-- INFO rls_enabled_no_policy est assumé).
ALTER TABLE public.cron_heartbeats ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cron_heartbeats FROM anon, authenticated;

-- Ligne initiale pour que /api/health ne parte pas en alerte avant le 1er run.
INSERT INTO public.cron_heartbeats (job_name, last_result)
VALUES ('expire-stale-reservations', 'init')
ON CONFLICT (job_name) DO NOTHING;

-- CREATE OR REPLACE conserve owner + grants existants (hardening 20260528160000).
CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.reservations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Heartbeat : trace de la dernière exécution (lue par /api/health).
  INSERT INTO public.cron_heartbeats (job_name, last_run_at, last_result)
  VALUES ('expire-stale-reservations', now(), v_count::text)
  ON CONFLICT (job_name) DO UPDATE
    SET last_run_at = EXCLUDED.last_run_at,
        last_result = EXCLUDED.last_result;

  RETURN v_count;
END;
$function$;

-- D-7 : nouvelle cadence (idempotent — alter_job re-applique la même valeur).
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'expire-stale-reservations'),
  schedule := '*/15 * * * *'
);
