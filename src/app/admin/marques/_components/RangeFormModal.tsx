'use client'

import { useModalA11y } from '@/hooks/useModalA11y'
import { PopClose } from '@/components/ui/PopClose'
import { generateSlug } from '@/lib/slug'
import type { Brand, Range, RangeFormState } from '../_lib/types'

type RangeFormModalProps = {
  open: boolean
  editingRange: Range | null
  brands: Brand[]
  brandLocked: boolean
  form: RangeFormState
  onFormChange: (next: RangeFormState) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

const inputCls =
  'w-full px-3 py-[10px] border border-sand-300 rounded-lg text-[13.5px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]'
const labelCls =
  'font-mono text-[10.5px] tracking-[0.12em] uppercase text-ink-700 font-semibold'

export function RangeFormModal({
  open,
  editingRange,
  brands,
  brandLocked,
  form,
  onFormChange,
  onClose,
  onSubmit,
}: RangeFormModalProps) {
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
        aria-labelledby="range-modal-title"
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
              Marcas · gamas
            </span>
            <h3 id="range-modal-title" className="font-serif text-[22px] text-ink-900 m-0 mt-1">
              {editingRange ? 'Editar gama' : 'Nueva gama'}
            </h3>
          </div>
          <PopClose onClick={onClose} />
        </header>

        <form onSubmit={onSubmit}>
          <div className="px-[22px] py-[18px] flex flex-col gap-3">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="range-brand" className={labelCls}>Marca</label>
              <select
                id="range-brand"
                required
                value={form.brand_id}
                onChange={(e) => onFormChange({ ...form, brand_id: e.target.value })}
                disabled={brandLocked}
                className={`${inputCls} appearance-none disabled:bg-sand-100 disabled:text-ink-500`}
              >
                <option value="">Seleccionar marca</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="range-name" className={labelCls}>
                Nombre <span className="text-brick-600 ml-1">*</span>
              </label>
              <input
                id="range-name"
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    name: e.target.value,
                    slug: editingRange ? form.slug : generateSlug(e.target.value),
                  })
                }
                className={`${inputCls} font-serif !text-[15px]`}
                placeholder="Ej. Hydrance"
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="range-slug" className={labelCls}>Slug</label>
              <input
                id="range-slug"
                type="text"
                required
                value={form.slug}
                onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
                className={`${inputCls} font-mono !text-[12.5px]`}
              />
            </div>
          </div>

          <footer className="px-[22px] py-[14px] pb-[18px] border-t border-sand-200 relative">
            <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-sand-50 pointer-events-none" />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-[18px] py-[11px] text-[13.5px] font-medium text-ink-700 bg-transparent border border-sand-300 rounded-[10px] hover:bg-sand-100 hover:text-ink-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-[18px] py-[11px] text-[13.5px] font-medium text-sand-50 bg-clay-700 border-0 rounded-[10px] hover:bg-clay-800 transition-colors"
              >
                {editingRange ? 'Guardar' : 'Crear gama'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
