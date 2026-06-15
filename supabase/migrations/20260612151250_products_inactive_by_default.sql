-- ============================================================================
-- Flow de visibilité produit (demande propriétaire 2026-06-12) :
-- un produit NOUVELLEMENT créé naît INACTIF (invisible du catalogue public)
-- tant que l'admin ne l'a pas explicitement publié — soit via le drawer
-- « Initialiser l'inventaire » (/admin/stock, case Activer), soit via le
-- toggle œil de /admin/product (route dédiée auditée
-- PATCH /api/admin/products/[id]/active, barrière L-3).
--
-- Ce changement ne touche QUE le défaut des prochains INSERT — aucune ligne
-- existante n'est modifiée (les 353 produits actifs restent actifs ; le
-- reset L-1 reste une opération propriétaire séparée, cf. docs/OPS.md §1).
-- La route POST /api/admin/products pose AUSSI is_active:false explicitement
-- (défense en profondeur — le défaut DB n'est qu'un filet).
--
-- Idempotent : SET DEFAULT est rejouable.
-- ============================================================================

ALTER TABLE public.products ALTER COLUMN is_active SET DEFAULT false;

COMMENT ON COLUMN public.products.is_active IS
  'Visibilité catalogue public. Créé FALSE (2026-06-12) : la publication est une action explicite auditée (route /active ou drawer init inventaire) — jamais un effet de bord du formulaire produit (productCreate/Update strippent ce champ, invariant testé).';
