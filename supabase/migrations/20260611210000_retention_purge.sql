-- G-2 (rétention des données) — purge automatique des données personnelles
-- périmées (minimisation, droit à l'oubli, Ley 172-13 RD).
--
-- Deux gisements purgés quotidiennement :
--  (a) newsletter_subscribers JAMAIS confirmés dont le token de double opt-in
--      a expiré depuis > 30 jours → inscriptions abandonnées (l'email n'a
--      jamais consenti) : on ne garde aucune trace.
--  (b) contact_messages TERMINÉS (status 'closed' ou 'resolved') de plus de
--      24 mois → tickets de support clos, plus aucune valeur opérationnelle.
--
-- NOTE sur les statuts : la mission évoquait 'closed'/'archived', mais la
-- CHECK réelle de contact_messages.status n'autorise QUE
-- {open, in_progress, resolved, closed} (vérifié en lecture seule). Il n'y a
-- pas de statut 'archived'. On purge donc les DEUX états terminaux
-- ('closed' ET 'resolved') — un ticket résolu non re-rouvert depuis 24 mois
-- est de fait clos. Choix de la fenêtre 24 mois : aligné sur une rétention
-- raisonnable pour du support client (vs 30 jours pour des inscriptions
-- newsletter jamais confirmées, beaucoup plus volatiles).
--
-- Idempotente : OR REPLACE, IF NOT EXISTS, unschedule avant schedule.

-- =====================================================================
-- 1) Fonction de purge — SECURITY DEFINER, service-role only.
--    Ne touche QUE des données sans valeur de rétention. Renvoie le nombre
--    total de lignes supprimées (alimente le heartbeat pour observabilité).
CREATE OR REPLACE FUNCTION public.purge_expired_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_newsletter INT := 0;
  v_messages   INT := 0;
  v_total      INT := 0;
BEGIN
  -- (a) Inscriptions newsletter jamais confirmées, token expiré depuis > 30j.
  --     confirmed_at IS NULL → l'email n'a jamais validé le double opt-in.
  --     token_expires_at < now() - 30j → fenêtre de confirmation largement
  --     dépassée (le lien de confirmation ne marche plus depuis longtemps).
  DELETE FROM public.newsletter_subscribers
  WHERE confirmed_at IS NULL
    AND token_expires_at IS NOT NULL
    AND token_expires_at < (now() - interval '30 days');
  GET DIAGNOSTICS v_newsletter = ROW_COUNT;

  -- (b) Tickets support terminés (clos/résolus) de plus de 24 mois.
  DELETE FROM public.contact_messages
  WHERE status IN ('closed', 'resolved')
    AND created_at < (now() - interval '24 months');
  GET DIAGNOSTICS v_messages = ROW_COUNT;

  v_total := v_newsletter + v_messages;

  -- Heartbeat : trace de la dernière exécution (même pattern que
  -- expire_stale_reservations / migration 20260610190000). Détail dans
  -- last_result pour le debug (newsletter + messages purgés).
  INSERT INTO public.cron_heartbeats (job_name, last_run_at, last_result)
  VALUES (
    'purge-expired-data',
    now(),
    format('newsletter=%s messages=%s', v_newsletter, v_messages)
  )
  ON CONFLICT (job_name) DO UPDATE
    SET last_run_at = EXCLUDED.last_run_at,
        last_result = EXCLUDED.last_result;

  RETURN v_total;
END;
$function$;

-- Service-role only (cohérent avec record_stock_loss / expire_stale_reservations) :
-- aucune raison qu'anon/authenticated puissent déclencher une purge.
-- ⚠️ PUBLIC inclus : sans ça, le GRANT EXECUTE par défaut accordé à PUBLIC
-- laisserait anon exécuter cette fonction SECURITY DEFINER via PostgREST.
REVOKE ALL ON FUNCTION public.purge_expired_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_data() TO service_role;

-- Ligne de heartbeat initiale (évite une fausse alerte avant le 1er run).
INSERT INTO public.cron_heartbeats (job_name, last_result)
VALUES ('purge-expired-data', 'init')
ON CONFLICT (job_name) DO NOTHING;

-- =====================================================================
-- 2) Job pg_cron quotidien — 03:30 UTC (creux de trafic). Idempotent :
--    on déprogramme un job homonyme préexistant avant de (re)programmer,
--    pour ne jamais empiler de doublons sur une réapplication.
DO $$
BEGIN
  PERFORM cron.unschedule('purge-expired-data')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-data');

  PERFORM cron.schedule(
    'purge-expired-data',
    '30 3 * * *',
    $cron$ SELECT public.purge_expired_data(); $cron$
  );
END
$$;
