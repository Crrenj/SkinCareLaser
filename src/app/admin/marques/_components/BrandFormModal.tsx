'use client'

import { useTranslations } from 'next-intl'
import { useModalA11y } from '@/hooks/useModalA11y'
import { PopClose } from '@/components/ui/PopClose'
import { generateSlug } from '@/lib/slug'
import type { Brand, BrandFormState } from '../_lib/types'

type BrandFormModalProps = {
  open: boolean
  editingBrand: Brand | null
  form: BrandFormState
  onFormChange: (next: BrandFormState) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function BrandFormModal({
  open,
  editingBrand,
  form,
  onFormChange,
  onClose,
  onSubmit,
}: BrandFormModalProps) {
  const t = useTranslations('Admin.modals.brand')
  const tc = useTranslations('Admin.common')
  const dialogRef = useModalA11y(open, onClose)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 z-[-1] bg-[--pop-backdrop] backdrop-blur-[14px] backdrop-saturate-[120%]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-modal-title"
        tabIndex={-1}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[560px] bg-sand-50 flex flex-col overflow-hidden rounded-tl-[--pop-radius-drawer] rounded-bl-[--pop-radius-drawer]"
        style={{ boxShadow: 'var(--pop-shadow-drawer-r)' }}
      >
        {/* Header */}
        <header className="flex items-start justify-between px-[22px] py-[18px] shrink-0">
          <div>
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-1">
              {editingBrand ? t('eyebrowEdit', { slug: form.slug || '—' }) : t('eyebrowNew')}
            </span>
            <h3 id="brand-modal-title" className="font-serif text-[22px] text-ink-900 m-0 mt-1">
              {editingBrand ? form.name || t('titleEdit') : t('titleNew')}
            </h3>
          </div>
          <PopClose onClick={onClose} />
        </header>

        {/* Body */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-[22px] py-[18px] flex flex-col gap-0">
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] pb-[6px] mb-[14px]">
              <div className="font-serif text-[17px] text-ink-900 mb-3 flex justify-between items-baseline">
                {t('sectionIdentity')}
                <small className="font-mono text-[10.5px] text-ink-500 tracking-[0.06em]">
                  {t('sectionHint')}
                </small>
              </div>

              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label htmlFor="brand-name" className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-ink-700 font-semibold flex justify-between items-center">
                  {t('nameLabel')} <span className="text-brick-600 ml-1">{tc('required')}</span>
                </label>
                <input
                  id="brand-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    onFormChange({
                      ...form,
                      name: e.target.value,
                      slug: editingBrand ? form.slug : generateSlug(e.target.value),
                    })
                  }
                  className="w-full px-3 py-[10px] border border-sand-300 rounded-lg font-serif text-[18px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]"
                  placeholder={t('namePlaceholder')}
                />
              </div>

              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label htmlFor="brand-slug" className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-ink-700 font-semibold flex justify-between items-center">
                  {t('slugLabel')}
                </label>
                <input
                  id="brand-slug"
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-[10px] border border-sand-300 rounded-lg font-mono text-[12.5px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]"
                  placeholder="isdin"
                />
                <span className="text-[11.5px] text-ink-500 font-serif italic mt-0.5">
                  /marcas/<em className="text-clay-700">{form.slug || '…'}</em>
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="px-[22px] py-[14px] pb-[18px] border-t border-sand-200 shrink-0 relative">
            <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-sand-50 pointer-events-none" />
            <div className="flex justify-between items-center">
              <span className="text-[11.5px] text-ink-500 font-serif italic flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-clay-700" />
                {tc('unsaved')}
              </span>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-[18px] py-[11px] text-[13.5px] font-medium text-ink-700 bg-transparent border border-sand-300 rounded-[10px] hover:bg-sand-100 hover:text-ink-900 transition-colors"
                >
                  {tc('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-[18px] py-[11px] text-[13.5px] font-medium text-on-accent bg-clay-700 border-0 rounded-[10px] hover:bg-accent-hover transition-colors"
                >
                  {editingBrand ? tc('save') : t('submitCreate')}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  )
}
