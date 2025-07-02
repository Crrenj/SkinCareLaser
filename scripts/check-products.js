#!/usr/bin/env node

/**
 * Script pour vérifier les produits dans la base de données
 * Usage: node scripts/check-products.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Vérifier les variables d'environnement
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.log('❌ Variables d\'environnement manquantes:')
  missingVars.forEach(varName => console.log(`   ${varName}`))
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkProducts() {
  console.log('🔍 Vérification des produits dans la base de données...')
  
  try {
    // Récupérer tous les produits
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        currency,
        stock,
        product_images (url, alt)
      `)
      .limit(10)
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des produits:', error)
      return
    }
    
    if (!products || products.length === 0) {
      console.log('⚠️  Aucun produit trouvé dans la base de données')
      return
    }
    
    console.log(`✅ ${products.length} produits trouvés:`)
    console.log('')
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`)
      console.log(`   ID: ${product.id}`)
      console.log(`   Prix: ${product.price} ${product.currency}`)
      console.log(`   Stock: ${product.stock}`)
      console.log(`   Images: ${product.product_images?.length || 0}`)
      console.log('')
    })
    
    // Afficher un exemple d'ID pour les tests
    if (products.length > 0) {
      console.log('📝 Exemple d\'ID de produit pour les tests:')
      console.log(`   ${products[0].id}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

checkProducts() 