'use client'

import { useTranslations } from 'next-intl'
import { useModalA11y } from '@/hooks/useModalA11y'
import { PopClose } from '@/components/ui/PopClose'
import { generateSlug } from '@/lib/slug'
import type { Brand, Product, ProductFormState, Tag, TagType } from '../_lib/types'
import { TagSelector } from './TagSelector'

type ProductFormModalProps = {
  open: boolean
  editingProduct: Product | null
  form: ProductFormState
  onFormChange: (next: ProductFormState) => void
  brands: Brand[]
  tags: Tag[]
  tagTypes: TagType[]
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

const inputCls =
  'w-full px-3 py-[10px] border border-sand-300 rounded-lg text-[13.5px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]'
const labelCls =
  'font-mono text-[10.5px] tracking-[0.12em] uppercase text-ink-700 font-semibold flex justify-between items-center'

export function ProductFormModal({
  open,
  editingProduct,
  form,
  onFormChange,
  brands,
  tags,
  tagTypes,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const t = useTranslations('Admin.modals.product')
  const tc = useTranslations('Admin.common')
  const dialogRef = useModalA11y(open, onClose)
  if (!open) return null

  const selectedBrandRanges = brands.find((b) => b.id === form.brand_id)?.ranges || []

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result?.toString().split(',')[1]
      onFormChange({ ...form, imageFile: base64 || null })
    }
    reader.readAsDataURL(file)
  }

  const toggleTag = (tagId: string) => {
    const selectedTags = form.selectedTags.includes(tagId)
      ? form.selectedTags.filter((id) => id !== tagId)
      : [...form.selectedTags, tagId]
    onFormChange({ ...form, selectedTags })
  }

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
        aria-labelledby="product-modal-title"
        tabIndex={-1}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[560px] bg-sand-50 flex flex-col overflow-hidden rounded-tl-[--pop-radius-drawer] rounded-bl-[--pop-radius-drawer]"
        style={{ boxShadow: 'var(--pop-shadow-drawer-r)' }}
      >
        {/* Header */}
        <header className="flex items-start justify-between px-[22px] py-[18px] shrink-0">
          <div>
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-1">
              {editingProduct ? t('eyebrowEdit', { slug: form.slug || '—' }) : t('eyebrowNew')}
            </span>
            <h3 id="product-modal-title" className="font-serif text-[22px] text-ink-900 m-0 mt-1">
              {editingProduct ? form.name || t('titleEdit') : t('titleNew')}
            </h3>
          </div>
          <PopClose onClick={onClose} />
        </header>

        {/* Body */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-[22px] py-[18px]">
            {/* Informations de base */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] pb-[6px] mb-[14px]">
              <div className="font-serif text-[17px] text-ink-900 mb-3">{t('sectionInfo')}</div>

              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label htmlFor="product-name" className={labelCls}>
                  {t('nameLabel')} <span className="text-brick-600 ml-1">{tc('required')}</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    onFormChange({
                      ...form,
                      name: e.target.value,
                      slug: editingProduct ? form.slug : generateSlug(e.target.value),
                    })
                  }
                  className={`${inputCls} font-serif !text-[18px]`}
                  placeholder={t('namePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-[14px]">
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="product-slug" className={labelCls}>{t('slugLabel')}</label>
                  <input
                    id="product-slug"
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
                    className={`${inputCls} font-mono !text-[12.5px]`}
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="product-image" className={labelCls}>{t('imageLabel')}</label>
                  <input
                    id="product-image"
                    type="file"
                    accept="image/png"
                    onChange={handleImageChange}
                    className="w-full text-[12px] text-ink-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-medium file:bg-clay-50 file:text-clay-800 hover:file:bg-clay-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label htmlFor="product-description" className={labelCls}>{t('descriptionLabel')}</label>
                <textarea
                  id="product-description"
                  value={form.description}
                  onChange={(e) => onFormChange({ ...form, description: e.target.value })}
                  rows={3}
                  className={`${inputCls} min-h-[80px] resize-y`}
                />
              </div>
            </div>

            {/* Prix (le stock se gère sur l'écran Stock — voir la note) */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] pb-[6px] mb-[14px]">
              <div className="font-serif text-[17px] text-ink-900 mb-3">{t('sectionInventory')}</div>
              <div className="grid grid-cols-2 gap-3 mb-[14px]">
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="product-price" className={labelCls}>
                    {t('priceLabel')} <span className="text-brick-600 ml-1">{tc('required')}</span>
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => onFormChange({ ...form, price: parseFloat(e.target.value) })}
                    className={inputCls}
                  />
                </div>
              </div>
              <p className="text-[11.5px] leading-[1.5] text-ink-500 mb-[14px]">{t('stockManagedNote')}</p>
            </div>

            {/* Marque et gamme */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] pb-[6px] mb-[14px]">
              <div className="font-serif text-[17px] text-ink-900 mb-3">{t('sectionBrandRange')}</div>
              <div className="grid grid-cols-2 gap-3 mb-[14px]">
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="product-brand" className={labelCls}>{t('brandLabel')}</label>
                  <select
                    id="product-brand"
                    value={form.brand_id}
                    onChange={(e) => onFormChange({ ...form, brand_id: e.target.value, range_id: '' })}
                    className={`${inputCls} appearance-none`}
                  >
                    <option value="">{t('brandPlaceholder')}</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="product-range" className={labelCls}>{t('rangeLabel')}</label>
                  <select
                    id="product-range"
                    value={form.range_id}
                    onChange={(e) => onFormChange({ ...form, range_id: e.target.value })}
                    disabled={!form.brand_id}
                    className={`${inputCls} appearance-none disabled:bg-sand-100 disabled:text-ink-500`}
                  >
                    <option value="">{t('rangePlaceholder')}</option>
                    {selectedBrandRanges.map((range) => (
                      <option key={range.id} value={range.id}>{range.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tags */}
            <TagSelector
              tagTypes={tagTypes}
              tags={tags}
              selectedIds={form.selectedTags}
              onToggle={toggleTag}
            />
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
                  className="px-[18px] py-[11px] text-[13.5px] font-medium text-sand-50 bg-ink-900 border-0 rounded-[10px] hover:bg-ink-800 transition-colors"
                >
                  {editingProduct ? tc('save') : t('submitCreate')}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  )
}
