#!/usr/bin/env node
/**
 * Seed du CONTENU D'EXEMPLE (blog + bannières) pour le back-office FARMAU.
 *
 * Source : design handoff Claude Design « FARMAU - Contenido de ejemplo ».
 * Données : scripts/data/example-content.json (4 articles ES dont 1 brouillon
 *           + 3 bannières : editorial / hero / quote).
 *
 * But : donner au client des EXEMPLES DE RÉFÉRENCE déjà en place dans
 *       /admin/blog et /admin/annonce, pour rendre le back-office lisible.
 *
 * Idempotent :
 *   - posts    : matché par `slug` (UNIQUE) → update si existe, insert sinon.
 *                `published_at` est préservé (jamais réinitialisé sur re-run).
 *   - bannières : matchées par (`title`, `banner_type`) → update sinon insert.
 *
 * Prérequis : .env.local avec NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage :
 *   node scripts/seed-example-content.cjs --dry-run   # aperçu, AUCUNE écriture, ne touche pas la DB
 *   node scripts/seed-example-content.cjs             # applique en base (service-role)
 */

const fs = require('fs')
const path = require('path')

const DRY_RUN = process.argv.includes('--dry-run')
const DATA = require(path.join(__dirname, 'data', 'example-content.json'))

function emptyToNull(v) {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function postPayload(p) {
  return {
    title: p.title,
    slug: p.slug,
    excerpt: emptyToNull(p.excerpt),
    body: p.body ?? '',
    cover_image_url: emptyToNull(p.cover_image_url),
    author_name: emptyToNull(p.author_name),
    locale: p.locale || 'es',
    is_published: !!p.is_published,
  }
}

function bannerPayload(b) {
  return {
    title: b.title,
    description: emptyToNull(b.description),
    image_url: emptyToNull(b.image_url),
    link_url: emptyToNull(b.link_url),
    link_text: emptyToNull(b.link_text),
    banner_type: b.banner_type,
    slot: b.slot || 'banner',
    status: b.status || 'draft',
    position: b.position ?? 1,
    is_active: b.is_active ?? true,
    direction: emptyToNull(b.direction),
    attribution_name: emptyToNull(b.attribution_name),
    attribution_title: emptyToNull(b.attribution_title),
    attribution_photo_url: emptyToNull(b.attribution_photo_url),
  }
}

// ---------------------------------------------------------------- dry-run (offline)
if (DRY_RUN) {
  console.log('🔍 DRY-RUN — aucune écriture, aucune connexion à la base.\n')
  console.log(`Articles de blog (${DATA.posts.length}) :`)
  for (const p of DATA.posts) {
    const pl = postPayload(p)
    console.log(
      `  • [${pl.is_published ? 'PUBLIÉ ' : 'brouillon'}] ${pl.locale}  /${pl.slug}\n` +
      `      « ${pl.title} »  (${(pl.body || '').length} car. HTML, image: ${pl.cover_image_url ? 'oui' : 'non'})`,
    )
  }
  console.log(`\nBannières (${DATA.banners.length}) :`)
  for (const b of DATA.banners) {
    const pl = bannerPayload(b)
    console.log(
      `  • ${pl.banner_type}/${pl.slot}  pos.${pl.position}  ${pl.is_active ? 'ACTIVE' : 'inactive'}/${pl.status}\n` +
      `      « ${pl.title.replace(/<[^>]+>/g, '')} »` +
      (pl.link_url ? `  → ${pl.link_text} (${pl.link_url})` : '') +
      (pl.attribution_name ? `  — ${pl.attribution_name}` : ''),
    )
  }
  console.log('\nPour appliquer :  node scripts/seed-example-content.cjs')
  process.exit(0)
}

// ---------------------------------------------------------------- apply (DB write)
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function seedPosts() {
  let inserted = 0
  let updated = 0
  for (const p of DATA.posts) {
    const payload = postPayload(p)
    const { data: existing, error: selErr } = await supabase
      .from('posts')
      .select('id, published_at')
      .eq('slug', payload.slug)
      .limit(1)
    if (selErr) throw new Error(`SELECT posts (${payload.slug}): ${selErr.message}`)

    if (existing && existing.length) {
      const fields = { ...payload }
      // published_at préservé : on ne le pose que s'il est publié et qu'il n'en a pas encore.
      if (payload.is_published && !existing[0].published_at) {
        fields.published_at = new Date().toISOString()
      }
      const { error } = await supabase.from('posts').update(fields).eq('id', existing[0].id)
      if (error) throw new Error(`UPDATE posts (${payload.slug}): ${error.message}`)
      updated++
      console.log(`  ↻ post mis à jour  /${payload.slug}`)
    } else {
      const fields = { ...payload, published_at: payload.is_published ? new Date().toISOString() : null }
      const { error } = await supabase.from('posts').insert(fields)
      if (error) throw new Error(`INSERT posts (${payload.slug}): ${error.message}`)
      inserted++
      console.log(`  + post créé        /${payload.slug}${payload.is_published ? '' : ' (brouillon)'}`)
    }
  }
  return { inserted, updated }
}

async function seedBanners() {
  let inserted = 0
  let updated = 0
  for (const b of DATA.banners) {
    const payload = bannerPayload(b)
    const { data: existing, error: selErr } = await supabase
      .from('banners')
      .select('id')
      .eq('title', payload.title)
      .eq('banner_type', payload.banner_type)
      .limit(1)
    if (selErr) throw new Error(`SELECT banners (${payload.banner_type}): ${selErr.message}`)

    if (existing && existing.length) {
      const { error } = await supabase.from('banners').update(payload).eq('id', existing[0].id)
      if (error) throw new Error(`UPDATE banners (${payload.banner_type}): ${error.message}`)
      updated++
      console.log(`  ↻ bannière mise à jour  ${payload.banner_type}/${payload.slot}`)
    } else {
      const { error } = await supabase.from('banners').insert(payload)
      if (error) throw new Error(`INSERT banners (${payload.banner_type}): ${error.message}`)
      inserted++
      console.log(`  + bannière créée         ${payload.banner_type}/${payload.slot}`)
    }
  }
  return { inserted, updated }
}

async function main() {
  console.log(`→ Projet : ${SUPABASE_URL}\n`)
  console.log('Articles de blog :')
  const posts = await seedPosts()
  console.log('\nBannières :')
  const banners = await seedBanners()
  console.log(
    `\n✅ Terminé. Posts : +${posts.inserted} / ↻${posts.updated}` +
    `  ·  Bannières : +${banners.inserted} / ↻${banners.updated}`,
  )
  console.log('   Vérifie dans /admin/blog et /admin/annonce.')
}

main().catch((err) => {
  console.error(`\n❌ Échec du seed : ${err.message}`)
  process.exit(1)
})
