-- Appearance settings on the single-row shop_settings table (id = 1).
-- Drives the theme system for the public site:
--   theme              : active color palette (6 predefined themes)
--   default_mode       : server default light/dark/system
--   allow_visitor_mode : whether the public site exposes a light/dark toggle
--
-- Replay-safe: ADD COLUMN IF NOT EXISTS skips the whole statement (incl. its
-- inline CHECK) when the column already exists, so re-running is idempotent.

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'terra'
    CHECK (theme IN ('terra', 'noir', 'botanico', 'coral', 'marino', 'ambar'));

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS default_mode text NOT NULL DEFAULT 'light'
    CHECK (default_mode IN ('light', 'dark', 'system'));

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS allow_visitor_mode boolean NOT NULL DEFAULT true;
