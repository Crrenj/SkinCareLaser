'use client'

import { forwardRef } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  /** Lien wa.me déjà encodé prêt à ouvrir. */
  whatsappUrl: string
  /** Aperçu du message qui sera envoyé, affiché dans le mockup téléphone. */
  messagePreview: string
  /** Téléphone pharmacie (shop_settings.contact_phone) pour le fallback tel:. */
  phone?: string
  /** Email pharmacie (shop_settings.contact_email) pour le fallback mailto:. */
  email?: string
}

/**
 * Carte hero post-réservation : CTA WhatsApp à gauche, aperçu du téléphone
 * à droite (desktop only). Le forwardRef permet à `StickyMobileCta`
 * d'observer la sortie du viewport du CTA pour faire apparaître la version
 * sticky-bottom mobile.
 */
export const WhatsappHero = forwardRef<HTMLAnchorElement, Props>(
  function WhatsappHero({ whatsappUrl, messagePreview, phone, email }, ref) {
    const t = useTranslations('Reservation.confirmation')
    const telDigits = (phone ?? '').replace(/[^\d+]/g, '')
    return (
      <article className="relative bg-sand-50 border border-sand-300 rounded-2xl p-6 lg:p-9 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-10 items-center overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 w-52 h-52 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(37,211,102,0.12), transparent 60%)',
          }}
        />
        <div className="relative flex flex-col gap-3.5">
          <span className="text-[11px] tracking-[0.18em] uppercase text-clay-700 font-semibold">
            {t('whatsappEyebrow')}
          </span>
          <h2 className="font-serif text-[26px] lg:text-[32px] leading-[1.1] text-ink-900 m-0">
            {t('whatsappTitle')}
          </h2>
          <p className="text-[14.5px] text-ink-700 leading-[1.6] m-0">
            {t('whatsappBody')}
          </p>
          <a
            ref={ref}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 min-h-[60px] px-7 rounded-xl bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold text-[15.5px] no-underline transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_14px_-4px_rgba(37,211,102,0.45)] w-fit"
          >
            <WhatsappIcon className="w-5 h-5" />
            <span className="flex flex-col items-start leading-[1.15]">
              <span>{t('whatsappCta')}</span>
              <small className="text-[11.5px] font-normal opacity-90 tracking-[0.04em] mt-0.5">
                {t('whatsappCtaSub')}
              </small>
            </span>
          </a>
          <p className="text-[12.5px] text-ink-500 leading-[1.5] m-0">
            {t.rich('fallback', {
              call: (chunks) =>
                telDigits ? (
                  <a
                    href={`tel:${telDigits}`}
                    className="text-ink-700 underline underline-offset-[3px] hover:text-ink-900 transition-colors"
                  >
                    {chunks}
                  </a>
                ) : (
                  <>{chunks}</>
                ),
              mail: (chunks) =>
                email ? (
                  <a
                    href={`mailto:${email}`}
                    className="text-ink-700 underline underline-offset-[3px] hover:text-ink-900 transition-colors"
                  >
                    {chunks}
                  </a>
                ) : (
                  <>{chunks}</>
                ),
            })}
          </p>
        </div>

        {/* Mockup téléphone — desktop only */}
        <PhonePreview messagePreview={messagePreview} />
      </article>
    )
  },
)

function PhonePreview({ messagePreview }: { messagePreview: string }) {
  const t = useTranslations('Reservation.confirmation')
  return (
    <div className="hidden lg:flex relative bg-ink-900 border-[8px] border-ink-900 rounded-[2rem] h-[480px] flex-col overflow-hidden shadow-[0_24px_48px_-16px_rgba(31,27,22,0.32)]">
      <header className="bg-[#075E54] text-white px-4 pt-4 pb-3 flex items-center gap-2.5 text-[13.5px]">
        <span className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center font-serif text-white text-sm font-semibold shrink-0">
          {t('phoneAvatar')}
        </span>
        <span className="flex flex-col">
          <strong className="font-medium">FARMAU</strong>
          <small className="text-[11px] opacity-70">{t('phoneOnline')}</small>
        </span>
      </header>
      <div
        className="flex-1 p-3.5 flex flex-col justify-end gap-1.5 overflow-y-auto"
        style={{
          background:
            '#ECE5DD url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23d4cabe\' fill-opacity=\'.25\'%3E%3Ccircle cx=\'8\' cy=\'8\' r=\'1\'/%3E%3Ccircle cx=\'28\' cy=\'18\' r=\'1\'/%3E%3Ccircle cx=\'14\' cy=\'32\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        <div className="self-end max-w-[90%] bg-[#DCF8C6] px-3 pt-2 pb-1.5 rounded-[8px_0_8px_8px] text-[11.5px] leading-[1.45] text-[#111] whitespace-pre-wrap shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
          {messagePreview}
        </div>
      </div>
      <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2 border-t border-[#DDD]">
        <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-[#999]">
          {t('phoneInputPlaceholder')}
        </div>
        <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white text-[12px]">
          →
        </div>
      </div>
    </div>
  )
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5-.2 0-.4 0-.6 0-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5 0 1.5 1.1 2.9 1.2 3.1.1.2 2.1 3.2 5 4.5 1.8.8 2.5.8 3.4.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM20.5 3.4C18.3 1.2 15.3 0 12.1 0 5.5 0 .2 5.3.2 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.4zM12.1 21.7c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1 1-3.7-.2-.4c-1-1.6-1.5-3.4-1.5-5.3 0-5.5 4.5-9.9 9.9-9.9 2.7 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.5-4.5 10-10 10z" />
    </svg>
  )
}
