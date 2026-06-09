-- ============================================================================
-- Campagnes promo : remise (% ou montant fixe) ciblant produit / marque /
-- gamme / tag, datée. Le prix effectif (meilleur prix client) est calculé par
-- effective_price() et exposé publiquement via la vue v_product_pricing
-- (security_invoker → respecte la RLS, n'expose aucun coût) ; il alimente aussi
-- le snapshot des réservations (migration suivante).
-- ============================================================================

-- 1) Tables (privées : lecture admin, écriture service-role ; affichage via la vue).
CREATE TABLE IF NOT EXISTS public.promotions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  discount_type  text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric(10,2) NOT NULL CHECK (discount_value >= 0),
  start_date     timestamptz NOT NULL,
  end_date       timestamptz NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  priority       int NOT NULL DEFAULT 0,            -- départage seulement (non utilisé par effective_price : MIN gagne)
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotions_window_chk  CHECK (end_date > start_date),
  CONSTRAINT promotions_percent_chk CHECK (discount_type <> 'percent' OR discount_value <= 100)
);
COMMENT ON TABLE public.promotions IS
  'Campagnes promo datees. discount_type percent|fixed. Prive (lecture admin, ecriture service-role). Affichage via v_product_pricing.';

CREATE TABLE IF NOT EXISTS public.promotion_targets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  target_type  text NOT NULL CHECK (target_type IN ('product', 'brand', 'range', 'tag')),
  target_id    uuid NOT NULL,                       -- polymorphe (pas de FK) : integrite validee cote API
  UNIQUE (promotion_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_promotions_active_window ON public.promotions (is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_created_by    ON public.promotions (created_by);
CREATE INDEX IF NOT EXISTS idx_promotion_targets_promo  ON public.promotion_targets (promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_targets_lookup ON public.promotion_targets (target_type, target_id);

ALTER TABLE public.promotions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read promotions" ON public.promotions;
CREATE POLICY "Admins read promotions" ON public.promotions
  FOR SELECT USING (is_user_admin((SELECT auth.uid())));
DROP POLICY IF EXISTS "Admins read promotion_targets" ON public.promotion_targets;
CREATE POLICY "Admins read promotion_targets" ON public.promotion_targets
  FOR SELECT USING (is_user_admin((SELECT auth.uid())));

REVOKE ALL ON public.promotions, public.promotion_targets FROM anon, authenticated;
GRANT ALL ON public.promotions, public.promotion_targets TO service_role;

-- 2) Prix effectif (meilleur prix client = MIN sur toutes les cibles qui matchent).
--    SECURITY DEFINER : lit les tables promo en tant que postgres (cibles privees).
--    anon a EXECUTE (renvoie seulement un prix, jamais le cout) → la vue invoker marche.
CREATE OR REPLACE FUNCTION public.effective_price(p_product_id uuid, p_at timestamptz DEFAULT now())
RETURNS numeric(10,2)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT pr.id, pr.price, pr.range_id, r.brand_id
    FROM products pr
    LEFT JOIN ranges r ON r.id = pr.range_id     -- LEFT JOIN : produit sans gamme survit
    WHERE pr.id = p_product_id
  ),
  cand AS (
    SELECT round(GREATEST(0, CASE
             WHEN p.discount_type = 'percent' THEN b.price * (1 - p.discount_value / 100.0)
             ELSE b.price - p.discount_value
           END), 2) AS eff
    FROM base b
    JOIN promotion_targets t ON (
           (t.target_type = 'product' AND t.target_id = b.id)
        OR (t.target_type = 'range'   AND t.target_id = b.range_id)
        OR (t.target_type = 'brand'   AND t.target_id = b.brand_id)
        OR (t.target_type = 'tag'     AND t.target_id IN (
              SELECT pt.tag_id FROM product_tags pt WHERE pt.product_id = b.id))
    )
    JOIN promotions p ON p.id = t.promotion_id
      AND p.is_active
      AND p_at >= p.start_date
      AND p_at <  p.end_date
  )
  SELECT COALESCE(MIN(eff), (SELECT price FROM base)) FROM cand;
$$;
REVOKE ALL ON FUNCTION public.effective_price(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.effective_price(uuid, timestamptz) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.effective_price(uuid, timestamptz) IS
  'Prix effectif (DOP) d''un produit a l''instant p_at : meilleur prix client (MIN) sur toutes les promos actives qui le ciblent (produit/marque/gamme/tag), sinon prix de base. round 2 decimales. N''expose jamais le cout.';

-- 3) Vue publique d'affichage (security_invoker → RLS produits respectee, aucun cout).
DROP VIEW IF EXISTS public.v_product_pricing;
CREATE VIEW public.v_product_pricing WITH (security_invoker = true) AS
  SELECT
    p.id                                  AS product_id,
    p.price                               AS base_price,
    public.effective_price(p.id, now())   AS effective_price,
    p.currency
  FROM public.products p;
GRANT SELECT ON public.v_product_pricing TO anon, authenticated, service_role;

-- 4) Swap atomique des cibles (DELETE+INSERT en une transaction → pas de fenetre d'orphelins).
CREATE OR REPLACE FUNCTION public.set_promotion_targets(p_promotion_id uuid, p_targets jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.promotion_targets WHERE promotion_id = p_promotion_id;
  INSERT INTO public.promotion_targets (promotion_id, target_type, target_id)
  SELECT p_promotion_id, x->>'target_type', (x->>'target_id')::uuid
  FROM jsonb_array_elements(p_targets) AS x
  ON CONFLICT (promotion_id, target_type, target_id) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.set_promotion_targets(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_promotion_targets(uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.set_promotion_targets(uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_promotion_targets(uuid, jsonb) TO service_role;
COMMENT ON FUNCTION public.set_promotion_targets(uuid, jsonb) IS
  'Remplace atomiquement les cibles d''une promo (DELETE + INSERT). p_targets = jsonb array de {target_type, target_id}. Service-role only.';
