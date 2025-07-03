#!/usr/bin/env node

/**
 * Script de vérification de la configuration du système admin
 * Usage: node scripts/check-admin-setup.js
 */

const { createClient } = require('@supabase/supabase-js')

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
}

async function checkAdminSetup() {
  console.log('\n🔍 Vérification de la configuration admin...\n')

  // 1. Vérifier les variables d'environnement
  log.info('Vérification des variables d\'environnement...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    log.error('NEXT_PUBLIC_SUPABASE_URL non définie')
    return
  } else {
    log.success('NEXT_PUBLIC_SUPABASE_URL trouvée')
  }
  
  if (!supabaseAnonKey) {
    log.error('NEXT_PUBLIC_SUPABASE_ANON_KEY non définie')
    return
  } else {
    log.success('NEXT_PUBLIC_SUPABASE_ANON_KEY trouvée')
  }
  
  if (!supabaseServiceKey) {
    log.error('Clé de service non définie - nécessaire pour les opérations admin!')
    log.info('Ajoutez SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY dans votre .env.local')
    log.info('Récupérez-la depuis : Settings > API > service_role dans votre dashboard Supabase')
    return
  } else {
    log.success('Clé de service trouvée (SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY)')
  }

  // 2. Créer le client admin
  log.info('\nConnexion à Supabase avec la clé de service...')
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 3. Vérifier les tables
    log.info('\nVérification des tables...')
    
    const tables = ['products', 'brands', 'ranges', 'product_ranges']
    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).select('count', { count: 'exact', head: true })
      if (error) {
        log.error(`Table '${table}' inaccessible : ${error.message}`)
      } else {
        log.success(`Table '${table}' accessible`)
      }
    }
    
    // 4. Vérifier le bucket storage
    log.info('\nVérification du bucket storage...')
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      log.error(`Impossible de lister les buckets : ${bucketsError.message}`)
    } else {
      const productImageBucket = buckets.find(b => b.id === 'product-image')
      if (productImageBucket) {
        log.success('Bucket "product-image" trouvé')
        if (productImageBucket.public) {
          log.success('Bucket configuré en mode public ✓')
        } else {
          log.warning('Bucket non public - les images ne seront pas accessibles!')
        }
      } else {
        log.error('Bucket "product-image" non trouvé')
        log.info('Exécutez le script SQL : db/create_storage_bucket.sql')
      }
    }
    
    // 5. Vérifier les données
    log.info('\nVérification des données...')
    
    const { count: brandsCount } = await supabaseAdmin
      .from('brands')
      .select('*', { count: 'exact', head: true })
    
    const { count: productsCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    if (brandsCount > 0) {
      log.success(`${brandsCount} marques trouvées`)
    } else {
      log.warning('Aucune marque trouvée')
      log.info('Exécutez le script SQL : db/populate_catalog.sql')
    }
    
    if (productsCount > 0) {
      log.success(`${productsCount} produits trouvés`)
    } else {
      log.warning('Aucun produit trouvé')
    }
    
    // 6. Test d'upload (optionnel)
    log.info('\nTest d\'upload d\'image...')
    try {
      const testData = Buffer.from('test', 'utf-8')
      const { error: uploadError } = await supabaseAdmin.storage
        .from('product-image')
        .upload('test-admin-setup.txt', testData, { upsert: true })
      
      if (uploadError) {
        log.error(`Test d'upload échoué : ${uploadError.message}`)
      } else {
        log.success('Test d\'upload réussi')
        // Nettoyer
        await supabaseAdmin.storage.from('product-image').remove(['test-admin-setup.txt'])
      }
    } catch (err) {
      log.error(`Test d'upload échoué : ${err.message}`)
    }
    
    console.log('\n✅ Configuration admin vérifiée avec succès!\n')
    
  } catch (error) {
    log.error(`Erreur générale : ${error.message}`)
  }
}

// Exécuter le script
checkAdminSetup().catch(console.error) 