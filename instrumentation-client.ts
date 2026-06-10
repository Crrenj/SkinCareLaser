/**
 * Init Sentry côté navigateur — convention Next.js 15.3+ (chargé nativement,
 * indépendant de withSentryConfig). À la RACINE du projet : la variante
 * src/instrumentation-client.ts a un piège de chargement selon la version
 * de Next (getsentry/sentry-docs#13326).
 *
 * Monitoring d'erreurs uniquement ; DORMANT si NEXT_PUBLIC_SENTRY_DSN absent.
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
