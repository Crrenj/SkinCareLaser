-- Migration : fix RPC add_to_cart pour incrémenter au lieu d'écraser
--
-- Bug d'origine : ON CONFLICT DO UPDATE SET quantity = EXCLUDED.quantity
-- écrasait la quantité existante. Cliquer "Ajouter au panier" 2x sur le
-- même produit ne donnait pas 2 unités. Finding audit DB #10.
--
-- Fix : quantité cumulée (cart_items.quantity + EXCLUDED.quantity) + bump
-- de updated_at pour cohérence avec le trigger.

CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_cart_id    UUID,
  p_product_id UUID,
  p_quantity   INT,
  p_anon_id    UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF p_anon_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND anonymous_id = p_anon_id
  ) THEN
    RAISE EXCEPTION 'Panier non autorisé';
  END IF;

  INSERT INTO public.cart_items (cart_id, product_id, quantity)
  VALUES (p_cart_id, p_product_id, p_quantity)
  ON CONFLICT (cart_id, product_id)
  DO UPDATE SET
    quantity   = public.cart_items.quantity + EXCLUDED.quantity,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
