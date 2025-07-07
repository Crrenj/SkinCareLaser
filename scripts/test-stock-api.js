const BASE_URL = 'http://localhost:3000'

// Test de l'API de stock
async function testStockAPI() {
  console.log('🧪 Test de l\'API de stock...\n')
  
  try {
    // Test 1: Récupération des données de stock
    console.log('📋 Test 1: Récupération des données de stock')
    const response = await fetch(`${BASE_URL}/api/admin/stock`)
    
    if (!response.ok) {
      console.error('❌ Erreur:', response.status, response.statusText)
      const error = await response.json()
      console.error('Détails:', error)
      return
    }
    
    const data = await response.json()
    console.log('✅ Données récupérées avec succès')
    console.log(`   - Total produits: ${data.stats.total}`)
    console.log(`   - Stock normal: ${data.stats.ok}`)
    console.log(`   - Stock faible: ${data.stats.low}`)
    console.log(`   - Rupture: ${data.stats.out}`)
    console.log(`   - Nombre d'items retournés: ${data.items.length}`)
    
    if (data.items.length > 0) {
      console.log('   - Premier produit:', data.items[0].product_name)
      console.log('   - Stock actuel:', data.items[0].current_stock)
      console.log('   - Statut:', data.items[0].status)
    }
    
    // Test 2: Filtrage par recherche
    console.log('\n🔍 Test 2: Filtrage par recherche')
    const searchResponse = await fetch(`${BASE_URL}/api/admin/stock?search=crème`)
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      console.log('✅ Recherche fonctionnelle')
      console.log(`   - Produits trouvés: ${searchData.items.length}`)
    } else {
      console.log('❌ Erreur lors de la recherche')
    }
    
    // Test 3: Tri par stock
    console.log('\n📊 Test 3: Tri par stock')
    const sortResponse = await fetch(`${BASE_URL}/api/admin/stock?sortBy=stock&sortOrder=desc`)
    
    if (sortResponse.ok) {
      const sortData = await sortResponse.json()
      console.log('✅ Tri fonctionnel')
      if (sortData.items.length >= 2) {
        console.log(`   - Premier produit: ${sortData.items[0].product_name} (${sortData.items[0].current_stock})`)
        console.log(`   - Deuxième produit: ${sortData.items[1].product_name} (${sortData.items[1].current_stock})`)
      }
    } else {
      console.log('❌ Erreur lors du tri')
    }
    
    // Test 4: Filtrage par statut
    console.log('\n🟡 Test 4: Filtrage par statut (stock faible)')
    const statusResponse = await fetch(`${BASE_URL}/api/admin/stock?status=low`)
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json()
      console.log('✅ Filtrage par statut fonctionnel')
      console.log(`   - Produits avec stock faible: ${statusData.items.length}`)
    } else {
      console.log('❌ Erreur lors du filtrage par statut')
    }
    
    // Test 5: Mise à jour du stock (si on a des produits)
    if (data.items.length > 0) {
      console.log('\n📝 Test 5: Mise à jour du stock')
      const firstProduct = data.items[0]
      const newStock = firstProduct.current_stock + 1
      
      const updateResponse = await fetch(`${BASE_URL}/api/admin/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: firstProduct.product_id,
          stock: newStock
        })
      })
      
      if (updateResponse.ok) {
        const updateData = await updateResponse.json()
        console.log('✅ Mise à jour du stock réussie')
        console.log(`   - Produit: ${firstProduct.product_name}`)
        console.log(`   - Ancien stock: ${firstProduct.current_stock}`)
        console.log(`   - Nouveau stock: ${newStock}`)
        
        // Remettre l'ancien stock
        await fetch(`${BASE_URL}/api/admin/stock`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: firstProduct.product_id,
            stock: firstProduct.current_stock
          })
        })
        console.log('   - Stock restauré à sa valeur originale')
      } else {
        console.log('❌ Erreur lors de la mise à jour du stock')
        const error = await updateResponse.json()
        console.error('Détails:', error)
      }
    }
    
    console.log('\n🎉 Tous les tests terminés!')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
  }
}

// Exécuter les tests
testStockAPI() 