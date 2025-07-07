-- ======================================================================
-- POLITIQUES RLS POUR LA GESTION DES MARQUES ET GAMMES PAR LES ADMINS
-- ======================================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Admin manage brands" ON public.brands;
DROP POLICY IF EXISTS "Admin manage ranges" ON public.ranges;

-- ======================================================================
-- POLITIQUES POUR LES MARQUES
-- ======================================================================

-- Les admins peuvent créer, modifier et supprimer les marques
CREATE POLICY "Admin manage brands" 
ON public.brands FOR ALL 
USING (public.is_user_admin(auth.uid()));

-- ======================================================================
-- POLITIQUES POUR LES GAMMES
-- ======================================================================

-- Les admins peuvent créer, modifier et supprimer les gammes
CREATE POLICY "Admin manage ranges" 
ON public.ranges FOR ALL 
USING (public.is_user_admin(auth.uid()));

-- ======================================================================
-- VÉRIFICATIONS
-- ======================================================================

-- Vérifier que les politiques ont été créées
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('brands', 'ranges')
ORDER BY tablename, policyname;

-- ======================================================================
-- NOTES
-- ======================================================================
-- 1. Ces politiques permettent aux admins de gérer complètement les marques et gammes
-- 2. La lecture publique reste possible grâce aux politiques existantes
-- 3. Seuls les utilisateurs avec is_user_admin(auth.uid()) = true peuvent modifier
-- ====================================================================== 