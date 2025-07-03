import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const BASE_URL = 'http://localhost:3000'
let testResults = []

// Fonction utilitaire pour ajouter un résultat de test
function addResult(test, success, message, data = null) {
  testResults.push({ test, success, message, data })
  const icon = success ? '✅' : '❌'
  console.log(`${icon} ${test}: ${message}`)
  if (data) console.log(`   Données:`, data)
}

// Test 1: API Produits - Liste
async function testProductsList() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/products?page=1&limit=5`)
    const data = await res.json()
    
    if (res.ok && data.products && Array.isArray(data.products)) {
      addResult('Liste des produits', true, `${data.products.length} produits récupérés`, {
        totalCount: data.totalCount,
        currentPage: data.currentPage,
        totalPages: data.totalPages
      })
      return data.products[0] // Retourner le premier produit pour les tests suivants
    } else {
      addResult('Liste des produits', false, data.error || 'Réponse invalide')
      return null
    }
  } catch (error) {
    addResult('Liste des produits', false, error.message)
    return null
  }
}

// Test 2: API Marques
async function testBrandsList() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/brands`)
    const data = await res.json()
    
    if (res.ok && Array.isArray(data)) {
      addResult('Liste des marques', true, `${data.length} marques récupérées`, {
        firstBrand: data[0]?.name
      })
      return data[0] // Retourner la première marque
    } else {
      addResult('Liste des marques', false, data.error || 'Réponse invalide')
      return null
    }
  } catch (error) {
    addResult('Liste des marques', false, error.message)
    return null
  }
}

// Test 3: Mise à jour du stock d'un produit
async function testUpdateStock(product) {
  if (!product) {
    addResult('Mise à jour stock', false, 'Aucun produit disponible pour le test')
    return
  }
  
  try {
    const originalStock = product.stock
    const newStock = originalStock + 5
    
    const updateData = {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      stock: newStock,
      brand_id: product.brand?.id || '',
      range_id: product.product_ranges?.[0]?.range_id || ''
    }
    
    const res = await fetch(`${BASE_URL}/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    
    if (res.ok) {
      const updatedProduct = await res.json()
      addResult('Mise à jour stock', true, `Stock mis à jour: ${originalStock} → ${updatedProduct.stock}`)
    } else {
      const error = await res.json()
      addResult('Mise à jour stock', false, error.error || 'Erreur inconnue')
    }
  } catch (error) {
    addResult('Mise à jour stock', false, error.message)
  }
}

// Test 4: Création d'un nouveau produit
async function testCreateProduct(brand) {
  if (!brand || !brand.ranges || brand.ranges.length === 0) {
    addResult('Création produit', false, 'Aucune marque/gamme disponible pour le test')
    return null
  }
  
  try {
    const productData = {
      name: `Produit Test ${Date.now()}`,
      slug: `produit-test-${Date.now()}`,
      description: 'Produit créé automatiquement pour les tests',
      price: 99.99,
      stock: 10,
      brand_id: brand.id,
      range_id: brand.ranges[0].id
    }
    
    const res = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    })
    
    if (res.ok) {
      const newProduct = await res.json()
      addResult('Création produit', true, `Produit créé: ${newProduct.name}`, { id: newProduct.id })
      return newProduct
    } else {
      const error = await res.json()
      addResult('Création produit', false, error.error || 'Erreur inconnue')
      return null
    }
  } catch (error) {
    addResult('Création produit', false, error.message)
    return null
  }
}

// Test 5: Suppression d'un produit
async function testDeleteProduct(product) {
  if (!product) {
    addResult('Suppression produit', false, 'Aucun produit à supprimer')
    return
  }
  
  try {
    const res = await fetch(`${BASE_URL}/api/admin/products/${product.id}`, {
      method: 'DELETE'
    })
    
    if (res.ok) {
      addResult('Suppression produit', true, `Produit supprimé: ${product.name}`)
    } else {
      const error = await res.json()
      addResult('Suppression produit', false, error.error || 'Erreur inconnue')
    }
  } catch (error) {
    addResult('Suppression produit', false, error.message)
  }
}

// Test 6: Test avec upload d'image (base64 factice)
async function testUpdateWithImage(product) {
  if (!product) {
    addResult('Upload image', false, 'Aucun produit disponible pour le test')
    return
  }
  
  try {
    // Image PNG 1x1 pixel en base64 (pour test)
    const fakeImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    
    const updateData = {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      stock: product.stock,
      brand_id: product.brand?.id || '',
      range_id: product.product_ranges?.[0]?.range_id || '',
      imageFile: fakeImageBase64
    }
    
    const res = await fetch(`${BASE_URL}/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    
    if (res.ok) {
      const updatedProduct = await res.json()
      addResult('Upload image', true, 'Image uploadée avec succès')
    } else {
      const error = await res.json()
      addResult('Upload image', false, error.error || 'Erreur inconnue')
    }
  } catch (error) {
    addResult('Upload image', false, error.message)
  }
}

// Test 7: Recherche de produits
async function testProductSearch() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/products?page=1&limit=5&search=agua`)
    const data = await res.json()
    
    if (res.ok && data.products) {
      addResult('Recherche produits', true, `${data.products.length} produits trouvés avec "agua"`)
    } else {
      addResult('Recherche produits', false, data.error || 'Erreur inconnue')
    }
  } catch (error) {
    addResult('Recherche produits', false, error.message)
  }
}

// Test 8: Pagination
async function testPagination() {
  try {
    const res1 = await fetch(`${BASE_URL}/api/admin/products?page=1&limit=2`)
    const res2 = await fetch(`${BASE_URL}/api/admin/products?page=2&limit=2`)
    
    const data1 = await res1.json()
    const data2 = await res2.json()
    
    if (res1.ok && res2.ok && data1.products && data2.products) {
      const differentProducts = data1.products[0]?.id !== data2.products[0]?.id
      addResult('Pagination', differentProducts, 
        differentProducts ? 'Pagination fonctionne correctement' : 'Pagination retourne les mêmes produits')
    } else {
      addResult('Pagination', false, 'Erreur lors du test de pagination')
    }
  } catch (error) {
    addResult('Pagination', false, error.message)
  }
}

// Fonction principale de test
async function runAllTests() {
  console.log('🧪 DÉBUT DES TESTS COMPLETS DES FONCTIONNALITÉS ADMIN\n')
  console.log('=' .repeat(60))
  
  // Tests séquentiels
  const product = await testProductsList()
  const brand = await testBrandsList()
  
  await testUpdateStock(product)
  await testProductSearch()
  await testPagination()
  await testUpdateWithImage(product)
  
  const newProduct = await testCreateProduct(brand)
  await testDeleteProduct(newProduct)
  
  // Résumé
  console.log('\n' + '=' .repeat(60))
  console.log('📊 RÉSUMÉ DES TESTS')
  console.log('=' .repeat(60))
  
  const totalTests = testResults.length
  const passedTests = testResults.filter(r => r.success).length
  const failedTests = totalTests - passedTests
  
  console.log(`Total des tests: ${totalTests}`)
  console.log(`✅ Réussis: ${passedTests}`)
  console.log(`❌ Échoués: ${failedTests}`)
  console.log(`📈 Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  
  if (failedTests > 0) {
    console.log('\n🔍 TESTS ÉCHOUÉS:')
    testResults.filter(r => !r.success).forEach(result => {
      console.log(`   • ${result.test}: ${result.message}`)
    })
  }
  
  console.log('\n🎯 RECOMMANDATIONS:')
  if (passedTests === totalTests) {
    console.log('   ✅ Toutes les fonctionnalités admin fonctionnent correctement!')
  } else {
    console.log('   ⚠️  Certaines fonctionnalités nécessitent des corrections.')
    console.log('   📝 Consultez les erreurs ci-dessus pour plus de détails.')
  }
}

// Exécuter tous les tests
runAllTests().catch(console.error) 