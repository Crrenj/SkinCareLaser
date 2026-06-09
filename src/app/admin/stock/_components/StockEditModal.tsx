'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useModalA11y } from '@/hooks/useModalA11y'
import type { StockItem } from '../_lib/types'

interface Props {
  item: StockItem
  open: boolean
  onClose: () => void
  onSave: (productId: string, stock: number) => Promise<boolean>
}

export function StockEditModal({ item, open, onClose, onSave }: Props) {
  const t = useTranslations('Admin.stock')
  const tCommon = useTranslations('Admin.common')
  const dialogRef = useModalA11y(open, onClose)
  const [stock, setStock] = useState(item.current_stock)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await onSave(item.product_id, stock)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-start justify-center px-4 py-12">
      <div
        className="absolute inset-0 z-[-1] bg-ink-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-modal-title"
        tabIndex={-1}
        className="w-full max-w-md bg-sand-50 border border-sand-300 rounded-xl shadow-[0_24px_60px_-12px_rgba(31,27,22,0.35)] overflow-hidden"
      >
        <header className="px-6 py-5 border-b border-sand-300">
          <h3 id="stock-modal-title" className="font-serif text-[22px] text-ink-900 leading-tight m-0">
            {t('adjustTitle')}
          </h3>
          <p className="text-[12.5px] text-ink-500 mt-1">{item.product_name}</p>
        </header>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          <div>
            <label htmlFor="stock-modal-current" className="block text-[11px] tracking-[0.14em] uppercase text-ink-500 font-semibold mb-2">
              {t('modalCurrentLabel')}
            </label>
            <input
              id="stock-modal-current"
              type="number"
              required
              min={0}
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-md font-mono text-[14px] text-ink-900 focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-2 focus-visible:ring-clay-700/20"
            />
            <p className="text-[11.5px] text-ink-500 mt-2">{t('adjustHelp')}</p>
          </div>
          <div className="bg-sand-100 border border-sand-300 rounded-md p-3.5 text-[12.5px] text-ink-700 flex flex-col gap-1">
            <span><b className="text-ink-900 font-medium">{t('modalPriceLabel')}</b> {item.price} {item.currency.toUpperCase()}</span>
            <span><b className="text-ink-900 font-medium">{t('modalBrandLabel')}</b> {item.brand_name || t('modalBrandFallback')}</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-ink-700 bg-transparent border border-sand-300 rounded-md hover:bg-sand-100 transition-colors">
              {tCommon('cancel')}
            </button>
            <button type="submit" className="px-4 py-2 text-[13px] font-medium text-on-accent bg-clay-700 rounded-md hover:bg-accent-hover transition-colors">
              {tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
