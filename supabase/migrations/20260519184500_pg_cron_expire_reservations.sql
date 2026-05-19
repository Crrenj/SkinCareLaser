-- Migration : auto-expiration des réservations via pg_cron
--
-- Étape 1.3/8 du système de réservation.
-- Active l'extension pg_cron et planifie un job qui tourne toutes les
-- 5 minutes pour passer les réservations pending dont le TTL est dépassé
-- en status='expired'.
--
-- Pas de notification au user à l'expiration (MVP). Si besoin plus tard :
-- ajouter un appel HTTP ou pgmq pour notifier.

-- 1. Activer pg_cron (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Fonction d'expiration : passe pending -> expired
--    Retourne le count de lignes modifiées (utile pour debug / monitoring).
--    SECURITY DEFINER + SET search_path pour éviter toute injection.
CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.reservations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Accès très restreint : seulement service_role peut l'appeler manuellement.
-- Le job pg_cron tourne comme postgres (owner) donc bypass les GRANTs.
REVOKE ALL ON FUNCTION public.expire_stale_reservations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_reservations() TO service_role;

COMMENT ON FUNCTION public.expire_stale_reservations IS
  'Passe les réservations pending dont expires_at est dépassé à status=expired. Appelée par pg_cron toutes les 5 min. Retourne le nombre de lignes modifiées.';

-- 3. Schedule via pg_cron : toutes les 5 minutes
--    cron.schedule est idempotent par jobname (UPDATE si existe déjà).
SELECT cron.schedule(
  'expire-stale-reservations',
  '*/5 * * * *',
  $job$ SELECT public.expire_stale_reservations(); $job$
);
