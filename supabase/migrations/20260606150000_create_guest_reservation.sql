-- Phase 4 — Réservation invité (visiteur web sans compte).
-- Mirroir de create_reservation, mais SANS auth.uid() : l'appelant est la route
-- /api/cart/reserve en service-role (pas de session JWT pour un invité).
-- Sécurité = ownership du panier vérifié par anonymous_id (cookie httpOnly
-- non-falsifiable côté client) + GRANT service-role only.
--
-- Différences avec create_reservation :
--   - user_id NULL, source 'guest', anonymous_id stocké.
--   - PAS de check « déjà une résa active » (un invité non identifié peut en
--     avoir plusieurs ; le partial unique index est sur user_id, NULLS DISTINCT).
--   - contact_name/phone/email viennent du formulaire (pas du profil).
--   - génère un confirmation_token non-devinable (accès à la confirmation sans
--     compte, sans IDOR). Token = 2× uuid sans tirets (64 hex), zéro dépendance
--     pgcrypto (gen_random_uuid est natif).
-- Retourne (id, confirmation_token).

CREATE OR REPLACE FUNCTION public.create_guest_reservation(
  p_cart_id uuid,
  p_anon_id uuid,
  p_name    text,
  p_phone   text,
  p_email   text DEFAULT NULL
) RETURNS TABLE(id uuid, confirmation_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reservation_id uuid;
  v_token          text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_total_items    int;
  v_total_price    numeric(10,2);
  v_currency       text;
BEGIN
  IF p_phone IS NULL OR TRIM(p_phone) = '' THEN
    RAISE EXCEPTION 'Téléphone requis pour réserver' USING ERRCODE = 'P0002';
  END IF;

  -- Ownership : le panier doit appartenir à cet anonymous_id (invité, sans compte).
  IF NOT EXISTS (
    SELECT 1 FROM public.carts c
    WHERE c.id = p_cart_id AND c.anonymous_id = p_anon_id AND c.user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Panier introuvable ou non autorisé' USING ERRCODE = 'P0004';
  END IF;

  SELECT SUM(ci.quantity), SUM(ci.quantity * pr.price), MAX(pr.currency)
    INTO v_total_items, v_total_price, v_currency
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  IF v_total_items IS NULL OR v_total_items = 0 THEN
    RAISE EXCEPTION 'Le panier est vide' USING ERRCODE = 'P0005';
  END IF;

  INSERT INTO public.reservations (
    user_id, source, anonymous_id, confirmation_token, status, expires_at,
    contact_phone, contact_email, contact_name,
    total_items, total_price, currency
  ) VALUES (
    NULL, 'guest', p_anon_id, v_token, 'pending', NOW() + INTERVAL '24 hours',
    TRIM(p_phone),
    NULLIF(TRIM(COALESCE(p_email, '')), ''),
    NULLIF(TRIM(COALESCE(p_name, '')), ''),
    v_total_items, v_total_price, COALESCE(v_currency, 'DOP')
  )
  RETURNING reservations.id INTO v_reservation_id;

  INSERT INTO public.reservation_items (
    reservation_id, product_id, product_name, unit_price, quantity
  )
  SELECT v_reservation_id, ci.product_id, pr.name, pr.price, ci.quantity
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;

  RETURN QUERY SELECT v_reservation_id, v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_reservation(uuid, uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_guest_reservation(uuid, uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.create_guest_reservation(uuid, uuid, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_guest_reservation(uuid, uuid, text, text, text) TO service_role;

COMMENT ON FUNCTION public.create_guest_reservation(uuid, uuid, text, text, text) IS
  'Convertit le panier d''un invité (anonymous_id) en réservation pending (TTL 24h), user_id NULL, source guest. Ownership vérifié par anonymous_id. Retourne (id, confirmation_token). Service-role only.';
