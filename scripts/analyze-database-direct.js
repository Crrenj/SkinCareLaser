/**
 * Script d'analyse directe de la base de données
 * Utilise des requêtes directes sur les vues système PostgreSQL
 */

import { createClient } from '@supabase/supabase-js'

// Configuration directe
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9mcWpxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQzOTkyOSwiZXhwIjoyMDY2MDE1OTI5fQ.98FXsrhus3HOPJrh10GxmWB7THDFr3HN6MhWfwMplfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeDatabaseDirect() {
  console.log('🔍 ANALYSE DIRECTE DE LA BASE DE DONNÉES')
  console.log('=' .repeat(60))

  try {
    // 1. ANALYSER LA TABLE PROFILES DIRECTEMENT
    console.log('\n👤 1. DONNÉES DE LA TABLE PROFILES')
    console.log('-'.repeat(40))
    
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at')

      if (profilesError) {
        console.log('❌ Erreur données profiles:', profilesError.message)
        console.log('   Code:', profilesError.code)
        console.log('   Details:', profilesError.details)
      } else {
        console.log('✅ Données de la table profiles:')
        profilesData.forEach((profile, index) => {
          console.log(`   ${index + 1}. ID: ${profile.id}`)
          console.log(`      Display Name: ${profile.display_name}`)
          console.log(`      Is Admin: ${profile.is_admin}`)
          console.log(`      Role: ${profile.role}`)
          console.log(`      Created: ${profile.created_at}`)
          console.log('')
        })
      }
    } catch (error) {
      console.log('❌ Erreur catch profiles:', error.message)
    }

    // 2. ANALYSER LA TABLE ADMIN_USERS
    console.log('\n🔑 2. TABLE ADMIN_USERS')
    console.log('-'.repeat(40))
    
    try {
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at')

      if (adminError) {
        console.log('❌ Erreur admin_users:', adminError.message)
        console.log('   Code:', adminError.code)
      } else {
        console.log('✅ Données de la table admin_users:')
        adminUsers.forEach((admin, index) => {
          console.log(`   ${index + 1}. User ID: ${admin.user_id}`)
          console.log(`      Created: ${admin.created_at}`)
        })
      }
    } catch (error) {
      console.log('❌ Erreur catch admin_users:', error.message)
    }

    // 3. TESTER L'ACCÈS AVEC DIFFÉRENTS UTILISATEURS
    console.log('\n🧪 3. TEST D\'ACCÈS AVEC L\'UTILISATEUR ADMIN')
    console.log('-'.repeat(40))
    
    try {
      // Créer un client avec une session utilisateur normal (pas service)
      const supabaseUser = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9mcWpxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Mzk5MjksImV4cCI6MjA2NjAxNTkyOX0.yn-XK6I4AyOLCndsFmZqDQFTAr9vnySsc8wFc4nC68s')
      
      // Tenter une connexion
      console.log('   Tentative de connexion avec j@gmail.com...')
      const { data: authData, error: authError } = await supabaseUser.auth.signInWithPassword({
        email: 'j@gmail.com',
        password: '123456789'
      })

      if (authError) {
        console.log('   ❌ Erreur de connexion:', authError.message)
      } else {
        console.log('   ✅ Connexion réussie!')
        console.log(`   User ID: ${authData.session.user.id}`)
        
        // Tester l'accès au profil
        console.log('   Test d\'accès au profil...')
        const { data: userProfile, error: userProfileError } = await supabaseUser
          .from('profiles')
          .select('*')
          .eq('id', authData.session.user.id)
          .single()

        if (userProfileError) {
          console.log('   ❌ Erreur accès profil:', userProfileError.message)
          console.log('   🎯 RÉCURSION DÉTECTÉE ICI!')
        } else {
          console.log('   ✅ Profil accessible:', userProfile.display_name)
        }

        // Déconnexion
        await supabaseUser.auth.signOut()
      }
    } catch (error) {
      console.log('   ❌ Erreur test utilisateur:', error.message)
    }

    // 4. ANALYSER LES AUTRES TABLES
    console.log('\n📊 4. AUTRES TABLES IMPORTANTES')
    console.log('-'.repeat(40))
    
    const tables = ['products', 'brands', 'ranges', 'carts', 'cart_items']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ ${table}: ${count} enregistrements`)
        }
      } catch (error) {
        console.log(`   ❌ ${table}: Erreur catch - ${error.message}`)
      }
    }

    // 5. DIAGNOSTIC FINAL
    console.log('\n🎯 5. DIAGNOSTIC ET RECOMMANDATIONS')
    console.log('-'.repeat(40))
    
    console.log('Résumé de l\'analyse:')
    console.log('1. Si "RÉCURSION DÉTECTÉE" apparaît ci-dessus = problème confirmé')
    console.log('2. Les politiques RLS sur profiles causent une boucle infinie')
    console.log('3. Solution: Simplifier les politiques sans référence circulaire')
    console.log('')
    console.log('Plan de correction recommandé:')
    console.log('• Désactiver temporairement RLS sur profiles')
    console.log('• Supprimer toutes les politiques existantes')
    console.log('• Créer des politiques simples basées sur auth.uid() uniquement')
    console.log('• Éviter les fonctions qui référencent profiles dans les politiques')

    console.log('\n✅ Analyse directe terminée!')

  } catch (error) {
    console.error('❌ Erreur globale:', error.message)
  }
}

analyzeDatabaseDirect() 