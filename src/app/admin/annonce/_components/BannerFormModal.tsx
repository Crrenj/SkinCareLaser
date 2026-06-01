'use client'

import { useTranslations } from 'next-intl'
import { useModalA11y } from '@/hooks/useModalA11y'
import { PopClose } from '@/components/ui/PopClose'
import { ImageUploadField } from '@/components/admin/ImageUploadField'
import type { BannerData, BannerFormState, BannerSlot, BannerStatus, BannerType } from '../_lib/types'
import { SLOT_LABELS } from '../_lib/types'

type BannerFormModalProps = {
  open: boolean
  editingBanner: BannerData | null
  form: BannerFormState
  onFormChange: (next: BannerFormState) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  saving: boolean
}

const NEW_TYPES: BannerType[] = ['editorial', 'hero', 'quote']

const TYPE_HINT_KEYS: Record<'editorial' | 'hero' | 'quote', string> = {
  editorial: 'typeHintEditorial',
  hero: 'typeHintHero',
  quote: 'typeHintQuote',
}

const inputCls =
  'w-full px-3 py-[10px] border border-sand-300 rounded-lg text-[13.5px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]'
const labelCls =
  'font-mono text-[10.5px] tracking-[0.12em] uppercase text-ink-700 font-semibold'

export function BannerFormModal({
  open,
  editingBanner,
  form,
  onFormChange,
  onClose,
  onSubmit,
  saving,
}: BannerFormModalProps) {
  const t = useTranslations('Admin.modals.banner')
  const tc = useTranslations('Admin.common')
  const tStatus = useTranslations('Admin.annonce.status')
  const dialogRef = useModalA11y(open, onClose)
  if (!open) return null

  const isNewType = (NEW_TYPES as BannerType[]).includes(form.banner_type)
  const hintType = isNewType ? (form.banner_type as 'editorial' | 'hero' | 'quote') : 'editorial'

  return (
    <div
      className="fixed inset-0 z-50 bg-[--pop-backdrop] backdrop-blur-[14px] backdrop-saturate-[120%]"
      onClick={onClose}
      aria-hidden="true"
    >
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="annonce-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[560px] bg-sand-50 flex flex-col overflow-hidden rounded-tl-[--pop-radius-drawer] rounded-bl-[--pop-radius-drawer]"
        style={{ boxShadow: 'var(--pop-shadow-drawer-r)' }}
      >
        {/* Header */}
        <header className="flex items-start justify-between px-[22px] py-[18px] shrink-0">
          <div>
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-1">
              {editingBanner ? t('eyebrowEdit', { slug: form.banner_type }) : t('eyebrowNew')}
            </span>
            <h3 id="annonce-modal-title" className="font-serif text-[22px] text-ink-900 m-0 mt-1">
              {editingBanner ? form.title || t('titleEdit') : t('titleNew')}
            </h3>
            {editingBanner && form.is_active && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold tracking-[0.08em] uppercase bg-olive-50 text-olive-800 border border-olive-200">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                {t('activeLabel')}
              </div>
            )}
          </div>
          <PopClose onClick={onClose} />
        </header>

        {/* Body */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-[22px] py-[18px]">
            {/* Type selection */}
            <div className="flex flex-col gap-[6px] mb-[14px]">
              <span className={labelCls}>{t('typeLabel')} <span className="text-brick-600 ml-1">{tc('required')}</span></span>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {NEW_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center justify-center gap-2 px-3 py-[10px] border rounded-[10px] cursor-pointer text-[12.5px] transition-colors ${
                      form.banner_type === type
                        ? 'border-clay-700 bg-clay-50 text-clay-800 shadow-[0_0_0_3px_rgba(142,82,50,.1)]'
                        : 'border-sand-300 text-ink-700 hover:bg-sand-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="banner_type"
                      value={type}
                      checked={form.banner_type === type}
                      onChange={() => onFormChange({ ...form, banner_type: type })}
                      className="sr-only"
                    />
                    <span className="font-medium capitalize">{type}</span>
                  </label>
                ))}
              </div>
              {isNewType && (
                <span className="text-[11.5px] text-ink-500 font-serif italic mt-1">{t(TYPE_HINT_KEYS[hintType])}</span>
              )}
            </div>

            {/* Slot + Status */}
            <div className="grid grid-cols-2 gap-3 mb-[14px]">
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="banner-slot" className={labelCls}>{t('slotLabel')}</label>
                <select
                  id="banner-slot"
                  value={form.slot}
                  onChange={(e) => onFormChange({ ...form, slot: e.target.value as BannerSlot })}
                  className={inputCls}
                >
                  {(Object.keys(SLOT_LABELS) as BannerSlot[]).map(s => (
                    <option key={s} value={s}>{SLOT_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="banner-status" className={labelCls}>{t('statusLabel')}</label>
                <select
                  id="banner-status"
                  value={form.status}
                  onChange={(e) => onFormChange({ ...form, status: e.target.value as BannerStatus })}
                  className={inputCls}
                >
                  {(['draft', 'scheduled', 'active', 'paused', 'expired'] as BannerStatus[]).map((s) => (
                    <option key={s} value={s}>{tStatus(s)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content fields */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] pb-[6px] mb-[14px]">
              <div className="font-serif text-[17px] text-ink-900 mb-3">{t('sectionContent')}</div>

              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label htmlFor="banner-title" className={labelCls}>
                  {t('titleLabel')} <span className="text-brick-600 ml-1">{tc('required')}</span>
                </label>
                <input
                  id="banner-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => onFormChange({ ...form, title: e.target.value })}
                  className={`${inputCls} font-serif !text-[18px]`}
                  placeholder={t('titlePlaceholder')}
                />
              </div>

              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label htmlFor="banner-description" className={labelCls}>
                  {form.banner_type === 'quote' ? t('quoteLabel') : t('descriptionLabel')}
                </label>
                <textarea
                  id="banner-description"
                  required={form.banner_type !== 'quote'}
                  value={form.description}
                  onChange={(e) => onFormChange({ ...form, description: e.target.value })}
                  rows={3}
                  className={`${inputCls} min-h-[80px] resize-y`}
                />
              </div>

              {form.banner_type === 'editorial' && (
                <div className="flex flex-col gap-[6px] mb-[14px]">
                  <span className={labelCls}>{t('directionLabel')}</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {(['left', 'right'] as const).map((dir) => (
                      <label
                        key={dir}
                        className={`flex items-center justify-center px-3 py-[10px] border rounded-[10px] cursor-pointer text-[12.5px] transition-colors ${
                          form.direction === dir
                            ? 'border-ink-900 bg-sand-100 text-ink-900'
                            : 'border-sand-300 text-ink-700 hover:bg-sand-100'
                        }`}
                      >
                        <input
                          type="radio" name="direction" value={dir}
                          checked={form.direction === dir}
                          onChange={() => onFormChange({ ...form, direction: dir })}
                          className="sr-only"
                        />
                        {dir === 'left' ? t('directionImageLeft') : t('directionImageRight')}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {form.banner_type === 'quote' && (
                <div className="bg-sand-100 rounded-xl p-[14px] mb-[14px] flex flex-col gap-3">
                  <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-semibold">{t('sectionAttribution')}</div>
                  <div className="flex flex-col gap-[6px]">
                    <label htmlFor="banner-attribution-name" className="text-[11.5px] text-ink-700">{t('attrNameLabel')}</label>
                    <input id="banner-attribution-name" type="text" value={form.attribution_name}
                      onChange={(e) => onFormChange({ ...form, attribution_name: e.target.value })}
                      className={inputCls} placeholder="Dra. María Rosa Cabrera" />
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label htmlFor="banner-attribution-title" className="text-[11.5px] text-ink-700">{t('attrTitleLabel')}</label>
                    <input id="banner-attribution-title" type="text" value={form.attribution_title}
                      onChange={(e) => onFormChange({ ...form, attribution_title: e.target.value })}
                      className={inputCls} placeholder="Pharmacienne, Santo Domingo" />
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label htmlFor="banner-attribution-photo" className="text-[11.5px] text-ink-700">{t('attrPhotoLabel')}</label>
                    <ImageUploadField
                      value={form.attribution_photo_url}
                      onChange={(url) => onFormChange({ ...form, attribution_photo_url: url })}
                      folder="banners"
                      aspectClassName="aspect-square max-w-[160px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Image + CTA */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] pb-[6px] mb-[14px]">
              <div className="font-serif text-[17px] text-ink-900 mb-3">{t('sectionImageLink')}</div>

              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label htmlFor="banner-image" className={labelCls}>
                  {t('imageUrlLabel')}
                  {form.banner_type === 'quote' && <span className="font-sans text-ink-500 text-[10px] normal-case tracking-normal ml-2">({t('optionalForQuote')})</span>}
                </label>
                <ImageUploadField
                  value={form.image_url}
                  onChange={(url) => onFormChange({ ...form, image_url: url })}
                  folder="banners"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-[14px]">
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="banner-link" className={labelCls}>{t('ctaDestLabel')}</label>
                  <input id="banner-link" type="url" value={form.link_url}
                    onChange={(e) => onFormChange({ ...form, link_url: e.target.value })}
                    className={`${inputCls} font-mono !text-[12px]`} placeholder="/catalogo?categoria=solar" />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="banner-link-text" className={labelCls}>{t('ctaLabelLabel')}</label>
                  <input id="banner-link-text" type="text" value={form.link_text}
                    onChange={(e) => onFormChange({ ...form, link_text: e.target.value })}
                    className={inputCls} placeholder="Descubrir" />
                </div>
              </div>

              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label htmlFor="banner-position" className={labelCls}>{t('positionLabel')}</label>
                <input id="banner-position" type="number" min="1" value={form.position}
                  onChange={(e) => onFormChange({ ...form, position: parseInt(e.target.value, 10) || 1 })}
                  className={inputCls} />
                <span className="text-[11.5px] text-ink-500 font-serif italic">{t('positionHint')}</span>
              </div>
            </div>

            {/* Programación */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] pb-[6px] mb-[14px]">
              <div className="font-serif text-[17px] text-ink-900 mb-3">{t('sectionSchedule')}</div>

              <div className="grid grid-cols-2 gap-3 mb-[14px]">
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="banner-start" className={labelCls}>{t('startDateLabel')}</label>
                  <input id="banner-start" type="date" value={form.start_date}
                    onChange={(e) => onFormChange({ ...form, start_date: e.target.value })}
                    className={inputCls} />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="banner-end" className={labelCls}>{t('endDateLabel')}</label>
                  <input id="banner-end" type="date" value={form.end_date}
                    onChange={(e) => onFormChange({ ...form, end_date: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-sand-50 border border-sand-200 rounded-[10px] mb-[14px]">
                <div className="text-[13.5px] text-ink-900">
                  {t('activeLabel')}
                  <small className="block text-[11.5px] text-ink-500 font-serif italic mt-0.5">
                    {t('activeHint')}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => onFormChange({ ...form, is_active: !form.is_active })}
                  className={`w-9 h-[22px] rounded-full relative cursor-pointer shrink-0 transition-colors ${
                    form.is_active ? 'bg-clay-700' : 'bg-sand-300'
                  }`}
                >
                  <span className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${
                    form.is_active ? 'translate-x-[14px]' : ''
                  }`} />
                </button>
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
                <button type="button" onClick={onClose}
                  className="px-[18px] py-[11px] text-[13.5px] font-medium text-ink-700 bg-transparent border border-sand-300 rounded-[10px] hover:bg-sand-100 hover:text-ink-900 transition-colors">
                  {tc('cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="px-[18px] py-[11px] text-[13.5px] font-medium text-sand-50 bg-clay-700 border-0 rounded-[10px] hover:bg-clay-800 transition-colors disabled:opacity-50">
                  {saving ? tc('saving') : editingBanner ? tc('save') : t('submitCreate')}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  )
}
