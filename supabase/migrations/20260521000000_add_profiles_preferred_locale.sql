-- Ajoute une colonne preferred_locale au profil utilisateur.
-- NULL = utilise la locale de l'URL ; sinon force la redirect vers ce locale.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_locale text
  CHECK (preferred_locale IS NULL OR preferred_locale IN ('fr','en','es'));
