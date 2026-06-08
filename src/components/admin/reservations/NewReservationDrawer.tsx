'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Minus, Plus, Search, Trash2 } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'
import { PopClose } from '@/components/ui/PopClose'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { CustomerStep, type CustomerSelection } from '@/components/admin/customers/CustomerStep'
import { fmtDOP } from './types'

export type NewReservationItem = {
  product_id: string | null
  product_name: string
  unit_price: number
  quantity: number
}

export type NewReservationPayload = {
  contact_name: string
  contact_phone: string
  contact_email: string
  admin_notes: string
  sold: boolean
  items: NewReservationItem[]
  /** Identité client (mode `sale`) — le parent la résout en user_id / création. */
  customer?: CustomerSelection
}

type SearchHit = {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  currency: string
}

type NewReservationDrawerProps = {
  open: boolean
  onClose: () => void
  onCreate: (payload: NewReservationPayload) => Promise<void>
  /**
   * `reservation` (défaut) : crée une réservation en attente (page /reservations).
   * `sale` : crée une vente comptoir déjà retirée + décrément stock (page /ventas).
   * Le flag `sold` est dérivé du mode — plus de case à cocher.
   */
  mode?: 'reservation' | 'sale'
}

const inputCls =
  'w-full px-3 py-[10px] border border-sand-300 rounded-lg text-[13.5px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]'

export function NewReservationDrawer({
  open,
  onClose,
  onCreate,
  mode = 'reservation',
}: NewReservationDrawerProps) {
  const t = useTranslations('Admin.reservations.create')
  const tc = useTranslations('Admin.common')
  const dialogRef = useModalA11y(open, onClose)
  const isSale = mode === 'sale'

  const [note, setNote] = useState('')
  const [items, setItems] = useState<NewReservationItem[]>([])
  // Identité client (les deux modes) — défaut posé à l'ouverture selon le mode.
  const [customer, setCustomer] = useState<CustomerSelection>({ mode: 'anonymous' })

  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Reset complet à chaque ouverture. Vente → anonyme par défaut ;
  // réservation → invité (téléphone requis, pas d'anonyme).
  useEffect(() => {
    if (!open) return
    setNote('')
    setItems([])
    setCustomer(isSale ? { mode: 'anonymous' } : { mode: 'guest', name: '', phone: '' })
    setQuery('')
    setHits([])
    setSearching(false)
    setSubmitting(false)
  }, [open, isSale])

  // Recherche produits debounced (réutilise /api/search)
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setSearching(false)
      return
    }
    setSearching(true)
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, {
          signal: ctrl.signal,
        })
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
  }, [query])

  const addHit = useCallback((hit: SearchHit) => {
    setItems((prev) => {
      const existing = prev.findIndex((it) => it.product_id === hit.id)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], quantity: next[existing].quantity + 1 }
        return next
      }
      return [
        ...prev,
        {
          product_id: hit.id,
          product_name: hit.name,
          unit_price: Number(hit.price) || 0,
          quantity: 1,
        },
      ]
    })
    setQuery('')
    setHits([])
  }, [])

  const addCustomLine = useCallback(() => {
    setItems((prev) => [...prev, { product_id: null, product_name: '', unit_price: 0, quantity: 1 }])
  }, [])

  const updateItem = useCallback((index: number, patch: Partial<NewReservationItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const totalPrice = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.unit_price) || 0) * it.quantity, 0),
    [items],
  )
  const totalItems = useMemo(() => items.reduce((sum, it) => sum + it.quantity, 0), [items])

  // Produits requis ; l'identité client doit être valide selon la voie choisie.
  // L'anonyme n'est permis qu'en vente ; la réservation exige au moins un tél.
  const itemsOk =
    items.length > 0 &&
    items.every((it) => it.product_name.trim().length > 0 && it.quantity >= 1 && it.unit_price >= 0)
  const customerOk =
    customer.mode === 'anonymous'
      ? isSale
      : customer.mode === 'account'
        ? !!customer.userId
        : customer.mode === 'create'
          ? customer.firstName.trim().length > 0 && customer.phone.trim().length >= 5
          : customer.mode === 'guest'
            ? customer.phone.trim().length >= 5
            : false
  const canSubmit = itemsOk && customerOk && !submitting

  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!canSubmit) return
      setSubmitting(true)
      try {
        // Coordonnées « snapshot » dérivées de l'identité choisie ; le parent
        // (page) résout customer → user_id / création de compte.
        let contactName = ''
        let contactPhone = ''
        if (customer.mode === 'account') {
          contactName = customer.name
          contactPhone = customer.phone
        } else if (customer.mode === 'create') {
          contactName = `${customer.firstName} ${customer.lastName}`.trim()
          contactPhone = customer.phone.trim()
        } else if (customer.mode === 'guest') {
          contactName = customer.name.trim()
          contactPhone = customer.phone.trim()
        }
        await onCreate({
          contact_name: contactName,
          contact_phone: contactPhone,
          contact_email: '',
          admin_notes: note.trim(),
          sold: isSale,
          items: items.map((it) => ({
            product_id: it.product_id,
            product_name: it.product_name.trim(),
            unit_price: Number(it.unit_price) || 0,
            quantity: it.quantity,
          })),
          customer,
        })
      } catch {
        // Le parent a déjà affiché un toast d'erreur ; on garde le drawer ouvert
        // pour permettre une nouvelle tentative.
      } finally {
        setSubmitting(false)
      }
    },
    [canSubmit, onCreate, note, isSale, items, customer],
  )

  if (!open) return null

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
        aria-labelledby="new-reservation-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[560px] bg-sand-50 flex flex-col overflow-hidden rounded-tl-[--pop-radius-drawer] rounded-bl-[--pop-radius-drawer]"
        style={{ boxShadow: 'var(--pop-shadow-drawer-r)' }}
      >
        {/* Header */}
        <header className="flex items-start justify-between px-[22px] py-[18px] shrink-0">
          <div>
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-1">
              {isSale ? t('eyebrowSale') : t('eyebrow')}
            </span>
            <h3 id="new-reservation-title" className="font-serif text-[22px] text-ink-900 m-0 mt-1">
              {isSale ? t('titleSale') : t('title')}
            </h3>
          </div>
          <PopClose onClick={onClose} />
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-[22px] py-[18px] flex flex-col gap-[14px]">
            {/* Client : sélecteur d'identité — compte / création express /
                anonyme (vente) ou invité tél-requis (réservation). */}
            <CustomerStep
              context={isSale ? 'sale' : 'reservation'}
              value={customer}
              onChange={setCustomer}
            />

            {/* Produits */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px]">
              <div className="font-serif text-[17px] text-ink-900 mb-3">{t('sectionProducts')}</div>

              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (hits[0]) addHit(hits[0])
                    }
                  }}
                  className={`${inputCls} pl-9`}
                  placeholder={t('searchPlaceholder')}
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clay-700 animate-spin" />
                )}

                {/* Dropdown résultats */}
                {query.trim().length >= 2 && (hits.length > 0 || !searching) && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 bg-sand-50 border border-sand-300 rounded-lg overflow-hidden max-h-[260px] overflow-y-auto shadow-[0_8px_24px_rgba(0,0,0,.10)]">
                    {hits.length === 0 ? (
                      <div className="px-3 py-3 text-[12.5px] text-ink-500">{t('noResults')}</div>
                    ) : (
                      hits.map((hit) => (
                        <button
                          key={hit.id}
                          type="button"
                          onClick={() => addHit(hit)}
                          className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-sand-100 transition-colors border-b border-sand-200 last:border-b-0"
                        >
                          <span className="min-w-0">
                            <span className="block text-[13px] text-ink-900 truncate">{hit.name}</span>
                            {hit.brand && (
                              <span className="block text-[11px] text-ink-500 font-mono uppercase tracking-[0.08em] truncate">
                                {hit.brand}
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-[12px] text-ink-700 shrink-0">
                            {fmtDOP(Number(hit.price) || 0)} {DEFAULT_CURRENCY}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Liste des lignes */}
              <div className="mt-3 flex flex-col">
                {items.length === 0 ? (
                  <p className="text-[12.5px] text-ink-500 py-3 m-0">{t('emptyItems')}</p>
                ) : (
                  items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 py-3 border-b border-sand-200 last:border-b-0"
                    >
                      {/* Nom : éditable si ligne libre, sinon texte */}
                      <div className="min-w-0 self-center">
                        {it.product_id === null ? (
                          <input
                            type="text"
                            value={it.product_name}
                            onChange={(e) => updateItem(idx, { product_name: e.target.value })}
                            className={`${inputCls} !py-[7px] !text-[12.5px]`}
                            placeholder={t('customNamePlaceholder')}
                          />
                        ) : (
                          <span className="block text-[13px] text-ink-900 truncate">{it.product_name}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        aria-label={t('removeLine')}
                        className="self-center w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-500 hover:text-brick-600 hover:bg-sand-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Contrôles : prix + quantité + sous-total */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="inline-flex items-center gap-1.5">
                          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">
                            {t('priceLabel')}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.unit_price}
                            onChange={(e) => updateItem(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                            className="w-[88px] px-2 py-[6px] border border-sand-300 rounded-md text-[12.5px] font-mono text-ink-900 bg-sand-50 focus-visible:outline-none focus-visible:border-clay-700"
                          />
                        </label>

                        <div className="inline-flex items-center border border-sand-300 rounded-md overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateItem(idx, { quantity: Math.max(1, it.quantity - 1) })}
                            aria-label="−"
                            className="w-7 h-8 inline-flex items-center justify-center text-ink-700 hover:bg-sand-200 transition-colors disabled:opacity-40"
                            disabled={it.quantity <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) =>
                              updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                            }
                            className="w-[44px] h-8 text-center text-[12.5px] font-mono text-ink-900 bg-sand-50 border-x border-sand-300 focus-visible:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(idx, { quantity: it.quantity + 1 })}
                            aria-label="+"
                            className="w-7 h-8 inline-flex items-center justify-center text-ink-700 hover:bg-sand-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-mono text-[12.5px] text-ink-900 ml-auto">
                          {fmtDOP((Number(it.unit_price) || 0) * it.quantity)} {DEFAULT_CURRENCY}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={addCustomLine}
                className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-clay-700 hover:text-clay-800 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('addCustomLine')}
              </button>
            </div>

            {/* Note interne */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] pb-[14px]">
              <div className="font-serif text-[17px] text-ink-900 mb-3">{t('sectionNote')}</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className={`${inputCls} min-h-[64px] resize-y`}
                placeholder={t('notePlaceholder')}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="px-[22px] py-[14px] pb-[18px] border-t border-sand-200 shrink-0 relative">
            <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-sand-50 pointer-events-none" />
            <p className="text-[11.5px] text-ink-500 leading-snug mb-3">
              {isSale ? t('saleHint') : t('reservationHint')}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-ink-700 inline-flex items-baseline gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">
                  {t('total')}
                </span>
                <span className="font-mono text-[15px] text-ink-900 font-semibold">
                  {fmtDOP(totalPrice)} {DEFAULT_CURRENCY}
                </span>
                {totalItems > 0 && (
                  <span className="text-[11px] text-ink-500">· {totalItems}</span>
                )}
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
                  disabled={!canSubmit}
                  className="px-[18px] py-[11px] text-[13.5px] font-medium text-sand-50 bg-ink-900 border-0 rounded-[10px] hover:bg-ink-800 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? t('creating') : isSale ? t('submitSold') : t('submit')}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  )
}
