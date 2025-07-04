-- ======================================================================
-- SUPPRESSION DE LA COLONNE NAME_FR DE LA TABLE TAG_TYPES
-- ======================================================================
-- Ce script supprime la colonne name_fr qui est redondante avec name_en
-- ======================================================================

-- 1. Supprimer la colonne name_fr de la table tag_types
ALTER TABLE public.tag_types 
DROP COLUMN IF EXISTS name_fr;

-- 2. Vérifier la structure finale
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tag_types' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Afficher les données pour vérification
SELECT id, slug, name_en, icon, color, created_at
FROM public.tag_types
ORDER BY id; 