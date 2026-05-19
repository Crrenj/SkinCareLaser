import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { SWRProvider } from '@/components/SWRProvider'
import { AuthProvider } from '@/components/AuthProvider'

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

export const metadata: Metadata = {
  title: "FARMAU — Dermo-cosmétique d'expert pharmacien",
  description: "Sélection dermo-cosmétique certifiée par des pharmaciens-dermatologues. Livraison en République Dominicaine.",
  metadataBase: new URL("https://farmau.do"),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
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
