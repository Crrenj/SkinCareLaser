-- Migration : système de tickets de support (contact_messages)
--
-- Contexte : /admin/messages devient un système de tickets pour problèmes divers
-- (bugs, erreurs, questions produit/compte). WhatsApp gère déjà les réservations ;
-- ici = support. Le centre d'aide public /aide ouvre les tickets.
--
-- Changements :
--   1. contact_messages.category (bug/order/product/account/other)
--   2. statuts -> cycle ticket : open / in_progress / resolved / closed
--      (migration des anciennes valeurs unread/read/replied/archived)
--   3. RPC create_ticket (remplace create_contact_message) : ajoute la catégorie ;
--      accepte toujours les emails anonymes (lie user_id si le compte existe)
--   4. get_messages_stats -> compteurs par nouveau statut
--   5. drop policy "Insert valid email" : tickets anonymes désormais légitimes ;
--      l'insert ne passe que par create_ticket (SECURITY DEFINER) / service_role.
--
-- Idempotent (IF EXISTS / OR REPLACE / DROP CONSTRAINT IF EXISTS).

-- ── 1. Catégorie ─────────────────────────────────────────────────────────────
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';

ALTER TABLE public.contact_messages
  DROP CONSTRAINT IF EXISTS contact_messages_category_check;
ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_category_check
  CHECK (category IN ('bug','order','product','account','other'));

CREATE INDEX IF NOT EXISTS idx_contact_messages_category
  ON public.contact_messages(category);

-- ── 2. Statuts : cycle de ticket ─────────────────────────────────────────────
-- Drop l'ancien CHECK inline (nom auto-généré par Postgres au baseline)
ALTER TABLE public.contact_messages
  DROP CONSTRAINT IF EXISTS contact_messages_status_check;

-- Migration des valeurs existantes vers le cycle ticket
UPDATE public.contact_messages SET status = 'open'     WHERE status IN ('unread','read');
UPDATE public.contact_messages SET status = 'resolved' WHERE status = 'replied';
UPDATE public.contact_messages SET status = 'closed'   WHERE status = 'archived';

ALTER TABLE public.contact_messages ALTER COLUMN status SET DEFAULT 'open';
ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_status_check
  CHECK (status IN ('open','in_progress','resolved','closed'));

-- ── 3. RPC create_ticket (remplace create_contact_message) ───────────────────
DROP FUNCTION IF EXISTS public.create_contact_message(text, text, text);

CREATE OR REPLACE FUNCTION public.create_ticket(
  p_email    text,
  p_category text,
  p_subject  text,
  p_message  text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id    UUID;
  v_category   TEXT;
  v_message_id UUID;
BEGIN
  -- Catégorie validée (fallback 'other' si valeur inconnue)
  v_category := CASE
    WHEN p_category IN ('bug','order','product','account','other') THEN p_category
    ELSE 'other'
  END;

  -- Lie un compte existant si l'email correspond, sinon ticket anonyme (user_id NULL)
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  INSERT INTO public.contact_messages (user_email, user_id, category, subject, message)
  VALUES (p_email, v_user_id, v_category, p_subject, p_message)
  RETURNING id INTO v_message_id;

  RETURN json_build_object(
    'success', true,
    'message_id', v_message_id
  );
END;
$$;

-- service_role uniquement (appelée côté serveur depuis /api/contact, rate-limit + CSRF)
REVOKE EXECUTE ON FUNCTION public.create_ticket(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.create_ticket(text, text, text, text) TO service_role;

-- ── 4. Stats par statut (cycle ticket) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_messages_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total',       COUNT(*),
    'open',        COUNT(*) FILTER (WHERE status = 'open'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'resolved',    COUNT(*) FILTER (WHERE status = 'resolved'),
    'closed',      COUNT(*) FILTER (WHERE status = 'closed'),
    'today',       COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE),
    'this_week',   COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')
  ) INTO v_stats
  FROM public.contact_messages;
  RETURN v_stats;
END;
$$;

-- ── 5. RLS : retirer la contrainte "email = compte" sur l'INSERT ─────────────
-- (les tickets anonymes passent par create_ticket en SECURITY DEFINER ; aucun
--  insert direct anon n'est exposé)
DROP POLICY IF EXISTS "Insert valid email" ON public.contact_messages;
