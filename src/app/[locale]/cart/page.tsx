import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import CartClient from '@/components/CartClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMeta.cart' })
  return {
    title: t('title'),
    description: t('description'),
    // Panier = page user-spécifique : pas d'indexation moteurs
    robots: { index: false, follow: false },
  }
}

export default function CartPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />
      <main id="main-content" className="flex-grow p-6">
        <CartClient />
      </main>
      <Footer />
    </div>
  )
}
