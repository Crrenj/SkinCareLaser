'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Copy, MessageCircle } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'
import { PopClose } from '@/components/ui/PopClose'

export type AccountSetupInfo = {
  link: string
  phone: string
  name: string | null
}

/**
 * Panneau affiché après la création d'un compte client express : il fournit le
 * lien de configuration à transmettre au client (WhatsApp pré-rempli ou copie).
 */
export function AccountSetupDialog({
  info,
  onClose,
}: {
  info: AccountSetupInfo | null
  onClose: () => void
}) {
  const t = useTranslations('Admin.customers.setup')
  const dialogRef = useModalA11y(!!info, onClose)
  const [copied, setCopied] = useState(false)

  if (!info) return null

  const digits = info.phone.replace(/\D/g, '')
  const greeting = info.name ? `${t('waGreeting', { name: info.name })}\n\n` : ''
  const message = `${greeting}${t('waMessage', { link: info.link })}`
  const waLink = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(info.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard indispo — l'utilisateur peut sélectionner le lien à la main */
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-[--pop-backdrop] backdrop-blur-[14px] backdrop-saturate-[120%] flex items-center justify-center p-4"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-setup-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] bg-sand-50 rounded-2xl p-[22px] flex flex-col gap-4"
        style={{ boxShadow: 'var(--pop-shadow-drawer-r)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-1">
              {t('eyebrow')}
            </span>
            <h3 id="account-setup-title" className="font-serif text-[21px] text-ink-900 m-0">
              {t('title')}
            </h3>
          </div>
          <PopClose onClick={onClose} />
        </div>

        <p className="text-[13px] text-ink-700 leading-[1.5] m-0">{t('body')}</p>

        <div className="bg-sand-100 border border-sand-200 rounded-lg px-3 py-2.5 text-[12.5px]">
          {info.name && <span className="block text-ink-900">{info.name}</span>}
          <span className="block font-mono text-ink-500">{info.phone || '—'}</span>
        </div>

        <div className="flex flex-col gap-2">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 rounded-lg bg-[#25D366] hover:bg-[#1ebd5a] text-white text-[13.5px] font-medium inline-flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {t('sendWhatsapp')}
            </a>
          )}
          <button
            type="button"
            onClick={copy}
            className="h-10 rounded-lg border border-sand-300 bg-sand-50 text-ink-700 hover:bg-sand-100 hover:text-ink-900 text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-olive-600" /> : <Copy className="w-4 h-4" />}
            {copied ? t('copied') : t('copyLink')}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="self-center text-[12.5px] text-ink-500 hover:text-ink-900 underline underline-offset-2 transition-colors"
        >
          {t('close')}
        </button>
      </div>
    </div>
  )
}
