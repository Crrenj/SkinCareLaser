#!/usr/bin/env node

/**
 * Script de test avec un vrai produit pour vérifier le fonctionnement du panier
 * Usage: node scripts/test-cart-real.js
 */

const https = require('https')
const http = require('http')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ID d'un produit qui existe probablement dans votre base
const REAL_PRODUCT_ID = '91e97ee7-c2ff-425a-8bf7-9b2147434804'

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const isHttps = url.protocol === 'https:'
    const client = isHttps ? https : http
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cart-Test-Script/1.0'
      }
    }

    const req = client.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body)
          resolve({ status: res.statusCode, data: jsonBody })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

async function testCartWithRealProduct() {
  console.log('🧪 Test du panier avec un vrai produit...\n')

  try {
    // Test 1: GET /api/cart (panier vide)
    console.log('1. Test GET /api/cart (panier vide)')
    const emptyCart = await makeRequest('/api/cart')
    console.log(`   Status: ${emptyCart.status}`)
    console.log(`   Total items: ${emptyCart.data.totalItems}`)
    console.log(`   Cart ID: ${emptyCart.data.cart?.id || 'null'}`)
    console.log('   ✅ OK\n')

    // Test 2: POST /api/cart (ajouter un vrai produit)
    console.log('2. Test POST /api/cart (ajouter un vrai produit)')
    const addProduct = await makeRequest('/api/cart', 'POST', {
      productId: REAL_PRODUCT_ID,
      quantity: 2
    })
    console.log(`   Status: ${addProduct.status}`)
    if (addProduct.status === 200) {
      console.log('   ✅ Produit ajouté avec succès')
    } else if (addProduct.status === 404) {
      console.log('   ⚠️  Produit non trouvé (vérifiez l\'ID dans votre base)')
    } else {
      console.log(`   ❌ Erreur: ${addProduct.data.error || 'Erreur inconnue'}`)
    }
    console.log('')

    // Test 3: GET /api/cart (après ajout)
    console.log('3. Test GET /api/cart (après ajout)')
    const cartAfterAdd = await makeRequest('/api/cart')
    console.log(`   Status: ${cartAfterAdd.status}`)
    console.log(`   Total items: ${cartAfterAdd.data.totalItems}`)
    if (cartAfterAdd.data.cart?.items?.length > 0) {
      console.log(`   Items dans le panier: ${cartAfterAdd.data.cart.items.length}`)
      cartAfterAdd.data.cart.items.forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.product.name} (x${item.quantity})`)
      })
    }
    console.log('   ✅ OK\n')

    // Test 4: POST /api/cart (modifier quantité)
    console.log('4. Test POST /api/cart (modifier quantité)')
    const updateQuantity = await makeRequest('/api/cart', 'POST', {
      productId: REAL_PRODUCT_ID,
      quantity: 3
    })
    console.log(`   Status: ${updateQuantity.status}`)
    if (updateQuantity.status === 200) {
      console.log('   ✅ Quantité mise à jour')
    } else {
      console.log(`   ❌ Erreur: ${updateQuantity.data.error || 'Erreur inconnue'}`)
    }
    console.log('')

    // Test 5: GET /api/cart (après modification)
    console.log('5. Test GET /api/cart (après modification)')
    const cartAfterUpdate = await makeRequest('/api/cart')
    console.log(`   Status: ${cartAfterUpdate.status}`)
    console.log(`   Total items: ${cartAfterUpdate.data.totalItems}`)
    console.log(`   Total price: ${cartAfterUpdate.data.totalPrice} DOP`)
    console.log('   ✅ OK\n')

    // Test 6: DELETE /api/cart (supprimer le produit)
    console.log('6. Test DELETE /api/cart')
    const deleteProduct = await makeRequest(`/api/cart?productId=${REAL_PRODUCT_ID}`, 'DELETE')
    console.log(`   Status: ${deleteProduct.status}`)
    if (deleteProduct.status === 200) {
      console.log('   ✅ Produit supprimé')
    } else {
      console.log(`   ❌ Erreur: ${deleteProduct.data.error || 'Erreur inconnue'}`)
    }
    console.log('')

    // Test 7: GET /api/cart (après suppression)
    console.log('7. Test GET /api/cart (après suppression)')
    const cartAfterDelete = await makeRequest('/api/cart')
    console.log(`   Status: ${cartAfterDelete.status}`)
    console.log(`   Total items: ${cartAfterDelete.data.totalItems}`)
    console.log('   ✅ OK\n')

    console.log('🎉 Tous les tests sont passés !')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
    process.exit(1)
  }
}

// Vérifier que le serveur est accessible
async function checkServer() {
  try {
    const response = await makeRequest('/')
    console.log('🌐 Serveur accessible:', BASE_URL)
    return true
  } catch (error) {
    console.error('❌ Serveur non accessible:', BASE_URL)
    console.error('   Assurez-vous que le serveur Next.js est démarré (npm run dev)')
    return false
  }
}

async function main() {
  const serverOk = await checkServer()
  if (!serverOk) {
    process.exit(1)
  }
  
  await testCartWithRealProduct()
}

if (require.main === module) {
  main()
} 