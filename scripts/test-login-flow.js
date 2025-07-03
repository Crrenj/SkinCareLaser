/**
 * Script de test du flux de connexion
 * Vérifie la configuration Supabase et les utilisateurs admin
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Charger les variables d'environnement
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testLoginFlow() {
  console.log('🧪 Test du flux de connexion...\n')

  // 1. Vérifier la configuration
  console.log('1. Configuration Supabase:')
  console.log(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`)
  console.log(`   Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)}...`)
  console.log(`   Service Role: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configuré' : 'Manquant'}\n`)

  // 2. Lister les utilisateurs admin
  console.log('2. Utilisateurs admin disponibles:')
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, is_admin')
      .eq('is_admin', true)

    if (error) {
      console.error('   ❌ Erreur:', error.message)
    } else if (profiles.length === 0) {
      console.log('   ⚠️  Aucun utilisateur admin trouvé')
    } else {
      profiles.forEach(profile => {
        console.log(`   ✅ ${profile.email} (ID: ${profile.id})`)
      })
    }
  } catch (error) {
    console.error('   ❌ Erreur de connexion:', error.message)
  }

  console.log()

  // 3. Vérifier la table auth.users
  console.log('3. Utilisateurs dans auth.users:')
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('   ❌ Erreur:', error.message)
    } else {
      console.log(`   📊 Total: ${users.users.length} utilisateurs`)
      users.users.forEach(user => {
        const role = user.app_metadata?.role || 'user'
        console.log(`   👤 ${user.email} - Role: ${role}`)
      })
    }
  } catch (error) {
    console.error('   ❌ Erreur:', error.message)
  }

  console.log()

  // 4. Suggestions de correction
  console.log('4. Suggestions de correction:')
  console.log('   - Vérifiez que vous utilisez les bons identifiants')
  console.log('   - Assurez-vous que votre utilisateur est marqué comme admin')
  console.log('   - Videz le cache du navigateur')
  console.log('   - Redémarrez le serveur de développement')
  console.log('   - Utilisez la console de développement pour voir les erreurs JS')
}

testLoginFlow().catch(console.error) 