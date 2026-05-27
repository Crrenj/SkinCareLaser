-- orders + order_items were scaffolded but never wired into the app.
-- 0 rows in both tables. v_bestsellers depends on them so recreate it first.

DROP VIEW IF EXISTS v_bestsellers;

CREATE OR REPLACE VIEW v_bestsellers AS
SELECT
  p.id, p.name, p.slug, p.description, p.price, p.currency,
  p.stock, p.is_active, p.created_at, p.updated_at,
  p.volume, p.pharmacist_advice, p.pharmacist_name,
  p.benefits, p.usage, p.inci, p.technical_pdf_url,
  p.skin_type, p.texture, p.old_price, p.is_new, p.is_featured,
  0::bigint AS sold_30d
FROM products p
WHERE p.is_active IS DISTINCT FROM false
ORDER BY p.is_featured DESC NULLS LAST, p.created_at DESC;

DROP POLICY IF EXISTS "Order items owner" ON order_items;
DROP POLICY IF EXISTS "Order owner" ON orders;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
