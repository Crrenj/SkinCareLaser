'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { UploadCloud, X, Loader2 } from 'lucide-react'
import { uploadImage, UploadError, IMAGE_ACCEPT, type UploadFolder } from '@/lib/uploadImage'

type Props = {
  value: string | null | undefined
  onChange: (url: string) => void
  folder: UploadFolder
  /** Classe d'aspect de l'aperçu (def. 16/9). Ex. 'aspect-square' pour une photo. */
  aspectClassName?: string
}

export function ImageUploadField({ value, onChange, folder, aspectClassName = 'aspect-[16/9]' }: Props) {
  const t = useTranslations('Admin.upload')
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const url = await uploadImage(file, folder)
      onChange(url)
    } catch (err) {
      const code = err instanceof UploadError ? err.code : 'server'
      toast.error(code === 'type' ? t('errorType') : code === 'size' ? t('errorSize') : t('errorGeneric'))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {value ? (
        <div className={`relative w-full overflow-hidden rounded-lg border border-sand-300 bg-sand-100 ${aspectClassName}`}>
          <Image src={value} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 480px" unoptimized />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-ink-900/60 to-transparent p-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-md bg-sand-50/90 px-2.5 py-1 text-[12px] font-medium text-ink-900 transition-colors hover:bg-sand-50 disabled:opacity-60"
            >
              {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {uploading ? t('uploading') : t('replace')}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={uploading}
              aria-label={t('remove')}
              className="rounded-md bg-sand-50/90 p-1.5 text-brick-600 transition-colors hover:bg-sand-50 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-sand-300 bg-sand-50 px-4 text-ink-500 transition-colors hover:border-clay-700 hover:text-clay-700 disabled:opacity-60 ${aspectClassName}`}
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
          <span className="text-[12.5px] font-medium">{uploading ? t('uploading') : t('choose')}</span>
          <span className="text-[11px] text-ink-500">{t('hint')}</span>
        </button>
      )}
    </div>
  )
}
