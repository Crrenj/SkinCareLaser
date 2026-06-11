-- P-FLEX volet 1 (Phase 9, décision produit 2026-06-10) — tarif préférentiel
-- sur réservation EN LIGNE : l'admin peut ajuster le prix d'une ligne d'une
-- réservation pending/confirmed (client fidèle) sans annuler/recréer.
--
-- 🔒 INVARIANT prix : effective_price = AFFICHAGE/défaut ;
-- reservation_items.unit_price = prix FACTURÉ (la compta lit unit_price).
-- Cette RPC modifie le prix FACTURÉ avant la collecte — JAMAIS après :
--   - statut ∈ {pending, confirmed} UNIQUEMENT — jamais collected (vente déjà
--     comptabilisée → désync des livres), ni expired/cancelled ;
--   - recalcul de reservations.total_price dans la MÊME transaction (jamais
--     de désync ligne/total) ;
--   - verrou FOR UPDATE sur la réservation (sérialise vs collecte concurrente) ;
--   - p_reservation_id exigé ET vérifié (anti-confusion d'item entre
--     réservations — l'appelant déclare la réservation qu'il croit éditer) ;
--   - service-role ONLY (admin via /api/admin/reservations, audit high-impact
--     côté route) — jamais exposée à anon/authenticated.

CREATE OR REPLACE FUNCTION public.set_reservation_item_price(
  p_reservation_id uuid,
  p_item_id        uuid,
  p_unit_price     numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_item      reservation_items%ROWTYPE;
  v_res       reservations%ROWTYPE;
  v_old_price numeric;
  v_old_total numeric;
  v_new_total numeric;
BEGIN
  -- Garde-fou montant (même plafond anti-overflow que record_stock_loss).
  IF p_unit_price IS NULL OR p_unit_price < 0 OR p_unit_price > 100000000 THEN
    RAISE EXCEPTION 'invalid_price';
  END IF;

  -- Verrou sur la réservation D'ABORD (sérialise les éditions concurrentes et
  -- surtout une collecte simultanée qui passerait le statut à collected).
  SELECT * INTO v_res FROM reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'reservation_not_found';
  END IF;

  SELECT * INTO v_item FROM reservation_items WHERE id = p_item_id;
  IF NOT FOUND OR v_item.reservation_id <> p_reservation_id THEN
    RAISE EXCEPTION 'item_not_found';
  END IF;

  -- 🔒 Édition possible UNIQUEMENT avant comptabilisation.
  IF v_res.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'price_locked';
  END IF;

  v_old_price := v_item.unit_price;
  v_old_total := v_res.total_price;

  UPDATE reservation_items
     SET unit_price = round(p_unit_price, 2)
   WHERE id = p_item_id;

  -- Recalcul du total — même transaction, jamais de désync.
  SELECT COALESCE(sum(unit_price * quantity), 0)
    INTO v_new_total
    FROM reservation_items
   WHERE reservation_id = p_reservation_id;

  UPDATE reservations
     SET total_price = v_new_total,
         updated_at  = now()
   WHERE id = p_reservation_id;

  -- Diff complet pour l'audit log côté route (ancien → nouveau).
  RETURN jsonb_build_object(
    'reservation_id', p_reservation_id,
    'item_id',        p_item_id,
    'product_name',   v_item.product_name,
    'quantity',       v_item.quantity,
    'old_unit_price', v_old_price,
    'new_unit_price', round(p_unit_price, 2),
    'old_total',      v_old_total,
    'new_total',      v_new_total
  );
END;
$function$;

-- Service-role only — PUBLIC inclus (le GRANT EXECUTE par défaut à PUBLIC
-- rendrait sinon la fonction appelable par anon via PostgREST).
REVOKE ALL ON FUNCTION public.set_reservation_item_price(uuid, uuid, numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_reservation_item_price(uuid, uuid, numeric)
  TO service_role;
