-- DROP de profiles.is_admin maintenant que admin_users est SoV unifiée
-- (login, callback, useIsAdmin, middleware, /api/admin/users tous migrés
-- vers is_user_admin RPC dans le commit précédent).

ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;
