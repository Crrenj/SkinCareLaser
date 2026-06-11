'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * Error boundary GLOBAL (A-4, plan remédiation 2026-06-10) : attrape les
 * erreurs des ROOT layouts eux-mêmes ([locale] / admin / auth). À ce stade
 * tout le document est en panne → il rend son propre <html>/<body>, SANS
 * next-intl (la résolution de locale peut être la cause de la panne) et en
 * STYLES INLINE (le pipeline CSS/thème peut être indisponible). Chaînes FR
 * en dur (locale par défaut).
 */

const page: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 24px',
  textAlign: 'center',
  backgroundColor: '#FAF6F0',
  color: '#1F1B16',
  fontFamily: "'Be Vietnam Pro', -apple-system, 'Segoe UI', sans-serif",
}

const brand: React.CSSProperties = {
  fontFamily: "'Instrument Serif', Georgia, serif",
  fontStyle: 'italic',
  fontSize: 64,
  lineHeight: 1,
  color: '#C8a18a',
  marginBottom: 24,
}

const title: React.CSSProperties = {
  fontFamily: "'Instrument Serif', Georgia, serif",
  fontSize: 34,
  lineHeight: 1.1,
  margin: '0 0 12px',
  fontWeight: 400,
}

const body: React.CSSProperties = {
  fontSize: 15,
  color: '#5C5346',
  maxWidth: 420,
  margin: '0 0 32px',
  lineHeight: 1.6,
}

const buttonPrimary: React.CSSProperties = {
  height: 44,
  padding: '0 24px',
  borderRadius: 8,
  border: 'none',
  backgroundColor: '#8A4B2D',
  color: '#FAF6F0',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}

const linkSecondary: React.CSSProperties = {
  height: 44,
  padding: '0 24px',
  borderRadius: 8,
  border: '1px solid #E3D9CB',
  color: '#1F1B16',
  fontSize: 14,
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Erreur de root layout = la plus grave possible — remontée Sentry
  // explicite (no-op sans DSN).
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>
        <main style={page}>
          <div aria-hidden style={brand}>
            FARMAU
          </div>
          <h1 style={title}>Une erreur est survenue</h1>
          <p style={body}>
            Quelque chose s&apos;est mal passé de notre côté. Réessayez, ou
            revenez à l&apos;accueil.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={reset} style={buttonPrimary}>
              Réessayer
            </button>
            {/* <a> natif voulu (pas <Link>) : le root layout est en panne,
                le router client l'est potentiellement aussi — on force un
                rechargement complet du document. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/fr" style={linkSecondary}>
              Accueil
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
