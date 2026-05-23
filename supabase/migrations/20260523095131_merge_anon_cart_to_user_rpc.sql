-- RPC pour merger un cart anonyme vers le user authentifié, contournant la
-- policy RLS UPDATE de `carts` qui exigeait auth.uid() = user_id (impossible
-- au moment du merge). Utilisée par useAuth.handleUserLogin au login.
--
-- Gère deux cas :
--   1. User n'a pas encore de cart : reclaim le cart anon (UPDATE user_id)
--   2. User a déjà un cart : fusionne les items (ON CONFLICT) puis supprime
--      le cart anon (CASCADE sur cart_items).

CREATE OR REPLACE FUNCTION public.merge_anon_cart_to_user(p_anon_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_anon_cart_id uuid;
  v_user_cart_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_anon_cart_id
  FROM public.carts
  WHERE anonymous_id = p_anon_id AND user_id IS NULL
  LIMIT 1;

  IF v_anon_cart_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_user_cart_id
  FROM public.carts WHERE user_id = v_user_id LIMIT 1;

  IF v_user_cart_id IS NULL THEN
    UPDATE public.carts
    SET user_id = v_user_id, anonymous_id = NULL
    WHERE id = v_anon_cart_id;
    RETURN v_anon_cart_id;
  ELSE
    INSERT INTO public.cart_items (cart_id, product_id, quantity)
    SELECT v_user_cart_id, product_id, quantity
    FROM public.cart_items
    WHERE cart_id = v_anon_cart_id
    ON CONFLICT (cart_id, product_id) DO UPDATE
      SET quantity = public.cart_items.quantity + EXCLUDED.quantity,
          updated_at = NOW();
    DELETE FROM public.carts WHERE id = v_anon_cart_id;
    RETURN v_user_cart_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_anon_cart_to_user(uuid) TO authenticated;

-- Hardening de remove_from_cart pour supporter le mode user-authenticated
-- (la version originale ne lisait que anonymous_id, donc inopérante pour les
-- carts attachés à user_id).

CREATE OR REPLACE FUNCTION public.remove_from_cart(p_product_id uuid, p_anon_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  DELETE FROM public.cart_items
  WHERE product_id = p_product_id
    AND cart_id IN (
      SELECT id FROM public.carts
      WHERE (p_anon_id IS NOT NULL AND anonymous_id = p_anon_id)
         OR (v_user_id IS NOT NULL AND user_id = v_user_id)
    );
END;
$$;
