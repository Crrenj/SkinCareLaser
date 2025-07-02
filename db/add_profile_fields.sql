-- ======================================================================
-- AJOUT DES CHAMPS SUPPLÉMENTAIRES À LA TABLE PROFILES
-- ======================================================================
-- Ce script ajoute les colonnes nécessaires pour un formulaire d'inscription plus complet

-- Ajouter les nouvelles colonnes si elles n'existent pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Commenter la migration réussie
COMMENT ON COLUMN public.profiles.first_name IS 'Prénom de l''utilisateur';
COMMENT ON COLUMN public.profiles.last_name IS 'Nom de famille de l''utilisateur';
COMMENT ON COLUMN public.profiles.phone IS 'Numéro de téléphone de l''utilisateur';
COMMENT ON COLUMN public.profiles.birth_date IS 'Date de naissance de l''utilisateur';

-- Exemple de mise à jour pour les profils existants (optionnel)
-- UPDATE public.profiles 
-- SET first_name = split_part(display_name, ' ', 1),
--     last_name = split_part(display_name, ' ', 2)
-- WHERE first_name IS NULL AND display_name IS NOT NULL; 