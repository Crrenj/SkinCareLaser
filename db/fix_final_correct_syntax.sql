-- ======================================================================
-- CORRECTION FINALE AVEC SYNTAXE CORRECTE DES POLITIQUES RLS
-- ======================================================================
-- Correction de l'erreur: INSERT utilise WITH CHECK, pas USING
-- ======================================================================

-- ÉTAPE 1: Désactiver RLS sur toutes les tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 2: Supprimer toutes les politiques existantes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT DISTINCT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'brands', 'ranges', 'tag_types', 'products')
    )
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Ignorer les erreurs
        END;
    END LOOP;
END $$;

-- ÉTAPE 3: Supprimer la fonction problématique
DROP FUNCTION IF EXISTS public.is_user_admin(uuid) CASCADE;

-- ÉTAPE 4: Créer des politiques correctes pour PROFILES
-- Une seule politique pour tout gérer
CREATE POLICY "profiles_access_policy"
ON public.profiles FOR ALL
USING (
    auth.uid() = id 
    OR 
    auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid
)
WITH CHECK (
    auth.uid() = id 
    OR 
    auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid
);

-- ÉTAPE 5: Créer des politiques correctes pour BRANDS
-- SELECT - tout le monde peut lire
CREATE POLICY "brands_select_policy" ON public.brands
FOR SELECT USING (true);

-- INSERT - admin seulement
CREATE POLICY "brands_insert_policy" ON public.brands
FOR INSERT WITH CHECK (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- UPDATE - admin seulement
CREATE POLICY "brands_update_policy" ON public.brands
FOR UPDATE 
USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid)
WITH CHECK (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- DELETE - admin seulement
CREATE POLICY "brands_delete_policy" ON public.brands
FOR DELETE USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- ÉTAPE 6: Créer des politiques correctes pour RANGES
-- SELECT - tout le monde peut lire
CREATE POLICY "ranges_select_policy" ON public.ranges
FOR SELECT USING (true);

-- INSERT - admin seulement
CREATE POLICY "ranges_insert_policy" ON public.ranges
FOR INSERT WITH CHECK (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- UPDATE - admin seulement
CREATE POLICY "ranges_update_policy" ON public.ranges
FOR UPDATE 
USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid)
WITH CHECK (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- DELETE - admin seulement
CREATE POLICY "ranges_delete_policy" ON public.ranges
FOR DELETE USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- ÉTAPE 7: Réactiver RLS uniquement sur les tables nécessaires
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranges ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 8: Vérification finale
SELECT 'Politiques sur profiles:' as verification;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

SELECT 'Politiques sur brands:' as verification;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'brands';

SELECT 'Politiques sur ranges:' as verification;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'ranges';

SELECT 'Test accès profiles:' as verification;
SELECT id, display_name, is_admin FROM public.profiles LIMIT 3;

-- Message final
SELECT '✅ CORRECTION APPLIQUÉE - Syntaxe correcte pour toutes les politiques!' as message; 