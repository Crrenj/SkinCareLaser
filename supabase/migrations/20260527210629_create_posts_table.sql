-- Blog posts table
CREATE TABLE IF NOT EXISTS posts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text UNIQUE NOT NULL,
  title      text NOT NULL,
  excerpt    text,
  body       text NOT NULL DEFAULT '',
  cover_image_url text,
  author_name text,
  locale     text NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'es', 'en')),
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts (slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_locale ON posts (locale);

DROP TRIGGER IF EXISTS set_posts_updated_at ON posts;
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published posts" ON posts;
CREATE POLICY "Public can read published posts"
  ON posts FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage posts" ON posts;
CREATE POLICY "Admins can manage posts"
  ON posts FOR ALL
  USING (is_user_admin((SELECT auth.uid())))
  WITH CHECK (is_user_admin((SELECT auth.uid())));
