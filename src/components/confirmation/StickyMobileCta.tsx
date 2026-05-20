'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  /** Élément CTA principal à observer ; quand il sort du viewport, le sticky apparaît. */
  observe: React.RefObject<HTMLElement | null>
  whatsappUrl: string
}

/**
 * Barre sticky en bas du viewport qui apparaît quand le bouton WhatsApp
 * principal sort de l'écran (mobile only). Animation slide-up 200ms.
 */
export function StickyMobileCta({ observe, whatsappUrl }: Props) {
  const t = useTranslations('Reservation.confirmation')
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = observe.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        // Quand le CTA principal n'est plus visible → on affiche la version sticky
        setShow(!entry.isIntersecting)
      },
      { threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [observe])

  return (
    <div
      aria-hidden={!show}
      className={`lg:hidden fixed bottom-0 inset-x-0 z-30 px-4 py-3 bg-sand-100/95 border-t border-sand-300 backdrop-blur transition-transform duration-200 ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={show ? 0 : -1}
        className="flex items-center justify-center gap-2.5 w-full min-h-[52px] rounded-xl bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold text-[14.5px] transition-colors shadow-[0_4px_14px_-4px_rgba(37,211,102,0.45)]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5-.2 0-.4 0-.6 0-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5 0 1.5 1.1 2.9 1.2 3.1.1.2 2.1 3.2 5 4.5 1.8.8 2.5.8 3.4.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM20.5 3.4C18.3 1.2 15.3 0 12.1 0 5.5 0 .2 5.3.2 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.4z" />
        </svg>
        {t('whatsappCta')}
      </a>
    </div>
  )
}
