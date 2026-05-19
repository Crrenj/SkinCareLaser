'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

type GalleryImage = { url: string; alt: string | null }

interface PdpGalleryProps {
  images: GalleryImage[]
  name: string
}

const PLACEHOLDER: GalleryImage = { url: '/placeholder.png', alt: null }

export function PdpGallery({ images, name }: PdpGalleryProps) {
  const t = useTranslations('Product.gallery')
  const list = images.length > 0 ? images.slice(0, 4) : [PLACEHOLDER]
  const [activeIdx, setActiveIdx] = useState(0)
  const active = list[activeIdx] ?? list[0]

  return (
    <div className="grid grid-cols-[64px_1fr] gap-3.5">
      {/* Thumbnails column */}
      <div className="flex flex-col gap-2">
        {list.map((img, idx) => {
          const isActive = idx === activeIdx
          return (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => setActiveIdx(idx)}
              aria-label={t('thumbAriaLabel', { n: idx + 1 })}
              aria-current={isActive}
              className={`aspect-square bg-sand-100 rounded-sm flex items-center justify-center p-2 border-[1.5px] transition-colors ${
                isActive ? 'border-ink-900' : 'border-transparent hover:border-ink-700'
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${name} ${idx + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-contain"
              />
            </button>
          )
        })}
      </div>

      {/* Main image */}
      <div className="relative aspect-square bg-sand-100 rounded flex items-center justify-center p-[14%] cursor-zoom-in group">
        <Image
          src={active.url}
          alt={active.alt ?? name}
          width={640}
          height={640}
          priority
          className="w-full h-full object-contain"
        />
        <div className="pointer-events-none absolute bottom-4 right-4 bg-ink-900/70 text-sand-50 text-[11px] px-2.5 py-1 rounded-sm font-mono tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
          {t('zoomHint')}
        </div>
      </div>
    </div>
  )
}
