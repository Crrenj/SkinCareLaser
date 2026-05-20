-- Clean up the "demo-" prefix on the Genové brand and its 31 product slugs.
-- This prefix was a seed artifact from db/populate_catalog.sql and creates ugly URLs
-- once we switch from /product/[id] to /product/[slug].

UPDATE public.brands
   SET slug = 'genove'
 WHERE slug = 'demo-genove';

UPDATE public.products
   SET slug = REPLACE(slug, 'demo-genove-', 'genove-')
 WHERE slug LIKE 'demo-genove-%';
