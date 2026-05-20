'use client'

import { User as UserIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PdpPharmacistProps {
  quote?: string
  name?: string
}

/**
 * Variantes (spec §04) :
 *   - A · Citation nominale (quote + name fournis)
 *   - B · Note clinique (quote fourni, sans name → attribué à "Équipe FARMAU")
 *   - Pas de variant C : sans quote ni name, on n'affiche rien (décision actée
 *     du brief sprint 2 — pas de CTA "Demander conseil").
 */
export function PdpPharmacist({ quote, name }: PdpPharmacistProps) {
  const t = useTranslations('Product.pharmacist')

  if (!quote && !name) return null

  const displayQuote = quote ?? t('fallbackQuote')
  const displayName = name ?? t('fallbackAttrib')

  return (
    <section className="bg-sand-50 px-8 pb-16">
      <div className="max-w-[920px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] bg-white border border-sand-300 rounded overflow-hidden">
          <div className="bg-sand-100 flex items-end justify-center p-6">
            <div className="w-24 h-24 rounded-full bg-sand-200 flex items-center justify-center text-ink-700">
              <UserIcon size={42} strokeWidth={1.4} />
            </div>
          </div>
          <div className="p-7 md:p-8 flex flex-col justify-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-700 mb-2.5">
              {t('eyebrow')}
            </div>
            <p className="font-serif italic text-[22px] leading-snug text-ink-900 mb-4 -tracking-[0.005em]">
              &ldquo;{displayQuote}&rdquo;
            </p>
            <p className="text-[13px] text-ink-500">
              <strong className="text-ink-900 font-semibold">{displayName}</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
