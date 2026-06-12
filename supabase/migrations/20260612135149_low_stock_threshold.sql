-- ============================================================================
-- Seuil de stock faible configurable (demande propriétaire 2026-06-12).
--
-- Avant : TROIS seuils incohérents codés en dur — 10 (page /admin/stock via
-- getStockStatus), 5 (badge sidebar, widget « Stock crítico », RPC
-- get_inventory_valuation), 5 (vitrine ProductCard, hors scope ici).
-- Après : une colonne shop_settings.low_stock_threshold (défaut 10, CHECK > 1
-- — demande explicite : « doit être supérieur à 1 »), éditée dans
-- /admin/settings, consommée par toutes les surfaces ADMIN.
--
-- Sémantique unifiée : out = stock 0 · low = 0 < stock ≤ seuil · ok = > seuil.
-- (L'ancien RPC utilisait 0 < stock < 5 ; avec le défaut 10, les produits à
-- 5..10 unités passent de « inStock » à « low » sur le dashboard — voulu.)
--
-- Idempotent : ADD COLUMN IF NOT EXISTS, contrainte nommée gardée par
-- pg_constraint, CREATE OR REPLACE (les ACLs service-role du RPC posées par
-- 20260611190000 sont PRÉSERVÉES par CREATE OR REPLACE — pas de re-grant).
-- ============================================================================

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 10;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shop_settings_low_stock_threshold_check'
      AND conrelid = 'public.shop_settings'::regclass
  ) THEN
    ALTER TABLE public.shop_settings
      ADD CONSTRAINT shop_settings_low_stock_threshold_check
      CHECK (low_stock_threshold > 1);
  END IF;
END $$;

COMMENT ON COLUMN public.shop_settings.low_stock_threshold IS
  'Seuil « stock faible » défini par la pharmacie (> 1, défaut 10). low = 0 < stock ≤ seuil. Consommé par /api/admin/stock, sidebar-stats, dashboard (get_inventory_valuation) et /admin/settings.';

-- ───────────────────────── get_inventory_valuation ─────────────────────────
-- Re-créée à l'identique de 20260611190000 SAUF la distribution : le littéral
-- 5 est remplacé par le seuil configurable (fallback 10 si la ligne manque).
CREATE OR REPLACE FUNCTION public.get_inventory_valuation()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH cfg AS (
    SELECT COALESCE(
      (SELECT low_stock_threshold FROM shop_settings WHERE id = 1),
      10
    ) AS thr
  )
  SELECT jsonb_build_object(
    'productsActive',    count(*),
    'units',             COALESCE(sum(COALESCE(stock, 0)), 0),
    'retailValue',       COALESCE(sum(COALESCE(price, 0) * COALESCE(stock, 0)), 0),
    'costValue',         COALESCE(sum(cost_price * COALESCE(stock, 0)) FILTER (WHERE cost_price IS NOT NULL), 0),
    'productsWithCost',  count(*) FILTER (WHERE cost_price IS NOT NULL),
    'placeholderPriced', count(*) FILTER (WHERE price = 100),
    -- Distribution (sémantique unifiée, seuil configurable via sous-requête
    -- scalaire — un cfg.thr nu serait rejeté en requête agrégée, 42803) :
    -- oos = 0 · low = 0 < s ≤ thr · inStock = s > thr. stock NULL = 0.
    'inStock',           count(*) FILTER (WHERE COALESCE(stock, 0) > (SELECT thr FROM cfg)),
    'low',               count(*) FILTER (WHERE COALESCE(stock, 0) > 0 AND COALESCE(stock, 0) <= (SELECT thr FROM cfg)),
    'oos',               count(*) FILTER (WHERE COALESCE(stock, 0) = 0),
    -- Seuil utilisé (affiché par le widget Inventario du dashboard).
    'lowThreshold',      (SELECT thr FROM cfg)
  )
  FROM products
  WHERE is_active = true;
$$;

COMMENT ON FUNCTION public.get_inventory_valuation() IS
  'Valorisation inventaire courant (détail + coût + distribution stock, seuil low configurable via shop_settings.low_stock_threshold). SERVICE-ROLE ONLY (expose cost_price). Phase 6 remediation 2026-06-10, seuil configurable 2026-06-12.';
