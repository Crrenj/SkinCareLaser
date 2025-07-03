import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function testProductUpdate() {
  console.log('🧪 Test de mise à jour de produit...\n')
  
  try {
    // 1. Récupérer un produit existant
    console.log('1️⃣ Récupération d\'un produit...')
    const productsRes = await fetch('http://localhost:3000/api/admin/products?page=1&limit=1')
    const productsData = await productsRes.json()
    
    if (!productsData.products || productsData.products.length === 0) {
      console.log('❌ Aucun produit trouvé')
      return
    }
    
    const product = productsData.products[0]
    console.log(`✅ Produit trouvé: ${product.name} (${product.id})`)
    console.log(`   Stock actuel: ${product.stock}`)
    
    // 2. Tester la mise à jour du stock
    console.log('\n2️⃣ Test de mise à jour du stock...')
    const newStock = product.stock + 10
    
    const updateData = {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      stock: newStock,
      // Ces champs seront extraits et ne causeront plus d'erreur
      brand_id: product.brand?.id || '',
      range_id: product.product_ranges?.[0]?.range_id || ''
    }
    
    const updateRes = await fetch(`http://localhost:3000/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    
    if (updateRes.ok) {
      const updatedProduct = await updateRes.json()
      console.log(`✅ Mise à jour réussie!`)
      console.log(`   Nouveau stock: ${updatedProduct.stock}`)
    } else {
      const error = await updateRes.json()
      console.log(`❌ Erreur de mise à jour: ${error.error}`)
      console.log(`   Message complet:`, error)
    }
    
  } catch (error) {
    console.error('❌ Erreur complète:', error)
  }
}

// Exécuter le test
testProductUpdate() 