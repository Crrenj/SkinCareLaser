-- ════════════════════════════════════════════════════════════════════════
-- shop_settings.home_layout : ordre + visibilité des sections de la home.
--
-- JSONB = tableau ordonné [{ "key": "...", "enabled": true|false }, ...] où
-- `key` ∈ registre canonique src/lib/homeSections.ts (hero, bestsellers,
-- byNeed, quote, brands, expertise, routine, banners). Permet à l'admin de
-- réordonner et d'afficher/masquer les sections (non supprimables).
--
-- Colonne nullable : le résolveur (resolveHomeLayout) traite NULL/invalide
-- comme l'ordre par défaut, donc le rendu reste sain même sans valeur.
-- Replay-safe : ADD COLUMN IF NOT EXISTS + UPDATE gardé sur IS NULL.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS home_layout jsonb;

UPDATE public.shop_settings
SET home_layout = '[
  {"key":"hero","enabled":true},
  {"key":"bestsellers","enabled":true},
  {"key":"byNeed","enabled":true},
  {"key":"quote","enabled":true},
  {"key":"brands","enabled":true},
  {"key":"expertise","enabled":true},
  {"key":"routine","enabled":true},
  {"key":"banners","enabled":true}
]'::jsonb
WHERE id = 1 AND home_layout IS NULL;
