-- Newsletter subscribers — Sprint 2 livrable 5/5
--
-- Stocke les inscriptions email à la newsletter mensuelle. Pas de
-- double-opt-in pour l'instant (à ajouter en sprint 3 quand on aura
-- un provider d'envoi). RLS bloque toute lecture publique — seul
-- service-role peut lire/écrire (via /api/newsletter et /admin).

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  lang text NOT NULL DEFAULT 'fr' CHECK (lang IN ('fr', 'es', 'en')),
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_created_at_idx
  ON public.newsletter_subscribers (created_at DESC);

-- RLS : table privée. service-role bypass, anon/auth ne voient rien.
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Aucune policy pour anon/authenticated — donc 0 ligne accessible.
-- L'insertion publique passe par la route /api/newsletter qui utilise
-- le client service-role.

COMMENT ON TABLE public.newsletter_subscribers IS
  'Inscriptions newsletter mensuelle FARMAU. Écriture via /api/newsletter (service-role). RLS bloque toute lecture publique.';
