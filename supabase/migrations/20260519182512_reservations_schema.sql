-- Migration : système de réservation FARMAU
--
-- Modèle : catalogue + réservation (PAS de paiement en ligne).
-- Le client connecté convertit son panier en réservation. L'admin contacte
-- via WhatsApp pour organiser la collecte. TTL 24h, auto-expiration via cron.
-- Stock non bloqué (admin arbitre les conflits manuellement).
--
-- Snapshot pattern : on capture phone, prix, nom produit au moment de la
-- création -> les modifs ultérieures du profil/produit n'affectent pas une
-- réservation existante.

-- Enum status (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'reservation_status'
  ) THEN
    CREATE TYPE public.reservation_status AS ENUM (
      'pending',     -- créée, en attente que l'admin contacte le client
      'confirmed',   -- admin a contacté, créneau de collecte fixé
      'collected',   -- client a récupéré ses produits
      'expired',     -- TTL dépassé sans action
      'cancelled'    -- annulée explicitement (admin ou client)
    );
  END IF;
END $$;

-- Table principale : une ligne par réservation
CREATE TABLE IF NOT EXISTS public.reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          public.reservation_status NOT NULL DEFAULT 'pending',
  expires_at      TIMESTAMPTZ NOT NULL,
  -- Snapshot des coordonnées au moment de la création
  contact_phone   TEXT NOT NULL,
  contact_email   TEXT NOT NULL,
  contact_name    TEXT,
  -- Totaux (snapshot, ne dépendent pas du cart après création)
  total_items     INT  NOT NULL CHECK (total_items > 0),
  total_price     NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  currency        TEXT NOT NULL DEFAULT 'DOP',
  -- Admin
  admin_notes     TEXT,
  -- Timestamps de cycle de vie
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ,
  collected_at    TIMESTAMPTZ
);
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.reservations IS
  'Réservations FARMAU. TTL 24h par défaut, expiration auto via pg_cron. Snapshot du téléphone et email pour ne pas dépendre du profil.';

-- Items snapshot : produits dans la réservation, avec prix figé
CREATE TABLE IF NOT EXISTS public.reservation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  unit_price      NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity        INT NOT NULL CHECK (quantity > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.reservation_items ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.reservation_items IS
  'Items d''une réservation. product_name et unit_price sont des snapshots : si le produit est modifié/supprimé après, la réservation garde l''état d''origine.';

-- Indexes : accès admin (status+date), accès user (par user_id), cron (pending+expires)
CREATE INDEX IF NOT EXISTS idx_reservations_user_id
  ON public.reservations(user_id);

CREATE INDEX IF NOT EXISTS idx_reservations_status_created
  ON public.reservations(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservations_pending_expires
  ON public.reservations(expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation_id
  ON public.reservation_items(reservation_id);

-- Contrainte : un seul user ne peut pas avoir 2 réservations actives (pending|confirmed)
-- Partial unique index = garantie atomique côté DB, même en cas de race condition côté API.
DROP INDEX IF EXISTS public.uniq_active_reservation_per_user;
CREATE UNIQUE INDEX uniq_active_reservation_per_user
  ON public.reservations(user_id)
  WHERE status IN ('pending', 'confirmed');

-- Trigger updated_at (réutilise la fonction existante)
DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
-- Lecture : un user voit ses propres réservations, l'admin voit tout via service_role.
DROP POLICY IF EXISTS "Users read own reservations" ON public.reservations;
CREATE POLICY "Users read own reservations" ON public.reservations
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own reservation items" ON public.reservation_items;
CREATE POLICY "Users read own reservation items" ON public.reservation_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_items.reservation_id
        AND r.user_id = auth.uid()
    )
  );

-- Pas de policy INSERT/UPDATE/DELETE pour les users : tout passe par la RPC
-- create_reservation (SECURITY DEFINER), à créer dans la migration suivante.
-- L'admin (service_role) bypasse RLS donc peut tout faire.
