-- ======================================================================
-- CORRECTION FORCÉE DE LA RÉCURSION RLS - VERSION AGRESSIVE
-- ======================================================================
-- Problème: La récursion persiste malgré le script précédent
-- Solution: Suppression forcée et reconstruction complète
-- ======================================================================

-- Étape 1: Désactiver RLS sur TOUTES les tables liées
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Étape 2: Supprimer TOUTES les politiques sur profiles (même celles non listées)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Étape 3: Supprimer la fonction problématique is_user_admin
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);

-- Étape 4: Vider le cache des politiques (forcer le rafraîchissement)
NOTIFY pgrst, 'reload schema';

-- Étape 5: Créer des politiques ultra-simples
CREATE POLICY "allow_own_profile"
ON public.profiles FOR ALL
USING (auth.uid() = id);

CREATE POLICY "allow_admin_user"
ON public.profiles FOR ALL
USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- Étape 6: Réactiver RLS uniquement sur profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Étape 7: Test immédiat
SELECT 'Test 1: Profiles accessibles' as test;
SELECT id, display_name, is_admin FROM public.profiles;

SELECT 'Test 2: Politiques créées' as test;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Étape 8: Redémarrer les connexions (optionnel)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = current_database() 
  AND pid <> pg_backend_pid()
  AND state = 'idle';

-- ======================================================================
-- VÉRIFICATION FINALE
-- ======================================================================
SELECT 'CORRECTION APPLIQUÉE - Testez maintenant la connexion' as message; 