-- Add confirmation token for double opt-in newsletter
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmation_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_newsletter_confirmation_token
  ON newsletter_subscribers (confirmation_token)
  WHERE confirmation_token IS NOT NULL;
