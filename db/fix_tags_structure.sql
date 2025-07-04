-- ======================================================================
-- CORRECTION COMPLÈTE DE LA STRUCTURE DES TAGS
-- ======================================================================
-- Ce script corrige les problèmes de structure et recrée la vue
-- ======================================================================

-- 1. Supprimer la contrainte NOT NULL sur tag_type (si elle existe encore)
ALTER TABLE public.tags 
  ALTER COLUMN tag_type DROP NOT NULL;

-- 2. Supprimer la colonne name_fr de tag_types si elle existe
ALTER TABLE public.tag_types 
  DROP COLUMN IF EXISTS name_fr;

-- 3. Mettre à jour tous les tags qui n'ont pas de tag_type_id
-- En se basant sur leur tag_type existant
UPDATE public.tags t
SET tag_type_id = tt.id
FROM public.tag_types tt
WHERE t.tag_type_id IS NULL
  AND (
    (t.tag_type = 'categories' AND tt.slug = 'categories') OR
    (t.tag_type = 'besoins' AND tt.slug = 'besoins') OR
    (t.tag_type = 'types_peau' AND tt.slug = 'types-peau') OR
    (t.tag_type = 'ingredients' AND tt.slug = 'ingredients') OR
    (t.tag_type = 'category' AND tt.slug = 'categories') OR
    (t.tag_type = 'need' AND tt.slug = 'besoins') OR
    (t.tag_type = 'skin_type' AND tt.slug = 'types-peau') OR
    (t.tag_type = 'ingredient' AND tt.slug = 'ingredients')
  );

-- 4. Supprimer les tags orphelins (sans tag_type_id valide)
DELETE FROM public.tags 
WHERE tag_type_id IS NULL;

-- 5. Rendre tag_type_id obligatoire maintenant que tous les tags en ont un
ALTER TABLE public.tags 
  ALTER COLUMN tag_type_id SET NOT NULL;

-- 6. Supprimer l'ancienne colonne tag_type (optionnel)
ALTER TABLE public.tags 
  DROP COLUMN IF EXISTS tag_type;

-- 7. Recréer la vue tags_with_types
DROP VIEW IF EXISTS public.tags_with_types;

CREATE VIEW public.tags_with_types AS
SELECT 
  t.id,
  t.name,
  t.slug,
  tt.slug as tag_type,
  tt.name as type_name,
  tt.color as type_color,
  tt.icon as type_icon,
  t.tag_type_id,
  t.created_at,
  t.updated_at
FROM public.tags t
JOIN public.tag_types tt ON t.tag_type_id = tt.id;

-- 8. Permissions sur la vue
GRANT SELECT ON public.tags_with_types TO anon, authenticated;

-- 9. Vérification finale
SELECT 
  'Structure corrigée' as status,
  COUNT(*) as total_tags,
  COUNT(DISTINCT tag_type_id) as types_uniques
FROM public.tags;

-- 10. Afficher la répartition par type
SELECT 
  tt.name as "Type",
  tt.slug as "Slug", 
  COUNT(t.id) as "Nombre de tags"
FROM public.tag_types tt
LEFT JOIN public.tags t ON t.tag_type_id = tt.id
GROUP BY tt.name, tt.slug
ORDER BY tt.name; 