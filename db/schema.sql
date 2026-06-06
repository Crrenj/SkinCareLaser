-- ======================================================================
-- SCHÉMA — Skincare Laser / FARMAU  ·  dump fidèle du remote (schema public)
-- ======================================================================
-- ⚠️ Source de vérité = supabase/migrations/. Ce fichier est un snapshot de
-- LECTURE régénérable (schema-only) — pratique pour voir tout le schéma d'un
-- coup. Toute modif doit aussi exister dans une migration.
--
-- Régénéré le 2026-06-06 via scripts/db-dump.sh (pg_dump natif de l'hôte,
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
    SUM(ci.quantity * pr.price),
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
    v_reservation_id, ci.product_id, pr.name, pr.price, ci.quantity
  FROM public.cart_items ci
  JOIN public.products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;

  RETURN v_reservation_id;
END;
$$;


ALTER FUNCTION "public"."create_reservation"("p_cart_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_reservation"("p_cart_id" "uuid") IS 'Convertit le panier d''un user en réservation pending (TTL 24h). Snapshot du téléphone et des items. Lève une exception si phone manquant, cart vide, ou réservation active déjà existante.';



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
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."expire_stale_reservations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."expire_stale_reservations"() IS 'Passe les réservations pending dont expires_at est dépassé à status=expired. Appelée par pg_cron toutes les 5 min.';



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
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "anonymous_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


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
    CONSTRAINT "products_price_check" CHECK (("price" >= (0)::numeric))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


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
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


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
    CONSTRAINT "reservation_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "reservation_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."reservation_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."reservation_items" IS 'Items d''une réservation. product_name et unit_price sont des snapshots : si le produit est modifié/supprimé après, la réservation garde l''état d''origine.';



CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "status" "public"."reservation_status" DEFAULT 'pending'::"public"."reservation_status" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "contact_phone" "text" NOT NULL,
    "contact_email" "text",
    "contact_name" "text",
    "total_items" integer NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'DOP'::"text" NOT NULL,
    "admin_notes" "text",
    "source" "text" DEFAULT 'account'::"text" NOT NULL,
    "confirmation_token" "text",
    "anonymous_id" "uuid",
    "stock_applied" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confirmed_at" timestamp with time zone,
    "collected_at" timestamp with time zone,
    CONSTRAINT "reservations_total_items_check" CHECK (("total_items" > 0)),
    CONSTRAINT "reservations_total_price_check" CHECK (("total_price" >= (0)::numeric)),
    CONSTRAINT "reservations_source_check" CHECK (("source" = ANY (ARRAY['account'::"text", 'guest'::"text", 'counter'::"text"])))
);


ALTER TABLE "public"."reservations" OWNER TO "postgres";


COMMENT ON TABLE "public"."reservations" IS 'Réservations FARMAU. TTL 24h par défaut, expiration auto via pg_cron. Snapshot du téléphone et email pour ne pas dépendre du profil.';



COMMENT ON COLUMN "public"."reservations"."user_id" IS 'Compte client propriétaire. NULL pour les réservations manuelles créées par l''admin (client walk-in / téléphone sans compte).';



COMMENT ON COLUMN "public"."reservations"."contact_email" IS 'Email de contact (snapshot). Peut être NULL pour une réservation manuelle walk-in.';



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


CREATE OR REPLACE VIEW "public"."tags_with_types" AS
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
 SELECT "id",
    "name",
    "slug",
    "description",
    "price",
    "currency",
    "stock",
    "is_active",
    "created_at",
    "updated_at",
    "volume",
    "pharmacist_advice",
    "pharmacist_name",
    "benefits",
    "usage",
    "inci",
    "technical_pdf_url",
    "skin_type",
    "texture",
    "old_price",
    "is_new",
    "is_featured",
    COALESCE("s"."sold_30d", (0)::bigint)::bigint AS "sold_30d"
   FROM ("public"."products" "p"
     LEFT JOIN ( SELECT "ri"."product_id",
            "sum"("ri"."quantity") AS "sold_30d"
           FROM ("public"."reservation_items" "ri"
             JOIN "public"."reservations" "r" ON (("r"."id" = "ri"."reservation_id")))
          WHERE (("r"."status" = 'collected'::"public"."reservation_status")
            AND ("r"."collected_at" > ("now"() - '30 days'::interval))
            AND ("ri"."product_id" IS NOT NULL))
          GROUP BY "ri"."product_id") "s" ON (("s"."product_id" = "p"."id")))
  WHERE ("is_active" IS DISTINCT FROM false)
  ORDER BY COALESCE("s"."sold_30d", (0)::bigint) DESC, "is_featured" DESC NULLS LAST, "created_at" DESC;


ALTER VIEW "public"."v_bestsellers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."wishlists" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("user_id");



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



ALTER TABLE ONLY "public"."shop_settings"
    ADD CONSTRAINT "shop_settings_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "idx_banners_active" ON "public"."banners" USING "btree" ("is_active");



CREATE INDEX "idx_banners_active_position" ON "public"."banners" USING "btree" ("is_active", "position");



CREATE INDEX "idx_banners_position" ON "public"."banners" USING "btree" ("position");



CREATE INDEX "idx_banners_slot" ON "public"."banners" USING "btree" ("slot");



CREATE INDEX "idx_banners_status" ON "public"."banners" USING "btree" ("status");



CREATE INDEX "idx_cart_items_cart" ON "public"."cart_items" USING "btree" ("cart_id");



CREATE INDEX "idx_cart_items_product_id" ON "public"."cart_items" USING "btree" ("product_id");



CREATE INDEX "idx_contact_messages_category" ON "public"."contact_messages" USING "btree" ("category");



CREATE INDEX "idx_contact_messages_created" ON "public"."contact_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contact_messages_email" ON "public"."contact_messages" USING "btree" ("user_email");



CREATE INDEX "idx_contact_messages_status" ON "public"."contact_messages" USING "btree" ("status");



CREATE INDEX "idx_newsletter_confirmation_token" ON "public"."newsletter_subscribers" USING "btree" ("confirmation_token") WHERE ("confirmation_token" IS NOT NULL);



CREATE INDEX "idx_posts_locale" ON "public"."posts" USING "btree" ("locale");



CREATE INDEX "idx_posts_published" ON "public"."posts" USING "btree" ("is_published", "published_at" DESC);



CREATE INDEX "idx_posts_slug" ON "public"."posts" USING "btree" ("slug");



CREATE INDEX "idx_product_images_product" ON "public"."product_images" USING "btree" ("product_id");



CREATE INDEX "idx_product_images_product_id" ON "public"."product_images" USING "btree" ("product_id");



CREATE INDEX "idx_product_tags_product" ON "public"."product_tags" USING "btree" ("product_id");



CREATE INDEX "idx_product_tags_tag" ON "public"."product_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_product_tags_tag_id" ON "public"."product_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_products_range_id" ON "public"."products" USING "btree" ("range_id");



CREATE INDEX "idx_reservation_items_reservation_id" ON "public"."reservation_items" USING "btree" ("reservation_id");



CREATE INDEX "idx_reservations_pending_expires" ON "public"."reservations" USING "btree" ("expires_at") WHERE ("status" = 'pending'::"public"."reservation_status");



CREATE INDEX "idx_reservations_status_created" ON "public"."reservations" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_reservations_user_id" ON "public"."reservations" USING "btree" ("user_id");



CREATE INDEX "idx_wishlists_product" ON "public"."wishlists" USING "btree" ("product_id");



CREATE INDEX "idx_wishlists_user" ON "public"."wishlists" USING "btree" ("user_id");



CREATE INDEX "newsletter_subscribers_created_at_idx" ON "public"."newsletter_subscribers" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "uniq_active_reservation_per_user" ON "public"."reservations" USING "btree" ("user_id") WHERE ("status" = ANY (ARRAY['pending'::"public"."reservation_status", 'confirmed'::"public"."reservation_status"]));



CREATE OR REPLACE TRIGGER "set_posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



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



ALTER TABLE ONLY "public"."ranges"
    ADD CONSTRAINT "ranges_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservation_items"
    ADD CONSTRAINT "reservation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reservation_items"
    ADD CONSTRAINT "reservation_items_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_settings"
    ADD CONSTRAINT "shop_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_tag_type_id_fkey" FOREIGN KEY ("tag_type_id") REFERENCES "public"."tag_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin manage all" ON "public"."profiles" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin manage banners" ON "public"."banners" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin manage brands" ON "public"."brands" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin manage messages" ON "public"."contact_messages" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin manage product_images" ON "public"."product_images" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin manage product_tags" ON "public"."product_tags" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin manage products" ON "public"."products" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin manage ranges" ON "public"."ranges" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin manage tag_types" ON "public"."tag_types" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin manage tags" ON "public"."tags" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin update shop_settings" ON "public"."shop_settings" FOR UPDATE USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin view all" ON "public"."profiles" FOR SELECT USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admin view messages" ON "public"."contact_messages" FOR SELECT USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage posts" ON "public"."posts" USING ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Create own cart" ON "public"."carts" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("anonymous_id")::"text" = ("auth"."jwt"() ->> 'anonymous_id'::"text"))));



CREATE POLICY "Create own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Manage own cart items" ON "public"."cart_items" USING ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("carts"."anonymous_id")::"text" = ("auth"."jwt"() ->> 'anonymous_id'::"text"))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("carts"."anonymous_id")::"text" = ("auth"."jwt"() ->> 'anonymous_id'::"text")))))));



CREATE POLICY "Public can read published posts" ON "public"."posts" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public read brands" ON "public"."brands" FOR SELECT USING (true);



CREATE POLICY "Public read product_images" ON "public"."product_images" FOR SELECT USING (true);



CREATE POLICY "Public read product_tags" ON "public"."product_tags" FOR SELECT USING (true);



CREATE POLICY "Public read ranges" ON "public"."ranges" FOR SELECT USING (true);



CREATE POLICY "Public read shop_settings" ON "public"."shop_settings" FOR SELECT USING (true);



CREATE POLICY "Public read tag_types" ON "public"."tag_types" FOR SELECT USING (true);



CREATE POLICY "Public read tags" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Public view active banners" ON "public"."banners" FOR SELECT USING ((("is_active" = true) OR "public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Update own cart" ON "public"."carts" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("anonymous_id")::"text" = ("auth"."jwt"() ->> 'anonymous_id'::"text")))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("anonymous_id")::"text" = ("auth"."jwt"() ->> 'anonymous_id'::"text"))));



CREATE POLICY "Update own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users manage own wishlists" ON "public"."wishlists" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users read own reservation items" ON "public"."reservation_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."reservations" "r"
  WHERE (("r"."id" = "reservation_items"."reservation_id") AND ("r"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read own reservations" ON "public"."reservations" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users view own messages" ON "public"."contact_messages" FOR SELECT USING (("user_email" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"));



CREATE POLICY "View active products" ON "public"."products" FOR SELECT USING ((("is_active" = true) OR "public"."is_user_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "View own cart" ON "public"."carts" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("anonymous_id")::"text" = ("auth"."jwt"() ->> 'anonymous_id'::"text"))));



CREATE POLICY "View own cart items" ON "public"."cart_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("carts"."anonymous_id")::"text" = ("auth"."jwt"() ->> 'anonymous_id'::"text")))))));



CREATE POLICY "View own profile" ON "public"."profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."banners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cart_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ranges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limit_buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reservation_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tag_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishlists" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."add_to_cart"("p_cart_id" "uuid", "p_product_id" "uuid", "p_quantity" integer, "p_anon_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_to_cart"("p_cart_id" "uuid", "p_product_id" "uuid", "p_quantity" integer, "p_anon_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_rate_limit"("p_key" "text", "p_max" integer, "p_window_sec" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_key" "text", "p_max" integer, "p_window_sec" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_banner_positions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_banner_positions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_banner_positions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_reservation"("p_cart_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_reservation"("p_cart_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_reservation"("p_cart_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_ticket"("p_email" "text", "p_category" "text", "p_subject" "text", "p_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_ticket"("p_email" "text", "p_category" "text", "p_subject" "text", "p_message" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."expire_stale_reservations"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."expire_stale_reservations"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_messages_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_messages_stats"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_or_create_cart"("p_user_id" "uuid", "p_anonymous_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_or_create_cart"("p_user_id" "uuid", "p_anonymous_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_admin"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_admin"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_admin"("check_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."merge_anon_cart_to_user"("p_anon_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."merge_anon_cart_to_user"("p_anon_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."merge_anon_cart_to_user"("p_anon_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_from_cart"("p_product_id" "uuid", "p_anon_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_from_cart"("p_product_id" "uuid", "p_anon_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reorder_banners"("banner_id" "uuid", "old_position" integer, "new_position" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_banners"("banner_id" "uuid", "old_position" integer, "new_position" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_banners"("banner_id" "uuid", "old_position" integer, "new_position" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



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



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."ranges" TO "anon";
GRANT ALL ON TABLE "public"."ranges" TO "authenticated";
GRANT ALL ON TABLE "public"."ranges" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_buckets" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_buckets" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_buckets" TO "service_role";



GRANT ALL ON TABLE "public"."reservation_items" TO "anon";
GRANT ALL ON TABLE "public"."reservation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."reservation_items" TO "service_role";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON TABLE "public"."shop_settings" TO "anon";
GRANT ALL ON TABLE "public"."shop_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_settings" TO "service_role";



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


-- ----------------------------------------------------------------------
-- reviews (avis produits) — bloc ajouté à la main (le dump complet via
-- scripts/db-dump.sh régénérera ce fichier proprement).
-- Source de vérité : supabase/migrations/20260606170000_reviews_system.sql
-- ----------------------------------------------------------------------
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

ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_product_id_key" UNIQUE ("user_id", "product_id");
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_reviews_product_status" ON "public"."reviews" USING "btree" ("product_id", "status");
CREATE INDEX "idx_reviews_status_created" ON "public"."reviews" USING "btree" ("status", "created_at" DESC);
CREATE INDEX "idx_reviews_user" ON "public"."reviews" USING "btree" ("user_id");

CREATE OR REPLACE TRIGGER "set_reviews_updated_at" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved reviews" ON "public"."reviews" FOR SELECT USING (("status" = 'approved'::"text"));
CREATE POLICY "Users can read own reviews" ON "public"."reviews" FOR SELECT USING ((( SELECT "auth"."uid"()) = "user_id"));
CREATE POLICY "Admins can manage reviews" ON "public"."reviews" USING ("public"."is_user_admin"(( SELECT "auth"."uid"()))) WITH CHECK ("public"."is_user_admin"(( SELECT "auth"."uid"())));






