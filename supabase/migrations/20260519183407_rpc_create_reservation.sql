-- Migration : RPC create_reservation
--
-- Convertit atomiquement le panier d'un user authentifié en une réservation
-- 'pending' avec TTL 24h. Snapshot du téléphone/email/nom + de chaque
-- product_name/unit_price pour figer l'état au moment de la création.
--
-- Sécurité : SECURITY DEFINER + utilise auth.uid() en interne (ne prend
-- PAS p_user_id en paramètre pour éviter qu'un user puisse réserver pour
-- un autre). GRANT EXECUTE limité à `authenticated`.
--
-- Préconditions vérifiées :
--   - User authentifié (auth.uid() not null)
--   - Pas déjà une réservation 'pending'|'confirmed'
--   - Profile.phone non vide
--   - Cart appartient au user
--   - Cart non vide
--
-- Effets : INSERT 1 row dans reservations + N rows dans reservation_items +
-- DELETE les cart_items (le cart lui-même reste, pour ré-usage).

CREATE OR REPLACE FUNCTION public.create_reservation(
  p_cart_id UUID
) RETURNS UUID AS $$
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
  -- Auth requise
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour réserver'
      USING ERRCODE = '42501';
  END IF;

  -- Pas déjà une réservation active
  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE user_id = v_user_id
      AND status IN ('pending', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà une réservation active'
      USING ERRCODE = 'P0001';
  END IF;

  -- Récupère phone, email, et un nom d'affichage (fallback email)
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

  -- Vérifie ownership du cart
  IF NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Panier introuvable ou non autorisé'
      USING ERRCODE = 'P0004';
  END IF;

  -- Calcule les totaux
  SELECT
    SUM(ci.quantity),
    SUM(ci.quantity * pr.price),
    MAX(pr.currency)
  INTO v_total_items, v_total_price, v_currency
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  IF v_total_items IS NULL OR v_total_items = 0 THEN
    RAISE EXCEPTION 'Le panier est vide'
      USING ERRCODE = 'P0005';
  END IF;

  -- Crée la réservation (le partial unique index protège des race conditions)
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

  -- Snapshot des items (figer product_name + unit_price)
  INSERT INTO public.reservation_items (
    reservation_id, product_id, product_name, unit_price, quantity
  )
  SELECT
    v_reservation_id, ci.product_id, pr.name, pr.price, ci.quantity
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  -- Vide le panier (le cart lui-même reste pour ré-usage futur)
  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;

  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Accès : authenticated only (anon ne peut pas réserver)
REVOKE ALL ON FUNCTION public.create_reservation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_reservation(UUID) TO authenticated;

COMMENT ON FUNCTION public.create_reservation IS
  'Convertit le panier d''un user en réservation pending (TTL 24h). Snapshot du téléphone et des items. Lève une exception si phone manquant, cart vide, ou réservation active déjà existante.';
