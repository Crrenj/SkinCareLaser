/**
 * Script pour vérifier la structure de la table profiles
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProfilesStructure() {
  console.log('🔍 Vérification de la structure de la table profiles...\n')

  try {
    // 1. Récupérer tous les profils
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')

    if (error) {
      console.error('❌ Erreur:', error.message)
      return
    }

    console.log(`📊 Total des profils: ${profiles.length}`)
    
    if (profiles.length > 0) {
      console.log('\n📋 Structure des colonnes:')
      const columns = Object.keys(profiles[0])
      columns.forEach(col => {
        console.log(`   - ${col}`)
      })

      console.log('\n👥 Profils existants:')
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ID: ${profile.id}`)
        console.log(`      is_admin: ${profile.is_admin}`)
        if (profile.first_name) console.log(`      first_name: ${profile.first_name}`)
        if (profile.last_name) console.log(`      last_name: ${profile.last_name}`)
        if (profile.created_at) console.log(`      created_at: ${profile.created_at}`)
        console.log()
      })
    } else {
      console.log('⚠️  Aucun profil trouvé')
    }

    // 2. Récupérer les utilisateurs auth
    console.log('👤 Utilisateurs dans auth.users:')
    const { data: users, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Erreur auth:', authError.message)
    } else {
      users.users.forEach(user => {
        console.log(`   📧 ${user.email} (ID: ${user.id})`)
      })
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

checkProfilesStructure().catch(console.error) 