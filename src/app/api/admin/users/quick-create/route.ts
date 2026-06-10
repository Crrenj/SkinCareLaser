import { randomUUID } from 'node:crypto'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { parseBody, quickCreateUser } from '@/lib/schemas'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSiteUrl } from '@/lib/csrf'
import { recordAuditLog } from '@/lib/audit'

/**
 * POST /api/admin/users/quick-create
 *
 * Crée un compte client « express » depuis le comptoir : nom + prénom +
 * téléphone seulement. Le serveur synthétise un email à partir du téléphone,
 * crée le compte (mot de passe aléatoire, déjà confirmé), enrichit le profil,
 * puis génère un lien de configuration (type recovery) que l'admin enverra au
 * client par WhatsApp. Le client ouvre le lien → connecté → pose son mot de
 * passe + son vrai email (page reset-password en mode ?setup=1).
 *
 * Dédup : si le téléphone correspond déjà à un compte (collision d'email
 * synthétisé), on renvoie ce compte (`created: false`, sans lien).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const parsed = parseBody(quickCreateUser, raw)
  if (!parsed.ok) return parsed.response
  const { first_name, last_name, phone, locale = 'fr' } = parsed.data

  const digits = phone.replace(/\D/g, '')
  if (digits.length < 5) {
    return NextResponse.json({ error: 'Téléphone invalide' }, { status: 400 })
  }

  const email = `t${digits}@wa.farmau.do`
  const fullName = [first_name, last_name].filter(Boolean).join(' ').trim()
  // Mot de passe aléatoire fort — le client le remplacera via le lien de config.
  const password = `${randomUUID()}Aa1!`

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name: last_name ?? '', phone, display_name: fullName },
  })

  // Collision (téléphone déjà enregistré) → relie au compte existant.
  if (createErr) {
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .limit(1)
      .maybeSingle()
    if (existing?.id) {
      return NextResponse.json(
        { userId: existing.id, name: fullName || null, phone, setupLink: null, created: false },
        { status: 200 },
      )
    }
    // Erreur Supabase Auth (4xx attendu : email synthétisé déjà pris, etc.) —
    // message assaini, jamais le message brut du provider.
    logger.error('[admin/users/quick-create] createUser error:', createErr)
    return NextResponse.json(
      { error: 'Impossible de créer le compte (téléphone déjà associé à un compte ?)' },
      { status: 409 },
    )
  }

  const userId = created.user.id

  // Le trigger handle_new_user a créé un profil vide → on l'enrichit.
  const { error: profileErr } = await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      first_name,
      last_name: last_name ?? null,
      display_name: fullName || null,
      phone,
      preferred_locale: locale,
    },
    { onConflict: 'id' },
  )
  if (profileErr) logger.error('[admin/users/quick-create] profile upsert error:', profileErr)

  // Lien de configuration (recovery) → page reset-password en mode setup.
  let setupLink: string | null = null
  const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${getSiteUrl()}/${locale}/reset-password?setup=1` },
  })
  if (linkErr) logger.error('[admin/users/quick-create] generateLink error:', linkErr)
  else setupLink = link.properties?.action_link ?? null

  recordAuditLog({
    actorId: auth.userId,
    action: 'create',
    entity: 'user',
    entityId: userId,
    summary: `Cliente creado (mostrador): ${fullName || phone}`,
    diff: { first_name, last_name: last_name ?? null }, // pas de téléphone (PII) dans le journal
  })

  return NextResponse.json(
    { userId, name: fullName || null, phone, setupLink, created: true },
    { status: 201 },
  )
}
