/**
 * Script de vérification post-correction
 * À exécuter APRÈS avoir appliqué le script SQL de correction
 */

import { createClient } from '@supabase/supabase-js'

// Configuration directe
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9mcWpxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Mzk5MjksImV4cCI6MjA2NjAxNTkyOX0.yn-XK6I4AyOLCndsFmZqDQFTAr9vnySsc8wFc4nC68s'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyFix() {
  console.log('🔍 VÉRIFICATION DE LA CORRECTION RLS')
  console.log('=' .repeat(50))
  console.log('Test après application du script SQL de correction\n')

  try {
    // TEST 1: Connexion admin
    console.log('📋 TEST 1: Connexion de l\'utilisateur admin')
    console.log('-'.repeat(40))
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'j@gmail.com',
      password: '123456789'
    })

    if (authError) {
      console.log('❌ Échec de la connexion:', authError.message)
      return
    }

    console.log('✅ Connexion réussie!')
    console.log(`   User ID: ${authData.session.user.id}`)
    console.log(`   Email: ${authData.session.user.email}`)

    // TEST 2: Accès au profil admin
    console.log('\n📋 TEST 2: Accès au profil admin')
    console.log('-'.repeat(40))
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.session.user.id)
      .single()

    if (profileError) {
      console.log('❌ Erreur accès profil:', profileError.message)
      if (profileError.message.includes('infinite recursion')) {
        console.log('🚨 RÉCURSION ENCORE PRÉSENTE! Le script SQL n\'a pas été appliqué correctement.')
        return
      }
    } else {
      console.log('✅ Profil accessible sans récursion!')
      console.log(`   Display Name: ${profile.display_name}`)
      console.log(`   Is Admin: ${profile.is_admin}`)
      console.log(`   Role: ${profile.role}`)
    }

    // TEST 3: Accès à tous les profils (test admin)
    console.log('\n📋 TEST 3: Accès admin à tous les profils')
    console.log('-'.repeat(40))
    
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, display_name, is_admin')
      .limit(5)

    if (allProfilesError) {
      console.log('❌ Erreur accès tous profils:', allProfilesError.message)
    } else {
      console.log('✅ Accès à tous les profils réussi!')
      allProfiles.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.display_name} (admin: ${p.is_admin})`)
      })
    }

    // TEST 4: Vérification de la logique de redirection
    console.log('\n📋 TEST 4: Logique de redirection')
    console.log('-'.repeat(40))
    
    if (profile && profile.is_admin) {
      console.log('✅ Utilisateur identifié comme admin')
      console.log('✅ La redirection vers /admin/overview devrait fonctionner')
    } else {
      console.log('❌ Utilisateur non identifié comme admin')
      console.log('❌ La redirection vers /admin/overview ne fonctionnera pas')
    }

    // TEST 5: Déconnexion
    console.log('\n📋 TEST 5: Déconnexion')
    console.log('-'.repeat(40))
    
    await supabase.auth.signOut()
    console.log('✅ Déconnexion réussie')

    // RÉSULTAT FINAL
    console.log('\n🎯 RÉSULTAT FINAL')
    console.log('-'.repeat(40))
    
    if (profile && profile.is_admin && !profileError) {
      console.log('🎉 CORRECTION RÉUSSIE!')
      console.log('   ✅ Plus de récursion infinie')
      console.log('   ✅ Accès admin fonctionnel')
      console.log('   ✅ Redirection possible vers /admin/overview')
      console.log('')
      console.log('🚀 Prochaines étapes:')
      console.log('   1. Testez la connexion sur http://localhost:3001/login')
      console.log('   2. Vérifiez la redirection automatique vers l\'admin')
      console.log('   3. Explorez les fonctionnalités admin')
    } else {
      console.log('❌ CORRECTION INCOMPLÈTE')
      console.log('   Le problème persiste. Vérifiez:')
      console.log('   1. Le script SQL a-t-il été exécuté entièrement?')
      console.log('   2. Y a-t-il des erreurs dans les logs Supabase?')
      console.log('   3. Les politiques ont-elles été créées correctement?')
    }

  } catch (error) {
    console.error('❌ Erreur globale:', error.message)
    console.log('\n💡 Suggestions:')
    console.log('   1. Vérifiez que le serveur de développement fonctionne')
    console.log('   2. Vérifiez les variables d\'environnement')
    console.log('   3. Réessayez l\'exécution du script SQL')
  }
}

verifyFix() 