'use client'

import { useTranslations } from 'next-intl'
import {
  CalendarCheck,
  Check,
  Banknote,
  Landmark,
  MessageCircle,
  Store,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import { PdpQuantity } from '@/components/pdp/PdpQuantity'
import { PdpWishlistButton } from '@/components/pdp/PdpWishlistButton'

interface PdpReservationPanelProps {
  productId: string
  quantity: number
  onQuantityChange: (next: number) => void
  onReserve: () => void
  maxQuantity?: number
  outOfStock?: boolean
  /** Lien wa.me pré-rempli « réassort ? » — remplace le CTA quand épuisé. */
  restockLink?: string | null
}

/**
 * Panneau de réservation — le cœur de la fiche produit, recadré sur le mode
 * opératoire de FARMAU (réserver → confirmation WhatsApp → paiement & retrait
 * au comptoir). Remplace l'ancien bloc « trust signals » e-commerce
 * (livraison/retours), incompatible avec le click & collect sans paiement en ligne.
 */
export function PdpReservationPanel({
  productId,
  quantity,
  onQuantityChange,
  onReserve,
  maxQuantity,
  outOfStock = false,
  restockLink,
}: PdpReservationPanelProps) {
  const t = useTranslations('Product.reservation')

  const steps = [
    { title: t('step1Title'), body: t('step1Body'), tone: 'bg-ink-900' },
    { title: t('step2Title'), body: t('step2Body'), tone: 'bg-clay-700' },
    { title: t('step3Title'), body: t('step3Body'), tone: 'bg-olive-600' },
  ]

  const chips = [
    { icon: Banknote, label: t('chipCash') },
    { icon: Landmark, label: t('chipTransfer') },
    { icon: Store, label: t('chipPickup') },
  ]

  return (
    <div>
      {/* ── Carte réservation ── */}
      <div className="rounded-[14px] border border-sand-300 bg-sand-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 bg-clay-50 border-b border-clay-200">
          <CalendarCheck size={17} strokeWidth={1.7} className="shrink-0 text-clay-700" />
          <b className="text-[13px] font-semibold text-clay-800 leading-tight">
            {t('panelTitle')}
          </b>
          <span className="ml-auto shrink-0 font-mono text-[10px] tracking-[0.08em] uppercase text-clay-700">
            {t('noCommitTag')}
          </span>
        </div>

        {/* Body */}
        <div className="p-[22px]">
          <div className="grid grid-cols-[104px_1fr_52px] gap-2.5 mb-3">
            <PdpQuantity value={quantity} onChange={onQuantityChange} max={maxQuantity} />
            {outOfStock && restockLink ? (
              // Épuisé : à la place d'un bouton mort, un CTA actionnable —
              // demander la disponibilité sur WhatsApp (message pré-rempli
              // avec le nom du produit ; fallback /contact sans numéro).
              <a
                href={restockLink}
                {...(restockLink.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="h-[52px] bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-sm font-semibold text-[14px] tracking-[0.02em] flex items-center justify-center gap-2.5 no-underline transition-colors"
              >
                <MessageCircle size={18} strokeWidth={1.8} />
                {t('restockCta')}
              </a>
            ) : (
              <button
                type="button"
                onClick={onReserve}
                disabled={outOfStock}
                className="h-[52px] bg-clay-700 text-on-accent rounded-sm font-semibold text-[14px] tracking-[0.02em] flex items-center justify-center gap-2.5 hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={18} strokeWidth={1.8} />
                {t('cta')}
              </button>
            )}
            <PdpWishlistButton productId={productId} />
          </div>
          {outOfStock && restockLink && (
            <p className="mb-3 text-[12.5px] leading-[1.5] text-ink-500">{t('restockHint')}</p>
          )}

          {/* Comment ça marche — 3 étapes */}
          <ul className="list-none p-0 m-0 mt-5">
            {steps.map((step, i) => (
              <li
                key={i}
                className="grid grid-cols-[28px_1fr] gap-3.5 items-start py-3.5 border-t border-dashed border-sand-300 first:border-t-0"
              >
                <span
                  className={`w-[26px] h-[26px] rounded-full ${step.tone} text-sand-50 font-mono text-[12px] font-semibold flex items-center justify-center shrink-0`}
                >
                  {i + 1}
                </span>
                <span className="text-[13.5px] font-semibold text-ink-900 leading-snug">
                  {step.title}
                  <span className="block font-normal text-ink-500 text-[12.5px] mt-px">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {/* Moyens à coordonner */}
          <div className="mt-[18px] pt-4 border-t border-sand-200">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-500 mb-2.5">
              {t('coordinateHeading')}
            </div>
            <div className="flex flex-wrap gap-2">
              {chips.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-[12px] text-ink-800 bg-sand-100 border border-sand-300 px-2.5 py-1.5 rounded-md"
                >
                  <Icon size={13} strokeWidth={1.7} className="text-ink-700" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Réassurance ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-[18px]">
        <Reassurance
          icon={<ShieldCheck size={16} strokeWidth={1.7} />}
          title={t('assureVerifiedTitle')}
          body={t('assureVerifiedBody')}
        />
        <Reassurance
          icon={<Clock size={16} strokeWidth={1.7} />}
          title={t('assureHoldTitle')}
          body={t('assureHoldBody')}
        />
      </div>
    </div>
  )
}

function Reassurance({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex gap-3 items-start text-[12.5px] text-ink-700 leading-snug">
      <span className="w-[30px] h-[30px] rounded-lg bg-sand-100 text-clay-700 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span>
        <strong className="block text-ink-900 font-semibold mb-px">{title}</strong>
        {body}
      </span>
    </div>
  )
}
