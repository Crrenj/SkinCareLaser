/**
 * Coquille `<html>/<body>` PARTAGÉE des root layouts (Phase 1 palier 2/2,
 * décision 2026-06-10 : restructure canonique next-intl).
 *
 * Il n'y a PLUS de `src/app/layout.tsx` : chaque branche top-level a son
 * propre root layout qui rend ce shell —
 *   - `[locale]/layout.tsx` (public) : lang = segment URL → **statique**
 *     (l'ancien root layout lisait `getLocale()` → header next-intl →
 *     TOUT l'arbre rendait dynamique, ISR/SSG impossibles).
 *   - `admin/layout.tsx` : lang = cookie admin → dynamique (assumé, gated).
 *   - `auth/layout.tsx` : callback OAuth, lang fixe.
 *
 * Contenu déplacé tel quel de l'ancien root layout : fonts, globals.css,
 * attrs de thème + script anti-flash, favicons par thème, skip-link,
 * ThemeFavicon, providers SWR/Auth.
 */
import { Instrument_Serif, Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google'
import '@/app/globals.css'
import { SWRProvider } from '@/components/SWRProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { getThemeConfig, resolveInitialMode } from '@/lib/getThemeConfig'
import { ThemeFavicon } from '@/components/ThemeFavicon'
import { THEME_MODE_SCRIPT } from '@/lib/themeModeScript'

const serif = Instrument_Serif({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const sans = Be_Vietnam_Pro({
  variable: '--font-bevn',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

export async function AppHtmlShell({
  lang,
  children,
}: {
  lang: string
  children: React.ReactNode
}) {
  // getThemeConfig est cookieless + unstable_cache → ne casse pas le statique.
  // Le thème du HTML statique peut être en retard de quelques minutes ;
  // ThemeFavicon le corrige en live côté client (mécanisme existant).
  const { theme, defaultMode, allowVisitorMode } = await getThemeConfig()
  const initialMode = resolveInitialMode(defaultMode)

  return (
    <html
      lang={lang}
      data-theme={theme}
      data-mode={initialMode}
      data-default-mode={defaultMode}
      data-allow-mode={allowVisitorMode ? '1' : '0'}
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      {/* <head> manuel requis : le script anti-flash doit s'exécuter AVANT le
          premier paint (React ne hoiste pas les <script> inline). La règle
          no-head-element vise le Pages Router ; ce composant est rendu
          exclusivement par les root layouts App Router. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_MODE_SCRIPT }} />
        <link rel="icon" type="image/png" sizes="32x32" href={`/favicons/${theme}-32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`/favicons/${theme}-16.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`/favicons/${theme}-180.png`} />
      </head>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-sand-50 focus:text-ink-900 focus:px-4 focus:py-2 focus:rounded focus:shadow focus:outline focus:outline-2 focus:outline-clay-700"
        >
          Aller au contenu principal
        </a>
        <ThemeFavicon />
        <SWRProvider>
          <AuthProvider>
            <div className="flex-1 bg-sand-200">{children}</div>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  )
}
