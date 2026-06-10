-- Phase 5 (hygiène BDD) + Phase 2-B (early-return effective_price, option B
-- actée par le propriétaire 2026-06-10) du plan de remédiation
-- docs/audits/full-audit-2026-06-10/00-REMEDIATION-PLAN.md.
-- D-7 (cadence cron) déjà livré par 20260610190000_cron_heartbeat_d7.sql.
--
-- Idempotente (IF EXISTS / IF NOT EXISTS / OR REPLACE / DROP avant CREATE
-- POLICY). VACUUM ANALYZE (D-9) volontairement HORS fichier : interdit en
-- transaction — exécuté ponctuellement à la main après application.

-- =====================================================================
-- D-1 — index partiel is_active. Prérequis Phase 3 (catalogue RPC) ;
-- 0 gain immédiat (353/353 actifs) — posé forward-looking, coût nul.
CREATE INDEX IF NOT EXISTS idx_products_is_active
  ON public.products (is_active) WHERE is_active;

-- =====================================================================
-- D-2 — doublons byte-identiques (advisor duplicate_index) : on garde
-- idx_product_images_product / idx_product_tags_tag.
DROP INDEX IF EXISTS public.idx_product_images_product_id;
DROP INDEX IF EXISTS public.idx_product_tags_tag_id;  -- couvre aussi D-8

-- =====================================================================
-- D-3 — FK sans index couvrant (liste advisor exacte, 4 FK).
-- reservation_items.product_id = le plus utile (FK ON DELETE SET NULL).
CREATE INDEX IF NOT EXISTS idx_reservation_items_product
  ON public.reservation_items (product_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user
  ON public.contact_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_replied_by
  ON public.contact_messages (replied_by);
CREATE INDEX IF NOT EXISTS idx_shop_settings_updated_by
  ON public.shop_settings (updated_by);

-- =====================================================================
-- D-8 — index inutilisés : SEULEMENT les 5 sûrs (idx_product_tags_tag_id
-- déjà droppé en D-2). Les 8 autres flaggés idx_scan=0 (audit_log/stock_*/
-- newsletter/contact_messages.category) le sont parce que les TABLES sont
-- vides, pas parce qu'ils sont inutiles (ex. idx_newsletter_confirmation_token
-- backe /api/newsletter/confirm) → CONSERVÉS.
-- NB : la drop d'idx_cart_items_product_id fera réapparaître un lint
-- unindexed_foreign_keys sur cart_items.product_id — assumé (table minuscule,
-- index jamais scanné, décision du plan raffiné).
DROP INDEX IF EXISTS public.idx_cart_items_product_id;
DROP INDEX IF EXISTS public.idx_banners_active;
DROP INDEX IF EXISTS public.idx_banners_slot;
DROP INDEX IF EXISTS public.idx_banners_status;

-- =====================================================================
-- D-4 — recherche accent-insensible (prérequis du filtre ?q de Phase 3).
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- unaccent() est STABLE → wrapper IMMUTABLE requis pour la colonne générée.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(p_text text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
SET search_path = ''
AS $$ SELECT extensions.unaccent('extensions.unaccent'::regdictionary, p_text) $$;

-- Colonne générée : nom minuscule sans accents — interrogeable par PostgREST
-- (ilike) sans appel de fonction côté requête.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name_search text
  GENERATED ALWAYS AS (public.immutable_unaccent(lower(name))) STORED;

CREATE INDEX IF NOT EXISTS idx_products_name_search_trgm
  ON public.products USING gin (name_search extensions.gin_trgm_ops);

-- Liste blanche de colonnes products (cost_price masqué — migration
-- 20260607130000) : toute nouvelle colonne doit être grantée explicitement.
GRANT SELECT (name_search) ON public.products TO anon, authenticated;

-- =====================================================================
-- D-5 — advisor auth_rls_initplan : auth.jwt() nu ré-évalué par ligne sur
-- les 5 policies carts/cart_items → envelopper en (SELECT auth.jwt()).
-- (auth.uid() était déjà enveloppé — migration 20260527100000.)
DROP POLICY IF EXISTS "View own cart" ON public.carts;
CREATE POLICY "View own cart" ON public.carts
  FOR SELECT
  USING ((( SELECT auth.uid()) = user_id)
      OR ((anonymous_id)::text = ((SELECT auth.jwt()) ->> 'anonymous_id')));

DROP POLICY IF EXISTS "Create own cart" ON public.carts;
CREATE POLICY "Create own cart" ON public.carts
  FOR INSERT
  WITH CHECK ((( SELECT auth.uid()) = user_id)
      OR ((anonymous_id)::text = ((SELECT auth.jwt()) ->> 'anonymous_id')));

DROP POLICY IF EXISTS "Update own cart" ON public.carts;
CREATE POLICY "Update own cart" ON public.carts
  FOR UPDATE
  USING ((( SELECT auth.uid()) = user_id)
      OR ((anonymous_id)::text = ((SELECT auth.jwt()) ->> 'anonymous_id')))
  WITH CHECK ((( SELECT auth.uid()) = user_id)
      OR ((anonymous_id)::text = ((SELECT auth.jwt()) ->> 'anonymous_id')));

DROP POLICY IF EXISTS "View own cart items" ON public.cart_items;
CREATE POLICY "View own cart items" ON public.cart_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
      AND ((carts.user_id = ( SELECT auth.uid()))
        OR ((carts.anonymous_id)::text = ((SELECT auth.jwt()) ->> 'anonymous_id')))));

-- D-6 (cart_items) — split du FOR ALL user-scoped « Manage own cart items »
-- en INSERT/UPDATE/DELETE (le SELECT « View own cart items » existe déjà →
-- le FOR ALL créait un 2e SELECT permissif).
DROP POLICY IF EXISTS "Manage own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Insert own cart items" ON public.cart_items;
CREATE POLICY "Insert own cart items" ON public.cart_items
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
      AND ((carts.user_id = ( SELECT auth.uid()))
        OR ((carts.anonymous_id)::text = ((SELECT auth.jwt()) ->> 'anonymous_id')))));
DROP POLICY IF EXISTS "Update own cart items" ON public.cart_items;
CREATE POLICY "Update own cart items" ON public.cart_items
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
      AND ((carts.user_id = ( SELECT auth.uid()))
        OR ((carts.anonymous_id)::text = ((SELECT auth.jwt()) ->> 'anonymous_id')))))
  WITH CHECK (EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
      AND ((carts.user_id = ( SELECT auth.uid()))
        OR ((carts.anonymous_id)::text = ((SELECT auth.jwt()) ->> 'anonymous_id')))));
DROP POLICY IF EXISTS "Delete own cart items" ON public.cart_items;
CREATE POLICY "Delete own cart items" ON public.cart_items
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
      AND ((carts.user_id = ( SELECT auth.uid()))
        OR ((carts.anonymous_id)::text = ((SELECT auth.jwt()) ->> 'anonymous_id')))));

-- =====================================================================
-- D-6 — éclater les 12 policies admin FOR ALL en INSERT/UPDATE/DELETE
-- (advisor multiple_permissive_policies, 90 lints : le FOR ALL ajoute un
-- 2e SELECT permissif par rôle au-dessus du SELECT public). WITH CHECK
-- explicite reposé partout. L'admin ne PERD aucun SELECT utile : les
-- lectures admin passent par le service-role (API) ou par des policies
-- SELECT dédiées (products/banners « OR is_user_admin », contact_messages
-- « Admin view messages », profiles « Admin view all »). On n'ajoute PAS
-- « OR is_user_admin » aux SELECT publics de posts/reviews (décision plan).

-- banners
DROP POLICY IF EXISTS "Admin manage banners" ON public.banners;
DROP POLICY IF EXISTS "Admin insert banners" ON public.banners;
CREATE POLICY "Admin insert banners" ON public.banners
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update banners" ON public.banners;
CREATE POLICY "Admin update banners" ON public.banners
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete banners" ON public.banners;
CREATE POLICY "Admin delete banners" ON public.banners
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- brands
DROP POLICY IF EXISTS "Admin manage brands" ON public.brands;
DROP POLICY IF EXISTS "Admin insert brands" ON public.brands;
CREATE POLICY "Admin insert brands" ON public.brands
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update brands" ON public.brands;
CREATE POLICY "Admin update brands" ON public.brands
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete brands" ON public.brands;
CREATE POLICY "Admin delete brands" ON public.brands
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- contact_messages (le SELECT « Admin view messages » dédié subsiste)
DROP POLICY IF EXISTS "Admin manage messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admin insert messages" ON public.contact_messages;
CREATE POLICY "Admin insert messages" ON public.contact_messages
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update messages" ON public.contact_messages;
CREATE POLICY "Admin update messages" ON public.contact_messages
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete messages" ON public.contact_messages;
CREATE POLICY "Admin delete messages" ON public.contact_messages
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- posts
DROP POLICY IF EXISTS "Admins can manage posts" ON public.posts;
DROP POLICY IF EXISTS "Admin insert posts" ON public.posts;
CREATE POLICY "Admin insert posts" ON public.posts
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update posts" ON public.posts;
CREATE POLICY "Admin update posts" ON public.posts
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete posts" ON public.posts;
CREATE POLICY "Admin delete posts" ON public.posts
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- product_images
DROP POLICY IF EXISTS "Admin manage product_images" ON public.product_images;
DROP POLICY IF EXISTS "Admin insert product_images" ON public.product_images;
CREATE POLICY "Admin insert product_images" ON public.product_images
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update product_images" ON public.product_images;
CREATE POLICY "Admin update product_images" ON public.product_images
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete product_images" ON public.product_images;
CREATE POLICY "Admin delete product_images" ON public.product_images
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- product_tags
DROP POLICY IF EXISTS "Admin manage product_tags" ON public.product_tags;
DROP POLICY IF EXISTS "Admin insert product_tags" ON public.product_tags;
CREATE POLICY "Admin insert product_tags" ON public.product_tags
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update product_tags" ON public.product_tags;
CREATE POLICY "Admin update product_tags" ON public.product_tags
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete product_tags" ON public.product_tags;
CREATE POLICY "Admin delete product_tags" ON public.product_tags
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- products (le SELECT « View active products » garde son OR is_user_admin)
DROP POLICY IF EXISTS "Admin manage products" ON public.products;
DROP POLICY IF EXISTS "Admin insert products" ON public.products;
CREATE POLICY "Admin insert products" ON public.products
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update products" ON public.products;
CREATE POLICY "Admin update products" ON public.products
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete products" ON public.products;
CREATE POLICY "Admin delete products" ON public.products
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- profiles (le SELECT « Admin view all » dédié subsiste)
DROP POLICY IF EXISTS "Admin manage all" ON public.profiles;
DROP POLICY IF EXISTS "Admin insert profiles" ON public.profiles;
CREATE POLICY "Admin insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update profiles" ON public.profiles;
CREATE POLICY "Admin update profiles" ON public.profiles
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete profiles" ON public.profiles;
CREATE POLICY "Admin delete profiles" ON public.profiles
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- ranges
DROP POLICY IF EXISTS "Admin manage ranges" ON public.ranges;
DROP POLICY IF EXISTS "Admin insert ranges" ON public.ranges;
CREATE POLICY "Admin insert ranges" ON public.ranges
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update ranges" ON public.ranges;
CREATE POLICY "Admin update ranges" ON public.ranges
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete ranges" ON public.ranges;
CREATE POLICY "Admin delete ranges" ON public.ranges
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- reviews
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin insert reviews" ON public.reviews;
CREATE POLICY "Admin insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update reviews" ON public.reviews;
CREATE POLICY "Admin update reviews" ON public.reviews
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete reviews" ON public.reviews;
CREATE POLICY "Admin delete reviews" ON public.reviews
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- tag_types
DROP POLICY IF EXISTS "Admin manage tag_types" ON public.tag_types;
DROP POLICY IF EXISTS "Admin insert tag_types" ON public.tag_types;
CREATE POLICY "Admin insert tag_types" ON public.tag_types
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update tag_types" ON public.tag_types;
CREATE POLICY "Admin update tag_types" ON public.tag_types
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete tag_types" ON public.tag_types;
CREATE POLICY "Admin delete tag_types" ON public.tag_types
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- tags
DROP POLICY IF EXISTS "Admin manage tags" ON public.tags;
DROP POLICY IF EXISTS "Admin insert tags" ON public.tags;
CREATE POLICY "Admin insert tags" ON public.tags
  FOR INSERT WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin update tags" ON public.tags;
CREATE POLICY "Admin update tags" ON public.tags
  FOR UPDATE USING (is_user_admin(( SELECT auth.uid())))
  WITH CHECK (is_user_admin(( SELECT auth.uid())));
DROP POLICY IF EXISTS "Admin delete tags" ON public.tags;
CREATE POLICY "Admin delete tags" ON public.tags
  FOR DELETE USING (is_user_admin(( SELECT auth.uid())));

-- =====================================================================
-- D-9 — autovacuum plus agressif sur les tables à fort churn (défaut 20 %
-- → 5 %). VACUUM ANALYZE ponctuel exécuté hors migration (hors transaction).
ALTER TABLE public.reservations SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.profiles     SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.cart_items   SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.carts        SET (autovacuum_vacuum_scale_factor = 0.05);

-- =====================================================================
-- D-10 — vues : tags_with_types passe en security_invoker (sûr : RLS
-- sous-jacente tags/tag_types = USING(true)). v_bestsellers RESTE en
-- SECURITY DEFINER — la passer en invoker ferait retomber sold_30d à 0
-- pour anon (reservation_items est RLS user-only) → bestsellers cassés.
-- L'advisor ERROR security_definer_view sur v_bestsellers est ASSUMÉ.
ALTER VIEW public.tags_with_types SET (security_invoker = true);

COMMENT ON VIEW public.v_bestsellers IS
  'SECURITY DEFINER assumé + documenté (plan remédiation 2026-06-10, D-10) : '
  'la vue agrège reservation_items (RLS user-only) pour sold_30d — en '
  'security_invoker, sold_30d retomberait à 0 pour anon et casserait les '
  'bestsellers (home + recherche). Ne JAMAIS exposer de colonne de coût ici '
  '(vue servie à anon).';

-- =====================================================================
-- Phase 2-B — early-return effective_price (option B actée 2026-06-10).
-- v_product_pricing évalue cette fonction PAR LIGNE (~500 invocations sur
-- les surfaces chaudes) même avec 0 promo active. Sans promo active à p_at,
-- on retourne le prix de base sans les joins targets/brand/range/tag.
-- Bloc complet re-staté : STABLE + SECURITY DEFINER + search_path + grants.
-- 🔒 INVARIANT (testé par src/__tests__/pricingDb.integration.test.ts) :
-- effective_price = prix d'AFFICHAGE/défaut ; reservation_items.unit_price
-- = prix FACTURÉ (snapshot, surcouchable au comptoir) ; la compta lit
-- unit_price, jamais un recalcul d'effective_price.
CREATE OR REPLACE FUNCTION public.effective_price(p_product_id uuid, p_at timestamp with time zone DEFAULT now())
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  -- Early-return : le CASE n'évalue la branche cand QUE s'il existe au moins
  -- une promotion active à p_at (probe EXISTS sur une table minuscule).
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM promotions p
      WHERE p.is_active AND p_at >= p.start_date AND p_at < p.end_date
    )
    THEN COALESCE((SELECT MIN(eff) FROM cand), (SELECT price FROM base))
    ELSE (SELECT price FROM base)
  END;
$function$;

-- Grants re-statés par convention. ⚠️ L'EXECUTE anon est VOULU : la vue
-- v_product_pricing est security_invoker → l'EXECUTE est vérifié contre
-- l'appelant (mémoire promo-pricing-public-view-gotcha). Ne JAMAIS révoquer.
GRANT EXECUTE ON FUNCTION public.effective_price(uuid, timestamp with time zone)
  TO anon, authenticated, service_role;
