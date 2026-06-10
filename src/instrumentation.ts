/**
 * Hooks d'instrumentation Next.js (convention native, indépendante de
 * withSentryConfig). `onRequestError` capture les erreurs non attrapées des
 * route handlers, Server Components, Server Actions et middleware.
 * Les 5xx attrapés passent par src/lib/apiError.ts (capture explicite).
 */
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
