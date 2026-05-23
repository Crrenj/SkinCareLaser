-- Le CREATE OR REPLACE de la migration précédente a créé une nouvelle
-- signature (avec p_user_id) sans remplacer l'ancienne. On droppe l'ancienne
-- pour éviter l'ambiguïté à l'appel.
DROP FUNCTION IF EXISTS public.remove_from_cart(uuid, uuid);
