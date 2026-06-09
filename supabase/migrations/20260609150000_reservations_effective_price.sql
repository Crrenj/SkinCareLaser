-- ============================================================================
-- Snapshot des réservations au PRIX EFFECTIF (promo) plutôt qu'au prix de base.
-- Remplace les 4 lectures de pr.price par public.effective_price(pr.id, now())
-- dans create_reservation + create_guest_reservation. Corps repris verbatim de
-- la DB live ; SECURITY DEFINER / search_path / owner / grants ASYMÉTRIQUES
-- préservés à l'identique. effective_price (DEFINER) est appelable depuis ces
-- RPC (DEFINER, owner postgres) sans grant supplémentaire. Sans promo active,
-- effective_price renvoie pr.price → zéro changement de comportement.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_guest_reservation(p_cart_id uuid, p_anon_id uuid, p_name text, p_phone text, p_email text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, confirmation_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  IF NOT EXISTS (
    SELECT 1 FROM public.carts c
    WHERE c.id = p_cart_id AND c.anonymous_id = p_anon_id AND c.user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Panier introuvable ou non autorisé' USING ERRCODE = 'P0004';
  END IF;

  SELECT SUM(ci.quantity), SUM(ci.quantity * public.effective_price(pr.id, now())), MAX(pr.currency)
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
  SELECT v_reservation_id, ci.product_id, pr.name, public.effective_price(pr.id, now()), ci.quantity
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;

  RETURN QUERY SELECT v_reservation_id, v_token;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_guest_reservation(uuid, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_guest_reservation(uuid, uuid, text, text, text) TO service_role;
COMMENT ON FUNCTION public.create_guest_reservation(uuid, uuid, text, text, text) IS
  'Convertit le panier d''un invité (anonymous_id) en réservation pending (TTL 24h), user_id NULL, source guest. unit_price = prix effectif (promo) au moment de la réservation. Service-role only.';


CREATE OR REPLACE FUNCTION public.create_reservation(p_cart_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id         UUID := auth.uid();
  v_reservation_id  UUID;
  v_phone           TEXT;
  v_email           TEXT;
  v_name            TEXT;
  v_total_items     INT;
  v_total_price     NUMERIC(10,2);
  v_currency        TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour réserver'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE user_id = v_user_id
      AND status IN ('pending', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà une réservation active'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT
    p.phone,
    u.email,
    COALESCE(
      NULLIF(TRIM(p.display_name), ''),
      NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''),
      u.email
    )
  INTO v_phone, v_email, v_name
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = v_user_id;

  IF v_phone IS NULL OR TRIM(v_phone) = '' THEN
    RAISE EXCEPTION 'Téléphone requis pour réserver. Ajoutez-le à votre profil.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_email IS NULL OR TRIM(v_email) = '' THEN
    RAISE EXCEPTION 'Email manquant sur le compte'
      USING ERRCODE = 'P0003';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Panier introuvable ou non autorisé'
      USING ERRCODE = 'P0004';
  END IF;

  SELECT
    SUM(ci.quantity),
    SUM(ci.quantity * public.effective_price(pr.id, now())),
    MAX(pr.currency)
  INTO v_total_items, v_total_price, v_currency
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  IF v_total_items IS NULL OR v_total_items = 0 THEN
    RAISE EXCEPTION 'Le panier est vide'
      USING ERRCODE = 'P0005';
  END IF;

  INSERT INTO public.reservations (
    user_id, status, expires_at,
    contact_phone, contact_email, contact_name,
    total_items, total_price, currency
  ) VALUES (
    v_user_id,
    'pending',
    NOW() + INTERVAL '24 hours',
    v_phone, v_email, v_name,
    v_total_items, v_total_price, COALESCE(v_currency, 'DOP')
  )
  RETURNING id INTO v_reservation_id;

  INSERT INTO public.reservation_items (
    reservation_id, product_id, product_name, unit_price, quantity
  )
  SELECT
    v_reservation_id, ci.product_id, pr.name, public.effective_price(pr.id, now()), ci.quantity
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;

  RETURN v_reservation_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_reservation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_reservation(uuid) TO authenticated, service_role;
COMMENT ON FUNCTION public.create_reservation(uuid) IS
  'Convertit le panier de l''utilisateur connecté (auth.uid()) en réservation pending (TTL 24h). 1 active par compte (garde P0001). unit_price = prix effectif (promo) au moment de la réservation. authenticated + service_role.';
