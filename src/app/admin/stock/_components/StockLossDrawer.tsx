'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Minus, Plus } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'
import { PopClose } from '@/components/ui/PopClose'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { formatPrice } from '@/lib/formatPrice'
import { STOCK_LOSS_REASONS } from '@/lib/schemas'
import type { StockLossPayload } from '../_lib/types'

type LossProduct = { id: string; name: string; cost_price: number | null }

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: StockLossPayload) => Promise<void>
  product: LossProduct | null
}

const inputCls =
  'w-full px-3 py-[10px] border border-sand-300 rounded-lg text-[13.5px] text-ink-900 bg-sand-50 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-clay-700 focus-visible:shadow-[0_0_0_3px_rgba(142,82,50,.14)]'
const labelCls = 'font-mono text-[10.5px] tracking-[0.12em] uppercase text-ink-700 font-semibold'

export function StockLossDrawer({ open, onClose, onSubmit, product }: Props) {
  const t = useTranslations('Admin.stock.loss')
  const tc = useTranslations('Admin.common')
  const dialogRef = useModalA11y(open, onClose)

  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState<StockLossPayload['reason']>('vencido')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const tokenRef = useRef<string>('')

  // Reset + nouveau client_token (idempotence) à chaque ouverture.
  useEffect(() => {
    if (!open) return
    tokenRef.current = crypto.randomUUID()
    setQuantity(1)
    setReason('vencido')
    setNote('')
    setSubmitting(false)
  }, [open])

  const canSubmit = quantity >= 1 && !submitting

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
          reason,
          note: note.trim() || undefined,
        })
      } catch {
        // Le parent a affiché un toast d'erreur ; on garde le drawer ouvert.
      } finally {
        setSubmitting(false)
      }
    },
    [canSubmit, product, onSubmit, quantity, reason, note],
  )

  if (!open || !product) return null

  const costKnown = product.cost_price != null
  const costPreview = costKnown
    ? `${formatPrice(product.cost_price! * quantity, { fractionDigits: 2 })} ${DEFAULT_CURRENCY}`
    : t('costUnknown')

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
        aria-labelledby="stock-loss-title"
        tabIndex={-1}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-sand-50 flex flex-col overflow-hidden rounded-tl-[--pop-radius-drawer] rounded-bl-[--pop-radius-drawer] text-ink-900"
        style={{ boxShadow: 'var(--pop-shadow-drawer-r)' }}
      >
        <header className="flex items-start justify-between px-[22px] py-[18px] shrink-0">
          <div>
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-ink-500 font-medium mb-1">
              {t('eyebrow')}
            </span>
            <h3 id="stock-loss-title" className="font-serif text-[22px] text-ink-900 m-0 mt-1">
              {t('title')}
            </h3>
          </div>
          <PopClose onClick={onClose} />
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-[22px] py-[18px] flex flex-col gap-[14px]">
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-[18px] flex flex-col gap-[14px]">
              <div>
                <span className={labelCls}>{t('productLabel')}</span>
                <p className="text-[14px] text-ink-900 mt-1 mb-0">{product.name}</p>
              </div>

              <div className="flex flex-col gap-[6px]">
                <span className={labelCls}>{t('qtyLabel')}</span>
                <div className="inline-flex items-center border border-sand-300 rounded-md overflow-hidden w-fit">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label={t('decreaseQty')}
                    disabled={quantity <= 1}
                    className="w-9 h-9 inline-flex items-center justify-center text-ink-700 hover:bg-sand-200 transition-colors disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-[64px] h-9 text-center text-[13px] font-mono text-ink-900 bg-sand-50 border-x border-sand-300 focus-visible:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label={t('increaseQty')}
                    className="w-9 h-9 inline-flex items-center justify-center text-ink-700 hover:bg-sand-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-[6px]">
                <label htmlFor="loss-reason" className={labelCls}>{t('reasonLabel')}</label>
                <select
                  id="loss-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as StockLossPayload['reason'])}
                  className={inputCls}
                >
                  {STOCK_LOSS_REASONS.map((r) => (
                    <option key={r} value={r}>{t(`reason.${r}`)}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-[6px]">
                <label htmlFor="loss-note" className={labelCls}>{t('noteLabel')}</label>
                <textarea
                  id="loss-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className={`${inputCls} min-h-[60px] resize-y`}
                  placeholder={t('notePlaceholder')}
                />
              </div>
            </div>

            <div className="bg-sand-100 border border-sand-200 rounded-xl px-[18px] py-[14px] flex items-baseline justify-between">
              <span className={labelCls}>{t('costLabel')}</span>
              <span className={`font-mono ${costKnown ? 'text-[15px] text-ink-900 font-semibold' : 'text-[12px] text-ink-500'}`}>
                {costPreview}
              </span>
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
                {submitting ? t('saving') : t('submit')}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  )
}
