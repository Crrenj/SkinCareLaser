-- M1 — add_to_cart : contrôle de stock CUMULÉ + plafond MAX_CART_QUANTITY (99).
--
-- Bug d'origine (audit C-13) : la route /api/cart POST validait le DELTA envoyé
-- contre le stock, alors que add_to_cart INCRÉMENTE → en cliquant plusieurs fois
-- on dépassait le stock (sur-réservation). Le contrôle remonte dans la RPC pour
-- être ATOMIQUE (SELECT ... FOR UPDATE sur le produit → pas de TOCTOU).
--
-- Replay-safe : CREATE OR REPLACE. `SET search_path` re-figé (cf. migration
-- 20260522092810). GRANTs préservés par CREATE OR REPLACE (service_role-only,
-- cf. 20260528160000) — on NE ré-ajoute PAS anon/authenticated.

CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_cart_id    UUID,
  p_product_id UUID,
  p_quantity   INT,
  p_anon_id    UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_stock     INT;
  v_existing  INT;
  v_new_total INT;
BEGIN
  -- Propriété du panier en mode anonyme (claim JWT jamais émis → check ici).
  IF p_anon_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND anonymous_id = p_anon_id
  ) THEN
    RAISE EXCEPTION 'Panier non autorisé';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantité invalide' USING ERRCODE = 'check_violation';
  END IF;

  -- Verrou ligne produit : rend le contrôle de stock atomique (anti-TOCTOU
  -- sous ajouts concurrents).
  SELECT stock INTO v_stock FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable' USING ERRCODE = 'no_data_found';
  END IF;

  SELECT quantity INTO v_existing FROM public.cart_items
    WHERE cart_id = p_cart_id AND product_id = p_product_id;
  v_existing := COALESCE(v_existing, 0);

  v_new_total := v_existing + p_quantity;

  -- Contrôle stock CUMULÉ (le vrai fix C-13).
  IF v_stock IS NOT NULL AND v_new_total > v_stock THEN
    RAISE EXCEPTION 'Stock insuffisant' USING ERRCODE = 'check_violation';
  END IF;

  -- Plafond de sécurité par ligne (MAX_CART_QUANTITY = 99).
  IF v_new_total > 99 THEN
    v_new_total := 99;
  END IF;

  INSERT INTO public.cart_items (cart_id, product_id, quantity)
  VALUES (p_cart_id, p_product_id, v_new_total)
  ON CONFLICT (cart_id, product_id)
  DO UPDATE SET quantity = v_new_total, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
