-- ======================================================================
-- CORRECTION FINALE DE LA STRUCTURE DES TAGS (VERSION 2 - CORRIGÉE)
-- ======================================================================
-- Ce script corrige définitivement tous les problèmes de structure
-- ======================================================================

-- 1. Supprimer complètement l'ancienne colonne tag_type
ALTER TABLE public.tags 
  DROP COLUMN IF EXISTS tag_type CASCADE;

-- 2. Supprimer la colonne name_fr de tag_types
ALTER TABLE public.tag_types 
  DROP COLUMN IF EXISTS name_fr CASCADE;

-- 3. Ajouter les colonnes created_at et updated_at si elles n'existent pas
ALTER TABLE public.tags 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.tag_types 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Ajouter la contrainte unique sur slug pour la table tags
DO $$
BEGIN
    -- Vérifier si la contrainte existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tags_slug_unique'
    ) THEN
        ALTER TABLE public.tags 
        ADD CONSTRAINT tags_slug_unique UNIQUE (slug);
    END IF;
END $$;

-- 5. S'assurer que tag_type_id est NOT NULL avec une valeur par défaut temporaire
-- D'abord, créer un type par défaut si nécessaire
INSERT INTO public.tag_types (slug, name, icon, color) 
VALUES ('default', 'Default', 'TagIcon', '#6B7280')
ON CONFLICT (slug) DO NOTHING;

-- Récupérer l'ID du type par défaut et mettre à jour les tags NULL
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

-- 6. Maintenant rendre tag_type_id NOT NULL
ALTER TABLE public.tags 
  ALTER COLUMN tag_type_id SET NOT NULL;

-- 7. Créer ou recréer les triggers pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags;
DROP TRIGGER IF EXISTS update_tag_types_updated_at ON public.tag_types;

-- Créer les nouveaux triggers
CREATE TRIGGER update_tags_updated_at 
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tag_types_updated_at 
  BEFORE UPDATE ON public.tag_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Recréer la vue tags_with_types avec les bonnes colonnes
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

-- 9. Permissions sur la vue
GRANT SELECT ON public.tags_with_types TO anon, authenticated;

-- 10. Créer quelques tags de test pour vérifier (SANS ON CONFLICT d'abord)
DO $$
DECLARE
    categories_id UUID;
    besoins_id UUID;
    tag_exists BOOLEAN;
BEGIN
    -- Récupérer les IDs des types
    SELECT id INTO categories_id FROM public.tag_types WHERE slug = 'categories' LIMIT 1;
    SELECT id INTO besoins_id FROM public.tag_types WHERE slug = 'besoins' LIMIT 1;
    
    -- Créer des tags de test si les types existent et si les tags n'existent pas déjà
    IF categories_id IS NOT NULL THEN
        -- Vérifier et créer Nettoyant
        SELECT EXISTS(SELECT 1 FROM public.tags WHERE slug = 'nettoyant') INTO tag_exists;
        IF NOT tag_exists THEN
            INSERT INTO public.tags (name, slug, tag_type_id) 
            VALUES ('Nettoyant', 'nettoyant', categories_id);
        END IF;
        
        -- Vérifier et créer Hydratant
        SELECT EXISTS(SELECT 1 FROM public.tags WHERE slug = 'hydratant') INTO tag_exists;
        IF NOT tag_exists THEN
            INSERT INTO public.tags (name, slug, tag_type_id) 
            VALUES ('Hydratant', 'hydratant', categories_id);
        END IF;
    END IF;
    
    IF besoins_id IS NOT NULL THEN
        -- Vérifier et créer Peau sèche
        SELECT EXISTS(SELECT 1 FROM public.tags WHERE slug = 'peau-seche') INTO tag_exists;
        IF NOT tag_exists THEN
            INSERT INTO public.tags (name, slug, tag_type_id) 
            VALUES ('Peau sèche', 'peau-seche', besoins_id);
        END IF;
        
        -- Vérifier et créer Anti-âge
        SELECT EXISTS(SELECT 1 FROM public.tags WHERE slug = 'anti-age') INTO tag_exists;
        IF NOT tag_exists THEN
            INSERT INTO public.tags (name, slug, tag_type_id) 
            VALUES ('Anti-âge', 'anti-age', besoins_id);
        END IF;
    END IF;
END $$;

-- 11. Vérification finale
SELECT 
  'Structure corrigée' as status,
  COUNT(*) as total_tags,
  COUNT(DISTINCT tag_type_id) as types_uniques
FROM public.tags;

-- 12. Afficher la répartition par type
SELECT 
  tt.name as "Type",
  tt.slug as "Slug", 
  COUNT(t.id) as "Nombre de tags"
FROM public.tag_types tt
LEFT JOIN public.tags t ON t.tag_type_id = tt.id
GROUP BY tt.name, tt.slug
ORDER BY tt.name;

-- 13. Tester la vue
SELECT 'Test de la vue' as test, COUNT(*) as nb_lignes 
FROM public.tags_with_types;

-- 14. Afficher la structure finale des contraintes
SELECT 
  conname as "Contrainte",
  contype as "Type"
FROM pg_constraint 
WHERE conrelid = 'public.tags'::regclass; 