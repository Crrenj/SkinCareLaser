-- ======================================================================
-- CORRECTION FINALE DE LA STRUCTURE DES TAGS
-- ======================================================================
-- Ce script corrige définitivement tous les problèmes de structure
-- ======================================================================

-- 1. Supprimer complètement l'ancienne colonne tag_type
ALTER TABLE public.tags 
  DROP COLUMN IF EXISTS tag_type CASCADE;

-- 2. Supprimer la colonne name_fr de tag_types
ALTER TABLE public.tag_types 
  DROP COLUMN IF EXISTS name_fr CASCADE;

-- 3. S'assurer que tag_type_id est NOT NULL avec une valeur par défaut temporaire
-- D'abord, créer un type par défaut si nécessaire
INSERT INTO public.tag_types (slug, name, icon, color) 
VALUES ('default', 'Default', 'TagIcon', '#6B7280')
ON CONFLICT (slug) DO NOTHING;

-- Récupérer l'ID du type par défaut
DO $$
DECLARE
    default_type_id UUID;
BEGIN
    SELECT id INTO default_type_id FROM public.tag_types WHERE slug = 'default' LIMIT 1;
    
    -- Mettre à jour tous les tags NULL avec le type par défaut
    UPDATE public.tags 
    SET tag_type_id = default_type_id 
    WHERE tag_type_id IS NULL;
END $$;

-- 4. Maintenant rendre tag_type_id NOT NULL
ALTER TABLE public.tags 
  ALTER COLUMN tag_type_id SET NOT NULL;

-- 5. Recréer la vue tags_with_types
DROP VIEW IF EXISTS public.tags_with_types CASCADE;

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

-- 6. Permissions sur la vue
GRANT SELECT ON public.tags_with_types TO anon, authenticated;

-- 7. Créer quelques tags de test pour vérifier
DO $$
DECLARE
    categories_id UUID;
    besoins_id UUID;
BEGIN
    -- Récupérer les IDs des types
    SELECT id INTO categories_id FROM public.tag_types WHERE slug = 'categories' LIMIT 1;
    SELECT id INTO besoins_id FROM public.tag_types WHERE slug = 'besoins' LIMIT 1;
    
    -- Créer des tags de test si les types existent
    IF categories_id IS NOT NULL THEN
        INSERT INTO public.tags (name, slug, tag_type_id) 
        VALUES 
            ('Nettoyant', 'nettoyant', categories_id),
            ('Hydratant', 'hydratant', categories_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;
    
    IF besoins_id IS NOT NULL THEN
        INSERT INTO public.tags (name, slug, tag_type_id) 
        VALUES 
            ('Peau sèche', 'peau-seche', besoins_id),
            ('Anti-âge', 'anti-age', besoins_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;
END $$;

-- 8. Vérification finale
SELECT 
  'Structure corrigée' as status,
  COUNT(*) as total_tags,
  COUNT(DISTINCT tag_type_id) as types_uniques
FROM public.tags;

-- 9. Afficher la répartition par type
SELECT 
  tt.name as "Type",
  tt.slug as "Slug", 
  COUNT(t.id) as "Nombre de tags"
FROM public.tag_types tt
LEFT JOIN public.tags t ON t.tag_type_id = tt.id
GROUP BY tt.name, tt.slug
ORDER BY tt.name; 