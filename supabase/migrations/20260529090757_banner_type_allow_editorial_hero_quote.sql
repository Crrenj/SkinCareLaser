-- ════════════════════════════════════════════════════════════════════════
-- banners.banner_type : autoriser les 3 types éditoriaux actuels
-- (editorial / hero / quote) utilisés par l'admin (BannerFormModal),
-- la validation Zod (src/lib/schemas.ts VALID_BANNER_TYPES) et le dispatcher
-- front (src/components/Banner.tsx).
--
-- Contexte : le CHECK historique (baseline) n'autorisait que les 6 types
-- legacy (image_left/right/full, card_style, minimal, gradient_overlay).
-- Conséquence : TOUTE création de bannière via l'admin avec un type éditorial
-- échouait (violation banners_banner_type_check). La table est vide (0 ligne),
-- donc le bug n'avait jamais été déclenché — le seed de contenu d'exemple l'a
-- révélé.
--
-- Cette migration élargit le CHECK. Les 6 types legacy restent acceptés pour
-- la rétro-compat du normalizeType côté front. Changement purement additif et
-- sûr : on ne fait qu'agrandir l'ensemble des valeurs permises, aucune donnée
-- existante n'est invalidée. Replay-safe (DROP IF EXISTS + ADD).
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_banner_type_check;

ALTER TABLE public.banners ADD CONSTRAINT banners_banner_type_check
  CHECK (banner_type IN (
    'editorial', 'hero', 'quote',
    'image_left', 'image_right', 'image_full', 'card_style', 'minimal', 'gradient_overlay'
  ));
