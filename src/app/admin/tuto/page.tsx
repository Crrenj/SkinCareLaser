import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import type { TutoContent } from './_content/types'
import { fr } from './_content/fr'
import { es } from './_content/es'
import { en } from './_content/en'
import { TutoGuideClient } from './_components/TutoGuideClient'

export const metadata: Metadata = {
  title: 'Guía · Admin · FARMAU',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// Le corps du guide vit dans des fichiers par locale (modèle pages légales) ;
// le compilateur garantit la parité de structure entre les trois langues.
// Toute l'interactivité (recherche, sommaire, accordéons) est côté client.
const CONTENT: Record<string, TutoContent> = { fr, es, en }

export default async function AdminTutoPage() {
  const locale = await getLocale()
  const content = CONTENT[locale] ?? CONTENT.fr
  return <TutoGuideClient content={content} />
}
