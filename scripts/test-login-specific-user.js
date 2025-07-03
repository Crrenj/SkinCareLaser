/**
 * Script pour tester la connexion avec un utilisateur spécifique
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testLoginSpecificUser() {
  console.log('🧪 Test de connexion utilisateur spécifique...\n')

  // Utiliser l'email admin
  const adminEmail = 'j@gmail.com'
  
  console.log(`🔑 Test avec l'utilisateur admin: ${adminEmail}`)
  console.log('⚠️  Note: Le mot de passe doit être entré manuellement pour la sécurité\n')

  try {
    // Simpler: juste vérifier si on peut récupérer le profil
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'e7bc4c23-a9c8-4551-b212-b6a540af21ed')
      .single()

    if (error) {
      console.error('❌ Erreur profil:', error.message)
    } else {
      console.log('✅ Profil admin trouvé:')
      console.log(`   Nom: ${profile.first_name} ${profile.last_name}`)
      console.log(`   Admin: ${profile.is_admin}`)
      console.log(`   ID: ${profile.id}`)
    }

    // Vérifier la session actuelle (s'il y en a une)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('⚠️  Aucune session active (normal)')
    } else if (sessionData.session) {
      console.log('✅ Session active trouvée:')
      console.log(`   User: ${sessionData.session.user.email}`)
    } else {
      console.log('ℹ️  Aucune session active')
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }

  console.log('\n📝 Instructions pour tester:')
  console.log('1. Ouvrez votre navigateur sur http://localhost:3000/login')
  console.log('2. Connectez-vous avec: j@gmail.com')
  console.log('3. Ouvrez la console de développement (F12)')
  console.log('4. Vérifiez les logs de redirection')
  console.log('5. Si ça ne fonctionne pas, essayez de vider le cache du navigateur')
}

testLoginSpecificUser().catch(console.error) 