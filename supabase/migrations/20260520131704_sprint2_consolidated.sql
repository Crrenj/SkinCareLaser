-- Sprint 2 — Migrations consolidées (§7 audit)
--
-- Idempotent : utilise IF NOT EXISTS partout, sauf pour l'enum
-- banner_type_enum qu'on (re)crée en remplaçant la colonne varchar.
-- À rejouer sans crainte sur un environnement déjà migré.

-- ═══════════════════════════════════════════════════
-- 1. PRODUCTS — colonnes PDP enrichie + flags
-- ═══════════════════════════════════════════════════
ALTER TABLE products ADD COLUMN IF NOT EXISTS volume text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pharmacist_advice text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pharmacist_name text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS benefits text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS usage text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS inci text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS technical_pdf_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS skin_type text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS texture text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- ═══════════════════════════════════════════════════
-- 2. TAGS — curation home
-- ═══════════════════════════════════════════════════
ALTER TABLE tags ADD COLUMN IF NOT EXISTS featured_on_home boolean DEFAULT false;

-- ═══════════════════════════════════════════════════
-- 3. BANNERS — passage à 3 variantes editorial/hero/quote
-- ═══════════════════════════════════════════════════
ALTER TABLE banners ADD COLUMN IF NOT EXISTS direction text
  CHECK (direction IS NULL OR direction IN ('left', 'right'));
ALTER TABLE banners ADD COLUMN IF NOT EXISTS attribution_name text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS attribution_title text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS attribution_photo_url text;

-- Mappage des anciens types → nouveaux (idempotent : pas de WHERE
-- restrictif sur les ENUM déjà migrés, le UPDATE est no-op si déjà OK)
UPDATE banners SET banner_type = 'editorial', direction = COALESCE(direction, 'left')
  WHERE banner_type IN ('image_left', 'card_style', 'minimal');

UPDATE banners SET banner_type = 'editorial', direction = COALESCE(direction, 'right')
  WHERE banner_type = 'image_right';

UPDATE banners SET banner_type = 'hero'
  WHERE banner_type IN ('image_full', 'gradient_overlay');

-- ═══════════════════════════════════════════════════
-- 4. WISHLIST — favoris utilisateur
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS wishlists (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON wishlists(product_id);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own wishlists" ON wishlists;
CREATE POLICY "Users manage own wishlists" ON wishlists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- 5. VUE BESTSELLERS — tri par ventes 30j + fallback is_featured
-- ═══════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_bestsellers AS
SELECT
  p.*,
  COALESCE(SUM(oi.quantity), 0) AS sold_30d
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id
  AND o.created_at > now() - INTERVAL '30 days'
WHERE p.is_active IS DISTINCT FROM false
GROUP BY p.id
ORDER BY sold_30d DESC, p.is_featured DESC NULLS LAST, p.created_at DESC;

-- ═══════════════════════════════════════════════════
-- 6. INDEXES sur les FKs critiques (perf catalogue + cart)
-- ═══════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_product_ranges_product ON product_ranges(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ranges_range ON product_ranges(range_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

COMMENT ON COLUMN products.pharmacist_advice IS 'Citation pharmacien affichée sur PDP + home quote section';
COMMENT ON COLUMN products.is_featured IS 'Fallback bestsellers si pas de ventes récentes';
COMMENT ON TABLE wishlists IS 'Favoris user. RLS : chaque user voit/modifie seulement les siens';
COMMENT ON VIEW v_bestsellers IS 'Produits triés par ventes 30j desc, fallback is_featured, puis created_at desc';
