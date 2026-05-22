-- product_ranges (n-n) → products.range_id (1-n direct).
--
-- Audit DB #1 : la table d'association est modélisée n-n mais utilisée 1-n
-- partout (chaque produit a exactement une gamme, le code prend toujours
-- `product_ranges?.[0]?.range`). Ça alourdit toutes les requêtes catalogue
-- pour rien.
--
-- Pre-flight (2026-05-22) : 353 / 353 produits ont exactement 1 ligne dans
-- product_ranges, 0 multiple, 0 sans range. Migration sans perte.
--
-- Plan :
--   1. ALTER TABLE products ADD range_id (nullable initialement)
--   2. UPDATE products avec la range_id depuis product_ranges
--   3. Vérification : 0 NULL
--   4. ALTER COLUMN NOT NULL + index sur range_id
--   5. DROP TABLE product_ranges (les indexes + FK partent avec)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS range_id UUID
  REFERENCES public.ranges(id) ON DELETE SET NULL;

UPDATE public.products p
SET range_id = pr.range_id
FROM public.product_ranges pr
WHERE pr.product_id = p.id AND p.range_id IS NULL;

-- Garde-fou : si jamais un produit n'a pas reçu de range_id, on annule.
DO $$
DECLARE
  missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing FROM public.products WHERE range_id IS NULL;
  IF missing > 0 THEN
    RAISE EXCEPTION 'Migration product_ranges → range_id : % produits sans range_id, abort.', missing;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_range_id ON public.products(range_id);

DROP TABLE IF EXISTS public.product_ranges;
