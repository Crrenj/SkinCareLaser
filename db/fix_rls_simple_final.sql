-- ======================================================================
-- CORRECTION SIMPLE ET DÉFINITIVE DE LA RÉCURSION RLS
-- ======================================================================
-- Version simplifiée sans blocs complexes pour éviter les erreurs de syntaxe
-- ======================================================================

-- Étape 1: Désactiver RLS temporairement
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Étape 2: Supprimer toutes les politiques une par une (liste exhaustive)
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
DROP POLICY IF EXISTS "user_own_profile_access" ON public.profiles;
DROP POLICY IF EXISTS "specific_admin_full_access" ON public.profiles;
DROP POLICY IF EXISTS "allow_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_admin_user" ON public.profiles;

-- Étape 3: Supprimer la fonction problématique
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);

-- Étape 4: Créer UNE SEULE politique simple qui couvre tout
CREATE POLICY "simple_access_policy"
ON public.profiles FOR ALL
USING (
  auth.uid() = id 
  OR 
  auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid
);

-- Étape 5: Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Étape 6: Vérification immédiate
SELECT 'Test: Politiques actives' as verification;
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';

SELECT 'Test: Accès aux données' as verification;
SELECT id, display_name, is_admin FROM public.profiles LIMIT 3; 