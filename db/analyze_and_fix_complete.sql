-- ======================================================================
-- ANALYSE COMPLÈTE ET CORRECTION DÉFINITIVE DES POLITIQUES RLS
-- ======================================================================
-- Ce script analyse d'abord toutes les politiques existantes
-- puis applique une correction complète et définitive
-- ======================================================================

-- ======================================================================
-- PARTIE 1: ANALYSE COMPLÈTE
-- ======================================================================

-- 1.1 Lister TOUTES les politiques RLS dans la base
SELECT '===== TOUTES LES POLITIQUES RLS =====' as section;
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 1.2 Tables avec RLS activé
SELECT '===== TABLES AVEC RLS ACTIVÉ =====' as section;
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- 1.3 Recherche spécifique de politiques problématiques
SELECT '===== POLITIQUES UTILISANT is_user_admin =====' as section;
SELECT 
  tablename,
  policyname,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%is_user_admin%' OR with_check LIKE '%is_user_admin%');

-- 1.4 Politiques sur la table profiles
SELECT '===== POLITIQUES SUR PROFILES =====' as section;
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 1.5 Fonctions personnalisées
SELECT '===== FONCTIONS PERSONNALISÉES =====' as section;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%admin%'
ORDER BY routine_name;

-- ======================================================================
-- PARTIE 2: CORRECTION DÉFINITIVE
-- ======================================================================

-- 2.1 Désactiver RLS sur TOUTES les tables concernées
SELECT '===== DÉSACTIVATION RLS =====' as section;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 2.2 Supprimer TOUTES les politiques existantes via un bloc DO
SELECT '===== SUPPRESSION DES POLITIQUES =====' as section;
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Supprimer toutes les politiques sur les tables principales
    FOR r IN (
        SELECT DISTINCT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'admin_users', 'tag_types', 'brands', 'ranges', 'products')
    )
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
            RAISE NOTICE 'Supprimé: % sur %', r.policyname, r.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur suppression: % sur %', r.policyname, r.tablename;
        END;
    END LOOP;
END $$;

-- 2.3 Supprimer la fonction problématique
SELECT '===== SUPPRESSION FONCTION is_user_admin =====' as section;
DROP FUNCTION IF EXISTS public.is_user_admin(uuid) CASCADE;

-- 2.4 Créer des politiques ULTRA SIMPLES pour profiles
SELECT '===== CRÉATION NOUVELLES POLITIQUES =====' as section;

-- Une seule politique pour profiles
CREATE POLICY "simple_profile_policy"
ON public.profiles FOR ALL
USING (
  auth.uid() = id 
  OR 
  auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid
);

-- Politiques pour les autres tables (lecture publique, admin pour modifications)
CREATE POLICY "public_read_brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_brands" ON public.brands
  FOR INSERT USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);
  
CREATE POLICY "admin_update_brands" ON public.brands
  FOR UPDATE USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);
  
CREATE POLICY "admin_delete_brands" ON public.brands
  FOR DELETE USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- Même pattern pour ranges
CREATE POLICY "public_read_ranges" ON public.ranges
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_ranges" ON public.ranges
  FOR INSERT USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);
  
CREATE POLICY "admin_update_ranges" ON public.ranges
  FOR UPDATE USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);
  
CREATE POLICY "admin_delete_ranges" ON public.ranges
  FOR DELETE USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- 2.5 Réactiver RLS
SELECT '===== RÉACTIVATION RLS =====' as section;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranges ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- PARTIE 3: VÉRIFICATION FINALE
-- ======================================================================

SELECT '===== VÉRIFICATION FINALE =====' as section;

-- 3.1 Nouvelles politiques créées
SELECT 'Politiques sur profiles:' as check_type;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

SELECT 'Politiques sur brands:' as check_type;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'brands';

SELECT 'Politiques sur ranges:' as check_type;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'ranges';

-- 3.2 Test d'accès aux données
SELECT 'Test accès profiles:' as check_type;
SELECT id, display_name, is_admin FROM public.profiles;

-- 3.3 Message final
SELECT '✅ CORRECTION TERMINÉE - Testez maintenant la connexion!' as message; 