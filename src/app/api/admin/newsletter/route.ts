import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/admin/newsletter
 *
 * Liste les abonnés newsletter, plus récents en premier.
 *
 * Query params :
 *   - lang   : filtre langue (fr|es|en, optionnel)
 *   - search : filtre email (insensible casse, optionnel)
 *   - limit  : limite (défaut 200, max 1000)
 *   - format : "csv" pour téléchargement CSV
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  const url = new URL(request.url)
  const lang = url.searchParams.get('lang')
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
  const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get('limit') ?? 200)))
  const format = url.searchParams.get('format')

  let query = supabaseAdmin
    .from('newsletter_subscribers')
    .select('id, email, lang, created_at, confirmed_at, ip')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (lang === 'fr' || lang === 'es' || lang === 'en') {
    query = query.eq('lang', lang)
  }
  if (search) {
    query = query.ilike('email', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    logger.error('[/api/admin/newsletter] select error', error)
    return NextResponse.json({ error: 'select_failed' }, { status: 500 })
  }

  if (format === 'csv') {
    const lines = [
      'id,email,lang,created_at,confirmed_at,ip',
      ...(data ?? []).map((row) =>
        [
          row.id,
          escapeCsv(row.email),
          row.lang,
          row.created_at ?? '',
          row.confirmed_at ?? '',
          escapeCsv(row.ip ?? ''),
        ].join(','),
      ),
    ]
    const csv = lines.join('\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="farmau-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  // Stats agrégées légères pour le header
  const byLang = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.lang] = (acc[row.lang] ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    subscribers: data ?? [],
    stats: {
      total: data?.length ?? 0,
      byLang,
    },
  })
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
