import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables manquantes')
  process.exit(1)
}

/**
 * Test des accès storage pour admin vs user normal
 */
async function testStorageAccess() {
  console.log('🧪 Test des accès Storage\n')

  // 1. Test lecture publique (sans auth)
  console.log('1️⃣ Test lecture publique...')
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    const { data: files } = await anonClient.storage
      .from('product-image')
      .list()
    
    console.log('✅ Lecture publique OK -', files?.length || 0, 'fichiers')
  } catch (error) {
    console.log('❌ Lecture publique échouée:', error.message)
  }

  // 2. Test avec compte admin
  console.log('\n2️⃣ Test compte admin...')
  const adminEmail = 'admin@test.com' // Remplacer par votre admin
  const adminPassword = 'password123' // Remplacer par le mot de passe
  
  const adminClient = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Se connecter
    const { data: { user }, error: authError } = await adminClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })
    
    if (authError) throw authError
    console.log('✅ Connexion admin OK:', user.email)
    
    // Test upload
    const testFile = new Blob(['test'], { type: 'text/plain' })
    const fileName = `test/admin-test-${Date.now()}.txt`
    
    const { error: uploadError } = await adminClient.storage
      .from('product-image')
      .upload(fileName, testFile)
    
    if (uploadError) {
      console.log('❌ Upload admin échoué:', uploadError.message)
    } else {
      console.log('✅ Upload admin OK')
      
      // Test delete
      const { error: deleteError } = await adminClient.storage
        .from('product-image')
        .remove([fileName])
      
      if (deleteError) {
        console.log('❌ Delete admin échoué:', deleteError.message)
      } else {
        console.log('✅ Delete admin OK')
      }
    }
    
  } catch (error) {
    console.log('❌ Test admin échoué:', error.message)
  }

  // 3. Test avec compte normal
  console.log('\n3️⃣ Test compte normal...')
  const userEmail = 'user@test.com' // Remplacer par un user non-admin
  const userPassword = 'password123' // Remplacer par le mot de passe
  
  const userClient = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Se connecter
    const { data: { user }, error: authError } = await userClient.auth.signInWithPassword({
      email: userEmail,
      password: userPassword
    })
    
    if (authError) throw authError
    console.log('✅ Connexion user OK:', user.email)
    
    // Test upload (devrait échouer)
    const testFile = new Blob(['test'], { type: 'text/plain' })
    const fileName = `test/user-test-${Date.now()}.txt`
    
    const { error: uploadError } = await userClient.storage
      .from('product-image')
      .upload(fileName, testFile)
    
    if (uploadError) {
      console.log('✅ Upload user bloqué (comportement attendu):', uploadError.message)
    } else {
      console.log('❌ PROBLÈME: User normal a pu uploader!')
    }
    
  } catch (error) {
    console.log('❌ Test user échoué:', error.message)
  }

  console.log('\n✅ Tests terminés')
}

// Exécuter les tests
testStorageAccess() 