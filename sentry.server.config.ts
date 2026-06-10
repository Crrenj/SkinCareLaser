/**
 * Init Sentry côté serveur Node (importé par src/instrumentation.ts).
 *
 * Setup minimal G-4a : monitoring d'erreurs uniquement (pas de tracing, pas
 * de replay), SANS `withSentryConfig` (le build n'est pas modifié, pas
 * d'auth token requis ; en contrepartie les stack traces prod restent
 * minifiées — acceptable pour la V1).
 *
 * DORMANT sans DSN : `SENTRY_DSN` absent → no-op total (aucun réseau,
 * aucune erreur console).
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 0,
})
