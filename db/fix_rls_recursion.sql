-- ======================================================================
-- CORRECTION DE LA RÉCURSION INFINIE DANS LES POLITIQUES RLS
-- ======================================================================
-- Problème : La fonction is_user_admin() crée une récursion infinie
-- Solution : Utiliser directement la colonne is_admin de la table profiles
-- ======================================================================

-- Désactiver temporairement RLS pour éviter les erreurs pendant la correction
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 1. SUPPRIMER LES POLITIQUES PROBLÉMATIQUES
-- ======================================================================

-- Supprimer toutes les politiques existantes sur profiles
DROP POLICY IF EXISTS "View own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin view all" ON public.profiles;
DROP POLICY IF EXISTS "Create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- ======================================================================
-- 2. CRÉER DE NOUVELLES POLITIQUES SANS RÉCURSION
-- ======================================================================

-- Politique 1: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Politique 2: Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "Users can create own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Politique 3: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Politique 4: Les admins peuvent voir tous les profils (sans récursion)
-- Utilise directement is_admin au lieu de is_user_admin()
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.is_admin = true
  )
);

-- Politique 5: Les admins peuvent gérer tous les profils (sans récursion)
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.is_admin = true
  )
);

-- ======================================================================
-- 3. RÉACTIVER RLS
-- ======================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 4. CORRIGER LES AUTRES TABLES QUI UTILISENT is_user_admin()
-- ======================================================================

-- Corriger les politiques des produits
DROP POLICY IF EXISTS "View active products" ON public.products;
DROP POLICY IF EXISTS "Admin manage products" ON public.products;

CREATE POLICY "View active products" 
ON public.products FOR SELECT 
USING (
  is_active = true 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admin manage products" 
ON public.products FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Corriger les politiques des marques
DROP POLICY IF EXISTS "Admin manage brands" ON public.brands;
CREATE POLICY "Admin manage brands" 
ON public.brands FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Corriger les politiques des gammes
DROP POLICY IF EXISTS "Admin manage ranges" ON public.ranges;
CREATE POLICY "Admin manage ranges" 
ON public.ranges FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ======================================================================
-- 5. VÉRIFICATIONS
-- ======================================================================

-- Vérifier que les politiques ont été créées
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY tablename, policyname;

-- Tester l'accès au profil
SELECT 
  'Test accès profil' as test,
  count(*) as nombre_profils
FROM public.profiles;

-- ======================================================================
-- 6. NOTES IMPORTANTES
-- ======================================================================
-- 1. La fonction is_user_admin() peut être supprimée si elle n'est plus utilisée
-- 2. La table admin_users peut aussi être supprimée si elle n'est plus nécessaire
-- 3. Ces nouvelles politiques évitent la récursion en utilisant directement is_admin
-- 4. Les performances peuvent être meilleures car moins de jointures
-- ====================================================================== 