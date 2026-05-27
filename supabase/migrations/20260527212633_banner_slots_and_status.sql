-- Banner slot type enum
DO $$ BEGIN
  CREATE TYPE banner_slot AS ENUM ('hero', 'banner', 'card', 'modal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Banner status enum
DO $$ BEGIN
  CREATE TYPE banner_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add slot and status columns to banners
ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS slot banner_slot NOT NULL DEFAULT 'banner',
  ADD COLUMN IF NOT EXISTS status banner_status NOT NULL DEFAULT 'draft';

-- Migrate existing data: active banners → 'active', inactive → 'draft'
UPDATE banners SET status = 'active' WHERE is_active = true;
UPDATE banners SET status = 'draft' WHERE is_active = false;

-- Assign slots based on existing banner_type
UPDATE banners SET slot = 'hero' WHERE banner_type IN ('hero', 'image_full', 'gradient_overlay');
UPDATE banners SET slot = 'card' WHERE banner_type IN ('card_style', 'minimal');
UPDATE banners SET slot = 'banner' WHERE banner_type IN ('editorial', 'image_left', 'image_right');

-- Index for quick slot lookups
CREATE INDEX IF NOT EXISTS idx_banners_slot ON banners (slot);
CREATE INDEX IF NOT EXISTS idx_banners_status ON banners (status);
