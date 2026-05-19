'use client'

import { useTranslations } from 'next-intl'
import { Truck, RefreshCcw, User as UserIcon } from 'lucide-react'

interface PdpTrustSignalsProps {
  /** Lien WhatsApp ou contact pour l'item "demander conseil". Défaut /contact. */
  contactHref?: string
}

export function PdpTrustSignals({ contactHref = '/contact' }: PdpTrustSignalsProps) {
  const t = useTranslations('Product.trust')
  return (
    <div className="flex flex-col gap-3.5 mt-6 p-5 bg-white border border-sand-300 rounded">
      <TrustItem icon={<Truck size={16} strokeWidth={1.8} />} title={t('deliveryTitle')} body={t('deliveryBody')} />
      <TrustItem icon={<RefreshCcw size={16} strokeWidth={1.8} />} title={t('returnsTitle')} body={t('returnsBody')} />
      <TrustItem
        icon={<UserIcon size={16} strokeWidth={1.8} />}
        title={t('askPharmacistTitle')}
        action={
          <a href={contactHref} className="text-clay-700 font-medium underline decoration-clay-200 underline-offset-2 hover:text-clay-800">
            {t('askPharmacistCta')}
          </a>
        }
      />
    </div>
  )
}

function TrustItem({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex gap-3.5 items-start">
      <div className="w-8 h-8 flex-shrink-0 rounded-full bg-sand-100 text-clay-700 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-[13px] text-ink-800 leading-snug">
        <strong className="block text-[13px] text-ink-900 font-semibold mb-0.5">{title}</strong>
        {body}
        {action}
      </div>
    </div>
  )
}
