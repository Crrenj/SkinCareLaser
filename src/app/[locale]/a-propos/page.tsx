import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { AboutHero } from '@/components/about/AboutHero'
import { AboutStats } from '@/components/about/AboutStats'
import { AboutManifest } from '@/components/about/AboutManifest'
import { AboutTeam } from '@/components/about/AboutTeam'
import { AboutCriteria } from '@/components/about/AboutCriteria'
import { AboutVisit } from '@/components/about/AboutVisit'
import { AboutPartner } from '@/components/about/AboutPartner'
import { AboutLeaveReview } from '@/components/about/AboutLeaveReview'
import { AboutCta } from '@/components/about/AboutCta'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.about' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/a-propos'),
      languages: buildLanguageAlternates('/a-propos'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      type: 'website',
    },
  }
}

export default async function AProposPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />
      <main id="main-content" className="flex-1">
        <AboutHero />
        <AboutStats />
        <AboutManifest />
        <AboutTeam />
        <AboutCriteria />
        <AboutVisit />
        <AboutPartner />
        <AboutLeaveReview />
        <AboutCta />
      </main>
      <Footer />
    </div>
  )
}
