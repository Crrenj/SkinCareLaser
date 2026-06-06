'use client'

import { useTranslations } from 'next-intl'
import { useModalA11y } from '@/hooks/useModalA11y'
import { PopClose } from '@/components/ui/PopClose'
import { generateSlug } from '../_lib/icons'
import type { TagType, TypeFormState } from '../_lib/types'
import { IconPicker } from './IconPicker'
import { ColorPicker } from './ColorPicker'

type TagTypeModalProps = {
  open: boolean
  editingType: TagType | null
  form: TypeFormState
  onFormChange: (next: TypeFormState) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

const inputCls =
  'w-full px-3 py-[10px] border border-sand-300 rounded-lg text-[13.5px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]'
const labelCls =
  'font-mono text-[10.5px] tracking-[0.12em] uppercase text-ink-700 font-semibold'

export function TagTypeModal({
  open,
  editingType,
  form,
  onFormChange,
  onClose,
  onSubmit,
}: TagTypeModalProps) {
  const t = useTranslations('Admin.modals.tagType')
  const tc = useTranslations('Admin.common')
  const dialogRef = useModalA11y(open, onClose)
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[--pop-backdrop] backdrop-blur-[14px] backdrop-saturate-[120%]"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-type-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto w-full max-w-[520px] bg-sand-50 flex flex-col overflow-hidden"
        style={{
          borderRadius: 'var(--pop-radius-modal)',
          boxShadow: 'var(--pop-shadow-floating)',
        }}
      >
        <header className="px-[22px] py-[18px] flex justify-between items-start border-b border-sand-200 shrink-0">
          <div>
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-1">
              {editingType ? t('eyebrowEdit', { slug: form.slug || '' }) : t('eyebrowNew')}
            </span>
            <h3 id="tag-type-modal-title" className="font-serif text-[22px] text-ink-900 m-0 mt-1">
              {editingType ? t('titleEdit') : t('titleNew')}
            </h3>
          </div>
          <PopClose onClick={onClose} />
        </header>

        <form onSubmit={onSubmit}>
          <div className="px-[22px] py-[18px] flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="type-name" className={labelCls}>
                {t('nameLabel')} <span className="text-brick-600 ml-1">{tc('required')}</span>
              </label>
              <input
                id="type-name"
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    name: e.target.value,
                    slug: editingType ? form.slug : generateSlug(e.target.value),
                  })
                }
                className={`${inputCls} font-serif !text-[15px]`}
                placeholder={t('namePlaceholder')}
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="type-slug" className={labelCls}>{t('slugLabel')}</label>
              <input
                id="type-slug"
                type="text"
                required
                value={form.slug}
                onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
                className={`${inputCls} font-mono !text-[12.5px]`}
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <span className={labelCls}>{t('iconLabel')}</span>
              <IconPicker
                value={form.icon}
                onChange={(icon) => onFormChange({ ...form, icon })}
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <span className={labelCls}>{t('colorLabel')}</span>
              <ColorPicker
                value={form.color}
                onChange={(color) => onFormChange({ ...form, color })}
              />
            </div>

            {!editingType && (
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="type-initial-tag" className={labelCls}>
                  {t('initialTagLabel')}
                </label>
                <input
                  id="type-initial-tag"
                  type="text"
                  value={form.initialTag}
                  onChange={(e) => onFormChange({ ...form, initialTag: e.target.value })}
                  className={inputCls}
                  placeholder={t('initialTagNameLabel')}
                />
              </div>
            )}
          </div>

          <footer className="px-[22px] py-[14px] pb-[18px] border-t border-sand-200 relative">
            <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-sand-50 pointer-events-none" />
            <div className="flex justify-end gap-2">
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
                {editingType ? tc('save') : t('submitCreate')}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
