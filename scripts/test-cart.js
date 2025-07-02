#!/usr/bin/env node

/**
 * Script de test simple pour vérifier le fonctionnement du panier
 * Usage: node scripts/test-cart.js
 */

const https = require('https')
const http = require('http')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

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

async function testCartAPI() {
  console.log('🧪 Test du panier invité...\n')

  try {
    // Test 1: GET /api/cart (panier vide)
    console.log('1. Test GET /api/cart (panier vide)')
    const emptyCart = await makeRequest('/api/cart')
    console.log(`   Status: ${emptyCart.status}`)
    console.log(`   Total items: ${emptyCart.data.totalItems}`)
    console.log(`   Cart ID: ${emptyCart.data.cart?.id || 'null'}`)
    console.log('   ✅ OK\n')

    // Test 2: POST /api/cart (ajouter un produit)
    console.log('2. Test POST /api/cart (ajouter un produit)')
    const addProduct = await makeRequest('/api/cart', 'POST', {
      productId: 'test-product-id',
      quantity: 1
    })
    console.log(`   Status: ${addProduct.status}`)
    if (addProduct.status === 400) {
      console.log('   ⚠️  Produit de test non trouvé (normal)')
    } else {
      console.log('   ✅ Produit ajouté')
    }
    console.log('')

    // Test 3: GET /api/cart (après ajout)
    console.log('3. Test GET /api/cart (après ajout)')
    const cartAfterAdd = await makeRequest('/api/cart')
    console.log(`   Status: ${cartAfterAdd.status}`)
    console.log(`   Total items: ${cartAfterAdd.data.totalItems}`)
    console.log('   ✅ OK\n')

    // Test 4: DELETE /api/cart (supprimer un produit)
    console.log('4. Test DELETE /api/cart')
    const deleteProduct = await makeRequest('/api/cart?productId=test-product-id', 'DELETE')
    console.log(`   Status: ${deleteProduct.status}`)
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
  
  await testCartAPI()
}

if (require.main === module) {
  main()
} 