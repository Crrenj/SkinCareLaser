-- ======================================================================
-- CORRECTION DE LA RÉCURSION INFINIE DANS LES POLITIQUES RLS
-- ======================================================================
-- Problème identifié: Récursion infinie dans les politiques RLS de "profiles"
-- Cause: Politiques qui référencent la table profiles dans leurs conditions
-- Solution: Politiques simplifiées basées uniquement sur auth.uid()
-- ======================================================================

-- Étape 1: Désactiver RLS temporairement pour éviter les erreurs
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Étape 2: Supprimer TOUTES les politiques existantes problématiques
DROP POLICY IF EXISTS "View own profile" ON public.profiles;
DROP POLICY IF EXISTS "Create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin user access" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_full_access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin view all" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage all" ON public.profiles;

-- Étape 3: Créer des politiques SIMPLES sans récursion
-- Politique 1: Chaque utilisateur peut gérer son propre profil
CREATE POLICY "user_own_profile_access"
ON public.profiles FOR ALL
USING (auth.uid() = id);

-- Politique 2: L'admin spécifique (j@gmail.com) a accès à tout
CREATE POLICY "specific_admin_full_access"
ON public.profiles FOR ALL
USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- Étape 4: Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Étape 5: Vérifier que les politiques ont été créées
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Étape 6: Test de la correction
-- Cette requête devrait maintenant fonctionner sans erreur
SELECT id, display_name, is_admin FROM public.profiles LIMIT 3;

-- ======================================================================
-- NOTES IMPORTANTES
-- ======================================================================
-- 1. Ces politiques évitent toute récursion en utilisant uniquement auth.uid()
-- 2. L'admin j@gmail.com aura accès complet via son UUID spécifique
-- 3. Les autres utilisateurs n'auront accès qu'à leur propre profil
-- 4. Aucune fonction externe n'est utilisée dans les politiques
-- 5. Cette solution est basée sur l'analyse complète de la base de données
-- ======================================================================

-- ======================================================================
-- INSTRUCTIONS D'EXÉCUTION
-- ======================================================================
-- 1. Ouvrez Supabase Dashboard > SQL Editor
-- 2. Copiez et collez ce script complet
-- 3. Cliquez sur "Run" pour exécuter
-- 4. Vérifiez que les résultats des SELECT montrent les bonnes données
-- 5. Testez la connexion sur http://localhost:3001/login
-- 6. Email: j@gmail.com / Mot de passe: 123456789
-- 7. Vérifiez la redirection vers /admin/overview
-- ====================================================================== 