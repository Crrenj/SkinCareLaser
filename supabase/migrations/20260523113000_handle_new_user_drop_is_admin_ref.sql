-- Le trigger handle_new_user faisait INSERT sur profiles.is_admin (= false),
-- mais la colonne a été droppée. L'INSERT échouait, cascade : signup
-- "Database error creating new user". On recrée la fonction sans is_admin.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, role,
    display_name, first_name, last_name, phone, birth_date
  )
  VALUES (
    NEW.id, 'user',
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
$$;
