import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkOrigin } from '@/lib/csrf'
import { ticketCreate } from '@/lib/schemas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// POST /api/contact - Envoyer un message de contact (= ticket de support)
export async function POST(request: NextRequest) {
  const originError = checkOrigin(request)
  if (originError) return originError

  try {
    const ip = getClientIp(request)
    const rl = await checkRateLimit(`contact:${ip}`, 5, 60)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Réessayez dans quelques instants.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Configuration serveur manquante' },
        { status: 500 },
      )
    }

    const raw = await request.json()
    const parsed = ticketCreate.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 },
      )
    }
    const { email, category, subject, message } = parsed.data

    // create_ticket : accepte les emails anonymes (lie user_id si le compte existe)
    // et enregistre la catégorie du problème. Aucun compte requis.
    const { data: result, error } = await supabaseAdmin.rpc('create_ticket', {
      p_email: email,
      p_category: category ?? 'other',
      p_subject: subject,
      p_message: message,
    })

    if (error) {
      logger.error('Erreur création ticket:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi du message' },
        { status: 500 },
      )
    }

    // create_ticket renvoie un Json non typé côté client : narrow local.
    const r = result as { success: boolean; message_id?: string } | null
    if (!r || !r.success) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi du message' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès!',
      messageId: r.message_id,
    })
  } catch (error) {
    logger.error('Erreur API contact:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 },
    )
  }
}

// GET /api/contact - Récupérer les messages de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Erreur récupération messages utilisateur:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    logger.error('Erreur API GET contact:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
