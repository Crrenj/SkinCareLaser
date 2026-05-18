#!/usr/bin/env node
/**
 * Importe db/catalog.json dans Supabase + upload des images/PDFs vers Storage.
 *
 * Prérequis :
 *   1. db/schema.sql exécuté sur le projet cible (tables vides)
 *   2. .env.local contient NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   3. db/catalog.json généré par parse-pdfs.cjs
 *
 * Stratégie d'images :
 *   - "positional"  : image1.png → 1er produit, image2.png → 2e produit, etc.
 *                     (ordre = ordre des produits dans le JSON, qui suit l'ordre du PDF)
 *   - "by-slug"     : match l'image dont le slug (basename sans extension) ressemble
 *                     le plus au slug du produit (Levenshtein simple)
 *
 * Prix par défaut : 25.00 DOP, is_active = false (à activer via admin après revue).
 *
 * Usage :
 *   node scripts/seed-import.cjs [--dry-run]
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')
const PLACEHOLDER_PRICE = 25.00
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const CATALOG = require(path.join(__dirname, '..', 'db', 'catalog.json'))
const IMAGE_DIR = path.join(__dirname, '..', 'contenu_bd', 'image')
const FICHE_DIR = path.join(__dirname, '..', 'contenu_bd', 'fiche')

// ---------------------------------------------------------------------- utils

function log(msg) { console.error(msg) }

function levenshtein(a, b) {
  const m = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) m[i][0] = i
  for (let j = 0; j <= b.length; j++) m[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost)
    }
  }
  return m[a.length][b.length]
}

function basenameNoExt(file) {
  return file.replace(/\.[^.]+$/, '')
}

// Match by-slug : pour chaque produit, trouver l'image dont le slug ressemble le plus
function matchBySlug(products, imageFiles) {
  const used = new Set()
  const matches = new Map()

  for (const p of products) {
    const productSlug = p.slug.replace(/^[^-]+-/, '') // strip brand prefix
    let best = null
    let bestDist = Infinity
    for (const img of imageFiles) {
      if (used.has(img)) continue
      const imgSlug = basenameNoExt(img)
      const dist = levenshtein(productSlug, imgSlug)
      if (dist < bestDist) { bestDist = dist; best = img }
    }
    // Heuristique : match seulement si distance < 60% de la longueur
    if (best && bestDist < Math.max(productSlug.length, basenameNoExt(best).length) * 0.6) {
      matches.set(p.slug, best)
      used.add(best)
    }
  }
  return matches
}

// ---------------------------------------------------------------------- main

async function ensureTagTypes() {
  const types = [
    { slug: 'categories', name: 'Catégories', icon: 'FolderIcon', color: '#3B82F6' },
    { slug: 'besoins',    name: 'Besoins',    icon: 'HeartIcon',  color: '#10B981' },
    { slug: 'types-peau', name: 'Type de peau', icon: 'UserGroupIcon', color: '#F59E0B' },
    { slug: 'ingredients', name: 'Ingrédients', icon: 'BeakerIcon', color: '#8B5CF6' },
  ]
  log(`\n→ tag_types (${types.length})`)
  if (DRY_RUN) return new Map(types.map(t => [t.slug, 'dry-run-id']))

  const map = new Map()
  for (const t of types) {
    const { data, error } = await supabase
      .from('tag_types')
      .upsert(t, { onConflict: 'slug' })
      .select()
      .single()
    if (error) throw new Error(`tag_type ${t.slug}: ${error.message}`)
    map.set(t.slug, data.id)
  }
  return map
}

// Mapping : nom dans le JSON parsé → slug du tag_type
const TAG_TYPE_MAP = {
  skin_type: 'types-peau',
  need:      'besoins',
  ingredient: 'ingredients',
}

async function ensureTag(tagTypeId, name, tagCache) {
  const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const cacheKey = `${tagTypeId}:${slug}`
  if (tagCache.has(cacheKey)) return tagCache.get(cacheKey)

  if (DRY_RUN) {
    tagCache.set(cacheKey, 'dry-run-tag-id')
    return 'dry-run-tag-id'
  }

  const { data, error } = await supabase
    .from('tags')
    .upsert({ tag_type_id: tagTypeId, name, slug }, { onConflict: 'tag_type_id,slug' })
    .select()
    .single()
  if (error) throw new Error(`tag ${name}: ${error.message}`)
  tagCache.set(cacheKey, data.id)
  return data.id
}

async function uploadImage(filepath, storagePath) {
  if (DRY_RUN) return `https://dry-run.example.com/${storagePath}`
  const buffer = fs.readFileSync(filepath)
  const { error } = await supabase.storage
    .from('product-image')
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: true })
  if (error) throw new Error(`upload ${storagePath}: ${error.message}`)
  const { data: { publicUrl } } = supabase.storage.from('product-image').getPublicUrl(storagePath)
  return publicUrl
}

async function uploadPdf(filepath, storagePath) {
  if (DRY_RUN) return `https://dry-run.example.com/${storagePath}`
  const buffer = fs.readFileSync(filepath)
  const { error } = await supabase.storage
    .from('brand-fiche')
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true })
  if (error) throw new Error(`upload pdf ${storagePath}: ${error.message}`)
  const { data: { publicUrl } } = supabase.storage.from('brand-fiche').getPublicUrl(storagePath)
  return publicUrl
}

async function importBrand(brand, tagTypeIds, tagCache) {
  log(`\n=== ${brand.name} (${brand.slug}) ===`)
  log(`   ${brand.ranges.length} gammes, ${brand.ranges.reduce((s, r) => s + r.products.length, 0)} produits, ${brand.image_files.length} images, strategy=${brand.image_strategy}`)

  // 1. Upload PDF fiche
  let ficheUrl = null
  const pdfPath = path.join(FICHE_DIR, brand.pdf_file)
  if (fs.existsSync(pdfPath)) {
    ficheUrl = await uploadPdf(pdfPath, `${brand.slug}.pdf`)
    log(`   ✓ PDF uploadé → ${ficheUrl}`)
  }

  // 2. Brand
  let brandId
  if (DRY_RUN) {
    brandId = 'dry-run-brand-id'
  } else {
    const { data, error } = await supabase
      .from('brands')
      .upsert({ slug: brand.slug, name: brand.name, fiche_url: ficheUrl }, { onConflict: 'slug' })
      .select()
      .single()
    if (error) throw new Error(`brand ${brand.slug}: ${error.message}`)
    brandId = data.id
  }
  log(`   ✓ brand id=${brandId}`)

  // 3. Pour le mapping by-slug, on calcule sur l'ensemble des produits de la marque
  let slugMatches = null
  if (brand.image_strategy === 'by-slug') {
    const allProducts = brand.ranges.flatMap(r => r.products)
    slugMatches = matchBySlug(allProducts, brand.image_files)
  }

  // 4. Pour positional, on consomme les images dans l'ordre
  let positionalIdx = 0
  const allImages = brand.image_files

  for (const range of brand.ranges) {
    // Range
    let rangeId
    if (DRY_RUN) {
      rangeId = 'dry-run-range-id'
    } else {
      const { data, error } = await supabase
        .from('ranges')
        .upsert({ brand_id: brandId, name: range.name, slug: range.slug }, { onConflict: 'brand_id,slug' })
        .select()
        .single()
      if (error) throw new Error(`range ${range.slug}: ${error.message}`)
      rangeId = data.id
    }
    log(`   → gamme "${range.name}" (${range.products.length} produits)`)

    for (const product of range.products) {
      // Détermine l'image
      let imageFile = null
      if (brand.image_strategy === 'by-slug') {
        imageFile = slugMatches?.get(product.slug) || null
      } else if (brand.image_strategy === 'positional') {
        if (positionalIdx < allImages.length) {
          imageFile = allImages[positionalIdx++]
        }
      }

      // Upload image si présente
      let imageUrl = null
      if (imageFile) {
        const localPath = path.join(IMAGE_DIR, brand.image_folder, imageFile)
        const ext = path.extname(imageFile).slice(1).toLowerCase()
        const storagePath = `${brand.slug}/${product.slug}.${ext}`
        try {
          imageUrl = await uploadImage(localPath, storagePath)
        } catch (e) {
          log(`     ⚠ image ${imageFile} → ${product.slug} échec: ${e.message}`)
        }
      }

      // Product
      let productId
      if (DRY_RUN) {
        productId = 'dry-run-product-id'
      } else {
        const { data, error } = await supabase
          .from('products')
          .upsert({
            slug: product.slug,
            name: product.name,
            description: product.description,
            price: PLACEHOLDER_PRICE,
            currency: 'DOP',
            stock: 0,
            is_active: false,
            image_url: imageUrl,
          }, { onConflict: 'slug' })
          .select()
          .single()
        if (error) {
          log(`     ⚠ produit ${product.slug} échec: ${error.message}`)
          continue
        }
        productId = data.id
      }

      // product_ranges
      if (!DRY_RUN) {
        await supabase.from('product_ranges').upsert({ product_id: productId, range_id: rangeId }, { onConflict: 'product_id,range_id' })
      }

      // product_images
      if (imageUrl && !DRY_RUN) {
        await supabase.from('product_images').insert({ product_id: productId, url: imageUrl, alt: product.name })
      }

      // product_tags
      for (const [parsedKey, tagSlug] of Object.entries(TAG_TYPE_MAP)) {
        const tagTypeId = tagTypeIds.get(tagSlug)
        const tagNames = product.tags[parsedKey] || []
        for (const tagName of tagNames) {
          const tagId = await ensureTag(tagTypeId, tagName, tagCache)
          if (!DRY_RUN) {
            await supabase.from('product_tags').upsert({ product_id: productId, tag_id: tagId }, { onConflict: 'product_id,tag_id' })
          }
        }
      }
    }
  }
}

async function main() {
  log(DRY_RUN ? '=== DRY RUN ===' : `=== IMPORT RÉEL → ${SUPABASE_URL} ===`)
  log(`Catalog : ${CATALOG.brands.length} marques`)

  const tagTypeIds = await ensureTagTypes()
  const tagCache = new Map()

  let totalProducts = 0
  let totalImages = 0
  for (const brand of CATALOG.brands) {
    try {
      await importBrand(brand, tagTypeIds, tagCache)
      totalProducts += brand.ranges.reduce((s, r) => s + r.products.length, 0)
      totalImages += brand.image_files.length
    } catch (e) {
      log(`❌ Erreur marque ${brand.slug}: ${e.message}`)
    }
  }

  log(`\n=== TERMINÉ ===`)
  log(`Total : ${totalProducts} produits, ${totalImages} images traitées`)
  log(`Prix placeholder : ${PLACEHOLDER_PRICE} DOP, is_active = false`)
  log(`Active les produits via /admin/product une fois les prix vérifiés.`)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
