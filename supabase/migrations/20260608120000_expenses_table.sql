-- Charges / dépenses opérationnelles (gastos) → compte de résultat (P&L) complet
-- sur /admin/contabilidad : Ingresos − COGS − Gastos = Resultado neto.
--
-- Table strictement admin (aucune surface publique, contrairement à
-- products/reservation_items) : RLS admin en lecture + écriture exclusivement
-- service-role via les routes /api/admin/expenses. Pas de RPC (CRUD simple).

CREATE TABLE IF NOT EXISTS public.expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount       numeric(12,2) NOT NULL CHECK (amount >= 0),
  category     text NOT NULL CHECK (category IN (
                 'alquiler', 'salarios', 'servicios', 'mercadeo',
                 'suministros', 'mantenimiento', 'impuestos', 'otros'
               )),
  label        text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  note         text,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.expenses IS
  'Charges/dépenses opérationnelles (gastos) pour le compte de résultat. Admin-only, écriture service-role.';

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses (created_by);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read expenses" ON public.expenses;
CREATE POLICY "Admins read expenses"
  ON public.expenses FOR SELECT
  USING (is_user_admin((SELECT auth.uid())));

REVOKE ALL ON TABLE public.expenses FROM anon, authenticated;
GRANT ALL ON TABLE public.expenses TO service_role;
