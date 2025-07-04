-- ======================================================================
-- MODIFICATION DE LA STRUCTURE DES TAGS
-- ======================================================================
-- Ce script modifie la structure des tags pour permettre la création
-- de nouveaux types de tags de manière dynamique
-- ======================================================================

-- 0. Créer la fonction update_updated_at_column si elle n'existe pas
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Créer la table des types de tags
CREATE TABLE IF NOT EXISTS public.tag_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insérer les types existants
INSERT INTO public.tag_types (slug, name, icon, color) VALUES
  ('categories', 'Categories', 'FolderIcon', '#3B82F6'),
  ('besoins', 'Needs', 'HeartIcon', '#10B981'),
  ('types-peau', 'Skin Types', 'UserGroupIcon', '#F59E0B'),
  ('ingredients', 'Ingredients', 'BeakerIcon', '#8B5CF6')
ON CONFLICT (slug) DO NOTHING;

-- 3. Sauvegarder les tags existants
CREATE TEMP TABLE tags_backup AS 
SELECT * FROM public.tags;

-- 4. Supprimer l'index unique existant
DROP INDEX IF EXISTS tags_type_slug_idx;

-- 5. Modifier la table tags pour utiliser la référence
ALTER TABLE public.tags 
  DROP CONSTRAINT IF EXISTS tags_tag_type_check;

-- 6. Ajouter la colonne tag_type_id
ALTER TABLE public.tags 
  ADD COLUMN IF NOT EXISTS tag_type_id UUID;

-- 7. Mettre à jour les références basées sur tag_type existant
UPDATE public.tags t
SET tag_type_id = tt.id
FROM public.tag_types tt
WHERE (t.tag_type = 'categories' AND tt.slug = 'categories')
   OR (t.tag_type = 'besoins' AND tt.slug = 'besoins')
   OR (t.tag_type = 'types_peau' AND tt.slug = 'types-peau')
   OR (t.tag_type = 'ingredients' AND tt.slug = 'ingredients');

-- 8. Rendre tag_type_id NOT NULL et ajouter la contrainte de clé étrangère
ALTER TABLE public.tags 
  ALTER COLUMN tag_type_id SET NOT NULL,
  ADD CONSTRAINT fk_tag_type 
    FOREIGN KEY (tag_type_id) 
    REFERENCES public.tag_types(id) 
    ON DELETE CASCADE;

-- 9. Créer un nouvel index unique sur tag_type_id et slug
CREATE UNIQUE INDEX tags_type_id_slug_idx ON public.tags(tag_type_id, slug);

-- 10. Supprimer l'ancienne colonne tag_type (optionnel, peut être gardée pour compatibilité)
-- ALTER TABLE public.tags DROP COLUMN tag_type;

-- 11. Activer RLS sur tag_types
ALTER TABLE public.tag_types ENABLE ROW LEVEL SECURITY;

-- 12. Créer les policies pour tag_types
-- Lecture publique
CREATE POLICY "Public read tag types" ON public.tag_types
  FOR SELECT USING (true);

-- Seuls les admins peuvent gérer les types
CREATE POLICY "Admin manage tag types" ON public.tag_types
  FOR ALL USING (public.is_user_admin(auth.uid()));

-- 13. Ajouter le trigger updated_at pour tag_types
CREATE TRIGGER update_tag_types_updated_at BEFORE UPDATE ON public.tag_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Vue pour compatibilité (optionnel)
CREATE OR REPLACE VIEW public.tags_with_types AS
SELECT 
  t.id,
  t.name,
  t.slug,
  tt.slug as tag_type,
  tt.name as type_name,
  tt.color as type_color,
  tt.icon as type_icon,
  t.tag_type_id
FROM public.tags t
JOIN public.tag_types tt ON t.tag_type_id = tt.id;

-- 15. Permissions
GRANT ALL ON public.tag_types TO anon, authenticated;
GRANT ALL ON public.tags_with_types TO anon, authenticated;

-- ======================================================================
-- VÉRIFICATION
-- ======================================================================
SELECT 
  tt.name as "Type",
  count(t.id) as "Nombre de tags"
FROM public.tag_types tt
LEFT JOIN public.tags t ON t.tag_type_id = tt.id
GROUP BY tt.name
ORDER BY tt.name; 