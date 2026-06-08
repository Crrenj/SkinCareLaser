'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/formatPrice'
import type { ExpenseRow } from './_data'
import { CATEGORIES, CAT_LABEL } from './expenseCategories'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

const inputCls =
  'px-3 py-2 text-[13px] text-ink-900 bg-sand-50 border border-sand-300 rounded-md focus-visible:outline-none focus-visible:border-clay-700 focus-visible:ring-2 focus-visible:ring-clay-700/20'

/** Gestion des dépenses du mois : ajout + liste + suppression. router.refresh()
 *  re-calcule le compte de résultat côté serveur après chaque mutation. */
export function ExpensesPanel({ expenses }: { expenses: ExpenseRow[] }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('alquiler')
  const [date, setDate] = useState(todayISO())
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!(amt > 0)) {
      toast.error('Monto inválido')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          category,
          expense_date: date,
          label: label.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('failed')
      setAmount('')
      setLabel('')
      toast.success('Gasto registrado')
      router.refresh()
    } catch {
      toast.error('No se pudo registrar el gasto')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      toast.success('Gasto eliminado')
      router.refresh()
    } catch {
      toast.error('No se pudo eliminar el gasto')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <form onSubmit={add} className="grid grid-cols-2 lg:grid-cols-[110px_1fr_150px_auto] gap-2 items-end">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Monto</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`${inputCls} font-mono`}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Categoría</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
            required
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-1.5 px-4 h-[38px] text-[13px] font-medium text-on-accent bg-clay-700 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Añadir
        </button>
        <label className="flex flex-col gap-1 col-span-2 lg:col-span-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Descripción (opcional)</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={200}
            placeholder="Ej. Alquiler de junio, factura CEPM…"
            className={inputCls}
          />
        </label>
      </form>

      {expenses.length === 0 ? (
        <p className="text-[12.5px] text-ink-500 py-2">Sin gastos registrados este mes.</p>
      ) : (
        <div className="flex flex-col divide-y divide-sand-200 border-t border-sand-200">
          {expenses.map((x) => (
            <div key={x.id} className="flex items-center gap-3 py-2.5">
              <span className="font-mono text-[11px] text-ink-500 tabular-nums w-[78px] shrink-0">
                {x.expense_date}
              </span>
              <span className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-clay-700 bg-clay-700/10 rounded-full px-2 py-0.5 shrink-0">
                {CAT_LABEL[x.category] ?? x.category}
              </span>
              <span className="text-[13px] text-ink-700 truncate flex-1">{x.label || '—'}</span>
              <span className="font-mono text-[13px] text-ink-900 tabular-nums shrink-0">
                {formatPrice(x.amount)}
              </span>
              <button
                type="button"
                onClick={() => remove(x.id)}
                disabled={deleting === x.id}
                aria-label="Eliminar gasto"
                className="w-7 h-7 inline-flex items-center justify-center rounded-md text-ink-500 hover:bg-sand-200 hover:text-brick-600 transition-colors shrink-0"
              >
                {deleting === x.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
