-- Migration : indexes FK manquants pour perf RLS + jointures catalogue
--
-- Audit DB #3 proposait 8 indexes ; 4 sont déjà couverts par des
-- PKs/uniques composites dont le leading column matche la FK
-- (Postgres prefix scan) :
--   - product_ranges(product_id, range_id) : PK couvre product_id
--   - product_tags(product_id, tag_id)     : PK couvre product_id
--   - ranges(brand_id, slug)               : unique couvre brand_id
--   - cart_items unique_cart_product(cart_id, product_id) : couvre cart_id
--
-- Les 4 restants nécessitent un index dédié :

CREATE INDEX IF NOT EXISTS idx_product_ranges_range_id   ON public.product_ranges(range_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id       ON public.product_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id     ON public.cart_items(product_id);
