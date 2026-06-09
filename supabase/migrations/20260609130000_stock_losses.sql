-- ============================================================================
-- Merma / productos vencidos : perte de stock → dépense au coût (CMP).
-- Décrémente products.stock ET crée une charge P&L au coût, atomiquement.
-- Ne touche JAMAIS cost_price (CMP appartient à record_stock_entries) ni
-- stock_entries (registre d'achats 606). Idempotent via client_token.
-- ============================================================================

-- 1) Étendre la CHECK de catégorie de dépense (drop+add : non altérable en place).
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check
  CHECK (category IN (
    'alquiler', 'salarios', 'servicios', 'mercadeo',
    'suministros', 'mantenimiento', 'impuestos', 'otros', 'merma'
  ));

-- 2) Registre des pertes (traçabilité + token d'idempotence + snapshot du coût).
CREATE TABLE IF NOT EXISTS public.stock_losses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity     integer NOT NULL CHECK (quantity > 0),
  unit_cost    numeric(10,2),               -- snapshot CMP figé ; NULL = coût inconnu (NE PAS traiter comme 0)
  reason       text NOT NULL CHECK (reason IN ('vencido', 'danado', 'robo', 'ajuste')),  -- slugs ASCII
  note         text,
  expense_id   uuid REFERENCES public.expenses(id) ON DELETE SET NULL,  -- NULL si coût inconnu (aucune charge)
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  client_token uuid
);
COMMENT ON TABLE public.stock_losses IS
  'Pertes de stock (merma : vencido/danado/robo/ajuste). 1 ligne = 1 evenement. unit_cost = snapshot CMP fige. expense_id relie la charge P&L (NULL si cout inconnu). Ecriture service-role via record_stock_loss.';

CREATE INDEX IF NOT EXISTS idx_stock_losses_product    ON public.stock_losses (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_losses_created    ON public.stock_losses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_losses_created_by ON public.stock_losses (created_by);
CREATE INDEX IF NOT EXISTS idx_stock_losses_expense    ON public.stock_losses (expense_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_stock_losses_client_token
  ON public.stock_losses (client_token) WHERE client_token IS NOT NULL;

ALTER TABLE public.stock_losses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read stock losses" ON public.stock_losses;
CREATE POLICY "Admins read stock losses" ON public.stock_losses
  FOR SELECT USING (is_user_admin((SELECT auth.uid())));

REVOKE ALL ON TABLE public.stock_losses FROM anon, authenticated;
GRANT ALL ON TABLE public.stock_losses TO service_role;

-- 3) RPC atomique : décrément stock (clamp >=0, skip stock NULL) + charge merma au coût.
CREATE OR REPLACE FUNCTION public.record_stock_loss(
  p_product_id  uuid,
  p_quantity    int,
  p_reason      text,
  p_note        text,
  p_created_by  uuid,
  p_client_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old_stock  int;
  v_cost       numeric(10,2);
  v_new_stock  int;
  v_amount     numeric(12,2);
  v_expense_id uuid;
  v_replay     jsonb;
BEGIN
  -- Idempotence : un rejeu (meme client_token) ne refait rien.
  IF p_client_token IS NOT NULL THEN
    SELECT jsonb_build_object(
             'replayed', true,
             'unit_cost', sl.unit_cost,
             'expense_id', sl.expense_id)
      INTO v_replay
    FROM public.stock_losses sl
    WHERE sl.client_token = p_client_token;
    IF FOUND THEN
      RETURN v_replay;
    END IF;
  END IF;

  -- Validation (la RPC est appelable hors route Zod).
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 1000000 THEN
    RAISE EXCEPTION 'Cantidad invalida: %', p_quantity USING ERRCODE = 'check_violation';
  END IF;
  IF p_reason IS NULL OR p_reason NOT IN ('vencido', 'danado', 'robo', 'ajuste') THEN
    RAISE EXCEPTION 'Motivo invalido: %', p_reason USING ERRCODE = 'check_violation';
  END IF;

  -- Verrou + lecture serveur du coût (jamais de confiance au client pour le coût).
  SELECT stock, cost_price INTO v_old_stock, v_cost
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado: %', p_product_id USING ERRCODE = 'no_data_found';
  END IF;

  -- Decrement : stock NULL (illimite) jamais decremente ; sinon clamp >= 0.
  IF v_old_stock IS NULL THEN
    v_new_stock := NULL;
  ELSE
    v_new_stock := GREATEST(v_old_stock - p_quantity, 0);
    UPDATE public.products
    SET stock = v_new_stock, updated_at = now()
    WHERE id = p_product_id;
  END IF;

  -- Charge P&L au cout (CMP * quantite DEMANDEE). Cout inconnu => aucune charge
  -- (NE PAS traiter NULL comme 0 : marge/resultat fictifs sinon).
  IF v_cost IS NOT NULL THEN
    v_amount := round(v_cost * p_quantity, 2);
    -- Garde-fou overflow : aligne sur le plafond des depenses manuelles (100M).
    IF v_amount > 100000000 THEN
      RAISE EXCEPTION 'Monto de merma excede el maximo permitido: %', v_amount
        USING ERRCODE = 'check_violation';
    END IF;
    INSERT INTO public.expenses (amount, category, label, expense_date, note, created_by)
    VALUES (v_amount, 'merma', NULL, (now() AT TIME ZONE 'UTC')::date, p_note, p_created_by)
    RETURNING id INTO v_expense_id;
  ELSE
    v_expense_id := NULL;
  END IF;

  -- Registre (snapshot cout fige + lien charge + token idempotence).
  INSERT INTO public.stock_losses
    (product_id, quantity, unit_cost, reason, note, expense_id, created_by, client_token)
  VALUES
    (p_product_id, p_quantity, v_cost, p_reason, p_note, v_expense_id, p_created_by, p_client_token);

  RETURN jsonb_build_object(
    'replayed', false,
    'product_id', p_product_id,
    'stock', v_new_stock,
    'unit_cost', v_cost,
    'expense_id', v_expense_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_stock_loss(uuid, int, text, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_stock_loss(uuid, int, text, text, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.record_stock_loss(uuid, int, text, text, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_stock_loss(uuid, int, text, text, uuid, uuid) TO service_role;
COMMENT ON FUNCTION public.record_stock_loss(uuid, int, text, text, uuid, uuid) IS
  'Perte de stock atomique : decremente products.stock (clamp >=0, ignore stock NULL) + insere stock_losses + une charge merma au cout (CMP fige, valorisee sur la quantite demandee) dans expenses. Cout inconnu => stock decremente mais aucune charge. Ne touche jamais cost_price ni stock_entries. Idempotente via client_token. Service-role only.';
