-- ======================================================================
-- SCHEMA COMPLET - BASE DE DONNÉES SKINCARE LASER
-- ======================================================================
-- Ce fichier contient TOUTE la configuration de la base de données :
-- - Authentification & Profils utilisateurs  
-- - Catalogue produits (marques, gammes, tags)
-- - Système de panier (invité/authentifié)
-- - Commandes
-- - RLS (Row Level Security)
-- - Triggers et fonctions utilitaires
-- ======================================================================

-- ======================================================================
-- 0. EXTENSIONS
-- ======================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- pour gen_random_uuid()

-- ======================================================================
-- 1. TABLE PROFILES (Utilisateurs et admins)
-- ======================================================================

-- Créer la table profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user' CHECK (role IN ('user','admin','customer'))
);

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user','admin','customer'));

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Activer RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 2. TABLE ADMIN_USERS (Pour éviter la récursion dans les policies)
-- ======================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- 3. CATALOGUE PRODUITS (Tables complètes)
-- ======================================================================

-- Table principale des produits
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) DEFAULT 'DOP',
  category TEXT,
  sub_category TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marques
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

-- Gammes de produits
CREATE TABLE IF NOT EXISTS public.ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  UNIQUE (brand_id, slug)
);

-- Relation produit ↔ gamme
CREATE TABLE IF NOT EXISTS public.product_ranges (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  range_id UUID REFERENCES public.ranges(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, range_id)
);

-- Tags (catégories, besoins, types de peau, ingrédients)
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('category','need','skin_type','ingredient'))
);

CREATE UNIQUE INDEX IF NOT EXISTS tags_type_slug_idx ON public.tags(tag_type, slug);

-- Relation produit ↔ tag
CREATE TABLE IF NOT EXISTS public.product_tags (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Images produits
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT
);

-- Activer RLS sur toutes les tables produits
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 4. SYSTÈME DE PANIER
-- ======================================================================

-- Paniers (invité ou authentifié)
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_cart UNIQUE (user_id),
  CONSTRAINT unique_anonymous_cart UNIQUE (anonymous_id)
);

-- Items du panier
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);

-- Activer RLS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 5. COMMANDES
-- ======================================================================

-- Créer le type enum pour le statut des commandes
DO $$
BEGIN
  CREATE TYPE order_status AS ENUM ('pending','paid','shipped','completed','cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Table des commandes
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  status order_status DEFAULT 'pending',
  total NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items des commandes
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  unit_price NUMERIC(10,2),
  quantity INT NOT NULL CHECK (quantity > 0)
);

-- Activer RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 6. FONCTION HELPER POUR VÉRIFIER SI ADMIN
-- ======================================================================

CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users au
    WHERE au.user_id = check_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ======================================================================
-- 7. TRIGGERS
-- ======================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_admin, display_name, role)
  VALUES (
    NEW.id, 
    false, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer les triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ======================================================================
-- 8. POLICIES RLS POUR PROFILES
-- ======================================================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "View own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin view all" ON public.profiles;
DROP POLICY IF EXISTS "Create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Les utilisateurs voient leur profil
CREATE POLICY "View own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Les admins voient tout
CREATE POLICY "Admin view all" 
ON public.profiles FOR SELECT 
USING (public.is_user_admin(auth.uid()));

-- Créer son profil
CREATE POLICY "Create own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Mettre à jour son profil
CREATE POLICY "Update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Les admins peuvent tout
CREATE POLICY "Admin manage all" 
ON public.profiles FOR ALL 
USING (public.is_user_admin(auth.uid()));

-- ======================================================================
-- 9. POLICIES RLS POUR CATALOGUE (lecture publique)
-- ======================================================================

-- Tout le monde peut voir les produits actifs
CREATE POLICY "View active products" 
ON public.products FOR SELECT 
USING (is_active = true OR public.is_user_admin(auth.uid()));

-- Seuls les admins peuvent gérer les produits
CREATE POLICY "Admin manage products" 
ON public.products FOR ALL 
USING (public.is_user_admin(auth.uid()));

-- Lecture publique pour toutes les tables du catalogue
CREATE POLICY "Public read brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Public read ranges" ON public.ranges
  FOR SELECT USING (true);

CREATE POLICY "Public read product_ranges" ON public.product_ranges
  FOR SELECT USING (true);

CREATE POLICY "Public read tags" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Public read product_tags" ON public.product_tags
  FOR SELECT USING (true);

CREATE POLICY "Public read images" ON public.product_images
  FOR SELECT USING (true);

-- ======================================================================
-- 10. POLICIES RLS POUR PANIERS
-- ======================================================================

-- Les utilisateurs peuvent voir leur panier
CREATE POLICY "View own cart" 
ON public.carts FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  anonymous_id::text = auth.jwt()->>'anonymous_id'
);

-- Les utilisateurs peuvent créer leur panier
CREATE POLICY "Create own cart" 
ON public.carts FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR 
  anonymous_id::text = auth.jwt()->>'anonymous_id'
);

-- Les utilisateurs peuvent mettre à jour leur panier
CREATE POLICY "Update own cart" 
ON public.carts FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR 
  anonymous_id::text = auth.jwt()->>'anonymous_id'
);

-- Les utilisateurs peuvent voir leurs articles
CREATE POLICY "View own cart items" 
ON public.cart_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id
    AND (
      carts.user_id = auth.uid() 
      OR 
      carts.anonymous_id::text = auth.jwt()->>'anonymous_id'
    )
  )
);

-- Les utilisateurs peuvent gérer leurs articles
CREATE POLICY "Manage own cart items" 
ON public.cart_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id
    AND (
      carts.user_id = auth.uid() 
      OR 
      carts.anonymous_id::text = auth.jwt()->>'anonymous_id'
    )
  )
);

-- ======================================================================
-- 11. POLICIES RLS POUR COMMANDES
-- ======================================================================

CREATE POLICY "Order owner"
  ON public.orders
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Order items owner"
  ON public.order_items
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- ======================================================================
-- 12. FONCTIONS UTILITAIRES
-- ======================================================================

-- Fonction pour obtenir ou créer un panier
CREATE OR REPLACE FUNCTION public.get_or_create_cart(
  p_user_id UUID DEFAULT NULL,
  p_anonymous_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_cart_id UUID;
BEGIN
  -- Chercher un panier existant
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id;
  ELSIF p_anonymous_id IS NOT NULL THEN
    SELECT id INTO v_cart_id FROM public.carts WHERE anonymous_id = p_anonymous_id;
  END IF;
  
  -- Si pas de panier, en créer un
  IF v_cart_id IS NULL THEN
    INSERT INTO public.carts (user_id, anonymous_id)
    VALUES (p_user_id, p_anonymous_id)
    RETURNING id INTO v_cart_id;
  END IF;
  
  RETURN v_cart_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ajouter un produit au panier
CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_cart_id UUID,
  p_product_id UUID,
  p_quantity INT,
  p_anon_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Vérifier que le panier appartient à l'utilisateur
  IF p_anon_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.carts 
    WHERE id = p_cart_id AND anonymous_id = p_anon_id
  ) THEN
    RAISE EXCEPTION 'Panier non autorisé';
  END IF;
  
  -- Upsert l'item
  INSERT INTO public.cart_items(cart_id, product_id, quantity)
  VALUES (p_cart_id, p_product_id, p_quantity)
  ON CONFLICT (cart_id, product_id)
  DO UPDATE SET quantity = p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer un produit du panier
CREATE OR REPLACE FUNCTION public.remove_from_cart(
  p_product_id UUID,
  p_anon_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.cart_items
  WHERE product_id = p_product_id
    AND cart_id IN (
      SELECT id FROM public.carts 
      WHERE anonymous_id = p_anon_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================================
-- 13. PERMISSIONS
-- ======================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ======================================================================
-- 14. DONNÉES INITIALES - COMPTE ADMIN
-- ======================================================================

-- Ajouter l'utilisateur admin (j@gmail.com) dans les tables
INSERT INTO public.profiles (id, is_admin, display_name, role)
VALUES (
  'e7bc4c23-a9c8-4551-b212-b6a540af21ed',
  true,
  'Admin Principal',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET 
  is_admin = true,
  role = 'admin';

-- Ajouter dans la table admin_users
INSERT INTO public.admin_users (user_id) 
VALUES ('e7bc4c23-a9c8-4551-b212-b6a540af21ed')
ON CONFLICT DO NOTHING;

-- ======================================================================
-- 15. VÉRIFICATIONS
-- ======================================================================

-- Vérifier que tout est créé
SELECT 
  'Tables créées:' as info,
  count(*) as nombre
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Vérifier les policies
SELECT 
  'Policies créées:' as info,
  count(*) as nombre
FROM pg_policies 
WHERE schemaname = 'public';

-- Vérifier le profil admin
SELECT 
  p.*,
  u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = true;

-- ======================================================================
-- NOTES D'UTILISATION
-- ======================================================================
-- 1. Compte admin par défaut : j@gmail.com (UUID: e7bc4c23-a9c8-4551-b212-b6a540af21ed)
-- 2. Les nouveaux utilisateurs sont créés automatiquement dans profiles
-- 3. Les admins sont gérés via la table admin_users
-- 4. Le panier supporte les utilisateurs connectés et anonymes
-- 5. Catalogue complet avec marques, gammes, tags et images
-- ====================================================================== 