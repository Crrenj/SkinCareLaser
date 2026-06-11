-- ======================================================================
-- SCHÉMA — Skincare Laser / FARMAU  ·  dump fidèle du remote (schema public)
-- ======================================================================
-- ⚠️ Source de vérité = supabase/migrations/. Ce fichier est un snapshot de
-- LECTURE régénérable (schema-only) — pratique pour voir tout le schéma d'un
-- coup. Toute modif doit aussi exister dans une migration.
--
-- Régénéré le 2026-06-11 via scripts/db-dump.sh (pg_dump natif de l'hôte,
-- SANS Docker — cf. en-tête du script). Re-dumper : bash scripts/db-dump.sh
-- ======================================================================



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."banner_slot" AS ENUM (
    'hero',
    'banner',
    'card',
    'modal'
);


ALTER TYPE "public"."banner_slot" OWNER TO "postgres";


CREATE TYPE "public"."banner_status" AS ENUM (
    'draft',
    'scheduled',
    'active',
    'paused',
    'expired'
);


ALTER TYPE "public"."banner_status" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'paid',
    'shipped',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."reservation_status" AS ENUM (
    'pending',
    'confirmed',
    'collected',
    'expired',
    'cancelled'
);


ALTER TYPE "public"."reservation_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_to_cart"("p_cart_id" "uuid", "p_product_id" "uuid", "p_quantity" integer, "p_anon_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_stock     INT;
  v_existing  INT;
  v_new_total INT;
BEGIN
  IF p_anon_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND anonymous_id = p_anon_id
  ) THEN
    RAISE EXCEPTION 'Panier non autorisé';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantité invalide' USING ERRCODE = 'check_violation';
  END IF;

  SELECT stock INTO v_stock FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable' USING ERRCODE = 'no_data_found';
  END IF;

  SELECT quantity INTO v_existing FROM public.cart_items
    WHERE cart_id = p_cart_id AND product_id = p_product_id;
  v_existing := COALESCE(v_existing, 0);

  v_new_total := v_existing + p_quantity;

  IF v_stock IS NOT NULL AND v_new_total > v_stock THEN
    RAISE EXCEPTION 'Stock insuffisant' USING ERRCODE = 'check_violation';
  END IF;

  IF v_new_total > 99 THEN
    v_new_total := 99;
  END IF;

  INSERT INTO public.cart_items (cart_id, product_id, quantity)
  VALUES (p_cart_id, p_product_id, v_new_total)
  ON CONFLICT (cart_id, product_id)
  DO UPDATE SET quantity = v_new_total, updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."add_to_cart"("p_cart_id" "uuid", "p_product_id" "uuid", "p_quantity" integer, "p_anon_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_reservation_collection"("p_reservation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_applied int;
BEGIN
  UPDATE public.reservations
     SET stock_applied = true
   WHERE id = p_reservation_id
     AND stock_applied = false
     AND status = 'collected';
  GET DIAGNOSTICS v_applied = ROW_COUNT;
  IF v_applied = 0 THEN
    RETURN;
  END IF;

  UPDATE public.products p
     SET stock = GREATEST(p.stock - agg.qty, 0),
         updated_at = now()
    FROM (
      SELECT product_id, SUM(quantity)::int AS qty
        FROM public.reservation_items
       WHERE reservation_id = p_reservation_id
         AND product_id IS NOT NULL
       GROUP BY product_id
    ) agg
   WHERE p.id = agg.product_id
     AND p.stock IS NOT NULL;

  UPDATE public.reservation_items ri
     SET unit_cost = p.cost_price
    FROM public.products p
   WHERE ri.reservation_id = p_reservation_id
     AND ri.product_id = p.id
     AND ri.unit_cost IS NULL;
END;
$$;


ALTER FUNCTION "public"."apply_reservation_collection"("p_reservation_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."apply_reservation_collection"("p_reservation_id" "uuid") IS 'Décrémente products.stock pour une réservation collected (idempotent via stock_applied) ET snapshot reservation_items.unit_cost = products.cost_price (write-once). Service-role only.';



CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_key" "text", "p_max" integer, "p_window_sec" integer) RETURNS TABLE("allowed" boolean, "retry_after" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_now          TIMESTAMPTZ := NOW();
  v_count        INT;
  v_window_start TIMESTAMPTZ;
  v_window_iv    INTERVAL    := (p_window_sec || ' seconds')::INTERVAL;
BEGIN
  INSERT INTO public.rate_limit_buckets (key, count, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN public.rate_limit_buckets.window_start + v_window_iv < v_now THEN 1
      ELSE public.rate_limit_buckets.count + 1
    END,
    window_start = CASE
      WHEN public.rate_limit_buckets.window_start + v_window_iv < v_now THEN v_now
      ELSE public.rate_limit_buckets.window_start
    END
  RETURNING public.rate_limit_buckets.count, public.rate_limit_buckets.window_start
  INTO v_count, v_window_start;

  -- Cleanup probabiliste (1% des appels) : supprime les buckets
  -- expirés depuis > 1h, évite que la table gonfle indéfiniment
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limit_buckets
    WHERE window_start + INTERVAL '1 hour' < v_now;
  END IF;

  allowed := v_count <= p_max;
  retry_after := GREATEST(0,
    EXTRACT(EPOCH FROM (v_window_start + v_window_iv - v_now))::INT
  );
  RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit"("p_key" "text", "p_max" integer, "p_window_sec" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_banner_positions"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  banner_record RECORD;
  new_pos       INTEGER := 1;
BEGIN
  FOR banner_record IN
    SELECT id FROM public.banners ORDER BY position ASC, created_at ASC
  LOOP
    UPDATE public.banners SET position = new_pos WHERE id = banner_record.id;
    new_pos := new_pos + 1;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."cleanup_banner_positions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_guest_reservation"("p_cart_id" "uuid", "p_anon_id" "uuid", "p_name" "text", "p_phone" "text", "p_email" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "confirmation_token" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_reservation_id uuid;
  v_token          text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_total_items    int;
  v_total_price    numeric(10,2);
  v_currency       text;
BEGIN
  IF p_phone IS NULL OR TRIM(p_phone) = '' THEN
    RAISE EXCEPTION 'Téléphone requis pour réserver' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.carts c
    WHERE c.id = p_cart_id AND c.anonymous_id = p_anon_id AND c.user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Panier introuvable ou non autorisé' USING ERRCODE = 'P0004';
  END IF;

  SELECT SUM(ci.quantity), SUM(ci.quantity * public.effective_price(pr.id, now())), MAX(pr.currency)
    INTO v_total_items, v_total_price, v_currency
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  IF v_total_items IS NULL OR v_total_items = 0 THEN
    RAISE EXCEPTION 'Le panier est vide' USING ERRCODE = 'P0005';
  END IF;

  INSERT INTO public.reservations (
    user_id, source, anonymous_id, confirmation_token, status, expires_at,
    contact_phone, contact_email, contact_name,
    total_items, total_price, currency
  ) VALUES (
    NULL, 'guest', p_anon_id, v_token, 'pending', NOW() + INTERVAL '24 hours',
    TRIM(p_phone),
    NULLIF(TRIM(COALESCE(p_email, '')), ''),
    NULLIF(TRIM(COALESCE(p_name, '')), ''),
    v_total_items, v_total_price, COALESCE(v_currency, 'DOP')
  )
  RETURNING reservations.id INTO v_reservation_id;

  INSERT INTO public.reservation_items (
    reservation_id, product_id, product_name, unit_price, quantity
  )
  SELECT v_reservation_id, ci.product_id, pr.name, public.effective_price(pr.id, now()), ci.quantity
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;

  RETURN QUERY SELECT v_reservation_id, v_token;
END;
$$;


ALTER FUNCTION "public"."create_guest_reservation"("p_cart_id" "uuid", "p_anon_id" "uuid", "p_name" "text", "p_phone" "text", "p_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_guest_reservation"("p_cart_id" "uuid", "p_anon_id" "uuid", "p_name" "text", "p_phone" "text", "p_email" "text") IS 'Convertit le panier d''un invité (anonymous_id) en réservation pending (TTL 24h), user_id NULL, source guest. unit_price = prix effectif (promo) au moment de la réservation. Service-role only.';



CREATE OR REPLACE FUNCTION "public"."create_reservation"("p_cart_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id         UUID := auth.uid();
  v_reservation_id  UUID;
  v_phone           TEXT;
  v_email           TEXT;
  v_name            TEXT;
  v_total_items     INT;
  v_total_price     NUMERIC(10,2);
  v_currency        TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour réserver'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE user_id = v_user_id
      AND status IN ('pending', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà une réservation active'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT
    p.phone,
    u.email,
    COALESCE(
      NULLIF(TRIM(p.display_name), ''),
      NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''),
      u.email
    )
  INTO v_phone, v_email, v_name
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = v_user_id;

  IF v_phone IS NULL OR TRIM(v_phone) = '' THEN
    RAISE EXCEPTION 'Téléphone requis pour réserver. Ajoutez-le à votre profil.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_email IS NULL OR TRIM(v_email) = '' THEN
    RAISE EXCEPTION 'Email manquant sur le compte'
      USING ERRCODE = 'P0003';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Panier introuvable ou non autorisé'
      USING ERRCODE = 'P0004';
  END IF;

  SELECT
    SUM(ci.quantity),
    SUM(ci.quantity * public.effective_price(pr.id, now())),
    MAX(pr.currency)
  INTO v_total_items, v_total_price, v_currency
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  IF v_total_items IS NULL OR v_total_items = 0 THEN
    RAISE EXCEPTION 'Le panier est vide'
      USING ERRCODE = 'P0005';
  END IF;

  INSERT INTO public.reservations (
    user_id, status, expires_at,
    contact_phone, contact_email, contact_name,
    total_items, total_price, currency
  ) VALUES (
    v_user_id,
    'pending',
    NOW() + INTERVAL '24 hours',
    v_phone, v_email, v_name,
    v_total_items, v_total_price, COALESCE(v_currency, 'DOP')
  )
  RETURNING id INTO v_reservation_id;

  INSERT INTO public.reservation_items (
    reservation_id, product_id, product_name, unit_price, quantity
  )
  SELECT
    v_reservation_id, ci.product_id, pr.name, public.effective_price(pr.id, now()), ci.quantity
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;

  RETURN v_reservation_id;
END;
$$;


ALTER FUNCTION "public"."create_reservation"("p_cart_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_reservation"("p_cart_id" "uuid") IS 'Convertit le panier de l''utilisateur connecté (auth.uid()) en réservation pending (TTL 24h). 1 active par compte (garde P0001). unit_price = prix effectif (promo) au moment de la réservation. authenticated + service_role.';



CREATE OR REPLACE FUNCTION "public"."create_ticket"("p_email" "text", "p_category" "text", "p_subject" "text", "p_message" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id    UUID;
  v_category   TEXT;
  v_message_id UUID;
BEGIN
  v_category := CASE
    WHEN p_category IN ('bug','order','product','account','other') THEN p_category
    ELSE 'other'
  END;

  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  INSERT INTO public.contact_messages (user_email, user_id, category, subject, message)
  VALUES (p_email, v_user_id, v_category, p_subject, p_message)
  RETURNING id INTO v_message_id;

  RETURN json_build_object('success', true, 'message_id', v_message_id);
END;
$$;


ALTER FUNCTION "public"."create_ticket"("p_email" "text", "p_category" "text", "p_subject" "text", "p_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."effective_price"("p_product_id" "uuid", "p_at" timestamp with time zone DEFAULT "now"()) RETURNS numeric
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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
$$;


ALTER FUNCTION "public"."effective_price"("p_product_id" "uuid", "p_at" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."effective_price"("p_product_id" "uuid", "p_at" timestamp with time zone) IS 'Prix effectif (DOP) d''un produit a l''instant p_at : meilleur prix client (MIN) sur toutes les promos actives qui le ciblent (produit/marque/gamme/tag), sinon prix de base. round 2 decimales. N''expose jamais le cout.';



CREATE OR REPLACE FUNCTION "public"."expire_stale_reservations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.reservations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Heartbeat : trace de la dernière exécution (lue par /api/health).
  INSERT INTO public.cron_heartbeats (job_name, last_run_at, last_result)
  VALUES ('expire-stale-reservations', now(), v_count::text)
  ON CONFLICT (job_name) DO UPDATE
    SET last_run_at = EXCLUDED.last_run_at,
        last_result = EXCLUDED.last_result;

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."expire_stale_reservations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."expire_stale_reservations"() IS 'Passe les réservations pending dont expires_at est dépassé à status=expired. Appelée par pg_cron toutes les 5 min.';



CREATE OR REPLACE FUNCTION public.get_catalogue_page(
  p_brands    text[]  DEFAULT '{}',
  p_ranges    text[]  DEFAULT '{}',
  p_pairs     jsonb   DEFAULT '{}'::jsonb,
  p_tags      jsonb   DEFAULT '{}'::jsonb,
  p_q         text    DEFAULT '',
  p_sort      text    DEFAULT 'bestsellers',
  p_page      int     DEFAULT 1,
  p_page_size int     DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_q_like    text;   -- motif ILIKE échappé (NULL si q vide → pas de filtre)
  v_sort      text;
  v_page_size int;
  v_tree      boolean; -- mode arbre : au moins une paire (marque, gammes[]) valide
BEGIN
  -- Normalisation des entrées (la fonction est exposée à anon : tout doit
  -- être défensif).
  p_brands := COALESCE(p_brands, '{}');
  p_ranges := COALESCE(p_ranges, '{}');
  p_pairs  := CASE WHEN jsonb_typeof(COALESCE(p_pairs, '{}'::jsonb)) = 'object'
                   THEN p_pairs ELSE '{}'::jsonb END;
  p_tags   := CASE WHEN jsonb_typeof(COALESCE(p_tags, '{}'::jsonb)) = 'object'
                   THEN p_tags ELSE '{}'::jsonb END;

  -- ⚠️ Pas de `jsonb_typeof = 'array' AND jsonb_array_length(...)` ici : le
  -- AND ne court-circuite pas forcément, une valeur scalaire ferait crasher.
  v_tree := EXISTS (
    SELECT 1 FROM jsonb_each(p_pairs) AS f(brand_name, ranges)
    WHERE jsonb_array_length(
            CASE WHEN jsonb_typeof(f.ranges) = 'array'
                 THEN f.ranges ELSE '[]'::jsonb END
          ) > 0
  );

  v_sort := CASE
    WHEN p_sort IN ('bestsellers', 'az', 'za', 'price-asc', 'price-desc') THEN p_sort
    ELSE 'bestsellers'
  END;

  v_page_size := GREATEST(1, COALESCE(p_page_size, 24));

  -- q : échappe les métacaractères LIKE (\ d'abord, puis % et _) sur la valeur
  -- DÉJÀ normalisée par le JS, puis %…% pour la recherche en sous-chaîne.
  IF p_q IS NOT NULL AND length(trim(p_q)) > 0 THEN
    v_q_like := '%' ||
      replace(replace(replace(p_q, '\', '\\'), '%', '\%'), '_', '\_') ||
      '%';
  END IF;

  RETURN (
    WITH
    -- ------------------------------------------------------------------
    -- base : produits actifs + noms marque/gamme dénormalisés, q appliqué
    -- (q est commun à TOUT : items, total ET facettes).
    -- ------------------------------------------------------------------
    base AS (
      SELECT
        p.id, p.slug, p.name, p.price, p.old_price, p.currency, p.stock,
        p.is_new, p.is_featured, p.volume,
        COALESCE(b.name, '') AS brand_name,
        COALESCE(r.name, '') AS range_name
      FROM products p
      LEFT JOIN ranges r ON r.id = p.range_id
      LEFT JOIN brands b ON b.id = r.brand_id
      WHERE p.is_active = true
        AND (v_q_like IS NULL OR p.name_search ILIKE v_q_like ESCAPE '\')
    ),
    -- ------------------------------------------------------------------
    -- filtered : base + groupe marque·gamme + tags (OR intra-type /
    -- AND inter-types via double NOT EXISTS).
    -- Groupe marque·gamme :
    --   mode arbre (v_tree)  → OR : marque pleine OU gamme nue OU paire ;
    --   mode hérité          → AND brand×range, à l'identique de la v1.
    -- ------------------------------------------------------------------
    filtered AS (
      SELECT cb.*
      FROM base cb
      WHERE (
          CASE WHEN v_tree THEN
            cb.brand_name = ANY(p_brands)
            OR (cardinality(p_ranges) > 0 AND cb.range_name = ANY(p_ranges))
            OR EXISTS (
              SELECT 1 FROM jsonb_each(p_pairs) AS pr(pair_brand, pair_ranges)
              WHERE pr.pair_brand = cb.brand_name
                AND jsonb_typeof(pr.pair_ranges) = 'array'
                AND cb.range_name IN (SELECT jsonb_array_elements_text(pr.pair_ranges))
            )
          ELSE
            (cardinality(p_brands) = 0 OR cb.brand_name = ANY(p_brands))
            AND (cardinality(p_ranges) = 0 OR cb.range_name = ANY(p_ranges))
          END
        )
        AND NOT EXISTS (
          -- Un type sélectionné (tableau non vide) que le produit ne
          -- satisfait PAS → produit exclu.
          SELECT 1
          FROM jsonb_each(p_tags) AS f(type_slug, names)
          WHERE jsonb_typeof(f.names) = 'array'
            AND jsonb_array_length(f.names) > 0
            AND NOT EXISTS (
              SELECT 1
              FROM product_tags pt
              JOIN tags t       ON t.id = pt.tag_id
              JOIN tag_types tt ON tt.id = t.tag_type_id
              WHERE pt.product_id = cb.id
                AND tt.slug = f.type_slug
                AND t.name IN (SELECT jsonb_array_elements_text(f.names))
            )
        )
    ),
    totals AS (
      SELECT count(*)::int AS total FROM filtered
    ),
    -- page effective clampée : LEAST(GREATEST(p_page,1), total_pages).
    paging AS (
      SELECT t.total,
             LEAST(
               GREATEST(COALESCE(p_page, 1), 1),
               GREATEST(1, CEIL(t.total::numeric / v_page_size))::int
             ) AS page
      FROM totals t
    ),
    -- ------------------------------------------------------------------
    -- Tri (fidèle à catalogueFilters.ts) + ordinal stable :
    --   bestsellers → featured d'abord, puis nom ASC ; az/za → nom ;
    --   price-asc/desc → PRIX EFFECTIF (le JS trie le prix promo-ajusté).
    -- Tiebreak final déterministe sur id.
    -- ------------------------------------------------------------------
    ordered AS (
      SELECT cf.*,
             row_number() OVER (ORDER BY
               CASE WHEN v_sort = 'bestsellers'
                    THEN (cf.is_featured IS NOT TRUE) END ASC,
               CASE WHEN v_sort = 'price-asc'
                    THEN public.effective_price(cf.id) END ASC NULLS LAST,
               CASE WHEN v_sort = 'price-desc'
                    THEN public.effective_price(cf.id) END DESC NULLS LAST,
               CASE WHEN v_sort = 'za' THEN cf.name END DESC,
               CASE WHEN v_sort IN ('bestsellers', 'az', 'price-asc', 'price-desc')
                    THEN cf.name END ASC,
               cf.id ASC
             ) AS ord
      FROM filtered cf
    ),
    page_slice AS (
      SELECT o.*
      FROM ordered o, paging pg
      WHERE o.ord >  (pg.page - 1) * v_page_size
        AND o.ord <= pg.page * v_page_size
    ),
    items AS (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'id',              ps.id,
               'slug',            ps.slug,
               'name',            ps.name,
               'price',           ps.price,
               'old_price',       ps.old_price,
               'currency',        ps.currency,
               'stock',           ps.stock,
               'is_new',          ps.is_new,
               'is_featured',     ps.is_featured,
               'volume',          ps.volume,
               'effective_price', public.effective_price(ps.id),
               'brand',           ps.brand_name,
               'range',           ps.range_name,
               'images', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object('url', pi.url, 'alt', pi.alt)
                                  ORDER BY pi.id)
                 FROM product_images pi
                 WHERE pi.product_id = ps.id
               ), '[]'::jsonb),
               'tags', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object('label', t.name, 'category', tt.slug))
                 FROM product_tags pt
                 JOIN tags t       ON t.id = pt.tag_id
                 JOIN tag_types tt ON tt.id = t.tag_type_id
                 WHERE pt.product_id = ps.id
               ), '[]'::jsonb)
             ) ORDER BY ps.ord), '[]'::jsonb) AS j
      FROM page_slice ps
    ),
    -- ------------------------------------------------------------------
    -- FACETTES.
    -- Marques & gammes = facettes du groupe marque·gamme → excluent le
    -- groupe ENTIER (brand + range + pairs), n'appliquent que tags (+ q,
    -- déjà dans base). Vocabulaires complets → entrées sans match = 0.
    -- ------------------------------------------------------------------
    -- 1) Marques : vocabulaire = marques avec ≥1 produit actif.
    brand_vocab AS (
      SELECT DISTINCT b.name AS brand_name
      FROM brands b
      JOIN ranges r   ON r.brand_id = b.id
      JOIN products p ON p.range_id = r.id AND p.is_active = true
    ),
    group_pool AS (  -- [tags + q], SANS le groupe marque·gamme — partagé
      SELECT cb.brand_name, cb.range_name
      FROM base cb
      WHERE NOT EXISTS (
          SELECT 1 FROM jsonb_each(p_tags) AS f(type_slug, names)
          WHERE jsonb_typeof(f.names) = 'array'
            AND jsonb_array_length(f.names) > 0
            AND NOT EXISTS (
              SELECT 1 FROM product_tags pt
              JOIN tags t       ON t.id = pt.tag_id
              JOIN tag_types tt ON tt.id = t.tag_type_id
              WHERE pt.product_id = cb.id AND tt.slug = f.type_slug
                AND t.name IN (SELECT jsonb_array_elements_text(f.names))
            )
        )
    ),
    brands_facet AS (
      SELECT COALESCE(jsonb_object_agg(bv.brand_name, COALESCE(bp.n, 0)), '{}'::jsonb) AS j
      FROM brand_vocab bv
      LEFT JOIN (
        SELECT brand_name, count(*) AS n FROM group_pool GROUP BY brand_name
      ) bp ON bp.brand_name = bv.brand_name
    ),
    -- 2) Gammes : vocabulaire = gammes avec ≥1 produit actif.
    range_vocab AS (
      SELECT DISTINCT r.name AS range_name
      FROM ranges r
      JOIN products p ON p.range_id = r.id AND p.is_active = true
    ),
    ranges_facet AS (
      SELECT COALESCE(jsonb_object_agg(rv.range_name, COALESCE(rp.n, 0)), '{}'::jsonb) AS j
      FROM range_vocab rv
      LEFT JOIN (
        SELECT range_name, count(*) AS n FROM group_pool GROUP BY range_name
      ) rp ON rp.range_name = rv.range_name
    ),
    -- 3) Tags : vocabulaire = TOUS les tags (même non utilisés → 0), groupés
    --    par tag_types.slug. Count d'un tag du type X = produits matchant
    --    [groupe marque·gamme + q + les AUTRES types] ET portant ce tag.
    --    ⚠️ tag_base_pool applique le groupe marque·gamme EN ENTIER (mode
    --    arbre compris) : les tags sont une autre famille → AND voulu.
    tag_vocab AS (
      SELECT tt.slug AS type_slug, t.id AS tag_id, t.name AS tag_name
      FROM tags t JOIN tag_types tt ON tt.id = t.tag_type_id
    ),
    tag_base_pool AS (  -- base + groupe marque·gamme (+ q via base).
      SELECT cb.id
      FROM base cb
      WHERE (
        CASE WHEN v_tree THEN
          cb.brand_name = ANY(p_brands)
          OR (cardinality(p_ranges) > 0 AND cb.range_name = ANY(p_ranges))
          OR EXISTS (
            SELECT 1 FROM jsonb_each(p_pairs) AS pr(pair_brand, pair_ranges)
            WHERE pr.pair_brand = cb.brand_name
              AND jsonb_typeof(pr.pair_ranges) = 'array'
              AND cb.range_name IN (SELECT jsonb_array_elements_text(pr.pair_ranges))
          )
        ELSE
          (cardinality(p_brands) = 0 OR cb.brand_name = ANY(p_brands))
          AND (cardinality(p_ranges) = 0 OR cb.range_name = ANY(p_ranges))
        END
      )
    ),
    tag_counts AS (
      SELECT tv.type_slug, tv.tag_name, count(*) AS n
      FROM tag_vocab tv
      JOIN product_tags pt  ON pt.tag_id = tv.tag_id
      JOIN tag_base_pool bp ON bp.id = pt.product_id
      WHERE NOT EXISTS (
        -- un AUTRE type sélectionné (≠ type courant) non satisfait → exclu.
        SELECT 1 FROM jsonb_each(p_tags) AS f(type_slug, names)
        WHERE f.type_slug <> tv.type_slug
          AND jsonb_typeof(f.names) = 'array'
          AND jsonb_array_length(f.names) > 0
          AND NOT EXISTS (
            SELECT 1 FROM product_tags pt2
            JOIN tags t2       ON t2.id = pt2.tag_id
            JOIN tag_types tt2 ON tt2.id = t2.tag_type_id
            WHERE pt2.product_id = pt.product_id AND tt2.slug = f.type_slug
              AND t2.name IN (SELECT jsonb_array_elements_text(f.names))
          )
      )
      GROUP BY tv.type_slug, tv.tag_name
    ),
    tags_facet AS (
      SELECT COALESCE(jsonb_object_agg(per_type.type_slug, per_type.names), '{}'::jsonb) AS j
      FROM (
        SELECT tv.type_slug,
               jsonb_object_agg(tv.tag_name, COALESCE(c.n, 0)) AS names
        FROM tag_vocab tv
        LEFT JOIN tag_counts c
          ON c.type_slug = tv.type_slug AND c.tag_name = tv.tag_name
        GROUP BY tv.type_slug
      ) per_type
    )
    SELECT jsonb_build_object(
      'total',     (SELECT total FROM totals),
      'total_all', (SELECT count(*)::int FROM products WHERE is_active = true),
      'page',      (SELECT page FROM paging),
      'items',     (SELECT j FROM items),
      'facets',    jsonb_build_object(
        'brands', (SELECT j FROM brands_facet),
        'ranges', (SELECT j FROM ranges_facet),
        'tags',   (SELECT j FROM tags_facet)
      )
    )
  );
END;
$$;


ALTER FUNCTION "public"."get_catalogue_page"("p_brands" "text"[], "p_ranges" "text"[], "p_pairs" "jsonb", "p_tags" "jsonb", "p_q" "text", "p_sort" "text", "p_page" integer, "p_page_size" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_catalogue_page"("p_brands" "text"[], "p_ranges" "text"[], "p_pairs" "jsonb", "p_tags" "jsonb", "p_q" "text", "p_sort" "text", "p_page" integer, "p_page_size" integer) IS 'Catalogue server-side v2 : groupe marque·gamme en OR quand p_pairs (paires marque:gamme qualifiees) est non vide, sinon AND herite ; tags OR-intra AND-inter ; q accent-insensible ; tri ; pagination ; facettes (marques/gammes excluent le groupe entier, tags excluent leur type). SECURITY INVOKER, is_active reaffirme, aucun cout expose. Redesign rail editorial 2026-06-11.';



CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_today_utc date := (now() AT TIME ZONE 'UTC')::date;
  v_start_utc date := v_today_utc - 13;  -- fenêtre 14 j (current + previous), inclusif
BEGIN
  RETURN jsonb_build_object(

    -- ── Revenue : chart 14 j (previous = 7 d'avant, current = 7 derniers) ──
    -- Reproduit fetchRevenue : buckets par jour UTC, status ≠ cancelled.
    -- reserved = total_price ; confirmed = total_price si status ∈ (confirmed,
    -- collected). On matérialise les 14 jours (même vides) pour un chart
    -- continu, puis previous=[idx 0..6] / current=[idx 7..13].
    'revenue', (
      WITH days AS (
        SELECT g::date AS d, (row_number() OVER (ORDER BY g)) - 1 AS idx
        FROM generate_series(v_start_utc, v_today_utc, interval '1 day') g
      ),
      agg AS (
        SELECT (created_at AT TIME ZONE 'UTC')::date AS d,
               sum(COALESCE(total_price, 0)) AS reserved,
               sum(COALESCE(total_price, 0)) FILTER (WHERE status IN ('confirmed', 'collected')) AS confirmed
        FROM reservations
        WHERE status <> 'cancelled'
          AND (created_at AT TIME ZONE 'UTC')::date >= v_start_utc
        GROUP BY 1
      ),
      points AS (
        SELECT days.idx,
               jsonb_build_object(
                 'date',      to_char(days.d, 'YYYY-MM-DD'),
                 'reserved',  COALESCE(agg.reserved, 0),
                 'confirmed', COALESCE(agg.confirmed, 0)
               ) AS pt
        FROM days LEFT JOIN agg ON agg.d = days.d
      )
      SELECT jsonb_build_object(
        'previous', COALESCE((SELECT jsonb_agg(pt ORDER BY idx) FROM points WHERE idx < 7),  '[]'::jsonb),
        'current',  COALESCE((SELECT jsonb_agg(pt ORDER BY idx) FROM points WHERE idx >= 7), '[]'::jsonb)
      )
    ),

    -- ── Inventaire : source unique = get_inventory_valuation() ──
    'inventory', public.get_inventory_valuation(),

    -- ── Catálogo : readiness (complétude) ──
    'readiness', (
      WITH active AS (
        SELECT id, range_id, is_featured, is_new, old_price, volume, inci,
               pharmacist_advice, technical_pdf_url, benefits, price
        FROM products WHERE is_active = true
      ),
      counts AS (
        SELECT
          count(*) AS active_count,
          count(*) FILTER (WHERE is_featured) AS featured,
          count(*) FILTER (WHERE is_new) AS is_new,
          count(*) FILTER (WHERE old_price IS NOT NULL) AS promo,
          count(*) FILTER (WHERE price = 100) AS placeholder,
          count(*) FILTER (WHERE volume IS NOT NULL) AS with_volume,
          count(*) FILTER (WHERE inci IS NOT NULL) AS with_inci,
          count(*) FILTER (WHERE pharmacist_advice IS NOT NULL) AS with_advice,
          count(*) FILTER (WHERE technical_pdf_url IS NOT NULL) AS with_pdf,
          count(*) FILTER (WHERE benefits IS NOT NULL) AS with_benefits,
          count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM product_images pi WHERE pi.product_id = active.id
          )) AS with_image
        FROM active
      ),
      -- nb de marques distinctes ayant ≥1 produit actif (= brandBars.length).
      brand_count AS (
        SELECT count(DISTINCT r.brand_id) AS n
        FROM active a JOIN ranges r ON r.id = a.range_id
        WHERE r.brand_id IS NOT NULL
      ),
      -- 7 métriques de couverture, MÊME ORDRE que le JS (score identique).
      metrics AS (
        SELECT jsonb_build_array(
          jsonb_build_object('label', 'Imagen',               'covered', c.with_image,                  'total', c.active_count),
          jsonb_build_object('label', 'Precio configurado',   'covered', c.active_count - c.placeholder, 'total', c.active_count),
          jsonb_build_object('label', 'Volumen',              'covered', c.with_volume,                 'total', c.active_count),
          jsonb_build_object('label', 'Beneficios',           'covered', c.with_benefits,               'total', c.active_count),
          jsonb_build_object('label', 'Consejo farmacéutico', 'covered', c.with_advice,                 'total', c.active_count),
          jsonb_build_object('label', 'INCI',                 'covered', c.with_inci,                   'total', c.active_count),
          jsonb_build_object('label', 'Ficha técnica PDF',    'covered', c.with_pdf,                    'total', c.active_count)
        ) AS arr,
        -- score = round( moyenne(covered/total sur 7 métriques) × 100 ).
        -- total = active_count partout → si 0 produit, score = 0.
        CASE WHEN c.active_count = 0 THEN 0 ELSE round((
            (c.with_image::numeric / c.active_count)
          + ((c.active_count - c.placeholder)::numeric / c.active_count)
          + (c.with_volume::numeric / c.active_count)
          + (c.with_benefits::numeric / c.active_count)
          + (c.with_advice::numeric / c.active_count)
          + (c.with_inci::numeric / c.active_count)
          + (c.with_pdf::numeric / c.active_count)
        ) / 7 * 100) END AS score
        FROM counts c
      )
      SELECT jsonb_build_object(
        'score',          (SELECT score FROM metrics),
        'activeProducts', (SELECT active_count FROM counts),
        'brands',         (SELECT n FROM brand_count),
        'ranges',         (SELECT count(*) FROM ranges),
        'featured',       (SELECT featured FROM counts),
        'isNew',          (SELECT is_new FROM counts),
        'promo',          (SELECT promo FROM counts),
        'metrics',        (SELECT arr FROM metrics)
      )
    ),

    -- ── Marcas : barres par marque (produits actifs + unités), produits>0, desc ──
    'brandBars', (
      SELECT COALESCE(jsonb_agg(
               jsonb_build_object('name', name, 'products', products, 'units', units)
               ORDER BY products DESC, name ASC
             ), '[]'::jsonb)
      FROM (
        SELECT b.name, count(p.id) AS products, COALESCE(sum(p.stock), 0) AS units
        FROM brands b
        JOIN ranges r   ON r.brand_id = b.id
        JOIN products p ON p.range_id = r.id AND p.is_active = true
        GROUP BY b.id, b.name
        HAVING count(p.id) > 0
      ) t
    ),

    -- ── Reservas por estado ──
    -- byStatus garde TOUJOURS les 5 clés (vocabulaire fixe → 0 si absent).
    'reservationStatus', (
      WITH agg AS (
        SELECT status::text AS st,
               count(*) AS n,
               sum(COALESCE(total_price, 0)) AS revenue,
               sum(COALESCE(total_items, 0)) AS items
        FROM reservations GROUP BY status
      ),
      buckets AS (
        SELECT s.st,
               COALESCE(a.n, 0)        AS n,
               COALESCE(a.revenue, 0)  AS revenue,
               COALESCE(a.items, 0)    AS items
        FROM (VALUES ('pending'),('confirmed'),('collected'),('expired'),('cancelled')) s(st)
        LEFT JOIN agg a ON a.st = s.st
      ),
      tot AS (
        SELECT
          COALESCE(sum(n), 0) AS total,
          COALESCE(sum(n)       FILTER (WHERE st IN ('pending','confirmed')),   0) AS active_count,
          COALESCE(sum(revenue) FILTER (WHERE st IN ('confirmed','collected')), 0) AS confirmed_revenue,
          COALESCE(sum(revenue) FILTER (WHERE st <> 'cancelled'),               0) AS noncancel_revenue,
          COALESCE(sum(n)       FILTER (WHERE st <> 'cancelled'),               0) AS noncancel_count
        FROM buckets
      )
      SELECT jsonb_build_object(
        'byStatus', (
          SELECT jsonb_object_agg(st, jsonb_build_object('n', n, 'revenue', revenue, 'items', items))
          FROM buckets
        ),
        'totalReservations', (SELECT total FROM tot),
        'activeCount',       (SELECT active_count FROM tot),
        'confirmedRevenue',  (SELECT confirmed_revenue FROM tot),
        'avgBasket', CASE WHEN (SELECT noncancel_count FROM tot) > 0
                          THEN round((SELECT noncancel_revenue FROM tot)::numeric / (SELECT noncancel_count FROM tot))
                          ELSE 0 END
      )
    ),

    -- ── Clientes ──
    'customers', (
      SELECT jsonb_build_object(
        'total',     count(*),
        'withPhone', count(*) FILTER (WHERE phone IS NOT NULL AND length(trim(phone)) > 0),
        'new7d',     count(*) FILTER (WHERE created_at >= now() - interval '7 days'),
        'new30d',    count(*) FILTER (WHERE created_at >= now() - interval '30 days'),
        'byLocale',  COALESCE((
          SELECT jsonb_agg(jsonb_build_object('locale', loc, 'n', n) ORDER BY n DESC, loc ASC)
          FROM (
            SELECT COALESCE(preferred_locale, '—') AS loc, count(*) AS n
            FROM profiles GROUP BY 1
          ) bl
        ), '[]'::jsonb)
      )
      FROM profiles
    ),

    -- ── Engagement (carritos, wishlist, newsletter) ──
    'engagement', jsonb_build_object(
      'totalCarts',          (SELECT count(*) FROM carts),
      'userCarts',           (SELECT count(*) FROM carts WHERE user_id IS NOT NULL),
      'activeCarts',         (SELECT count(DISTINCT cart_id) FROM cart_items),
      'cartUnits',           (SELECT COALESCE(sum(COALESCE(quantity, 0)), 0) FROM cart_items),
      'wishlists',           (SELECT count(*) FROM wishlists),
      'wishlistProducts',    (SELECT count(DISTINCT product_id) FROM wishlists),
      'newsletter',          (SELECT count(*) FROM newsletter_subscribers),
      'newsletterConfirmed', (SELECT count(*) FROM newsletter_subscribers WHERE confirmed_at IS NOT NULL)
    ),

    -- ── Contenido y taxonomía ──
    'content', jsonb_build_object(
      'posts',          (SELECT count(*) FROM posts),
      'postsPublished', (SELECT count(*) FROM posts WHERE is_published),
      'banners',        (SELECT count(*) FROM banners),
      'bannersActive',  (SELECT count(*) FROM banners WHERE is_active),
      'tags',           (SELECT count(*) FROM tags),
      'tagTypes',       (SELECT count(*) FROM tag_types),
      'productTags',    (SELECT count(*) FROM product_tags)
    ),

    -- ── Bandeja (mensajes) ──
    'inbox', jsonb_build_object(
      'total',  (SELECT count(*) FROM contact_messages),
      'unread', (SELECT count(*) FROM contact_messages WHERE status = 'open')
    )
  );
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_stats"() IS 'Tous les agrégats du tableau de bord admin en 1 appel (revenue chart, readiness, inventario, marcas, reservas por estado, clientes, engagement, contenido, bandeja). SERVICE-ROLE ONLY (agrège cost_price via get_inventory_valuation). Phase 6 remediation 2026-06-10.';



CREATE OR REPLACE FUNCTION "public"."get_inventory_valuation"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT jsonb_build_object(
    'productsActive',    count(*),
    'units',             COALESCE(sum(COALESCE(stock, 0)), 0),
    'retailValue',       COALESCE(sum(COALESCE(price, 0) * COALESCE(stock, 0)), 0),
    'costValue',         COALESCE(sum(cost_price * COALESCE(stock, 0)) FILTER (WHERE cost_price IS NOT NULL), 0),
    'productsWithCost',  count(*) FILTER (WHERE cost_price IS NOT NULL),
    'placeholderPriced', count(*) FILTER (WHERE price = 100),
    -- Distribution (seuils IDENTIQUES au JS : s=0 → oos ; 0<s<5 → low ; sinon
    -- inStock). stock NULL = 0 côté JS (p.stock ?? 0) → COALESCE(stock,0).
    'inStock',           count(*) FILTER (WHERE COALESCE(stock, 0) >= 5),
    'low',               count(*) FILTER (WHERE COALESCE(stock, 0) > 0 AND COALESCE(stock, 0) < 5),
    'oos',               count(*) FILTER (WHERE COALESCE(stock, 0) = 0)
  )
  FROM products
  WHERE is_active = true;
$$;


ALTER FUNCTION "public"."get_inventory_valuation"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_inventory_valuation"() IS 'Valorisation inventaire courant (détail + coût + distribution stock). SERVICE-ROLE ONLY (expose cost_price). Phase 6 remediation 2026-06-10.';



CREATE OR REPLACE FUNCTION "public"."get_messages_stats"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total',       COUNT(*),
    'open',        COUNT(*) FILTER (WHERE status = 'open'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'resolved',    COUNT(*) FILTER (WHERE status = 'resolved'),
    'closed',      COUNT(*) FILTER (WHERE status = 'closed'),
    'today',       COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE),
    'this_week',   COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')
  ) INTO v_stats
  FROM public.contact_messages;
  RETURN v_stats;
END;
$$;


ALTER FUNCTION "public"."get_messages_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_cart"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_anonymous_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_cart_id UUID;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id;
  ELSIF p_anonymous_id IS NOT NULL THEN
    SELECT id INTO v_cart_id FROM public.carts WHERE anonymous_id = p_anonymous_id;
  END IF;

  IF v_cart_id IS NULL THEN
    INSERT INTO public.carts (user_id, anonymous_id)
    VALUES (p_user_id, p_anonymous_id)
    RETURNING id INTO v_cart_id;
  END IF;

  RETURN v_cart_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_cart"("p_user_id" "uuid", "p_anonymous_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO public.profiles (
    id, role,
    display_name, first_name, last_name, phone, birth_date
  )
  VALUES (
    NEW.id, 'user',
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'),  ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'),      ''),
    NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."immutable_unaccent"("p_text" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT PARALLEL SAFE
    SET "search_path" TO ''
    AS $$ SELECT extensions.unaccent('extensions.unaccent'::regdictionary, p_text) $$;


ALTER FUNCTION "public"."immutable_unaccent"("p_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_admin"("check_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = check_user_id
  );
$$;


ALTER FUNCTION "public"."is_user_admin"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."merge_anon_cart_to_user"("p_anon_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_anon_cart_id uuid;
  v_user_cart_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_anon_cart_id
  FROM public.carts
  WHERE anonymous_id = p_anon_id AND user_id IS NULL
  LIMIT 1;

  IF v_anon_cart_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_user_cart_id
  FROM public.carts WHERE user_id = v_user_id LIMIT 1;

  IF v_user_cart_id IS NULL THEN
    UPDATE public.carts
    SET user_id = v_user_id, anonymous_id = NULL
    WHERE id = v_anon_cart_id;
    RETURN v_anon_cart_id;
  ELSE
    INSERT INTO public.cart_items (cart_id, product_id, quantity)
    SELECT v_user_cart_id, product_id, quantity
    FROM public.cart_items
    WHERE cart_id = v_anon_cart_id
    ON CONFLICT (cart_id, product_id) DO UPDATE
      SET quantity = public.cart_items.quantity + EXCLUDED.quantity,
          updated_at = NOW();
    DELETE FROM public.carts WHERE id = v_anon_cart_id;
    RETURN v_user_cart_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."merge_anon_cart_to_user"("p_anon_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_expired_data"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_newsletter INT := 0;
  v_messages   INT := 0;
  v_total      INT := 0;
BEGIN
  -- (a) Inscriptions newsletter jamais confirmées, token expiré depuis > 30j.
  --     confirmed_at IS NULL → l'email n'a jamais validé le double opt-in.
  --     token_expires_at < now() - 30j → fenêtre de confirmation largement
  --     dépassée (le lien de confirmation ne marche plus depuis longtemps).
  DELETE FROM public.newsletter_subscribers
  WHERE confirmed_at IS NULL
    AND token_expires_at IS NOT NULL
    AND token_expires_at < (now() - interval '30 days');
  GET DIAGNOSTICS v_newsletter = ROW_COUNT;

  -- (b) Tickets support terminés (clos/résolus) de plus de 24 mois.
  DELETE FROM public.contact_messages
  WHERE status IN ('closed', 'resolved')
    AND created_at < (now() - interval '24 months');
  GET DIAGNOSTICS v_messages = ROW_COUNT;

  v_total := v_newsletter + v_messages;

  -- Heartbeat : trace de la dernière exécution (même pattern que
  -- expire_stale_reservations / migration 20260610190000). Détail dans
  -- last_result pour le debug (newsletter + messages purgés).
  INSERT INTO public.cron_heartbeats (job_name, last_run_at, last_result)
  VALUES (
    'purge-expired-data',
    now(),
    format('newsletter=%s messages=%s', v_newsletter, v_messages)
  )
  ON CONFLICT (job_name) DO UPDATE
    SET last_run_at = EXCLUDED.last_run_at,
        last_result = EXCLUDED.last_result;

  RETURN v_total;
END;
$$;


ALTER FUNCTION "public"."purge_expired_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recompute_cost_price"("p_product_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE public.products p
     SET cost_price = (
       SELECT round(SUM(unit_cost * quantity) / NULLIF(SUM(quantity), 0), 2)
         FROM public.stock_entries WHERE product_id = p_product_id
     ),
     updated_at = now()
   WHERE p.id = p_product_id;
END;
$$;


ALTER FUNCTION "public"."recompute_cost_price"("p_product_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."recompute_cost_price"("p_product_id" "uuid") IS 'Réconciliation : recalcule cost_price = moyenne pondérée à vie sur stock_entries. Service-role only.';



CREATE OR REPLACE FUNCTION "public"."record_stock_entries"("p_items" "jsonb", "p_supplier_name" "text", "p_supplier_rnc" "text", "p_ncf" "text", "p_invoice_date" "date", "p_note" "text", "p_created_by" "uuid", "p_client_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_item     jsonb;
  v_qty      int;
  v_cost     numeric;
  rec        record;
  v_old_stock int;
  v_old_cost  numeric(10,2);
  v_new_cost  numeric(10,2);
  v_written   jsonb := '[]'::jsonb;
BEGIN
  IF p_client_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.stock_entries WHERE client_token = p_client_token
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty  := (v_item->>'quantity')::int;
    v_cost := (v_item->>'unit_cost')::numeric;
    IF (v_item->>'product_id') IS NULL THEN
      RAISE EXCEPTION 'product_id manquant' USING ERRCODE = 'check_violation';
    END IF;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 1000000 THEN
      RAISE EXCEPTION 'Quantité invalide: %', v_qty USING ERRCODE = 'check_violation';
    END IF;
    IF v_cost IS NULL OR v_cost < 0 OR v_cost > 10000000 THEN
      RAISE EXCEPTION 'Coût invalide: %', v_cost USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  INSERT INTO public.stock_entries
    (product_id, quantity, unit_cost, itbis_included, supplier_name, supplier_rnc, ncf, invoice_date, note, created_by, client_token)
  SELECT
    (e->>'product_id')::uuid,
    (e->>'quantity')::int,
    (e->>'unit_cost')::numeric,
    COALESCE((e->>'itbis_included')::boolean, true),
    p_supplier_name, p_supplier_rnc, p_ncf, p_invoice_date, p_note, p_created_by, p_client_token
  FROM jsonb_array_elements(p_items) e;

  FOR rec IN
    SELECT (e->>'product_id')::uuid AS product_id,
           SUM((e->>'quantity')::int)::int AS qty,
           SUM((e->>'quantity')::int * (e->>'unit_cost')::numeric)
             / NULLIF(SUM((e->>'quantity')::int), 0) AS batch_cost
      FROM jsonb_array_elements(p_items) e
     GROUP BY (e->>'product_id')::uuid
     ORDER BY (e->>'product_id')::uuid
  LOOP
    SELECT stock, cost_price INTO v_old_stock, v_old_cost
      FROM public.products WHERE id = rec.product_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produit introuvable: %', rec.product_id USING ERRCODE = 'no_data_found';
    END IF;

    IF v_old_cost IS NULL OR v_old_stock IS NULL OR v_old_stock <= 0 THEN
      v_new_cost := round(rec.batch_cost, 2);
    ELSE
      v_new_cost := round(
        (v_old_stock::numeric * v_old_cost + rec.qty::numeric * rec.batch_cost)
        / (v_old_stock + rec.qty), 2);
    END IF;

    IF v_old_stock IS NULL THEN
      UPDATE public.products
         SET cost_price = v_new_cost, updated_at = now()
       WHERE id = rec.product_id;
    ELSE
      IF v_old_stock::bigint + rec.qty::bigint > 2147483647 THEN
        RAISE EXCEPTION 'Stock maximum dépassé pour le produit %', rec.product_id
          USING ERRCODE = 'check_violation';
      END IF;
      UPDATE public.products
         SET stock = v_old_stock + rec.qty, cost_price = v_new_cost, updated_at = now()
       WHERE id = rec.product_id;
    END IF;

    v_written := v_written || jsonb_build_object(
      'product_id', rec.product_id,
      'stock', CASE WHEN v_old_stock IS NULL THEN NULL ELSE v_old_stock + rec.qty END,
      'cost_price', v_new_cost
    );
  END LOOP;

  RETURN v_written;
END;
$$;


ALTER FUNCTION "public"."record_stock_entries"("p_items" "jsonb", "p_supplier_name" "text", "p_supplier_rnc" "text", "p_ncf" "text", "p_invoice_date" "date", "p_note" "text", "p_created_by" "uuid", "p_client_token" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."record_stock_entries"("p_items" "jsonb", "p_supplier_name" "text", "p_supplier_rnc" "text", "p_ncf" "text", "p_invoice_date" "date", "p_note" "text", "p_created_by" "uuid", "p_client_token" "uuid") IS 'Réception de stock atomique : insère stock_entries + incrémente products.stock + recalcule le CMP (cost_price). Idempotente via client_token. Service-role only.';



CREATE OR REPLACE FUNCTION "public"."record_stock_loss"("p_product_id" "uuid", "p_quantity" integer, "p_reason" "text", "p_note" "text", "p_created_by" "uuid", "p_client_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_old_stock  int;
  v_cost       numeric(10,2);
  v_new_stock  int;
  v_amount     numeric(12,2);
  v_expense_id uuid;
  v_replay     jsonb;
BEGIN
  -- Idempotence : un rejeu (meme client_token) ne refait rien.
  IF p_client_token IS NOT NULL THEN
    SELECT jsonb_build_object(
             'replayed', true,
             'unit_cost', sl.unit_cost,
             'expense_id', sl.expense_id)
      INTO v_replay
    FROM public.stock_losses sl
    WHERE sl.client_token = p_client_token;
    IF FOUND THEN
      RETURN v_replay;
    END IF;
  END IF;

  -- Validation (la RPC est appelable hors route Zod).
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 1000000 THEN
    RAISE EXCEPTION 'Cantidad invalida: %', p_quantity USING ERRCODE = 'check_violation';
  END IF;
  IF p_reason IS NULL OR p_reason NOT IN ('vencido', 'danado', 'robo', 'ajuste') THEN
    RAISE EXCEPTION 'Motivo invalido: %', p_reason USING ERRCODE = 'check_violation';
  END IF;

  -- Verrou + lecture serveur du coût (jamais de confiance au client pour le coût).
  SELECT stock, cost_price INTO v_old_stock, v_cost
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado: %', p_product_id USING ERRCODE = 'no_data_found';
  END IF;

  -- Decrement : stock NULL (illimite) jamais decremente ; sinon clamp >= 0.
  IF v_old_stock IS NULL THEN
    v_new_stock := NULL;
  ELSE
    v_new_stock := GREATEST(v_old_stock - p_quantity, 0);
    UPDATE public.products
    SET stock = v_new_stock, updated_at = now()
    WHERE id = p_product_id;
  END IF;

  -- Charge P&L au cout (CMP * quantite DEMANDEE). Cout inconnu => aucune charge
  -- (NE PAS traiter NULL comme 0 : marge/resultat fictifs sinon).
  IF v_cost IS NOT NULL THEN
    v_amount := round(v_cost * p_quantity, 2);
    -- Garde-fou overflow : aligne sur le plafond des depenses manuelles (100M).
    IF v_amount > 100000000 THEN
      RAISE EXCEPTION 'Monto de merma excede el maximo permitido: %', v_amount
        USING ERRCODE = 'check_violation';
    END IF;
    INSERT INTO public.expenses (amount, category, label, expense_date, note, created_by)
    VALUES (v_amount, 'merma', NULL, (now() AT TIME ZONE 'UTC')::date, p_note, p_created_by)
    RETURNING id INTO v_expense_id;
  ELSE
    v_expense_id := NULL;
  END IF;

  -- Registre (snapshot cout fige + lien charge + token idempotence).
  INSERT INTO public.stock_losses
    (product_id, quantity, unit_cost, reason, note, expense_id, created_by, client_token)
  VALUES
    (p_product_id, p_quantity, v_cost, p_reason, p_note, v_expense_id, p_created_by, p_client_token);

  RETURN jsonb_build_object(
    'replayed', false,
    'product_id', p_product_id,
    'stock', v_new_stock,
    'unit_cost', v_cost,
    'expense_id', v_expense_id
  );
END;
$$;


ALTER FUNCTION "public"."record_stock_loss"("p_product_id" "uuid", "p_quantity" integer, "p_reason" "text", "p_note" "text", "p_created_by" "uuid", "p_client_token" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."record_stock_loss"("p_product_id" "uuid", "p_quantity" integer, "p_reason" "text", "p_note" "text", "p_created_by" "uuid", "p_client_token" "uuid") IS 'Perte de stock atomique : decremente products.stock (clamp >=0, ignore stock NULL) + insere stock_losses + une charge merma au cout (CMP fige, valorisee sur la quantite demandee) dans expenses. Cout inconnu => stock decremente mais aucune charge. Ne touche jamais cost_price ni stock_entries. Idempotente via client_token. Service-role only.';



CREATE OR REPLACE FUNCTION "public"."remove_from_cart"("p_product_id" "uuid", "p_anon_id" "uuid" DEFAULT NULL::"uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id uuid := COALESCE(p_user_id, auth.uid());
BEGIN
  DELETE FROM public.cart_items
  WHERE product_id = p_product_id
    AND cart_id IN (
      SELECT id FROM public.carts
      WHERE (p_anon_id IS NOT NULL AND anonymous_id = p_anon_id)
         OR (v_user_id IS NOT NULL AND user_id = v_user_id)
    );
END;
$$;


ALTER FUNCTION "public"."remove_from_cart"("p_product_id" "uuid", "p_anon_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_banners"("banner_id" "uuid", "old_position" integer, "new_position" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF new_position < old_position THEN
    UPDATE public.banners SET position = position + 1
    WHERE position >= new_position AND position < old_position AND id != banner_id;
  ELSIF new_position > old_position THEN
    UPDATE public.banners SET position = position - 1
    WHERE position > old_position AND position <= new_position AND id != banner_id;
  END IF;
  UPDATE public.banners SET position = new_position WHERE id = banner_id;
END;
$$;


ALTER FUNCTION "public"."reorder_banners"("banner_id" "uuid", "old_position" integer, "new_position" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_reservation_collection"("p_reservation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_restored int;
BEGIN
  UPDATE public.reservations
     SET stock_applied = false
   WHERE id = p_reservation_id
     AND stock_applied = true;
  GET DIAGNOSTICS v_restored = ROW_COUNT;
  IF v_restored = 0 THEN
    RETURN;
  END IF;

  UPDATE public.products p
     SET stock = COALESCE(p.stock, 0) + agg.qty,
         updated_at = now()
    FROM (
      SELECT product_id, SUM(quantity)::int AS qty
        FROM public.reservation_items
       WHERE reservation_id = p_reservation_id
         AND product_id IS NOT NULL
       GROUP BY product_id
    ) agg
   WHERE p.id = agg.product_id
     AND p.stock IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."restore_reservation_collection"("p_reservation_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."restore_reservation_collection"("p_reservation_id" "uuid") IS 'Re-crédite products.stock si une réservation collected est annulée/revertie (idempotent via stock_applied). Service-role only.';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_promotion_targets"("p_promotion_id" "uuid", "p_targets" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  DELETE FROM public.promotion_targets WHERE promotion_id = p_promotion_id;
  INSERT INTO public.promotion_targets (promotion_id, target_type, target_id)
  SELECT p_promotion_id, x->>'target_type', (x->>'target_id')::uuid
  FROM jsonb_array_elements(p_targets) AS x
  ON CONFLICT (promotion_id, target_type, target_id) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."set_promotion_targets"("p_promotion_id" "uuid", "p_targets" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_promotion_targets"("p_promotion_id" "uuid", "p_targets" "jsonb") IS 'Remplace atomiquement les cibles d''une promo (DELETE + INSERT). p_targets = jsonb array de {target_type, target_id}. Service-role only.';



CREATE OR REPLACE FUNCTION "public"."set_reservation_item_price"("p_reservation_id" "uuid", "p_item_id" "uuid", "p_unit_price" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_item      reservation_items%ROWTYPE;
  v_res       reservations%ROWTYPE;
  v_old_price numeric;
  v_old_total numeric;
  v_new_total numeric;
BEGIN
  -- Garde-fou montant (même plafond anti-overflow que record_stock_loss).
  IF p_unit_price IS NULL OR p_unit_price < 0 OR p_unit_price > 100000000 THEN
    RAISE EXCEPTION 'invalid_price';
  END IF;

  -- Verrou sur la réservation D'ABORD (sérialise les éditions concurrentes et
  -- surtout une collecte simultanée qui passerait le statut à collected).
  SELECT * INTO v_res FROM reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'reservation_not_found';
  END IF;

  SELECT * INTO v_item FROM reservation_items WHERE id = p_item_id;
  IF NOT FOUND OR v_item.reservation_id <> p_reservation_id THEN
    RAISE EXCEPTION 'item_not_found';
  END IF;

  -- 🔒 Édition possible UNIQUEMENT avant comptabilisation.
  IF v_res.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'price_locked';
  END IF;

  v_old_price := v_item.unit_price;
  v_old_total := v_res.total_price;

  UPDATE reservation_items
     SET unit_price = round(p_unit_price, 2)
   WHERE id = p_item_id;

  -- Recalcul du total — même transaction, jamais de désync.
  SELECT COALESCE(sum(unit_price * quantity), 0)
    INTO v_new_total
    FROM reservation_items
   WHERE reservation_id = p_reservation_id;

  UPDATE reservations
     SET total_price = v_new_total,
         updated_at  = now()
   WHERE id = p_reservation_id;

  -- Diff complet pour l'audit log côté route (ancien → nouveau).
  RETURN jsonb_build_object(
    'reservation_id', p_reservation_id,
    'item_id',        p_item_id,
    'product_name',   v_item.product_name,
    'quantity',       v_item.quantity,
    'old_unit_price', v_old_price,
    'new_unit_price', round(p_unit_price, 2),
    'old_total',      v_old_total,
    'new_total',      v_new_total
  );
END;
$$;


ALTER FUNCTION "public"."set_reservation_item_price"("p_reservation_id" "uuid", "p_item_id" "uuid", "p_unit_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    CONSTRAINT "admin_users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "entity" "text" NOT NULL,
    "entity_id" "text",
    "summary" "text",
    "diff" "jsonb",
    "is_high_impact" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audit_log_action_check" CHECK (("action" = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text"])))
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_log" IS 'Journal d''audit des mutations admin. Écriture service-role only (helper after()), lecture tout admin.';



CREATE TABLE IF NOT EXISTS "public"."banners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "image_url" "text",
    "link_url" "text",
    "link_text" character varying(100),
    "banner_type" character varying(20) DEFAULT 'image_left'::character varying NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true,
    "start_date" "date",
    "end_date" "date",
    "click_count" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "direction" "text",
    "attribution_name" "text",
    "attribution_title" "text",
    "attribution_photo_url" "text",
    "slot" "public"."banner_slot" DEFAULT 'banner'::"public"."banner_slot" NOT NULL,
    "status" "public"."banner_status" DEFAULT 'draft'::"public"."banner_status" NOT NULL,
    CONSTRAINT "banners_banner_type_check" CHECK ((("banner_type")::"text" = ANY ((ARRAY['editorial'::character varying, 'hero'::character varying, 'quote'::character varying, 'image_left'::character varying, 'image_right'::character varying, 'image_full'::character varying, 'card_style'::character varying, 'minimal'::character varying, 'gradient_overlay'::character varying])::"text"[]))),
    CONSTRAINT "banners_direction_check" CHECK ((("direction" IS NULL) OR ("direction" = ANY (ARRAY['left'::"text", 'right'::"text"]))))
);


ALTER TABLE "public"."banners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "fiche_url" "text"
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cart_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cart_items_quantity_check" CHECK (("quantity" > 0))
)
WITH ("autovacuum_vacuum_scale_factor"='0.05');


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "anonymous_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
)
WITH ("autovacuum_vacuum_scale_factor"='0.05');


ALTER TABLE "public"."carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_email" "text" NOT NULL,
    "user_id" "uuid",
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text",
    "priority" "text" DEFAULT 'normal'::"text",
    "admin_notes" "text",
    "replied_at" timestamp with time zone,
    "replied_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    CONSTRAINT "contact_messages_category_check" CHECK (("category" = ANY (ARRAY['bug'::"text", 'order'::"text", 'product'::"text", 'account'::"text", 'other'::"text"]))),
    CONSTRAINT "contact_messages_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "contact_messages_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."contact_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cron_heartbeats" (
    "job_name" "text" NOT NULL,
    "last_run_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_result" "text"
);


ALTER TABLE "public"."cron_heartbeats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "category" "text" NOT NULL,
    "label" "text",
    "expense_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "expenses_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "expenses_category_check" CHECK (("category" = ANY (ARRAY['alquiler'::"text", 'salarios'::"text", 'servicios'::"text", 'mercadeo'::"text", 'suministros'::"text", 'mantenimiento'::"text", 'impuestos'::"text", 'otros'::"text", 'merma'::"text"])))
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


COMMENT ON TABLE "public"."expenses" IS 'Charges/dépenses opérationnelles (gastos) pour le compte de résultat. Admin-only, écriture service-role.';



CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "lang" "text" DEFAULT 'fr'::"text" NOT NULL,
    "ip" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confirmed_at" timestamp with time zone,
    "confirmation_token" "text",
    "token_expires_at" timestamp with time zone,
    CONSTRAINT "newsletter_subscribers_lang_check" CHECK (("lang" = ANY (ARRAY['fr'::"text", 'es'::"text", 'en'::"text"])))
);


ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";


COMMENT ON TABLE "public"."newsletter_subscribers" IS 'Inscriptions newsletter mensuelle FARMAU. Écriture via /api/newsletter (service-role). RLS bloque toute lecture publique.';



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text",
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "cover_image_url" "text",
    "author_name" "text",
    "locale" "text" DEFAULT 'fr'::"text" NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "posts_locale_check" CHECK (("locale" = ANY (ARRAY['fr'::"text", 'es'::"text", 'en'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "url" "text" NOT NULL,
    "alt" "text"
);


ALTER TABLE "public"."product_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_tags" (
    "product_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."product_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "currency" character(3) DEFAULT 'DOP'::"bpchar",
    "stock" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "volume" "text",
    "pharmacist_advice" "text",
    "pharmacist_name" "text",
    "benefits" "text"[],
    "usage" "text",
    "inci" "text",
    "technical_pdf_url" "text",
    "skin_type" "text"[],
    "texture" "text",
    "old_price" numeric,
    "is_new" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "range_id" "uuid",
    "cost_price" numeric(10,2),
    "name_search" "text" GENERATED ALWAYS AS ("public"."immutable_unaccent"("lower"("name"))) STORED,
    CONSTRAINT "products_cost_price_check" CHECK ((("cost_price" IS NULL) OR ("cost_price" >= (0)::numeric))),
    CONSTRAINT "products_price_check" CHECK (("price" >= (0)::numeric))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."cost_price" IS 'CMP (coût moyen pondéré) — cache dérivé, recalculé UNIQUEMENT par record_stock_entries / recompute_cost_price. Source de vérité = stock_entries. Ne jamais éditer à la main.';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "birth_date" "date",
    "role" "text" DEFAULT 'user'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "preferred_locale" "text",
    CONSTRAINT "profiles_preferred_locale_check" CHECK ((("preferred_locale" IS NULL) OR ("preferred_locale" = ANY (ARRAY['fr'::"text", 'en'::"text", 'es'::"text"])))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text", 'customer'::"text"])))
)
WITH ("autovacuum_vacuum_scale_factor"='0.05');


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotion_targets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promotion_id" "uuid" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    CONSTRAINT "promotion_targets_target_type_check" CHECK (("target_type" = ANY (ARRAY['product'::"text", 'brand'::"text", 'range'::"text", 'tag'::"text"])))
);


ALTER TABLE "public"."promotion_targets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "discount_type" "text" NOT NULL,
    "discount_value" numeric(10,2) NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "promotions_discount_type_check" CHECK (("discount_type" = ANY (ARRAY['percent'::"text", 'fixed'::"text"]))),
    CONSTRAINT "promotions_discount_value_check" CHECK (("discount_value" >= (0)::numeric)),
    CONSTRAINT "promotions_percent_chk" CHECK ((("discount_type" <> 'percent'::"text") OR ("discount_value" <= (100)::numeric))),
    CONSTRAINT "promotions_window_chk" CHECK (("end_date" > "start_date"))
);


ALTER TABLE "public"."promotions" OWNER TO "postgres";


COMMENT ON TABLE "public"."promotions" IS 'Campagnes promo datees. discount_type percent|fixed. Prive (lecture admin, ecriture service-role). Affichage via v_product_pricing.';



CREATE TABLE IF NOT EXISTS "public"."ranges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."ranges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limit_buckets" (
    "key" "text" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "window_start" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rate_limit_buckets" OWNER TO "postgres";


COMMENT ON TABLE "public"."rate_limit_buckets" IS 'Buckets de rate limiting (fixed window). Accessible uniquement service_role.';



CREATE TABLE IF NOT EXISTS "public"."reservation_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reservation_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "product_name" "text" NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "quantity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "unit_cost" numeric(10,2),
    CONSTRAINT "reservation_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "reservation_items_unit_cost_check" CHECK ((("unit_cost" IS NULL) OR ("unit_cost" >= (0)::numeric))),
    CONSTRAINT "reservation_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."reservation_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."reservation_items" IS 'Items d''une réservation. product_name et unit_price sont des snapshots : si le produit est modifié/supprimé après, la réservation garde l''état d''origine.';



COMMENT ON COLUMN "public"."reservation_items"."unit_cost" IS 'Snapshot du CMP au moment de la vente (collected), write-once. NULL = coût inconnu (ligne libre, ou vente antérieure à la 1re entrée de stock) → marge inconnue, NE PAS traiter comme 0.';



CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "status" "public"."reservation_status" DEFAULT 'pending'::"public"."reservation_status" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "contact_phone" "text",
    "contact_email" "text",
    "contact_name" "text",
    "total_items" integer NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'DOP'::"text" NOT NULL,
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confirmed_at" timestamp with time zone,
    "collected_at" timestamp with time zone,
    "source" "text" DEFAULT 'account'::"text" NOT NULL,
    "confirmation_token" "text",
    "anonymous_id" "uuid",
    "stock_applied" boolean DEFAULT false NOT NULL,
    CONSTRAINT "reservations_source_check" CHECK (("source" = ANY (ARRAY['account'::"text", 'guest'::"text", 'counter'::"text"]))),
    CONSTRAINT "reservations_total_items_check" CHECK (("total_items" > 0)),
    CONSTRAINT "reservations_total_price_check" CHECK (("total_price" >= (0)::numeric))
)
WITH ("autovacuum_vacuum_scale_factor"='0.05');


ALTER TABLE "public"."reservations" OWNER TO "postgres";


COMMENT ON TABLE "public"."reservations" IS 'Réservations FARMAU. TTL 24h par défaut, expiration auto via pg_cron. Snapshot du téléphone et email pour ne pas dépendre du profil.';



COMMENT ON COLUMN "public"."reservations"."user_id" IS 'Compte client propriétaire. NULL pour les réservations manuelles créées par l''admin (client walk-in / téléphone sans compte).';



COMMENT ON COLUMN "public"."reservations"."contact_email" IS 'Email de contact (snapshot). Peut être NULL pour une réservation manuelle walk-in.';



COMMENT ON COLUMN "public"."reservations"."source" IS 'Origine : account (client connecté via RPC create_reservation), guest (visiteur web sans compte), counter (vente/réservation comptoir saisie par l''admin).';



COMMENT ON COLUMN "public"."reservations"."confirmation_token" IS 'Jeton non-devinable pour l''accès invité à sa page de confirmation (sans compte). NULL pour les résas compte (accès via auth.uid()).';



COMMENT ON COLUMN "public"."reservations"."anonymous_id" IS 'anonymous_id du panier invité à l''origine de la réservation (NULL pour compte/comptoir). Défense en profondeur.';



COMMENT ON COLUMN "public"."reservations"."stock_applied" IS 'true une fois le décrément de stock appliqué (statut collected). Garde d''idempotence pour apply/restore_reservation_collection.';



CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "title" "text",
    "body" "text",
    "author_name" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "verified_purchase" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "reviews_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "shop_name" "text" DEFAULT 'FARMAU'::"text" NOT NULL,
    "shop_tagline" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "whatsapp_number" "text",
    "pickup_name" "text",
    "pickup_address" "text",
    "pickup_hours" "text",
    "pickup_phone" "text",
    "shipping_santo_domingo" integer DEFAULT 300 NOT NULL,
    "shipping_interior" integer DEFAULT 600 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "theme" "text" DEFAULT 'terra'::"text" NOT NULL,
    "default_mode" "text" DEFAULT 'light'::"text" NOT NULL,
    "allow_visitor_mode" boolean DEFAULT true NOT NULL,
    "home_layout" "jsonb",
    CONSTRAINT "shop_settings_default_mode_check" CHECK (("default_mode" = ANY (ARRAY['light'::"text", 'dark'::"text", 'system'::"text"]))),
    CONSTRAINT "shop_settings_id_check" CHECK (("id" = 1)),
    CONSTRAINT "shop_settings_theme_check" CHECK (("theme" = ANY (ARRAY['terra'::"text", 'noir'::"text", 'botanico'::"text", 'coral'::"text", 'marino'::"text", 'ambar'::"text"])))
);


ALTER TABLE "public"."shop_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_cost" numeric(10,2) NOT NULL,
    "itbis_included" boolean DEFAULT true NOT NULL,
    "supplier_name" "text",
    "supplier_rnc" "text",
    "ncf" "text",
    "invoice_date" "date",
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_token" "uuid",
    CONSTRAINT "stock_entries_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "stock_entries_unit_cost_check" CHECK (("unit_cost" >= (0)::numeric))
);


ALTER TABLE "public"."stock_entries" OWNER TO "postgres";


COMMENT ON TABLE "public"."stock_entries" IS 'Réceptions / réappro (entrées de stock IN). Append-only : 1 ligne = 1 événement de réception (ancre future lot/péremption FIFO ; ne jamais upserter). Fonde le registre achats 606 DGII. Écriture service-role via record_stock_entries.';



COMMENT ON COLUMN "public"."stock_entries"."itbis_included" IS 'true = unit_cost TTC (base = cost/1.18, itbis = cost-base au 606). false = produit exonéré ITBIS (base = cost, itbis = 0).';



COMMENT ON COLUMN "public"."stock_entries"."client_token" IS 'Jeton anti-rejeu (idempotence POST). Un même token ne crée qu''une seule réception.';



CREATE TABLE IF NOT EXISTS "public"."stock_losses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_cost" numeric(10,2),
    "reason" "text" NOT NULL,
    "note" "text",
    "expense_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_token" "uuid",
    CONSTRAINT "stock_losses_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "stock_losses_reason_check" CHECK (("reason" = ANY (ARRAY['vencido'::"text", 'danado'::"text", 'robo'::"text", 'ajuste'::"text"])))
);


ALTER TABLE "public"."stock_losses" OWNER TO "postgres";


COMMENT ON TABLE "public"."stock_losses" IS 'Pertes de stock (merma : vencido/danado/robo/ajuste). 1 ligne = 1 evenement. unit_cost = snapshot CMP fige. expense_id relie la charge P&L (NULL si cout inconnu). Ecriture service-role via record_stock_loss.';



CREATE TABLE IF NOT EXISTS "public"."tag_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "icon" "text",
    "color" "text" DEFAULT '#3B82F6'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tag_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_type_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "featured_on_home" boolean DEFAULT false
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."tags_with_types" WITH ("security_invoker"='true') AS
 SELECT "t"."id",
    "t"."name",
    "t"."slug",
    "tt"."slug" AS "tag_type",
    "tt"."name" AS "type_name",
    "tt"."color" AS "type_color",
    "tt"."icon" AS "type_icon",
    "t"."tag_type_id"
   FROM ("public"."tags" "t"
     JOIN "public"."tag_types" "tt" ON (("t"."tag_type_id" = "tt"."id")));


ALTER VIEW "public"."tags_with_types" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_bestsellers" AS
 SELECT "p"."id",
    "p"."name",
    "p"."slug",
    "p"."description",
    "p"."price",
    "p"."currency",
    "p"."stock",
    "p"."is_active",
    "p"."created_at",
    "p"."updated_at",
    "p"."volume",
    "p"."pharmacist_advice",
    "p"."pharmacist_name",
    "p"."benefits",
    "p"."usage",
    "p"."inci",
    "p"."technical_pdf_url",
    "p"."skin_type",
    "p"."texture",
    "p"."old_price",
    "p"."is_new",
    "p"."is_featured",
    COALESCE("s"."sold_30d", (0)::bigint) AS "sold_30d"
   FROM ("public"."products" "p"
     LEFT JOIN ( SELECT "ri"."product_id",
            "sum"("ri"."quantity") AS "sold_30d"
           FROM ("public"."reservation_items" "ri"
             JOIN "public"."reservations" "r" ON (("r"."id" = "ri"."reservation_id")))
          WHERE (("r"."status" = 'collected'::"public"."reservation_status") AND ("r"."collected_at" > ("now"() - '30 days'::interval)) AND ("ri"."product_id" IS NOT NULL))
          GROUP BY "ri"."product_id") "s" ON (("s"."product_id" = "p"."id")))
  WHERE ("p"."is_active" IS DISTINCT FROM false)
  ORDER BY COALESCE("s"."sold_30d", (0)::bigint) DESC, "p"."is_featured" DESC NULLS LAST, "p"."created_at" DESC;


ALTER VIEW "public"."v_bestsellers" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_bestsellers" IS 'SECURITY DEFINER assumé + documenté (plan remédiation 2026-06-10, D-10) : la vue agrège reservation_items (RLS user-only) pour sold_30d — en security_invoker, sold_30d retomberait à 0 pour anon et casserait les bestsellers (home + recherche). Ne JAMAIS exposer de colonne de coût ici (vue servie à anon).';



CREATE OR REPLACE VIEW "public"."v_product_pricing" WITH ("security_invoker"='true') AS
 SELECT "id" AS "product_id",
    "price" AS "base_price",
    "public"."effective_price"("id", "now"()) AS "effective_price",
    "currency"
   FROM "public"."products" "p";


ALTER VIEW "public"."v_product_pricing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."wishlists" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."banners"
    ADD CONSTRAINT "banners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_messages"
    ADD CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cron_heartbeats"
    ADD CONSTRAINT "cron_heartbeats_pkey" PRIMARY KEY ("job_name");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_confirmation_token_key" UNIQUE ("confirmation_token");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "product_tags_pkey" PRIMARY KEY ("product_id", "tag_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promotion_targets"
    ADD CONSTRAINT "promotion_targets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promotion_targets"
    ADD CONSTRAINT "promotion_targets_promotion_id_target_type_target_id_key" UNIQUE ("promotion_id", "target_type", "target_id");



ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ranges"
    ADD CONSTRAINT "ranges_brand_id_slug_key" UNIQUE ("brand_id", "slug");



ALTER TABLE ONLY "public"."ranges"
    ADD CONSTRAINT "ranges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limit_buckets"
    ADD CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."reservation_items"
    ADD CONSTRAINT "reservation_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_product_id_key" UNIQUE ("user_id", "product_id");



ALTER TABLE ONLY "public"."shop_settings"
    ADD CONSTRAINT "shop_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_entries"
    ADD CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_losses"
    ADD CONSTRAINT "stock_losses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tag_types"
    ADD CONSTRAINT "tag_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tag_types"
    ADD CONSTRAINT "tag_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tag_types"
    ADD CONSTRAINT "tag_types_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_tag_type_id_slug_key" UNIQUE ("tag_type_id", "slug");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "unique_anonymous_cart" UNIQUE ("anonymous_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "unique_cart_product" UNIQUE ("cart_id", "product_id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "unique_user_cart" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY ("user_id", "product_id");



CREATE INDEX "idx_audit_log_action" ON "public"."audit_log" USING "btree" ("action");



CREATE INDEX "idx_audit_log_actor" ON "public"."audit_log" USING "btree" ("actor_id");



CREATE INDEX "idx_audit_log_created_at" ON "public"."audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_log_entity" ON "public"."audit_log" USING "btree" ("entity", "entity_id");



CREATE INDEX "idx_audit_log_high_impact" ON "public"."audit_log" USING "btree" ("is_high_impact") WHERE "is_high_impact";



CREATE INDEX "idx_banners_active_position" ON "public"."banners" USING "btree" ("is_active", "position");



CREATE INDEX "idx_banners_position" ON "public"."banners" USING "btree" ("position");



CREATE INDEX "idx_cart_items_cart" ON "public"."cart_items" USING "btree" ("cart_id");



CREATE INDEX "idx_contact_messages_category" ON "public"."contact_messages" USING "btree" ("category");



CREATE INDEX "idx_contact_messages_created" ON "public"."contact_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contact_messages_email" ON "public"."contact_messages" USING "btree" ("user_email");



CREATE INDEX "idx_contact_messages_replied_by" ON "public"."contact_messages" USING "btree" ("replied_by");



CREATE INDEX "idx_contact_messages_status" ON "public"."contact_messages" USING "btree" ("status");



CREATE INDEX "idx_contact_messages_user" ON "public"."contact_messages" USING "btree" ("user_id");



CREATE INDEX "idx_expenses_created_by" ON "public"."expenses" USING "btree" ("created_by");



CREATE INDEX "idx_expenses_date" ON "public"."expenses" USING "btree" ("expense_date" DESC);



CREATE INDEX "idx_newsletter_confirmation_token" ON "public"."newsletter_subscribers" USING "btree" ("confirmation_token") WHERE ("confirmation_token" IS NOT NULL);



CREATE INDEX "idx_posts_locale" ON "public"."posts" USING "btree" ("locale");



CREATE INDEX "idx_posts_published" ON "public"."posts" USING "btree" ("is_published", "published_at" DESC);



CREATE INDEX "idx_posts_slug" ON "public"."posts" USING "btree" ("slug");



CREATE INDEX "idx_product_images_product" ON "public"."product_images" USING "btree" ("product_id");



CREATE INDEX "idx_product_tags_product" ON "public"."product_tags" USING "btree" ("product_id");



CREATE INDEX "idx_product_tags_tag" ON "public"."product_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_products_is_active" ON "public"."products" USING "btree" ("is_active") WHERE "is_active";



CREATE INDEX "idx_products_name_search_trgm" ON "public"."products" USING "gin" ("name_search" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_products_range_id" ON "public"."products" USING "btree" ("range_id");



CREATE INDEX "idx_promotion_targets_lookup" ON "public"."promotion_targets" USING "btree" ("target_type", "target_id");



CREATE INDEX "idx_promotion_targets_promo" ON "public"."promotion_targets" USING "btree" ("promotion_id");



CREATE INDEX "idx_promotions_active_window" ON "public"."promotions" USING "btree" ("is_active", "start_date", "end_date");



CREATE INDEX "idx_promotions_created_by" ON "public"."promotions" USING "btree" ("created_by");



CREATE INDEX "idx_reservation_items_product" ON "public"."reservation_items" USING "btree" ("product_id");



CREATE INDEX "idx_reservation_items_reservation_id" ON "public"."reservation_items" USING "btree" ("reservation_id");



CREATE INDEX "idx_reservations_pending_expires" ON "public"."reservations" USING "btree" ("expires_at") WHERE ("status" = 'pending'::"public"."reservation_status");



CREATE INDEX "idx_reservations_status_created" ON "public"."reservations" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_reservations_user_id" ON "public"."reservations" USING "btree" ("user_id");



CREATE INDEX "idx_reviews_product_status" ON "public"."reviews" USING "btree" ("product_id", "status");



CREATE INDEX "idx_reviews_status_created" ON "public"."reviews" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_reviews_user" ON "public"."reviews" USING "btree" ("user_id");



CREATE INDEX "idx_shop_settings_updated_by" ON "public"."shop_settings" USING "btree" ("updated_by");



CREATE INDEX "idx_stock_entries_created" ON "public"."stock_entries" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_stock_entries_created_by" ON "public"."stock_entries" USING "btree" ("created_by");



CREATE INDEX "idx_stock_entries_invoice" ON "public"."stock_entries" USING "btree" ("invoice_date") WHERE ("invoice_date" IS NOT NULL);



CREATE INDEX "idx_stock_entries_product" ON "public"."stock_entries" USING "btree" ("product_id");



CREATE INDEX "idx_stock_losses_created" ON "public"."stock_losses" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_stock_losses_created_by" ON "public"."stock_losses" USING "btree" ("created_by");



CREATE INDEX "idx_stock_losses_expense" ON "public"."stock_losses" USING "btree" ("expense_id");



CREATE INDEX "idx_stock_losses_product" ON "public"."stock_losses" USING "btree" ("product_id");



CREATE INDEX "idx_wishlists_product" ON "public"."wishlists" USING "btree" ("product_id");



CREATE INDEX "idx_wishlists_user" ON "public"."wishlists" USING "btree" ("user_id");



CREATE INDEX "newsletter_subscribers_created_at_idx" ON "public"."newsletter_subscribers" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "uniq_active_reservation_per_user" ON "public"."reservations" USING "btree" ("user_id") WHERE ("status" = ANY (ARRAY['pending'::"public"."reservation_status", 'confirmed'::"public"."reservation_status"]));



CREATE UNIQUE INDEX "uniq_reservation_confirmation_token" ON "public"."reservations" USING "btree" ("confirmation_token") WHERE ("confirmation_token" IS NOT NULL);



CREATE UNIQUE INDEX "uniq_stock_entries_client_token" ON "public"."stock_entries" USING "btree" ("client_token") WHERE ("client_token" IS NOT NULL);



CREATE UNIQUE INDEX "uniq_stock_losses_client_token" ON "public"."stock_losses" USING "btree" ("client_token") WHERE ("client_token" IS NOT NULL);



CREATE OR REPLACE TRIGGER "set_posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_reviews_updated_at" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "shop_settings_updated_at" BEFORE UPDATE ON "public"."shop_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_banners_updated_at" BEFORE UPDATE ON "public"."banners" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cart_items_updated_at" BEFORE UPDATE ON "public"."cart_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_carts_updated_at" BEFORE UPDATE ON "public"."carts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contact_messages_updated_at" BEFORE UPDATE ON "public"."contact_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reservations_updated_at" BEFORE UPDATE ON "public"."reservations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tag_types_updated_at" BEFORE UPDATE ON "public"."tag_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_messages"
    ADD CONSTRAINT "contact_messages_replied_by_fkey" FOREIGN KEY ("replied_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contact_messages"
    ADD CONSTRAINT "contact_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "public"."ranges"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promotion_targets"
    ADD CONSTRAINT "promotion_targets_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ranges"
    ADD CONSTRAINT "ranges_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservation_items"
    ADD CONSTRAINT "reservation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reservation_items"
    ADD CONSTRAINT "reservation_items_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_settings"
    ADD CONSTRAINT "shop_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_entries"
    ADD CONSTRAINT "stock_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_entries"
    ADD CONSTRAINT "stock_entries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_losses"
    ADD CONSTRAINT "stock_losses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_losses"
    ADD CONSTRAINT "stock_losses_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_losses"
    ADD CONSTRAINT "stock_losses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_tag_type_id_fkey" FOREIGN KEY ("tag_type_id") REFERENCES "public"."tag_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin delete banners" ON "public"."banners" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete brands" ON "public"."brands" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete messages" ON "public"."contact_messages" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete posts" ON "public"."posts" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete product_images" ON "public"."product_images" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete product_tags" ON "public"."product_tags" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete products" ON "public"."products" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete profiles" ON "public"."profiles" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete ranges" ON "public"."ranges" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete reviews" ON "public"."reviews" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete tag_types" ON "public"."tag_types" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin delete tags" ON "public"."tags" FOR DELETE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert banners" ON "public"."banners" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert brands" ON "public"."brands" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert messages" ON "public"."contact_messages" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert posts" ON "public"."posts" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert product_images" ON "public"."product_images" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert product_tags" ON "public"."product_tags" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert products" ON "public"."products" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert profiles" ON "public"."profiles" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert ranges" ON "public"."ranges" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert reviews" ON "public"."reviews" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert tag_types" ON "public"."tag_types" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin insert tags" ON "public"."tags" FOR INSERT WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update banners" ON "public"."banners" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update brands" ON "public"."brands" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update messages" ON "public"."contact_messages" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update posts" ON "public"."posts" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update product_images" ON "public"."product_images" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update product_tags" ON "public"."product_tags" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update products" ON "public"."products" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update profiles" ON "public"."profiles" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update ranges" ON "public"."ranges" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update reviews" ON "public"."reviews" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update shop_settings" ON "public"."shop_settings" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update tag_types" ON "public"."tag_types" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update tags" ON "public"."tags" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin view all" ON "public"."profiles" FOR SELECT USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin view messages" ON "public"."contact_messages" FOR SELECT USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read audit_log" ON "public"."audit_log" FOR SELECT USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read expenses" ON "public"."expenses" FOR SELECT USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read promotion_targets" ON "public"."promotion_targets" FOR SELECT USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read promotions" ON "public"."promotions" FOR SELECT USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read stock entries" ON "public"."stock_entries" FOR SELECT USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read stock losses" ON "public"."stock_losses" FOR SELECT USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Create own cart" ON "public"."carts" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("anonymous_id")::"text" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'anonymous_id'::"text"))));



CREATE POLICY "Create own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Delete own cart items" ON "public"."cart_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("carts"."anonymous_id")::"text" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'anonymous_id'::"text")))))));



CREATE POLICY "Insert own cart items" ON "public"."cart_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("carts"."anonymous_id")::"text" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'anonymous_id'::"text")))))));



CREATE POLICY "Public can read approved reviews" ON "public"."reviews" FOR SELECT USING (("status" = 'approved'::"text"));



CREATE POLICY "Public can read published posts" ON "public"."posts" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public read brands" ON "public"."brands" FOR SELECT USING (true);



CREATE POLICY "Public read product_images" ON "public"."product_images" FOR SELECT USING (true);



CREATE POLICY "Public read product_tags" ON "public"."product_tags" FOR SELECT USING (true);



CREATE POLICY "Public read ranges" ON "public"."ranges" FOR SELECT USING (true);



CREATE POLICY "Public read shop_settings" ON "public"."shop_settings" FOR SELECT USING (true);



CREATE POLICY "Public read tag_types" ON "public"."tag_types" FOR SELECT USING (true);



CREATE POLICY "Public read tags" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Public view active banners" ON "public"."banners" FOR SELECT USING ((("is_active" = true) OR "public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Update own cart" ON "public"."carts" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("anonymous_id")::"text" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'anonymous_id'::"text")))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("anonymous_id")::"text" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'anonymous_id'::"text"))));



CREATE POLICY "Update own cart items" ON "public"."cart_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("carts"."anonymous_id")::"text" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'anonymous_id'::"text"))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("carts"."anonymous_id")::"text" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'anonymous_id'::"text")))))));



CREATE POLICY "Update own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can read own reviews" ON "public"."reviews" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users manage own wishlists" ON "public"."wishlists" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users read own reservation items" ON "public"."reservation_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."reservations" "r"
  WHERE (("r"."id" = "reservation_items"."reservation_id") AND ("r"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read own reservations" ON "public"."reservations" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users view own messages" ON "public"."contact_messages" FOR SELECT USING (("user_email" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"));



CREATE POLICY "View active products" ON "public"."products" FOR SELECT USING ((("is_active" = true) OR "public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "View own cart" ON "public"."carts" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("anonymous_id")::"text" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'anonymous_id'::"text"))));



CREATE POLICY "View own cart items" ON "public"."cart_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("carts"."anonymous_id")::"text" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'anonymous_id'::"text")))))));



CREATE POLICY "View own profile" ON "public"."profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."banners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cart_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cron_heartbeats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotion_targets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ranges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limit_buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reservation_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_losses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tag_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishlists" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."add_to_cart"("p_cart_id" "uuid", "p_product_id" "uuid", "p_quantity" integer, "p_anon_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_to_cart"("p_cart_id" "uuid", "p_product_id" "uuid", "p_quantity" integer, "p_anon_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_reservation_collection"("p_reservation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_reservation_collection"("p_reservation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_rate_limit"("p_key" "text", "p_max" integer, "p_window_sec" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_key" "text", "p_max" integer, "p_window_sec" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_banner_positions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_banner_positions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_banner_positions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_guest_reservation"("p_cart_id" "uuid", "p_anon_id" "uuid", "p_name" "text", "p_phone" "text", "p_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_guest_reservation"("p_cart_id" "uuid", "p_anon_id" "uuid", "p_name" "text", "p_phone" "text", "p_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_reservation"("p_cart_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_reservation"("p_cart_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_reservation"("p_cart_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_ticket"("p_email" "text", "p_category" "text", "p_subject" "text", "p_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_ticket"("p_email" "text", "p_category" "text", "p_subject" "text", "p_message" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."effective_price"("p_product_id" "uuid", "p_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."effective_price"("p_product_id" "uuid", "p_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."effective_price"("p_product_id" "uuid", "p_at" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."effective_price"("p_product_id" "uuid", "p_at" timestamp with time zone) TO "anon";



REVOKE ALL ON FUNCTION "public"."expire_stale_reservations"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."expire_stale_reservations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_catalogue_page"("p_brands" "text"[], "p_ranges" "text"[], "p_pairs" "jsonb", "p_tags" "jsonb", "p_q" "text", "p_sort" "text", "p_page" integer, "p_page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_catalogue_page"("p_brands" "text"[], "p_ranges" "text"[], "p_pairs" "jsonb", "p_tags" "jsonb", "p_q" "text", "p_sort" "text", "p_page" integer, "p_page_size" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."get_catalogue_page"("p_brands" "text"[], "p_ranges" "text"[], "p_pairs" "jsonb", "p_tags" "jsonb", "p_q" "text", "p_sort" "text", "p_page" integer, "p_page_size" integer) TO "anon";



REVOKE ALL ON FUNCTION "public"."get_dashboard_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_inventory_valuation"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_inventory_valuation"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_messages_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_messages_stats"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_or_create_cart"("p_user_id" "uuid", "p_anonymous_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_or_create_cart"("p_user_id" "uuid", "p_anonymous_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."immutable_unaccent"("p_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."immutable_unaccent"("p_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_admin"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_admin"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_admin"("check_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."merge_anon_cart_to_user"("p_anon_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."merge_anon_cart_to_user"("p_anon_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."merge_anon_cart_to_user"("p_anon_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_expired_data"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_expired_data"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."recompute_cost_price"("p_product_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."recompute_cost_price"("p_product_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_stock_entries"("p_items" "jsonb", "p_supplier_name" "text", "p_supplier_rnc" "text", "p_ncf" "text", "p_invoice_date" "date", "p_note" "text", "p_created_by" "uuid", "p_client_token" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_stock_entries"("p_items" "jsonb", "p_supplier_name" "text", "p_supplier_rnc" "text", "p_ncf" "text", "p_invoice_date" "date", "p_note" "text", "p_created_by" "uuid", "p_client_token" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_stock_loss"("p_product_id" "uuid", "p_quantity" integer, "p_reason" "text", "p_note" "text", "p_created_by" "uuid", "p_client_token" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_stock_loss"("p_product_id" "uuid", "p_quantity" integer, "p_reason" "text", "p_note" "text", "p_created_by" "uuid", "p_client_token" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_from_cart"("p_product_id" "uuid", "p_anon_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_from_cart"("p_product_id" "uuid", "p_anon_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reorder_banners"("banner_id" "uuid", "old_position" integer, "new_position" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_banners"("banner_id" "uuid", "old_position" integer, "new_position" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_banners"("banner_id" "uuid", "old_position" integer, "new_position" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."restore_reservation_collection"("p_reservation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_reservation_collection"("p_reservation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_promotion_targets"("p_promotion_id" "uuid", "p_targets" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_promotion_targets"("p_promotion_id" "uuid", "p_targets" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_reservation_item_price"("p_reservation_id" "uuid", "p_item_id" "uuid", "p_unit_price" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_reservation_item_price"("p_reservation_id" "uuid", "p_item_id" "uuid", "p_unit_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."banners" TO "anon";
GRANT ALL ON TABLE "public"."banners" TO "authenticated";
GRANT ALL ON TABLE "public"."banners" TO "service_role";



GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."carts" TO "anon";
GRANT ALL ON TABLE "public"."carts" TO "authenticated";
GRANT ALL ON TABLE "public"."carts" TO "service_role";



GRANT ALL ON TABLE "public"."contact_messages" TO "anon";
GRANT ALL ON TABLE "public"."contact_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_messages" TO "service_role";



GRANT ALL ON TABLE "public"."cron_heartbeats" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."product_images" TO "anon";
GRANT ALL ON TABLE "public"."product_images" TO "authenticated";
GRANT ALL ON TABLE "public"."product_images" TO "service_role";



GRANT ALL ON TABLE "public"."product_tags" TO "anon";
GRANT ALL ON TABLE "public"."product_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."product_tags" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."products" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."products" TO "anon";
GRANT SELECT("id") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("name") ON TABLE "public"."products" TO "anon";
GRANT SELECT("name") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("slug") ON TABLE "public"."products" TO "anon";
GRANT SELECT("slug") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("description") ON TABLE "public"."products" TO "anon";
GRANT SELECT("description") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("price") ON TABLE "public"."products" TO "anon";
GRANT SELECT("price") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("currency") ON TABLE "public"."products" TO "anon";
GRANT SELECT("currency") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("stock") ON TABLE "public"."products" TO "anon";
GRANT SELECT("stock") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("is_active") ON TABLE "public"."products" TO "anon";
GRANT SELECT("is_active") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("created_at") ON TABLE "public"."products" TO "anon";
GRANT SELECT("created_at") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("updated_at") ON TABLE "public"."products" TO "anon";
GRANT SELECT("updated_at") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("volume") ON TABLE "public"."products" TO "anon";
GRANT SELECT("volume") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("pharmacist_advice") ON TABLE "public"."products" TO "anon";
GRANT SELECT("pharmacist_advice") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("pharmacist_name") ON TABLE "public"."products" TO "anon";
GRANT SELECT("pharmacist_name") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("benefits") ON TABLE "public"."products" TO "anon";
GRANT SELECT("benefits") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("usage") ON TABLE "public"."products" TO "anon";
GRANT SELECT("usage") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("inci") ON TABLE "public"."products" TO "anon";
GRANT SELECT("inci") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("technical_pdf_url") ON TABLE "public"."products" TO "anon";
GRANT SELECT("technical_pdf_url") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("skin_type") ON TABLE "public"."products" TO "anon";
GRANT SELECT("skin_type") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("texture") ON TABLE "public"."products" TO "anon";
GRANT SELECT("texture") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("old_price") ON TABLE "public"."products" TO "anon";
GRANT SELECT("old_price") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("is_new") ON TABLE "public"."products" TO "anon";
GRANT SELECT("is_new") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("is_featured") ON TABLE "public"."products" TO "anon";
GRANT SELECT("is_featured") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("range_id") ON TABLE "public"."products" TO "anon";
GRANT SELECT("range_id") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT("name_search") ON TABLE "public"."products" TO "anon";
GRANT SELECT("name_search") ON TABLE "public"."products" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promotion_targets" TO "service_role";



GRANT ALL ON TABLE "public"."promotions" TO "service_role";



GRANT ALL ON TABLE "public"."ranges" TO "anon";
GRANT ALL ON TABLE "public"."ranges" TO "authenticated";
GRANT ALL ON TABLE "public"."ranges" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_buckets" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_buckets" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_buckets" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."reservation_items" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."reservation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."reservation_items" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."reservation_items" TO "anon";
GRANT SELECT("id") ON TABLE "public"."reservation_items" TO "authenticated";



GRANT SELECT("reservation_id") ON TABLE "public"."reservation_items" TO "anon";
GRANT SELECT("reservation_id") ON TABLE "public"."reservation_items" TO "authenticated";



GRANT SELECT("product_id") ON TABLE "public"."reservation_items" TO "anon";
GRANT SELECT("product_id") ON TABLE "public"."reservation_items" TO "authenticated";



GRANT SELECT("product_name") ON TABLE "public"."reservation_items" TO "anon";
GRANT SELECT("product_name") ON TABLE "public"."reservation_items" TO "authenticated";



GRANT SELECT("unit_price") ON TABLE "public"."reservation_items" TO "anon";
GRANT SELECT("unit_price") ON TABLE "public"."reservation_items" TO "authenticated";



GRANT SELECT("quantity") ON TABLE "public"."reservation_items" TO "anon";
GRANT SELECT("quantity") ON TABLE "public"."reservation_items" TO "authenticated";



GRANT SELECT("created_at") ON TABLE "public"."reservation_items" TO "anon";
GRANT SELECT("created_at") ON TABLE "public"."reservation_items" TO "authenticated";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."shop_settings" TO "anon";
GRANT ALL ON TABLE "public"."shop_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_settings" TO "service_role";



GRANT ALL ON TABLE "public"."stock_entries" TO "service_role";



GRANT ALL ON TABLE "public"."stock_losses" TO "service_role";



GRANT ALL ON TABLE "public"."tag_types" TO "anon";
GRANT ALL ON TABLE "public"."tag_types" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_types" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."tags_with_types" TO "anon";
GRANT ALL ON TABLE "public"."tags_with_types" TO "authenticated";
GRANT ALL ON TABLE "public"."tags_with_types" TO "service_role";



GRANT ALL ON TABLE "public"."v_bestsellers" TO "anon";
GRANT ALL ON TABLE "public"."v_bestsellers" TO "authenticated";
GRANT ALL ON TABLE "public"."v_bestsellers" TO "service_role";



GRANT ALL ON TABLE "public"."v_product_pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."v_product_pricing" TO "service_role";
GRANT SELECT ON TABLE "public"."v_product_pricing" TO "anon";



GRANT ALL ON TABLE "public"."wishlists" TO "anon";
GRANT ALL ON TABLE "public"."wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlists" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






