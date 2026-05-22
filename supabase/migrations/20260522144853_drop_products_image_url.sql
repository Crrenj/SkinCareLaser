-- Drops the legacy `products.image_url` column.
--
-- Context: the column predates the `product_images` table (which is the
-- canonical multi-image source). Every read site already prefers
-- `product_images[0].url`, and the audit (database #6, architecture #3)
-- flagged the cohabitation as a data-integrity risk.
--
-- Verified before drop (2026-05-22):
--   - 298 / 353 products had both fields set, with identical URLs (0 divergent)
--   - 0 products had `image_url` set without a matching `product_images` row
--   - 54 had neither (placeholder products, unchanged)
--
-- The application code has been updated in the same commit to:
--   - remove `image_url` from product SELECTs
--   - compute the API response's `image_url` field from `product_images[0].url`
--   - look up the Storage path for DELETE/PATCH from `product_images` instead
--
-- The `v_bestsellers` view also references the column and must be recreated
-- without it before the column drop. Both call sites of the view only ask
-- for {id, slug, name, price, currency} so removing image_url from the
-- view definition does not affect them.

DROP VIEW IF EXISTS public.v_bestsellers;

CREATE VIEW public.v_bestsellers AS
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.currency,
    p.stock,
    p.is_active,
    p.created_at,
    p.updated_at,
    p.volume,
    p.pharmacist_advice,
    p.pharmacist_name,
    p.benefits,
    p.usage,
    p.inci,
    p.technical_pdf_url,
    p.skin_type,
    p.texture,
    p.old_price,
    p.is_new,
    p.is_featured,
    COALESCE(sum(oi.quantity), 0::bigint) AS sold_30d
  FROM public.products p
  LEFT JOIN public.order_items oi ON oi.product_id = p.id
  LEFT JOIN public.orders o ON o.id = oi.order_id
    AND o.created_at > (now() - '30 days'::interval)
  WHERE p.is_active IS DISTINCT FROM false
  GROUP BY p.id
  ORDER BY
    COALESCE(sum(oi.quantity), 0::bigint) DESC,
    p.is_featured DESC NULLS LAST,
    p.created_at DESC;

ALTER TABLE public.products DROP COLUMN IF EXISTS image_url;
