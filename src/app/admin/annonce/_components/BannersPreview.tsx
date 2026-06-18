'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { RotateCw } from 'lucide-react'
import type { BannerData } from '../_lib/types'

type BannersPreviewProps = {
  banners: BannerData[]
}

const IFRAME_W = 1440

/**
 * Aperçu fidèle de la PAGE D'ACCUEIL COMPLÈTE : on embarque la vraie home
 * (`/es`, locale par défaut) dans une iframe same-origin, mise à l'échelle de la largeur du
 * panneau admin (les unités `vw` des bannières se résolvent contre le viewport
 * de l'iframe → rendu identique au site). La hauteur exacte vient du
 * `IframeHeightReporter` monté sur la home (postMessage). L'iframe affiche les
 * bannières actives enregistrées en contexte ; bouton « rafraîchir » pour
 * recharger après un enregistrement.
 */
export function BannersPreview({ banners }: BannersPreviewProps) {
  const t = useTranslations('Admin.annonce')
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.6)
  const [iframeH, setIframeH] = useState(2600)
  const [reloadKey, setReloadKey] = useState(0)

  // Largeur du panneau → facteur d'échelle de l'iframe (1440px de référence).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth > 0 ? el.clientWidth / IFRAME_W : 0.6)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Hauteur réelle de la home (postMessage du IframeHeightReporter).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      const d = e.data as { type?: string; height?: number } | null
      if (d?.type === 'farmau:preview-height' && typeof d.height === 'number') {
        setIframeH(Math.max(600, Math.round(d.height)))
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  return (
    <section className="rounded-xl border border-sand-300 overflow-hidden shadow-[0_1px_3px_rgba(31,27,22,0.06)]">
      <header className="flex items-center gap-2 px-5 py-3 bg-sand-100 border-b border-sand-300">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sand-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-sand-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-sand-400" />
        </span>
        <span className="ml-2 font-mono text-[11px] tracking-[0.16em] uppercase text-ink-500 font-semibold">
          {t('previewTitle')}
        </span>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          aria-label={t('refresh')}
          title={t('refresh')}
          className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-md text-ink-500 hover:bg-sand-200 hover:text-ink-900 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </header>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-sand-50"
        style={{ height: Math.round(iframeH * scale) }}
      >
        <iframe
          key={reloadKey}
          src="/es"
          title={t('previewTitle')}
          loading="lazy"
          className="absolute top-0 left-0 border-0"
          style={{
            width: IFRAME_W,
            height: iframeH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>

      {banners.length === 0 && (
        <p className="px-5 py-2.5 text-center text-[12px] text-ink-500 bg-sand-100 border-t border-sand-300">
          {t('previewEmptyHint')}
        </p>
      )}
    </section>
  )
}
