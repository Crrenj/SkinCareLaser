'use client'

import { useEffect, useState, type RefObject } from 'react'
import { ArrowUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Bouton flottant « remonter en haut ». Apparaît quand la NavBar (non-sticky)
 * a quitté le viewport ; un clic ramène en haut de page. Observe l'élément
 * `<header>` via IntersectionObserver plutôt qu'un seuil de scroll fixe, pour
 * coller exactement à « si la navbar n'est plus visible ».
 */
export function ScrollToTop({ headerRef }: { headerRef: RefObject<HTMLElement | null> }) {
  const t = useTranslations('Nav')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = headerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [headerRef])

  const toTop = () => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={t('backToTop')}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-5 right-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-sand-300 bg-sand-50/95 text-ink-800 backdrop-blur-[6px] shadow-[0_10px_28px_-10px_rgba(31,27,22,0.45),0_2px_6px_-3px_rgba(31,27,22,0.25)] transition-[opacity,transform] duration-200 hover:bg-sand-100 hover:text-ink-900 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <ArrowUp size={20} strokeWidth={1.8} />
    </button>
  )
}
