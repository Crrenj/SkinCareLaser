import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { apiError } from '@/lib/apiError'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, expenseCreate } from '@/lib/schemas'
import { recordAuditLog } from '@/lib/audit'

/** GET — liste des dépenses (optionnellement filtrées par ?month=YYYY-MM). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const month = new URL(request.url).searchParams.get('month')
  let query = supabaseAdmin
    .from('expenses')
    .select('id, amount, category, label, expense_date, note, created_at')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    const start = `${month}-01`
    const endY = m === 12 ? y + 1 : y
    const endM = m === 12 ? 1 : m + 1
    const end = `${endY}-${String(endM).padStart(2, '0')}-01`
    query = query.gte('expense_date', start).lt('expense_date', end)
  }

  const { data, error } = await query
  if (error) {
    logger.error('[admin/expenses] GET error:', error)
    return apiError('Erreur serveur', error, 500)
  }
  return NextResponse.json({ expenses: data ?? [] })
}

/** POST — enregistre une dépense. created_by = admin courant (jamais du body). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const parsed = parseBody(expenseCreate, raw)
  if (!parsed.ok) return parsed.response
  const { amount, category, label, expense_date, note } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert({
      amount,
      category,
      label: label?.trim() || null,
      expense_date,
      note: note?.trim() || null,
      created_by: auth.userId,
    })
    .select('id')
    .single()

  if (error) {
    logger.error('[admin/expenses] POST error:', error)
    return apiError('Erreur lors de la création de la dépense', error, 500)
  }

  recordAuditLog({
    actorId: auth.userId,
    action: 'create',
    entity: 'expense',
    entityId: data.id,
    summary: `Gasto registrado: ${category}${label?.trim() ? ' · ' + label.trim() : ''} · ${amount}`,
    diff: { amount, category, label: label?.trim() || null, expense_date, note: note?.trim() || null },
  })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
