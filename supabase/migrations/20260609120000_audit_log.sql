-- Journal d'audit des mutations admin (qui a fait quoi). Transparence d'équipe.
-- Écriture EXCLUSIVEMENT service-role (via src/lib/audit.ts appelé depuis /api/admin/*,
-- qui bypass RLS). Lecture ouverte à TOUT admin (décision produit) via is_user_admin.
-- Aucune surface publique. Best-effort côté helper (after()) : un échec d'insert ne
-- bloque jamais la mutation métier.
CREATE TABLE IF NOT EXISTS public.audit_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL = système (pg_cron)
  action         text NOT NULL CHECK (action IN ('create','update','delete')),
  entity         text NOT NULL,
  entity_id      text,                       -- uuid-as-text OU chemin Storage (upload)
  summary        text,                       -- libellé humain ES prêt à afficher
  diff           jsonb,                      -- body parsé sanitisé (file/imageFile/password retirés)
  is_high_impact boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.audit_log IS
  'Journal d''audit des mutations admin. Écriture service-role only (helper after()), lecture tout admin.';

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at  ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor       ON public.audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity      ON public.audit_log (entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action      ON public.audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_high_impact ON public.audit_log (is_high_impact) WHERE is_high_impact;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read audit_log" ON public.audit_log;
CREATE POLICY "Admins read audit_log" ON public.audit_log
  FOR SELECT USING (is_user_admin((SELECT auth.uid())));

REVOKE ALL ON TABLE public.audit_log FROM anon, authenticated;
GRANT ALL ON TABLE public.audit_log TO service_role;
