-- Phase 2 — Décrément / restauration du stock à la vente (statut collected).
-- Le stock n'était JAMAIS décrémenté automatiquement avant. On le fait à la
-- VENTE (collected), pas à la réservation (pending) → cohérent avec le cron
-- d'expiration (qui ne touche que pending) et le cap panier (lit products.stock).
--
-- Deux RPC SECURITY DEFINER, service-role only (appelées par les routes admin /
-- la RPC de vente comptoir), idempotentes via le flag reservations.stock_applied.

-- apply : décrémente le stock une seule fois, quand la résa est collected.
CREATE OR REPLACE FUNCTION public.apply_reservation_collection(p_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_applied int;
BEGIN
  -- Idempotence + verrou atomiques : ne passe qu'une fois (false -> true) et
  -- seulement si la résa est bien collected. Deux appels concurrents : un seul
  -- obtient ROW_COUNT = 1.
  UPDATE public.reservations
     SET stock_applied = true
   WHERE id = p_reservation_id
     AND stock_applied = false
     AND status = 'collected';
  GET DIAGNOSTICS v_applied = ROW_COUNT;
  IF v_applied = 0 THEN
    RETURN;  -- déjà appliqué, ou pas collected
  END IF;

  -- Décrément agrégé. Lignes libres (product_id NULL) ignorées. Produits à
  -- stock illimité (stock NULL) ignorés. Clamp >= 0 (une vente physique ne
  -- doit jamais être bloquée par un stock système faux).
  UPDATE public.products p
     SET stock = GREATEST(p.stock - agg.qty, 0),
         updated_at = now()
    FROM (
      SELECT product_id, SUM(quantity)::int AS qty
        FROM public.reservation_items
       WHERE reservation_id = p_reservation_id
         AND product_id IS NOT NULL
       GROUP BY product_id
    ) agg
   WHERE p.id = agg.product_id
     AND p.stock IS NOT NULL;
END;
$$;

-- restore : re-crédite le stock si une vente collected est annulée/revertie.
CREATE OR REPLACE FUNCTION public.restore_reservation_collection(p_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_restored int;
BEGIN
  UPDATE public.reservations
     SET stock_applied = false
   WHERE id = p_reservation_id
     AND stock_applied = true;
  GET DIAGNOSTICS v_restored = ROW_COUNT;
  IF v_restored = 0 THEN
    RETURN;  -- rien à restaurer
  END IF;

  UPDATE public.products p
     SET stock = COALESCE(p.stock, 0) + agg.qty,
         updated_at = now()
    FROM (
      SELECT product_id, SUM(quantity)::int AS qty
        FROM public.reservation_items
       WHERE reservation_id = p_reservation_id
         AND product_id IS NOT NULL
       GROUP BY product_id
    ) agg
   WHERE p.id = agg.product_id
     AND p.stock IS NOT NULL;
END;
$$;

-- Durcissement (cf. 20260528160000) : service-role uniquement.
REVOKE ALL ON FUNCTION public.apply_reservation_collection(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_reservation_collection(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.apply_reservation_collection(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_reservation_collection(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.restore_reservation_collection(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_reservation_collection(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.restore_reservation_collection(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.restore_reservation_collection(uuid) TO service_role;

COMMENT ON FUNCTION public.apply_reservation_collection(uuid) IS
  'Décrémente products.stock pour les items d''une réservation passée collected (idempotent via stock_applied). Service-role only.';
COMMENT ON FUNCTION public.restore_reservation_collection(uuid) IS
  'Re-crédite products.stock si une réservation collected est annulée/revertie (idempotent via stock_applied). Service-role only.';
