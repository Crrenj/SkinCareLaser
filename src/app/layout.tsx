import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Be_Vietnam_Pro } from "next/font/google";
import { getLocale } from 'next-intl/server'
import "./globals.css";
import { SWRProvider } from '@/components/SWRProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { getThemeConfig, resolveInitialMode } from '@/lib/getThemeConfig'

const serif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Be_Vietnam_Pro({
  variable: "--font-bevn",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// siteName en dur (pas via getShopSettings) : lire shop_settings ici utilise
// `cookies()` et forcerait TOUTES les pages (login, faq, legal…) en rendu
// dynamique. La valeur 'FARMAU' correspond au shop_name réel ; le surcoût
// perf d'un fetch DB par requête ne vaut pas un og:site_name dynamique.
export const metadata: Metadata = {
  title: "FARMAU — Dermo-cosmétique d'expert pharmacien",
  description: "Sélection dermo-cosmétique curatée par des pharmaciens. Click & collect en République Dominicaine.",
  metadataBase: new URL("https://farmau.do"),
  openGraph: {
    siteName: "FARMAU",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Script anti-flash : résout `data-mode` AVANT le premier paint (dans <head>).
// Priorité : override visiteur en localStorage (si autorisé) > défaut admin >
// préférence système (si défaut = 'system'). Évite le flash clair→sombre.
const THEME_MODE_SCRIPT = `(function(){try{var d=document.documentElement;var a=d.getAttribute('data-allow-mode')==='1';var def=d.getAttribute('data-default-mode')||'light';var s=null;try{if(a){s=localStorage.getItem('farmau:mode');}}catch(e){}var m=s||def;if(m==='system'){m=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}if(m!=='dark'&&m!=='light'){m='light';}d.setAttribute('data-mode',m);}catch(e){}})();`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Lit la locale next-intl du request (cf. middleware + [locale] segment).
  // Les routes non-localisées (/admin/*, /api/*) reçoivent la locale par
  // défaut ('fr') — l'admin est mono-langue FR/ES mélangé donc fr est OK.
  const locale = await getLocale()
  const { theme, defaultMode, allowVisitorMode } = await getThemeConfig()
  const initialMode = resolveInitialMode(defaultMode)

  return (
    <html
      lang={locale}
      data-theme={theme}
      data-mode={initialMode}
      data-default-mode={defaultMode}
      data-allow-mode={allowVisitorMode ? '1' : '0'}
      className={`${serif.variable} ${sans.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_MODE_SCRIPT }} />
        <link rel="icon" type="image/png" sizes="32x32" href={`/favicons/${theme}-32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`/favicons/${theme}-16.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`/favicons/${theme}-180.png`} />
      </head>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:shadow focus:outline focus:outline-2 focus:outline-clay-700"
        >
          Aller au contenu principal
        </a>
        <SWRProvider>
          <AuthProvider>
            <div className="flex-1 bg-sand-200">{children}</div>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
