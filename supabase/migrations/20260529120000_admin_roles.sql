-- Hiérarchie admin : ajoute un rôle (admin | super_admin) à admin_users.
--
-- Modèle plat historique : tout user présent dans admin_users avait un accès
-- total ET pouvait promouvoir/rétrograder n'importe quel autre admin. On
-- introduit 2 niveaux :
--   - admin       : accès complet au panel SAUF la gestion de l'équipe admin
--   - super_admin : tout + gestion de l'équipe (promote/demote/changer de rôle)
--
-- Seul un super_admin gère l'équipe (gating serveur via requireSuperAdmin).
-- L'owner fondateur (seul admin actuel) est seedé super_admin → aucun lock-out.
--
-- Additive & réversible : `ALTER TABLE public.admin_users DROP COLUMN role;`
-- suffit pour revenir au modèle plat.

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin'
  CHECK (role IN ('admin', 'super_admin'));

-- L'unique admin actuel (owner) passe super_admin.
UPDATE public.admin_users
  SET role = 'super_admin'
  WHERE user_id = 'da80bedd-9783-4022-89be-96f6294850a8';
