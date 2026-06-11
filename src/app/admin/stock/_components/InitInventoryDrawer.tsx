'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Minus, Plus, PackagePlus, Wrench } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'
import { PopClose } from '@/components/ui/PopClose'
import { DEFAULT_CURRENCY, PLACEHOLDER_PRICE } from '@/lib/constants'
import { formatPrice } from '@/lib/formatPrice'
import type { InitInventoryPayload } from '../_lib/types'

type InitProduct = {
  id: string
  name: string
  current_stock: number
  price: number | null
}

type Props = {
  open: boolean
  onClose: () => void
  /** Le parent (useStockData) orchestre stock-puis-produit + toasts. */
  onSubmit: (payload: InitInventoryPayload) => Promise<void>
  product: InitProduct | null
}

const inputCls =
  'w-full px-3 py-[10px] border border-sand-300 rounded-lg text-[13.5px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]'
const labelCls = 'font-mono text-[10.5px] tracking-[0.12em] uppercase text-ink-700 font-semibold'
const optionalCls = 'font-sans text-[10px] tracking-normal normal-case text-ink-500 font-normal ml-1.5'

export function InitInventoryDrawer({ open, onClose, onSubmit, product }: Props) {
  const t = useTranslations('Admin.stock.init')
  const tc = useTranslations('Admin.common')
  const dialogRef = useModalA11y(open, onClose)

  const [quantity, setQuantity] = useState(0)
  const [unitCost, setUnitCost] = useState('')
  const [price, setPrice] = useState('')
  const [activate, setActivate] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const tokenRef = useRef<string>('')

  // Reset + nouveau client_token (idempotence) à chaque ouverture.
  useEffect(() => {
    if (!open || !product) return
    tokenRef.current = crypto.randomUUID()
    setQuantity(0)
    setUnitCost('')
    // Pré-remplit le prix de vente avec le prix actuel, sauf s'il s'agit du
    // placeholder (100 DOP) — qu'on ne veut pas reconduire.
    setPrice(
      product.price != null && product.price !== PLACEHOLDER_PRICE
        ? String(product.price)
        : '',
    )
    setActivate(true)
    setSubmitting(false)
  }, [open, product])

  const costNum = parseFloat(unitCost)
  const priceNum = parseFloat(price)
  const hasCost = unitCost.trim() !== '' && Number.isFinite(costNum) && costNum > 0
  const hasPrice = price.trim() !== '' && Number.isFinite(priceNum) && priceNum >= 0

  // Réception → ADDITIONNE au stock actuel ; Ajuste → ÉCRASE (valeur absolue).
  const resultingStock = useMemo(
    () => (hasCost ? (product?.current_stock ?? 0) + quantity : quantity),
    [hasCost, product, quantity],
  )

  const canSubmit = quantity >= 0 && !submitting && !!product && (
    // Au moins une action utile : compter du stock, fixer un prix, ou activer.
    quantity > 0 || hasPrice || activate
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!canSubmit || !product) return
      setSubmitting(true)
      try {
        await onSubmit({
          client_token: tokenRef.current,
          product_id: product.id,
          quantity,
          unit_cost: hasCost ? costNum : null,
          price: hasPrice ? priceNum : null,
          activate,
        })
      } catch {
        // Le parent a affiché un toast d'erreur ; on garde le drawer ouvert.
      } finally {
        setSubmitting(false)
      }
    },
    [canSubmit, product, onSubmit, quantity, hasCost, costNum, hasPrice, priceNum, activate],
  )

  if (!open || !product) return null

  const isPlaceholderPrice = product.price === PLACEHOLDER_PRICE
  const modeHint = hasCost
    ? t('modeReception', { result: resultingStock })
    : t('modeAdjust', { result: resultingStock })

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
        aria-labelledby="stock-init-title"
        tabIndex={-1}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-sand-50 flex flex-col overflow-hidden rounded-tl-[--pop-radius-drawer] rounded-bl-[--pop-radius-drawer] text-ink-900"
        style={{ boxShadow: 'var(--pop-shadow-drawer-r)' }}
      >
        <header className="flex items-start justify-between px-[22px] py-[18px] shrink-0">
          <div>
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-1">
              {t('eyebrow')}
            </span>
            <h3 id="stock-init-title" className="font-serif text-[22px] text-ink-900 m-0 mt-1">
              {t('title')}
            </h3>
          </div>
          <PopClose onClick={onClose} />
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-[22px] py-[18px] flex flex-col gap-[14px]">
            {/* Identité produit + état actuel */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] flex flex-col gap-[12px]">
              <div>
                <span className={labelCls}>{t('productLabel')}</span>
                <p className="text-[14px] text-ink-900 mt-1 mb-0">{product.name}</p>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className={labelCls}>{t('currentStockLabel')}</span>
                  <p className="font-mono text-[14px] text-ink-900 mt-1 mb-0">{product.current_stock}</p>
                </div>
                <div>
                  <span className={labelCls}>{t('currentPriceLabel')}</span>
                  <p className="font-mono text-[14px] text-ink-900 mt-1 mb-0 inline-flex items-center gap-2">
                    {product.price != null
                      ? `${formatPrice(product.price, { fractionDigits: 2 })} ${DEFAULT_CURRENCY}`
                      : '—'}
                    {isPlaceholderPrice && (
                      <span className="font-sans text-[9.5px] tracking-[0.1em] uppercase font-semibold px-1.5 py-0.5 rounded bg-[rgba(181,133,43,0.15)] text-[#7A5A1C]">
                        {t('placeholderBadge')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Champs d'initialisation */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] flex flex-col gap-[16px]">
              {/* Quantité comptée */}
              <div className="flex flex-col gap-[6px]">
                <span className={labelCls}>{t('qtyLabel')}</span>
                <div className="inline-flex items-center border border-sand-300 rounded-md overflow-hidden w-fit">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                    aria-label={tc('decrease')}
                    disabled={quantity <= 0}
                    className="w-9 h-9 inline-flex items-center justify-center text-ink-700 hover:bg-sand-200 transition-colors disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-[64px] h-9 text-center text-[13px] font-mono text-ink-900 bg-sand-50 border-x border-sand-300 focus-visible:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label={tc('increase')}
                    className="w-9 h-9 inline-flex items-center justify-center text-ink-700 hover:bg-sand-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-ink-500 leading-snug">{t('qtyHelp')}</p>
              </div>

              {/* Coût d'achat unitaire (optionnel → aiguille réception/ajuste) */}
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="init-cost" className={labelCls}>
                  {t('costLabel')}
                  <span className={optionalCls}>{t('costOptional')}</span>
                </label>
                <div className="relative w-fit">
                  <input
                    id="init-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder={t('costPlaceholder')}
                    className={`${inputCls} w-[160px] pr-12 font-mono`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-500 pointer-events-none">
                    {DEFAULT_CURRENCY}
                  </span>
                </div>
                <p className="text-[11px] text-ink-500 leading-snug">{t('costHelp')}</p>
              </div>

              {/* Prix de vente (optionnel) */}
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="init-price" className={labelCls}>
                  {t('priceLabel')}
                  <span className={optionalCls}>{t('priceOptional')}</span>
                </label>
                <div className="relative w-fit">
                  <input
                    id="init-price"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={t('pricePlaceholder')}
                    className={`${inputCls} w-[160px] pr-12 font-mono`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-500 pointer-events-none">
                    {DEFAULT_CURRENCY}
                  </span>
                </div>
                <p className="text-[11px] text-ink-500 leading-snug">{t('priceHelp')}</p>
              </div>

              {/* Activer le produit */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activate}
                  onChange={(e) => setActivate(e.target.checked)}
                  className="mt-0.5 accent-clay-700 w-4 h-4"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] text-ink-900 font-medium">{t('activateLabel')}</span>
                  <span className="text-[11px] text-ink-500 leading-snug">{t('activateHelp')}</span>
                </span>
              </label>
            </div>

            {/* Aiguillage visible : réception (additionne) vs ajuste (écrase) */}
            <div className="bg-sand-100 border border-sand-200 rounded-xl px-[18px] py-[14px] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {hasCost ? (
                  <PackagePlus className="w-4 h-4 text-clay-700 shrink-0" aria-hidden />
                ) : (
                  <Wrench className="w-4 h-4 text-ink-700 shrink-0" aria-hidden />
                )}
                <p className="text-[12px] text-ink-700 leading-snug m-0">{modeHint}</p>
              </div>
              <div className="flex items-baseline justify-between pt-1 border-t border-sand-200">
                <span className={labelCls}>{t('resultingStockLabel')}</span>
                <span className="font-mono text-[15px] text-ink-900 font-semibold">{resultingStock}</span>
              </div>
            </div>
          </div>

          <footer className="px-[22px] py-[14px] pb-[18px] border-t border-sand-200 shrink-0">
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
                {submitting ? t('saving') : t('submit')}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  )
}
