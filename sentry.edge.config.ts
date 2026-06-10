/**
 * Init Sentry pour le runtime edge (middleware) — voir sentry.server.config.ts
 * pour le rationale du setup minimal/dormant.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 0,
})
