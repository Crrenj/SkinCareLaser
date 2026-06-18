-- ============================================================================
-- Remise employé (%) configurable (demande propriétaire 2026-06-18).
--
-- Une remise « staff » unique, appliquée MANUELLEMENT au comptoir (un admin la
-- coche au moment d'une vente comptoir → recalcul serveur de unit_price/total).
-- Le taux est affiché à TOUS les admins dans une bande du shell admin
-- (« Promo empleados : −X% »), éditable mais NON SUPPRIMABLE par construction :
-- c'est une colonne de la ligne unique shop_settings (id=1, RLS sans policy
-- INSERT/DELETE) → on ne peut que la modifier / la remettre à 0.
--
-- Modèle EXACT de la colonne low_stock_threshold (20260612135149) : ADD COLUMN
-- IF NOT EXISTS + DEFAULT + contrainte NOMMÉE gardée par pg_constraint (un CHECK
-- inline serait silencieusement SKIPPÉ par ADD COLUMN IF NOT EXISTS au replay).
-- numeric(5,2) : pourcentage 0.00..100.00 (premier numeric de la table, les
-- autres colonnes chiffrées étant integer — légitime pour un taux à décimales).
-- ============================================================================

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS employee_discount_pct numeric(5,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shop_settings_employee_discount_pct_check'
      AND conrelid = 'public.shop_settings'::regclass
  ) THEN
    ALTER TABLE public.shop_settings
      ADD CONSTRAINT shop_settings_employee_discount_pct_check
      CHECK (employee_discount_pct >= 0 AND employee_discount_pct <= 100);
  END IF;
END $$;

COMMENT ON COLUMN public.shop_settings.employee_discount_pct IS
  'Remise employé en % (0..100, défaut 0). Appliquée manuellement au comptoir (POST /api/admin/reservations, flag apply_employee_discount, recompute serveur de unit_price/total). Affichée à tous les admins dans le shell. 0 = aucune remise.';
