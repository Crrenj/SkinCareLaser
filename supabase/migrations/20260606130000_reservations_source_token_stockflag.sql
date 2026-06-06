-- Phase 1 — Socle DB pour : réservation invité (web sans compte), vente au
-- comptoir finalisée, et décrément de stock à la vente.
-- Purement additif. Rejouable (IF NOT EXISTS / DROP CONSTRAINT IF EXISTS).

-- ── source : origine de la réservation/vente ───────────────────────────────
-- CHECK sur text (pas un enum : le repo a souffert des enums figés, cf.
-- banner_type → on garde la souplesse DROP/ADD CONSTRAINT).
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'account';

ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_source_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_source_check
  CHECK (source IN ('account', 'guest', 'counter'));

-- Backfill idempotent : les réservations manuelles existantes (créées par
-- l'admin pour un walk-in, donc user_id IS NULL) deviennent 'counter'.
-- Le garde « AND source = 'account' » rend le replay sûr (ne réécrase jamais
-- un 'guest' créé plus tard).
UPDATE public.reservations SET source = 'counter'
  WHERE user_id IS NULL AND source = 'account';

-- ── confirmation_token : accès invité à SA confirmation, sans IDOR ─────────
-- L'invité n'a pas de session : il consulte sa confirmation via un jeton
-- non-devinable (généré par la RPC invité). NULL pour les résas compte
-- (qui passent par auth.uid()). Index unique partiel comme newsletter.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS confirmation_token text;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_reservation_confirmation_token
  ON public.reservations (confirmation_token)
  WHERE confirmation_token IS NOT NULL;

-- ── anonymous_id : panier invité à l'origine (défense en profondeur) ───────
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS anonymous_id uuid;

-- ── stock_applied : garde d'idempotence du décrément de stock ──────────────
-- Passe à true quand le stock a été décrémenté (statut collected). Utilisé par
-- apply_reservation_collection / restore_reservation_collection (Phase 2).
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS stock_applied boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reservations.source IS
  'Origine : account (client connecté via RPC create_reservation), guest (visiteur web sans compte), counter (vente/réservation comptoir saisie par l''admin).';
COMMENT ON COLUMN public.reservations.confirmation_token IS
  'Jeton non-devinable pour l''accès invité à sa page de confirmation (sans compte). NULL pour les résas compte (accès via auth.uid()).';
COMMENT ON COLUMN public.reservations.anonymous_id IS
  'anonymous_id du panier invité à l''origine de la réservation (NULL pour compte/comptoir). Défense en profondeur.';
COMMENT ON COLUMN public.reservations.stock_applied IS
  'true une fois le décrément de stock appliqué (statut collected). Garde d''idempotence pour apply/restore_reservation_collection.';
