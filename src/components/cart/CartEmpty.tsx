'use client'

import Image from 'next/image'
import useSWR from 'swr'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { formatPrice } from '@/lib/formatPrice'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type SearchHit = {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  currency: string
  image: string | null
}

export function CartEmpty() {
  const t = useTranslations('Cart.empty')
  const locale = useLocale()
  const fmt = (n: number) => formatPrice(n, { locale })

  const { data } = useSWR<{ hits: SearchHit[] }>('/api/search?bestsellers=1&limit=3', fetcher)
  const hits = data?.hits ?? []
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
    : '/contact'

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 lg:py-24 text-center flex flex-col items-center gap-4">
      <EmptyIllustration />

      <h1 className="font-serif text-[34px] lg:text-[44px] leading-[1.05] tracking-[-0.01em] text-ink-900">
        {t('title')}{' '}
        <em className="not-italic text-clay-700" style={{ fontStyle: 'italic' }}>
          {t('titleEmphasis')}
        </em>
        .
      </h1>

      <p className="font-serif italic text-[17px] lg:text-[19px] text-ink-700 max-w-md">
        {t('lede')}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
        <Link
          href="/catalogue"
          className="inline-flex items-center justify-center h-12 px-7 rounded-lg bg-clay-700 text-sand-50 font-medium text-[14.5px] hover:bg-clay-800 transition-colors"
        >
          {t('ctaCatalogue')}
        </Link>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-12 px-6 rounded-lg border border-ink-900 text-ink-900 font-medium text-[14.5px] hover:bg-ink-900 hover:text-sand-50 transition-colors"
        >
          {t('ctaPharmacist')}
        </a>
      </div>

      {hits.length > 0 && (
        <section className="mt-16 w-full max-w-[720px] text-left">
          <p className="text-[11px] tracking-[0.16em] uppercase text-clay-700 font-semibold mb-3.5">
            {t('bestsellersEyebrow')}
          </p>
          <h2 className="font-serif text-[22px] text-ink-900 mb-5">
            {t('bestsellersTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {hits.map((hit) => (
              <Link
                key={hit.id}
                href={`/product/${hit.slug}`}
                className="group bg-sand-50 border border-sand-300 rounded-xl p-4 flex flex-col gap-1.5 hover:border-ink-700 transition-colors"
              >
                <div className="relative aspect-square bg-sand-200 rounded-md mb-1.5 flex items-center justify-center text-ink-500 text-[10px] tracking-[0.1em] uppercase overflow-hidden">
                  {hit.image ? (
                    <Image
                      src={hit.image}
                      alt={hit.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 240px"
                      className="object-cover"
                    />
                  ) : (
                    'Pack'
                  )}
                </div>
                {hit.brand && (
                  <span className="text-[10px] tracking-[0.14em] uppercase text-clay-700 font-semibold">
                    {hit.brand}
                  </span>
                )}
                <span className="text-[14px] font-medium leading-[1.3] text-ink-900 line-clamp-2">
                  {hit.name}
                </span>
                <span className="font-serif text-[18px] mt-1">
                  {fmt(hit.price)}{' '}
                  <span className="font-sans text-[11px] text-ink-500">{hit.currency}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function EmptyIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      aria-hidden
      className="mb-2"
    >
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="var(--color-sand-100)"
        stroke="var(--color-sand-300)"
        strokeWidth="1"
      />
      <g
        transform="translate(28,32)"
        stroke="var(--color-ink-700)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M6 14h50l-6 30a4 4 0 01-4 3H16a4 4 0 01-4-3L6 14z" />
        <path d="M22 28v8M40 28v8" opacity=".55" />
        <path d="M16 14l8-10M46 14l-8-10" opacity=".4" />
      </g>
    </svg>
  )
}
