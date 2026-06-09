'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Search, X } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'
import { PopClose } from '@/components/ui/PopClose'
import type { Promotion, PromotionFormState, PromotionTarget, PromotionTargetType } from '../_lib/types'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: {
    name: string
    discount_type: 'percent' | 'fixed'
    discount_value: number
    start_date: string
    end_date: string
    is_active: boolean
    targets: { target_type: PromotionTargetType; target_id: string }[]
  }) => Promise<void>
  editing: Promotion | null
}

type Opt = { id: string; name: string }
type SearchHit = { id: string; name: string; brand: string }

const inputCls =
  'w-full px-3 py-[10px] border border-sand-300 rounded-lg text-[13.5px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]'
const labelCls = 'font-mono text-[10.5px] tracking-[0.12em] uppercase text-ink-700 font-semibold'

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildInitialForm(editing: Promotion | null): PromotionFormState {
  if (!editing) {
    return {
      name: '', discount_type: 'percent', discount_value: '',
      start_date: '', end_date: '', is_active: true, targets: [],
    }
  }
  return {
    name: editing.name,
    discount_type: editing.discount_type,
    discount_value: String(editing.discount_value),
    start_date: toLocalInput(editing.start_date),
    end_date: toLocalInput(editing.end_date),
    is_active: editing.is_active,
    targets: editing.targets.map((t) => ({ ...t })),
  }
}

export function PromotionFormModal({ open, onClose, onSubmit, editing }: Props) {
  const t = useTranslations('Admin.promotions')
  const tc = useTranslations('Admin.common')
  const dialogRef = useModalA11y(open, onClose)

  const [form, setForm] = useState<PromotionFormState>(buildInitialForm(null))
  const [submitting, setSubmitting] = useState(false)

  // Options marques / gammes / tags (chargées une fois à l'ouverture).
  const [brandOpts, setBrandOpts] = useState<Opt[]>([])
  const [rangeOpts, setRangeOpts] = useState<Opt[]>([])
  const [tagOpts, setTagOpts] = useState<Opt[]>([])

  // Picker
  const [pickerType, setPickerType] = useState<PromotionTargetType>('product')
  const [pickerSelect, setPickerSelect] = useState('')
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(buildInitialForm(editing))
    setSubmitting(false)
    setPickerType('product')
    setPickerSelect('')
    setQuery('')
    setHits([])
    // Charge les options marques/gammes/tags.
    ;(async () => {
      try {
        const [brandsRes, tagsRes] = await Promise.all([
          fetch('/api/admin/brands'),
          fetch('/api/admin/tags'),
        ])
        const brands = (await brandsRes.json()) as {
          id: string; name: string; ranges?: { id: string; name: string }[]
        }[]
        const tags = (await tagsRes.json()) as { id: string; name: string }[]
        setBrandOpts((brands ?? []).map((b) => ({ id: b.id, name: b.name })))
        setRangeOpts(
          (brands ?? []).flatMap((b) =>
            (b.ranges ?? []).map((r) => ({ id: r.id, name: `${b.name} · ${r.name}` })),
          ),
        )
        setTagOpts((tags ?? []).map((tg) => ({ id: tg.id, name: tg.name })))
      } catch {
        /* options vides → l'admin peut quand même cibler des produits */
      }
    })()
  }, [open, editing])

  // Recherche produits (debounced) pour les cibles « produit ».
  useEffect(() => {
    if (pickerType !== 'product') return
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      return
    }
    setSearching(true)
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, { signal: ctrl.signal })
        const json = await res.json()
        setHits(Array.isArray(json.hits) ? json.hits : [])
      } catch {
        if (!ctrl.signal.aborted) setHits([])
      } finally {
        if (!ctrl.signal.aborted) setSearching(false)
      }
    }, 220)
    return () => {
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [query, pickerType])

  const addTarget = useCallback((target: PromotionTarget) => {
    setForm((prev) =>
      prev.targets.some((x) => x.target_type === target.target_type && x.target_id === target.target_id)
        ? prev
        : { ...prev, targets: [...prev.targets, target] },
    )
  }, [])

  const removeTarget = useCallback((target: PromotionTarget) => {
    setForm((prev) => ({
      ...prev,
      targets: prev.targets.filter(
        (x) => !(x.target_type === target.target_type && x.target_id === target.target_id),
      ),
    }))
  }, [])

  const currentOpts = pickerType === 'brand' ? brandOpts : pickerType === 'range' ? rangeOpts : tagOpts

  const canSubmit =
    form.name.trim().length > 0 &&
    form.discount_value !== '' &&
    Number(form.discount_value) >= 0 &&
    !!form.start_date &&
    !!form.end_date &&
    form.targets.length > 0 &&
    !submitting

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!canSubmit) return
      setSubmitting(true)
      try {
        await onSubmit({
          name: form.name.trim(),
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          start_date: new Date(form.start_date).toISOString(),
          end_date: new Date(form.end_date).toISOString(),
          is_active: form.is_active,
          targets: form.targets.map((x) => ({ target_type: x.target_type, target_id: x.target_id })),
        })
      } catch {
        /* le parent affiche un toast ; on garde le drawer ouvert */
      } finally {
        setSubmitting(false)
      }
    },
    [canSubmit, form, onSubmit],
  )

  const targetTypeLabel = useMemo(
    () => ({
      product: t('targetProduct'),
      brand: t('targetBrand'),
      range: t('targetRange'),
      tag: t('targetTag'),
    }),
    [t],
  )

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
        aria-labelledby="promo-form-title"
        tabIndex={-1}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[560px] bg-sand-50 flex flex-col overflow-hidden rounded-tl-[--pop-radius-drawer] rounded-bl-[--pop-radius-drawer] text-ink-900"
        style={{ boxShadow: 'var(--pop-shadow-drawer-r)' }}
      >
        <header className="flex items-start justify-between px-[22px] py-[18px] shrink-0">
          <div>
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-1">
              {t('eyebrow')}
            </span>
            <h3 id="promo-form-title" className="font-serif text-[22px] text-ink-900 m-0 mt-1">
              {editing ? t('editTitle') : t('createTitle')}
            </h3>
          </div>
          <PopClose onClick={onClose} />
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-[22px] py-[18px] flex flex-col gap-[14px]">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="promo-name" className={labelCls}>{t('nameLabel')}</label>
              <input
                id="promo-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls}
                placeholder={t('namePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-[6px]">
                <span className={labelCls}>{t('discountTypeLabel')}</span>
                <div className="flex gap-1.5">
                  {(['percent', 'fixed'] as const).map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, discount_type: dt }))}
                      className={`flex-1 px-3 py-2 rounded-md text-[12.5px] border transition-colors ${
                        form.discount_type === dt
                          ? 'bg-ink-900 text-sand-50 border-ink-900'
                          : 'bg-sand-50 text-ink-700 border-sand-300 hover:border-sand-500'
                      }`}
                    >
                      {dt === 'percent' ? t('discountPercent') : t('discountFixed')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="promo-value" className={labelCls}>{t('valueLabel')}</label>
                <div className="relative">
                  <input
                    id="promo-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                    className={`${inputCls} pr-12`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-500">
                    {form.discount_type === 'percent' ? '%' : 'DOP'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="promo-start" className={labelCls}>{t('startLabel')}</label>
                <input
                  id="promo-start"
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="promo-end" className={labelCls}>{t('endLabel')}</label>
                <input
                  id="promo-end"
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-[13px] text-ink-900">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="accent-clay-700"
              />
              {t('activeLabel')}
            </label>

            {/* Cibles */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] flex flex-col gap-3">
              <div className="font-serif text-[17px] text-ink-900">{t('targetsLabel')}</div>

              <div className="flex gap-2">
                <select
                  value={pickerType}
                  onChange={(e) => {
                    setPickerType(e.target.value as PromotionTargetType)
                    setPickerSelect('')
                    setQuery('')
                    setHits([])
                  }}
                  className={`${inputCls} w-[140px]`}
                  aria-label={t('targetTypeLabel')}
                >
                  <option value="product">{targetTypeLabel.product}</option>
                  <option value="brand">{targetTypeLabel.brand}</option>
                  <option value="range">{targetTypeLabel.range}</option>
                  <option value="tag">{targetTypeLabel.tag}</option>
                </select>

                {pickerType === 'product' ? (
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className={`${inputCls} pl-9`}
                      placeholder={t('targetSearchPlaceholder')}
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clay-700 animate-spin" />
                    )}
                    {query.trim().length >= 2 && hits.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 bg-sand-50 border border-sand-300 rounded-lg overflow-hidden max-h-[220px] overflow-y-auto shadow-[0_8px_24px_rgba(0,0,0,.10)]">
                        {hits.map((hit) => (
                          <button
                            key={hit.id}
                            type="button"
                            onClick={() => {
                              addTarget({ target_type: 'product', target_id: hit.id, label: hit.name })
                              setQuery('')
                              setHits([])
                            }}
                            className="w-full text-left px-3 py-2 text-[13px] text-ink-900 hover:bg-sand-100 border-b border-sand-200 last:border-b-0 truncate"
                          >
                            {hit.name}
                            {hit.brand && <span className="text-ink-500 text-[11px] ml-2">{hit.brand}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <select
                      value={pickerSelect}
                      onChange={(e) => setPickerSelect(e.target.value)}
                      className={`${inputCls} flex-1`}
                    >
                      <option value="">{t('targetSelectPlaceholder')}</option>
                      {currentOpts.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!pickerSelect}
                      onClick={() => {
                        const opt = currentOpts.find((o) => o.id === pickerSelect)
                        if (opt) addTarget({ target_type: pickerType, target_id: opt.id, label: opt.name })
                        setPickerSelect('')
                      }}
                      className="px-3 py-2 rounded-md text-[12.5px] bg-clay-700 text-on-accent hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t('targetAdd')}
                    </button>
                  </div>
                )}
              </div>

              {form.targets.length === 0 ? (
                <p className="text-[12.5px] text-ink-500 m-0">{t('targetsEmpty')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {form.targets.map((tg) => (
                    <span
                      key={`${tg.target_type}:${tg.target_id}`}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-sand-200 text-ink-900 text-[12px]"
                    >
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                        {targetTypeLabel[tg.target_type]}
                      </span>
                      {tg.label ?? tg.target_id.slice(0, 8)}
                      <button
                        type="button"
                        onClick={() => removeTarget(tg)}
                        aria-label={t('targetRemove')}
                        className="w-4 h-4 inline-flex items-center justify-center rounded-full text-ink-500 hover:text-brick-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <footer className="px-[22px] py-[14px] pb-[18px] border-t border-sand-200 shrink-0">
            <p className="text-[11.5px] text-ink-500 leading-snug mb-3">{t('hint')}</p>
            <div className="flex justify-end gap-2 items-center">
              <button
                type="button"
                onClick={onClose}
                className="px-[18px] py-[11px] text-[13.5px] font-medium text-ink-700 bg-transparent border border-sand-300 rounded-[10px] hover:bg-sand-100 hover:text-ink-900 transition-colors"
              >
                {tc('cancel')}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-[18px] py-[11px] text-[13.5px] font-medium text-sand-50 bg-ink-900 border-0 rounded-[10px] hover:bg-ink-800 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {submitting ? tc('saving') : editing ? t('saveEdit') : t('saveCreate')}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  )
}
