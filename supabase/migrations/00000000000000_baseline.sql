-- ======================================================================
-- SCHÉMA CANONIQUE — Skincare Laser / FARMAU
-- ======================================================================
-- Source de vérité unique. À exécuter dans Supabase SQL Editor sur un
-- projet vierge. Idempotent (CREATE IF NOT EXISTS / DROP IF EXISTS).
--
-- Contenu :
--   0. Extensions
--   1. Profils & admins
--   2. Catalogue (brands, ranges, products, tags, tag_types, images)
--   3. Vue tags_with_types
--   4. Panier (carts, cart_items)
--   5. Commandes (orders, order_items)
--   6. Bannières
--   7. Messages de contact
--   8. Storage policies (bucket product-image)
--   9. Helpers, triggers, RPC
--  10. RLS policies
--  11. Permissions GRANT
--  12. Bootstrap admin
-- ======================================================================

-- ======================================================================
-- 0. EXTENSIONS
-- ======================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================================================================
-- 1. PROFILS UTILISATEURS & TABLE D'ADMINS
-- ======================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  first_name    TEXT,
  last_name     TEXT,
  phone         TEXT,
  birth_date    DATE,
  is_admin      BOOLEAN DEFAULT false,
  role          TEXT DEFAULT 'user' CHECK (role IN ('user','admin','customer')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Table dédiée pour éviter la récursion dans les policies RLS sur profiles
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================================
-- 2. CATALOGUE
-- ======================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  currency    CHAR(3) DEFAULT 'DOP',
  image_url   TEXT,
  stock       INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.brands (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT NOT NULL UNIQUE,
  slug      TEXT NOT NULL UNIQUE,
  fiche_url TEXT
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ranges (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  slug     TEXT NOT NULL,
  UNIQUE (brand_id, slug)
);
ALTER TABLE public.ranges ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.product_ranges (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  range_id   UUID REFERENCES public.ranges(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, range_id)
);
ALTER TABLE public.product_ranges ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tag_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  icon       TEXT,
  color      TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tag_types ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_type_id UUID NOT NULL REFERENCES public.tag_types(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  UNIQUE (tag_type_id, slug)
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.product_tags (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id     UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 3. VUE tags_with_types (utilisée par le front catalogue & product)
-- ======================================================================
CREATE OR REPLACE VIEW public.tags_with_types AS
SELECT
  t.id,
  t.name,
  t.slug,
  tt.slug AS tag_type,
  tt.name AS type_name,
  tt.color AS type_color,
  tt.icon AS type_icon,
  t.tag_type_id
FROM public.tags t
JOIN public.tag_types tt ON t.tag_type_id = tt.id;

-- ======================================================================
-- 4. PANIER
-- ======================================================================
CREATE TABLE IF NOT EXISTS public.carts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_cart      UNIQUE (user_id),
  CONSTRAINT unique_anonymous_cart UNIQUE (anonymous_id)
);
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 5. COMMANDES
-- ======================================================================
DO $$
BEGIN
  CREATE TYPE order_status AS ENUM ('pending','paid','shipped','completed','cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.orders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id),
  status     order_status DEFAULT 'pending',
  total      NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  unit_price NUMERIC(10,2),
  quantity   INT NOT NULL CHECK (quantity > 0)
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 6. BANNIÈRES
-- ======================================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  image_url   TEXT,
  link_url    TEXT,
  link_text   VARCHAR(100),
  banner_type VARCHAR(20) NOT NULL DEFAULT 'image_left'
    CHECK (banner_type IN ('image_left','image_right','image_full','card_style','minimal','gradient_overlay')),
  position    INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  start_date  DATE,
  end_date    DATE,
  click_count INTEGER DEFAULT 0,
  view_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_banners_position        ON public.banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_active          ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_active_position ON public.banners(is_active, position);

-- ======================================================================
-- 7. MESSAGES DE CONTACT
-- ======================================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT DEFAULT 'unread' CHECK (status IN ('unread','read','replied','archived')),
  priority    TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  admin_notes TEXT,
  replied_at  TIMESTAMPTZ,
  replied_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_contact_messages_email   ON public.contact_messages(user_email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status  ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);

-- ======================================================================
-- 8. STORAGE — buckets et policies
-- ======================================================================
-- Bucket des images produits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-image', 'product-image', true, 5242880,
  ARRAY['image/png','image/jpeg','image/jpg','image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/jpg','image/webp']::text[];

-- Bucket des fiches PDF par marque
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-fiche', 'brand-fiche', true, 31457280,  -- 30 MB pour les gros PDFs
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 31457280,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- ======================================================================
-- 9. HELPERS / TRIGGERS / RPC
-- ======================================================================

-- Helper : check admin (utilisé par toutes les policies, évite la récursion sur profiles)
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = check_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger générique updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création automatique du profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_admin, display_name, role)
  VALUES (
    NEW.id, false,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at         ON public.profiles;
DROP TRIGGER IF EXISTS update_products_updated_at         ON public.products;
DROP TRIGGER IF EXISTS update_carts_updated_at            ON public.carts;
DROP TRIGGER IF EXISTS update_cart_items_updated_at       ON public.cart_items;
DROP TRIGGER IF EXISTS update_banners_updated_at          ON public.banners;
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON public.contact_messages;
DROP TRIGGER IF EXISTS update_tag_types_updated_at        ON public.tag_types;

CREATE TRIGGER update_profiles_updated_at         BEFORE UPDATE ON public.profiles         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at         BEFORE UPDATE ON public.products         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_carts_updated_at            BEFORE UPDATE ON public.carts            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at       BEFORE UPDATE ON public.cart_items       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_banners_updated_at          BEFORE UPDATE ON public.banners          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tag_types_updated_at        BEFORE UPDATE ON public.tag_types        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC panier — get_or_create_cart
CREATE OR REPLACE FUNCTION public.get_or_create_cart(
  p_user_id      UUID DEFAULT NULL,
  p_anonymous_id UUID DEFAULT NULL
) RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC panier — add_to_cart (param canonique p_quantity)
CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_cart_id    UUID,
  p_product_id UUID,
  p_quantity   INT,
  p_anon_id    UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF p_anon_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND anonymous_id = p_anon_id
  ) THEN
    RAISE EXCEPTION 'Panier non autorisé';
  END IF;

  INSERT INTO public.cart_items (cart_id, product_id, quantity)
  VALUES (p_cart_id, p_product_id, p_quantity)
  ON CONFLICT (cart_id, product_id)
  DO UPDATE SET quantity = EXCLUDED.quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC panier — remove_from_cart
CREATE OR REPLACE FUNCTION public.remove_from_cart(
  p_product_id UUID,
  p_anon_id    UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  DELETE FROM public.cart_items
  WHERE product_id = p_product_id
    AND cart_id IN (
      SELECT id FROM public.carts WHERE anonymous_id = p_anon_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC bannières — reorder_banners
CREATE OR REPLACE FUNCTION public.reorder_banners(
  banner_id    UUID,
  old_position INTEGER,
  new_position INTEGER
) RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;

-- RPC bannières — cleanup positions
CREATE OR REPLACE FUNCTION public.cleanup_banner_positions()
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;

-- RPC messages — create_contact_message
CREATE OR REPLACE FUNCTION public.create_contact_message(
  p_email   TEXT,
  p_subject TEXT,
  p_message TEXT
) RETURNS JSON AS $$
DECLARE
  v_user_id    UUID;
  v_message_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false,
      'error', 'Email non trouvé. Vous devez avoir un compte pour envoyer un message.');
  END IF;

  INSERT INTO public.contact_messages (user_email, user_id, subject, message)
  VALUES (p_email, v_user_id, p_subject, p_message)
  RETURNING id INTO v_message_id;

  RETURN json_build_object('success', true, 'message_id', v_message_id,
    'message', 'Message envoyé avec succès!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC messages — mark as read
CREATE OR REPLACE FUNCTION public.mark_message_as_read(p_message_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.contact_messages
  SET status = 'read', updated_at = NOW()
  WHERE id = p_message_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC messages — stats
CREATE OR REPLACE FUNCTION public.get_messages_stats()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total',      COUNT(*),
    'unread',     COUNT(*) FILTER (WHERE status = 'unread'),
    'read',       COUNT(*) FILTER (WHERE status = 'read'),
    'replied',    COUNT(*) FILTER (WHERE status = 'replied'),
    'archived',   COUNT(*) FILTER (WHERE status = 'archived'),
    'today',      COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE),
    'this_week',  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')
  ) INTO v_stats
  FROM public.contact_messages;
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================================
-- 10. POLICIES RLS
-- ======================================================================

-- ----- profiles -----
DROP POLICY IF EXISTS "View own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Admin view all"     ON public.profiles;
DROP POLICY IF EXISTS "Create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage all"   ON public.profiles;

CREATE POLICY "View own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin view all"     ON public.profiles FOR SELECT USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Create own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin manage all"   ON public.profiles FOR ALL    USING (public.is_user_admin(auth.uid()));

-- ----- catalogue (lecture publique + écriture admin) -----
DROP POLICY IF EXISTS "View active products"        ON public.products;
DROP POLICY IF EXISTS "Admin manage products"       ON public.products;
DROP POLICY IF EXISTS "Public read brands"          ON public.brands;
DROP POLICY IF EXISTS "Admin manage brands"         ON public.brands;
DROP POLICY IF EXISTS "Public read ranges"          ON public.ranges;
DROP POLICY IF EXISTS "Admin manage ranges"         ON public.ranges;
DROP POLICY IF EXISTS "Public read product_ranges"  ON public.product_ranges;
DROP POLICY IF EXISTS "Admin manage product_ranges" ON public.product_ranges;
DROP POLICY IF EXISTS "Public read tag_types"       ON public.tag_types;
DROP POLICY IF EXISTS "Admin manage tag_types"      ON public.tag_types;
DROP POLICY IF EXISTS "Public read tags"            ON public.tags;
DROP POLICY IF EXISTS "Admin manage tags"           ON public.tags;
DROP POLICY IF EXISTS "Public read product_tags"    ON public.product_tags;
DROP POLICY IF EXISTS "Admin manage product_tags"   ON public.product_tags;
DROP POLICY IF EXISTS "Public read product_images"  ON public.product_images;
DROP POLICY IF EXISTS "Admin manage product_images" ON public.product_images;

CREATE POLICY "View active products"        ON public.products        FOR SELECT USING (is_active = true OR public.is_user_admin(auth.uid()));
CREATE POLICY "Admin manage products"       ON public.products        FOR ALL    USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Public read brands"          ON public.brands          FOR SELECT USING (true);
CREATE POLICY "Admin manage brands"         ON public.brands          FOR ALL    USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Public read ranges"          ON public.ranges          FOR SELECT USING (true);
CREATE POLICY "Admin manage ranges"         ON public.ranges          FOR ALL    USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Public read product_ranges"  ON public.product_ranges  FOR SELECT USING (true);
CREATE POLICY "Admin manage product_ranges" ON public.product_ranges  FOR ALL    USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Public read tag_types"       ON public.tag_types       FOR SELECT USING (true);
CREATE POLICY "Admin manage tag_types"      ON public.tag_types       FOR ALL    USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Public read tags"            ON public.tags            FOR SELECT USING (true);
CREATE POLICY "Admin manage tags"           ON public.tags            FOR ALL    USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Public read product_tags"    ON public.product_tags    FOR SELECT USING (true);
CREATE POLICY "Admin manage product_tags"   ON public.product_tags    FOR ALL    USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Public read product_images"  ON public.product_images  FOR SELECT USING (true);
CREATE POLICY "Admin manage product_images" ON public.product_images  FOR ALL    USING (public.is_user_admin(auth.uid()));

-- ----- panier (propriétaire utilisateur OU session anonyme via JWT claim) -----
DROP POLICY IF EXISTS "View own cart"        ON public.carts;
DROP POLICY IF EXISTS "Create own cart"      ON public.carts;
DROP POLICY IF EXISTS "Update own cart"      ON public.carts;
DROP POLICY IF EXISTS "View own cart items"  ON public.cart_items;
DROP POLICY IF EXISTS "Manage own cart items" ON public.cart_items;

CREATE POLICY "View own cart"   ON public.carts FOR SELECT USING (
  auth.uid() = user_id OR anonymous_id::text = auth.jwt()->>'anonymous_id'
);
CREATE POLICY "Create own cart" ON public.carts FOR INSERT WITH CHECK (
  auth.uid() = user_id OR anonymous_id::text = auth.jwt()->>'anonymous_id'
);
CREATE POLICY "Update own cart" ON public.carts FOR UPDATE USING (
  auth.uid() = user_id OR anonymous_id::text = auth.jwt()->>'anonymous_id'
);

CREATE POLICY "View own cart items" ON public.cart_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR carts.anonymous_id::text = auth.jwt()->>'anonymous_id'))
);
CREATE POLICY "Manage own cart items" ON public.cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR carts.anonymous_id::text = auth.jwt()->>'anonymous_id'))
);

-- ----- commandes -----
DROP POLICY IF EXISTS "Order owner"       ON public.orders;
DROP POLICY IF EXISTS "Order items owner" ON public.order_items;

CREATE POLICY "Order owner"       ON public.orders      FOR ALL USING (user_id = auth.uid() OR public.is_user_admin(auth.uid()));
CREATE POLICY "Order items owner" ON public.order_items FOR ALL USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  OR public.is_user_admin(auth.uid())
);

-- ----- bannières -----
DROP POLICY IF EXISTS "Public view active banners" ON public.banners;
DROP POLICY IF EXISTS "Admin manage banners"       ON public.banners;

CREATE POLICY "Public view active banners" ON public.banners FOR SELECT USING (is_active = true OR public.is_user_admin(auth.uid()));
CREATE POLICY "Admin manage banners"       ON public.banners FOR ALL    USING (public.is_user_admin(auth.uid()));

-- ----- messages de contact -----
DROP POLICY IF EXISTS "Admin view messages"     ON public.contact_messages;
DROP POLICY IF EXISTS "Users view own messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admin manage messages"   ON public.contact_messages;
DROP POLICY IF EXISTS "Insert valid email"      ON public.contact_messages;

CREATE POLICY "Admin view messages"     ON public.contact_messages FOR SELECT USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Users view own messages" ON public.contact_messages FOR SELECT USING (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "Admin manage messages"   ON public.contact_messages FOR ALL    USING (public.is_user_admin(auth.uid()));
CREATE POLICY "Insert valid email"      ON public.contact_messages FOR INSERT WITH CHECK (
  user_email IN (SELECT email FROM auth.users)
);

-- ----- storage policies -----
DROP POLICY IF EXISTS "Public read product-image"   ON storage.objects;
DROP POLICY IF EXISTS "Admin write product-image"   ON storage.objects;
DROP POLICY IF EXISTS "Admin update product-image"  ON storage.objects;
DROP POLICY IF EXISTS "Admin delete product-image"  ON storage.objects;
DROP POLICY IF EXISTS "Public read brand-fiche"     ON storage.objects;
DROP POLICY IF EXISTS "Admin write brand-fiche"     ON storage.objects;

CREATE POLICY "Public read product-image"  ON storage.objects FOR SELECT TO public        USING (bucket_id = 'product-image');
CREATE POLICY "Admin write product-image"  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-image' AND public.is_user_admin(auth.uid()));
CREATE POLICY "Admin update product-image" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-image' AND public.is_user_admin(auth.uid()));
CREATE POLICY "Admin delete product-image" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-image' AND public.is_user_admin(auth.uid()));
CREATE POLICY "Public read brand-fiche"    ON storage.objects FOR SELECT TO public        USING (bucket_id = 'brand-fiche');
CREATE POLICY "Admin write brand-fiche"    ON storage.objects FOR ALL    TO authenticated USING (bucket_id = 'brand-fiche' AND public.is_user_admin(auth.uid()));

-- ======================================================================
-- 11. PERMISSIONS GRANT
-- ======================================================================
GRANT USAGE  ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES    IN SCHEMA public TO anon;
GRANT ALL    ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL    ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.tags_with_types TO anon, authenticated;

-- ======================================================================
-- 12. BOOTSTRAP ADMIN
-- ======================================================================
-- L'UUID admin n'est PAS hardcodé ici. Pour créer un admin :
--   1. Créer l'utilisateur (via signup, ou scripts/create-admin-user.js)
--   2. Récupérer son UUID dans Supabase Auth
--   3. Exécuter :
--        INSERT INTO public.admin_users (user_id) VALUES ('<uuid>');
--        UPDATE public.profiles SET is_admin = true, role = 'admin' WHERE id = '<uuid>';

-- ======================================================================
-- VÉRIFICATIONS
-- ======================================================================
SELECT 'Tables créées:' AS info, COUNT(*) AS nb
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT 'Policies RLS:' AS info, COUNT(*) AS nb
FROM pg_policies WHERE schemaname = 'public';

SELECT 'Buckets storage:' AS info, COUNT(*) AS nb
FROM storage.buckets WHERE id IN ('product-image', 'brand-fiche');
