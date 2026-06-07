-- Entrées de stock (réappro) + prix de revient → marges + base registre 606 DGII.
--
-- Capture enfin un COÛT par produit (jusqu'ici products n'a que price/old_price/
-- stock). Modèle « Solide » :
--   * stock_entries = historique append-only des réceptions (1 ligne = 1 ligne de
--     réception = proto-ligne 606 ; champs fournisseur/RNC/NCF/date facture +
--     flag ITBIS capturés dès maintenant ; futur ancrage lot/péremption).
--   * products.cost_price = coût moyen pondéré (CMP) — cache dérivé, recalculé
--     UNIQUEMENT par les RPC ci-dessous.
--   * reservation_items.unit_cost = snapshot du CMP au moment de la vente (jumeau
--     de unit_price) → marge de chaque vente exacte et figée (write-once).
--
-- Sécurité : products & reservation_items sont lisibles par anon/authenticated en
-- accès direct PostgREST → on RÉVOQUE l'accès aux 2 colonnes de coût (donnée
-- commercialement sensible). is_user_admin reste exécutable par anon (lectures
-- anon des tables publiques en dépendent — NE PAS révoquer).

-- ───────────────────────────── Colonnes ─────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric(10,2);
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_cost_price_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_cost_price_check CHECK (cost_price IS NULL OR cost_price >= 0);
COMMENT ON COLUMN public.products.cost_price IS
  'CMP (coût moyen pondéré) — cache dérivé, recalculé UNIQUEMENT par record_stock_entries / recompute_cost_price. Source de vérité = stock_entries. Ne jamais éditer à la main.';

ALTER TABLE public.reservation_items
  ADD COLUMN IF NOT EXISTS unit_cost numeric(10,2);
ALTER TABLE public.reservation_items
  DROP CONSTRAINT IF EXISTS reservation_items_unit_cost_check;
ALTER TABLE public.reservation_items
  ADD CONSTRAINT reservation_items_unit_cost_check CHECK (unit_cost IS NULL OR unit_cost >= 0);
COMMENT ON COLUMN public.reservation_items.unit_cost IS
  'Snapshot du CMP au moment de la vente (collected), write-once. NULL = coût inconnu (ligne libre, ou vente antérieure à la 1re entrée de stock) → marge inconnue, NE PAS traiter comme 0.';

-- Révocation de l'accès public direct (PostgREST) en LECTURE sur les colonnes de
-- coût (donnée commercialement sensible). ⚠️ Un REVOKE au niveau colonne est
-- inopérant tant qu'un GRANT table-level (GRANT ALL TO anon) existe : Postgres
-- autorise la colonne dès qu'un privilège table OU colonne le permet. Il faut
-- donc révoquer le SELECT TABLE puis re-grant une LISTE BLANCHE de colonnes
-- (coût exclu). Les écritures restent bloquées par RLS (aucune policy
-- INSERT/UPDATE pour anon/authenticated sur products/reservation_items).
--
-- ⚠️ FOOTGUN : products & reservation_items ont désormais un SELECT en liste
-- blanche pour anon/authenticated. Toute NOUVELLE colonne publique ajoutée plus
-- tard devra être explicitement GRANT SELECT(col) TO anon, authenticated (sinon
-- invisible côté public). C'est volontaire : les nouvelles colonnes sont privées
-- par défaut. Bloc dynamique → re-grant automatiquement toutes les colonnes sauf
-- le coût, donc replay-safe sans hardcoder la liste.
DO $$
DECLARE v_cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO v_cols
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'products' AND column_name <> 'cost_price';
  EXECUTE 'REVOKE SELECT ON public.products FROM anon, authenticated';
  EXECUTE 'GRANT SELECT (' || v_cols || ') ON public.products TO anon, authenticated';

  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO v_cols
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'reservation_items' AND column_name <> 'unit_cost';
  EXECUTE 'REVOKE SELECT ON public.reservation_items FROM anon, authenticated';
  EXECUTE 'GRANT SELECT (' || v_cols || ') ON public.reservation_items TO anon, authenticated';
END $$;

-- ───────────────────────── Table stock_entries ─────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_entries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity       integer NOT NULL CHECK (quantity > 0),
  unit_cost      numeric(10,2) NOT NULL CHECK (unit_cost >= 0),  -- montant payé / unité (TTC par défaut)
  itbis_included boolean NOT NULL DEFAULT true,
  supplier_name  text,
  supplier_rnc   text,
  ncf            text,
  invoice_date   date,
  note           text,
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  client_token   uuid
);
COMMENT ON TABLE public.stock_entries IS
  'Réceptions / réappro (entrées de stock IN). Append-only : 1 ligne = 1 événement de réception (ancre future lot/péremption FIFO ; ne jamais upserter). Fonde le registre achats 606 DGII. Écriture service-role via record_stock_entries.';
COMMENT ON COLUMN public.stock_entries.itbis_included IS
  'true = unit_cost TTC (base = cost/1.18, itbis = cost-base au 606). false = produit exonéré ITBIS (base = cost, itbis = 0).';
COMMENT ON COLUMN public.stock_entries.client_token IS
  'Jeton anti-rejeu (idempotence POST). Un même token ne crée qu''une seule réception.';

CREATE INDEX IF NOT EXISTS idx_stock_entries_product ON public.stock_entries (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_created ON public.stock_entries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_entries_created_by ON public.stock_entries (created_by);
CREATE INDEX IF NOT EXISTS idx_stock_entries_invoice ON public.stock_entries (invoice_date) WHERE invoice_date IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_stock_entries_client_token
  ON public.stock_entries (client_token) WHERE client_token IS NOT NULL;

ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read stock entries" ON public.stock_entries;
CREATE POLICY "Admins read stock entries"
  ON public.stock_entries FOR SELECT
  USING (is_user_admin((SELECT auth.uid())));

-- Écriture exclusivement via record_stock_entries (SECURITY DEFINER / service-role).
REVOKE ALL ON TABLE public.stock_entries FROM anon, authenticated;
GRANT ALL ON TABLE public.stock_entries TO service_role;

-- ─────────────────── RPC record_stock_entries (réception) ───────────────────
-- Atomique (1 transaction). Idempotente via client_token. Recalcule le CMP par
-- produit avec verrou déterministe. Service-role only.

CREATE OR REPLACE FUNCTION public.record_stock_entries(
  p_items         jsonb,
  p_supplier_name text,
  p_supplier_rnc  text,
  p_ncf           text,
  p_invoice_date  date,
  p_note          text,
  p_created_by    uuid,
  p_client_token  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item     jsonb;
  v_qty      int;
  v_cost     numeric;
  rec        record;
  v_old_stock int;
  v_old_cost  numeric(10,2);
  v_new_cost  numeric(10,2);
  v_written   jsonb := '[]'::jsonb;
BEGIN
  -- Idempotence : un rejeu (même client_token) ne fait rien.
  IF p_client_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.stock_entries WHERE client_token = p_client_token
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Validation par item (la RPC est appelable hors route Zod).
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty  := (v_item->>'quantity')::int;
    v_cost := (v_item->>'unit_cost')::numeric;
    IF (v_item->>'product_id') IS NULL THEN
      RAISE EXCEPTION 'product_id manquant' USING ERRCODE = 'check_violation';
    END IF;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 1000000 THEN
      RAISE EXCEPTION 'Quantité invalide: %', v_qty USING ERRCODE = 'check_violation';
    END IF;
    IF v_cost IS NULL OR v_cost < 0 OR v_cost > 10000000 THEN
      RAISE EXCEPTION 'Coût invalide: %', v_cost USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  -- 1 ligne d'historique par ligne d'origine (audit fidèle + champs fiscaux dénormalisés).
  INSERT INTO public.stock_entries
    (product_id, quantity, unit_cost, itbis_included, supplier_name, supplier_rnc, ncf, invoice_date, note, created_by, client_token)
  SELECT
    (e->>'product_id')::uuid,
    (e->>'quantity')::int,
    (e->>'unit_cost')::numeric,
    COALESCE((e->>'itbis_included')::boolean, true),
    p_supplier_name, p_supplier_rnc, p_ncf, p_invoice_date, p_note, p_created_by, p_client_token
  FROM jsonb_array_elements(p_items) e;

  -- Agrégation par produit (dé-duplique un produit présent sur plusieurs lignes),
  -- verrou déterministe ORDER BY product_id, recalcul du CMP.
  FOR rec IN
    SELECT (e->>'product_id')::uuid AS product_id,
           SUM((e->>'quantity')::int)::int AS qty,
           SUM((e->>'quantity')::int * (e->>'unit_cost')::numeric)
             / NULLIF(SUM((e->>'quantity')::int), 0) AS batch_cost
      FROM jsonb_array_elements(p_items) e
     GROUP BY (e->>'product_id')::uuid
     ORDER BY (e->>'product_id')::uuid
  LOOP
    SELECT stock, cost_price INTO v_old_stock, v_old_cost
      FROM public.products WHERE id = rec.product_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produit introuvable: %', rec.product_id USING ERRCODE = 'no_data_found';
    END IF;

    -- CMP NULL-safe : pas de coût antérieur OU pas d'unités à moyenner → coût du lot.
    IF v_old_cost IS NULL OR v_old_stock IS NULL OR v_old_stock <= 0 THEN
      v_new_cost := round(rec.batch_cost, 2);
    ELSE
      v_new_cost := round(
        (v_old_stock::numeric * v_old_cost + rec.qty::numeric * rec.batch_cost)
        / (v_old_stock + rec.qty), 2);
    END IF;

    IF v_old_stock IS NULL THEN
      -- Produit « stock illimité » (NULL) : on ne le convertit pas en fini
      -- (apply_reservation_collection ignore stock NULL au décrément) — on met
      -- seulement le coût à jour.
      UPDATE public.products
         SET cost_price = v_new_cost, updated_at = now()
       WHERE id = rec.product_id;
    ELSE
      IF v_old_stock::bigint + rec.qty::bigint > 2147483647 THEN
        RAISE EXCEPTION 'Stock maximum dépassé pour le produit %', rec.product_id
          USING ERRCODE = 'check_violation';
      END IF;
      UPDATE public.products
         SET stock = v_old_stock + rec.qty, cost_price = v_new_cost, updated_at = now()
       WHERE id = rec.product_id;
    END IF;

    v_written := v_written || jsonb_build_object(
      'product_id', rec.product_id,
      'stock', CASE WHEN v_old_stock IS NULL THEN NULL ELSE v_old_stock + rec.qty END,
      'cost_price', v_new_cost
    );
  END LOOP;

  RETURN v_written;
END;
$$;

REVOKE ALL ON FUNCTION public.record_stock_entries(jsonb, text, text, text, date, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_stock_entries(jsonb, text, text, text, date, text, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.record_stock_entries(jsonb, text, text, text, date, text, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_stock_entries(jsonb, text, text, text, date, text, uuid, uuid) TO service_role;
COMMENT ON FUNCTION public.record_stock_entries(jsonb, text, text, text, date, text, uuid, uuid) IS
  'Réception de stock atomique : insère stock_entries + incrémente products.stock + recalcule le CMP (cost_price). Idempotente via client_token. Service-role only.';

-- ───────────── RPC recompute_cost_price (réconciliation / réparation) ─────────────
-- Recalcule le CMP comme moyenne pondérée À VIE sur tout l'historique d'entrées.
-- Diffère du CMP incrémental après une rupture de stock — l'incrémental est la
-- valeur opérationnelle ; ceci est une baseline de réparation.

CREATE OR REPLACE FUNCTION public.recompute_cost_price(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.products p
     SET cost_price = (
       SELECT round(SUM(unit_cost * quantity) / NULLIF(SUM(quantity), 0), 2)
         FROM public.stock_entries WHERE product_id = p_product_id
     ),
     updated_at = now()
   WHERE p.id = p_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_cost_price(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recompute_cost_price(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.recompute_cost_price(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_cost_price(uuid) TO service_role;
COMMENT ON FUNCTION public.recompute_cost_price(uuid) IS
  'Réconciliation : recalcule cost_price = moyenne pondérée à vie sur stock_entries. Service-role only.';

-- ───────── apply_reservation_collection : + snapshot du coût (write-once) ─────────
-- Corps copié VERBATIM depuis 20260606140000_reservation_stock_apply_restore.sql
-- (seule source canonique ; db/schema.sql est périmé), + le snapshot unit_cost.

CREATE OR REPLACE FUNCTION public.apply_reservation_collection(p_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_applied int;
BEGIN
  -- Idempotence + verrou atomiques : ne passe qu'une fois (false -> true) et
  -- seulement si la résa est bien collected.
  UPDATE public.reservations
     SET stock_applied = true
   WHERE id = p_reservation_id
     AND stock_applied = false
     AND status = 'collected';
  GET DIAGNOSTICS v_applied = ROW_COUNT;
  IF v_applied = 0 THEN
    RETURN;  -- déjà appliqué, ou pas collected
  END IF;

  -- Décrément agrégé. Lignes libres (product_id NULL) ignorées. Stock NULL
  -- (illimité) ignoré. Clamp >= 0.
  UPDATE public.products p
     SET stock = GREATEST(p.stock - agg.qty, 0),
         updated_at = now()
    FROM (
      SELECT product_id, SUM(quantity)::int AS qty
        FROM public.reservation_items
       WHERE reservation_id = p_reservation_id
         AND product_id IS NOT NULL
       GROUP BY product_id
    ) agg
   WHERE p.id = agg.product_id
     AND p.stock IS NOT NULL;

  -- Snapshot du coût (CMP) au moment de la vente. Write-once (unit_cost IS NULL)
  -- → un cycle collected→annulé→re-collected ne ré-estampe PAS un CMP qui aurait
  -- bougé entre-temps. Lignes libres (product_id NULL) → pas de match → restent
  -- NULL. Le décrément ci-dessus détient déjà le verrou des produits suivis, ce
  -- qui sérialise la lecture du CMP face à une réception concurrente.
  UPDATE public.reservation_items ri
     SET unit_cost = p.cost_price
    FROM public.products p
   WHERE ri.reservation_id = p_reservation_id
     AND ri.product_id = p.id
     AND ri.unit_cost IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_reservation_collection(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_reservation_collection(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.apply_reservation_collection(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_reservation_collection(uuid) TO service_role;
COMMENT ON FUNCTION public.apply_reservation_collection(uuid) IS
  'Décrémente products.stock pour une réservation collected (idempotent via stock_applied) ET snapshot reservation_items.unit_cost = products.cost_price (write-once). Service-role only.';
