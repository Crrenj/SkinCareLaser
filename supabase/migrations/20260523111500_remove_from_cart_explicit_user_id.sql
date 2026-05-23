-- remove_from_cart accepte maintenant p_user_id explicite (utile quand le
-- caller est en mode service-role où auth.uid() = NULL). Fallback sur
-- auth.uid() si p_user_id absent (mode client direct).

CREATE OR REPLACE FUNCTION public.remove_from_cart(
  p_product_id uuid,
  p_anon_id uuid DEFAULT NULL::uuid,
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := COALESCE(p_user_id, auth.uid());
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
