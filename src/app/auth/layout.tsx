import type { Metadata, Viewport } from 'next'
import { AppHtmlShell } from '@/components/AppHtmlShell'

/**
 * ROOT layout de la branche `/auth/*` (callback OAuth Supabase — une page
 * client de transit, jamais indexée ni localisée ; l'URL est enregistrée
 * dans la config Supabase, ne pas la déplacer sous [locale]).
 */

export const metadata: Metadata = {
  title: 'FARMAU',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AppHtmlShell lang="fr">{children}</AppHtmlShell>
}
