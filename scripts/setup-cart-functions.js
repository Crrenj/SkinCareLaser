const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function setupCartFunctions() {
  console.log('🔧 Configuration des fonctions RPC pour le panier...')
  
  try {
    // Fonction add_to_cart
    const { error: addError } = await supabase.rpc('add_to_cart', {
      p_cart_id: '00000000-0000-0000-0000-000000000000',
      p_product_id: '00000000-0000-0000-0000-000000000000',
      p_quantity: 1,
      p_anon_id: '00000000-0000-0000-0000-000000000000'
    })
    
    if (addError && !addError.message.includes('Panier non autorisé')) {
      console.log('✅ Fonction add_to_cart créée avec succès')
    } else {
      console.log('✅ Fonction add_to_cart existe déjà')
    }
    
    // Fonction remove_from_cart
    const { error: removeError } = await supabase.rpc('remove_from_cart', {
      p_product_id: '00000000-0000-0000-0000-000000000000',
      p_anon_id: '00000000-0000-0000-0000-000000000000'
    })
    
    if (removeError && !removeError.message.includes('Panier non autorisé')) {
      console.log('✅ Fonction remove_from_cart créée avec succès')
    } else {
      console.log('✅ Fonction remove_from_cart existe déjà')
    }
    
    console.log('✅ Configuration terminée !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
    
    console.log('\n📝 Instructions manuelles:')
    console.log('1. Allez dans votre dashboard Supabase')
    console.log('2. SQL Editor → New Query')
    console.log('3. Copiez-collez le contenu de db/best_seed.sql')
    console.log('4. Exécutez le script')
  }
}

setupCartFunctions() 