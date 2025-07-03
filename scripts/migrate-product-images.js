import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateProductImages() {
  try {
    console.log('🔄 Début de la migration des images...')
    
    // Récupérer tous les produits avec image_url mais sans product_images
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        image_url,
        product_images(id)
      `)
      .not('image_url', 'is', null)
    
    if (error) throw error
    
    // Filtrer les produits qui ont une image_url mais pas d'entrée dans product_images
    const productsToMigrate = products.filter(p => 
      p.image_url && (!p.product_images || p.product_images.length === 0)
    )
    
    console.log(`📊 ${productsToMigrate.length} produits à migrer`)
    
    for (const product of productsToMigrate) {
      console.log(`  ➜ Migration de: ${product.name}`)
      
      // Insérer dans product_images
      const { error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: product.id,
          url: product.image_url,
          alt: `Image de ${product.name}`
        })
      
      if (insertError) {
        console.error(`    ❌ Erreur pour ${product.name}:`, insertError.message)
      } else {
        console.log(`    ✅ Migré avec succès`)
      }
    }
    
    console.log('✅ Migration terminée!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  }
}

// Exécuter la migration
migrateProductImages() 