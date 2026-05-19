-- Migration : étend handle_new_user pour lire phone + first_name + last_name + birth_date
--
-- Étape 1.5/8 (partie DB).
-- Le trigger d'origine n'écrivait que `display_name` dans profiles. Pour
-- supporter le modèle "réservation" qui exige un téléphone, on lit
-- toutes les metas pertinentes depuis raw_user_meta_data.
--
-- NULLIF(..., '') protège contre les valeurs vides (qui violeraient les
-- futures contraintes NOT NULL si on en ajoute).
-- birth_date est castée en date (le form HTML5 produit YYYY-MM-DD).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, is_admin, role,
    display_name, first_name, last_name, phone, birth_date
  )
  VALUES (
    NEW.id, false, 'user',
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'),  ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'),      ''),
    NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
