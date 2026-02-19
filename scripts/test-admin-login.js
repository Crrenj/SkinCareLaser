/**
 * Script pour tester la connexion admin
 */

import { createClient } from '@supabase/supabase-js'

// Configuration directe
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9mcWpxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQzOTkyOSwiZXhwIjoyMDY2MDE1OTI5fQ.98FXsrhus3HOPJrh10GxmWB7THDFr3HN6MhWfwMplfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAdminLogin() {
  console.log('🧪 Test de connexion admin...\n')

  try {
    // 1. Tester la connexion
    console.log('1. Test de connexion avec j@gmail.com...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'j@gmail.com',
      password: '123456789'
    })

    if (authError) {
      console.log('❌ Erreur de connexion:', authError.message)
      return
    }

    console.log('✅ Connexion réussie!')
    console.log('   User ID:', authData.session.user.id)
    console.log('   Email:', authData.session.user.email)

    // 2. Vérifier le profil admin
    console.log('\n2. Vérification du profil admin...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.session.user.id)
      .single()

    if (profileError) {
      console.log('❌ Erreur profil:', profileError.message)
      return
    }

    console.log('✅ Profil récupéré:')
    console.log('   Display Name:', profile.display_name)
    console.log('   Is Admin:', profile.is_admin)
    console.log('   Role:', profile.role)

    // 3. Tester l'accès aux autres profils (vérification politique admin)
    console.log('\n3. Test de l\'accès admin aux autres profils...')
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, display_name, is_admin')
      .limit(5)

    if (allProfilesError) {
      console.log('❌ Erreur accès autres profils:', allProfilesError.message)
    } else {
      console.log('✅ Accès aux autres profils réussi:')
      allProfiles.forEach(p => {
        console.log(`   - ${p.display_name} (admin: ${p.is_admin})`)
      })
    }

    // 4. Résultats
    console.log('\n📊 Résultats du test:')
    if (profile.is_admin) {
      console.log('✅ L\'utilisateur est bien admin')
      console.log('✅ La redirection vers /admin/overview devrait fonctionner')
    } else {
      console.log('❌ L\'utilisateur n\'est PAS admin')
      console.log('❌ La redirection vers /admin/overview ne fonctionnera pas')
    }

    // 5. Déconnexion
    console.log('\n5. Déconnexion...')
    await supabase.auth.signOut()
    console.log('✅ Déconnexion réussie')

  } catch (error) {
    console.error('❌ Erreur globale:', error.message)
  }
}

testAdminLogin() 