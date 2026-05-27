import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import dynamic from 'next/dynamic'

const CartClient = dynamic(() => import('@/components/CartClient'), {
  loading: () => (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-4">
      <div className="h-8 w-40 rounded bg-sand-200 animate-pulse" />
      <div className="h-48 w-full rounded bg-sand-200 animate-pulse" />
    </div>
  ),
})
import { getShopSettings, whatsappHref } from '@/lib/getShopSettings'

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

export default async function CartPage() {
  const settings = await getShopSettings()
  const waLink = whatsappHref(settings.whatsapp_number) ?? '/contact'

  return (
    <div className="flex flex-col min-h-screen bg-sand-100">
      <NavBar />
      <main id="main-content" className="flex-grow">
        <CartClient whatsappLink={waLink} />
      </main>
      <Footer />
    </div>
  )
}
