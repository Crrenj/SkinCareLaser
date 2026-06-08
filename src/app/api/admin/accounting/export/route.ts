import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { buildCsv } from '@/lib/csv'
import { buildReservationReferenceCompact } from '@/lib/reservation'
import { logger } from '@/lib/logger'

// Export CSV pour la DGII (RD). 606 = registre des ACHATS, reconstruit depuis
// stock_entries (1 réception = 1 comprobante = 1 ligne, base + ITBIS séparés).
// 607 = journal des VENTES (borrador) depuis les réservations collected — NCF
// laissé vide, FARMAU n'émet pas encore de comprobante fiscal (couche e-CF).

const ITBIS_RATE = 0.18

function monthRange(month: string | null): { start: Date; end: Date; key: string } {
  const now = new Date()
  let y = now.getUTCFullYear()
  let m = now.getUTCMonth()
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yy, mm] = month.split('-')
    y = Number(yy)
    m = Number(mm) - 1
  }
  const start = new Date(Date.UTC(y, m, 1))
  const end = new Date(Date.UTC(y, m + 1, 1))
  const key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`
  return { start, end, key }
}

/** ISO ('YYYY-MM-DD' ou timestamp) → AAAAMMDD (format DGII). */
function yyyymmdd(iso: string | null): string {
  if (!iso) return ''
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00Z`) : new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`
}

function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }
  const sb = supabaseAdmin

  const url = new URL(request.url)
  const type = url.searchParams.get('type') === '607' ? '607' : '606'
  const { start, end, key } = monthRange(url.searchParams.get('month'))

  // ── 606 · Compras (depuis stock_entries) ──
  if (type === '606') {
    const { data, error } = await sb
      .from('stock_entries')
      .select(
        'quantity, unit_cost, itbis_included, supplier_name, supplier_rnc, ncf, invoice_date, created_at, client_token',
      )
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
    if (error) {
      logger.error('[accounting/export] 606 error:', error)
      return NextResponse.json({ error: 'export_failed' }, { status: 500 })
    }

    type Row = {
      quantity: number
      unit_cost: number | string | null
      itbis_included: boolean | null
      supplier_name: string | null
      supplier_rnc: string | null
      ncf: string | null
      invoice_date: string | null
      created_at: string
      client_token: string | null
    }
    const groups = new Map<
      string,
      { rnc: string; name: string; ncf: string; date: string; base: number; itbis: number; total: number }
    >()
    let anon = 0
    for (const r of (data ?? []) as Row[]) {
      const gkey = r.client_token ?? r.ncf ?? `anon-${anon++}`
      const lineTotal = Number(r.unit_cost ?? 0) * r.quantity
      const base = r.itbis_included === false ? lineTotal : lineTotal / (1 + ITBIS_RATE)
      const g = groups.get(gkey) ?? {
        rnc: r.supplier_rnc?.trim() ?? '',
        name: r.supplier_name?.trim() ?? '',
        ncf: r.ncf?.trim() ?? '',
        date: yyyymmdd(r.invoice_date ?? r.created_at),
        base: 0,
        itbis: 0,
        total: 0,
      }
      g.base += base
      g.itbis += lineTotal - base
      g.total += lineTotal
      groups.set(gkey, g)
    }

    const headers = [
      'RNC/Cédula',
      'Tipo Id',
      'Tipo Bienes/Servicios',
      'NCF',
      'Fecha Comprobante (AAAAMMDD)',
      'Proveedor',
      'Monto Facturado',
      'ITBIS Facturado',
      'Total',
    ]
    const rows = [...groups.values()].map((g) => {
      const digits = g.rnc.replace(/\D/g, '')
      const tipoId = digits.length === 11 ? '2' : digits.length >= 1 ? '1' : ''
      return [
        g.rnc,
        tipoId,
        '09',
        g.ncf,
        g.date,
        g.name,
        g.base.toFixed(2),
        g.itbis.toFixed(2),
        g.total.toFixed(2),
      ]
    })
    return csvResponse(buildCsv(headers, rows), `farmau-606-${key}.csv`)
  }

  // ── 607 · Ventas (journal borrador depuis reservations collected) ──
  const { data, error } = await sb
    .from('reservations')
    .select('id, contact_name, source, total_price, collected_at')
    .eq('status', 'collected')
    .gte('collected_at', start.toISOString())
    .lt('collected_at', end.toISOString())
    .order('collected_at', { ascending: true })
  if (error) {
    logger.error('[accounting/export] 607 error:', error)
    return NextResponse.json({ error: 'export_failed' }, { status: 500 })
  }

  const CANAL: Record<string, string> = { counter: 'Mostrador', guest: 'Web', account: 'Cuenta' }
  const headers = ['Fecha (AAAAMMDD)', 'Referencia', 'Canal', 'Cliente', 'Monto Total', 'NCF']
  const rows = (
    (data ?? []) as Array<{
      id: string
      contact_name: string | null
      source: string | null
      total_price: number | string | null
      collected_at: string | null
    }>
  ).map((r) => [
    yyyymmdd(r.collected_at),
    buildReservationReferenceCompact(r.id),
    CANAL[r.source ?? 'account'] ?? 'Cuenta',
    r.contact_name?.trim() || '—',
    Number(r.total_price ?? 0).toFixed(2),
    '',
  ])
  return csvResponse(buildCsv(headers, rows), `farmau-ventas-607-borrador-${key}.csv`)
}
