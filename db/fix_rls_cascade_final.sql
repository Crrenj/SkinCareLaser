-- ======================================================================
-- CORRECTION DÉFINITIVE AVEC CASCADE POUR SUPPRIMER TOUTES LES DÉPENDANCES
-- ======================================================================
-- Problème: La fonction is_user_admin est utilisée par plusieurs politiques
-- Solution: Suppression en cascade puis reconstruction propre
-- ======================================================================

-- Étape 1: Désactiver RLS sur toutes les tables concernées
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranges DISABLE ROW LEVEL SECURITY;

-- Étape 2: Supprimer la fonction is_user_admin ET toutes ses dépendances
DROP FUNCTION IF EXISTS public.is_user_admin(uuid) CASCADE;

-- Étape 3: Créer des politiques simples pour la table profiles
CREATE POLICY "simple_profile_access"
ON public.profiles FOR ALL
USING (
  auth.uid() = id 
  OR 
  auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid
);

-- Étape 4: Créer des politiques simples pour les autres tables
-- Table tag_types
CREATE POLICY "public_read_tag_types" ON public.tag_types
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_tag_types" ON public.tag_types
  FOR ALL USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- Table brands
CREATE POLICY "public_read_brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_brands" ON public.brands
  FOR ALL USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- Table ranges
CREATE POLICY "public_read_ranges" ON public.ranges
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_ranges" ON public.ranges
  FOR ALL USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- Étape 5: Réactiver RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranges ENABLE ROW LEVEL SECURITY;

-- Étape 6: Vérification complète
SELECT 'Test 1: Politiques sur profiles' as verification;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

SELECT 'Test 2: Politiques sur tag_types' as verification;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tag_types';

SELECT 'Test 3: Politiques sur brands' as verification;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'brands';

SELECT 'Test 4: Politiques sur ranges' as verification;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'ranges';

SELECT 'Test 5: Accès aux données profiles' as verification;
SELECT id, display_name, is_admin FROM public.profiles LIMIT 3;

-- ======================================================================
-- RÉSULTAT ATTENDU
-- ======================================================================
-- Toutes les politiques problématiques doivent être supprimées
-- Nouvelles politiques simples créées sans récursion
-- L'admin j@gmail.com doit avoir accès complet
-- Les autres utilisateurs ont accès limité selon les règles
-- ====================================================================== 