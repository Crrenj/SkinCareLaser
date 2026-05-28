-- Double opt-in : expiration des tokens de confirmation newsletter (TTL 24h)
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;
