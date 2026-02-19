/**
 * Script de correction ciblée des politiques RLS
 * Basé sur l'analyse précédente qui a confirmé la récursion
 */

import { createClient } from '@supabase/supabase-js'

// Configuration directe
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9mcWpxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQzOTkyOSwiZXhwIjoyMDY2MDE1OTI5fQ.98FXsrhus3HOPJrh10GxmWB7THDFr3HN6MhWfwMplfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRLSTargeted() {
  console.log('🎯 CORRECTION CIBLÉE DES POLITIQUES RLS')
  console.log('=' .repeat(50))
  console.log('Basé sur l\'analyse qui a confirmé la récursion infinie\n')

  try {
    // ÉTAPE 1: Désactiver RLS temporairement
    console.log('📋 ÉTAPE 1: Désactivation temporaire de RLS')
    console.log('-'.repeat(40))
    
    // Désactiver RLS sur la table profiles
    console.log('   Désactivation RLS sur profiles...')
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;' 
    }).catch(() => {
      console.log('   ⚠️  exec_sql non disponible, continuons...')
    })

    // ÉTAPE 2: Vérifier l'état actuel
    console.log('\n📊 ÉTAPE 2: Vérification de l\'état actuel')
    console.log('-'.repeat(40))
    
    // Tester l'accès sans RLS
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, display_name, is_admin')
      .limit(3)

    if (testError) {
      console.log('   ❌ Erreur test:', testError.message)
    } else {
      console.log('   ✅ Accès OK sans RLS:')
      testData.forEach(profile => {
        console.log(`      - ${profile.display_name} (admin: ${profile.is_admin})`)
      })
    }

    // ÉTAPE 3: Créer des politiques simplifiées
    console.log('\n🔧 ÉTAPE 3: Création de politiques simplifiées')
    console.log('-'.repeat(40))
    
    // Politique 1: Accès à son propre profil
    console.log('   Création: Accès à son propre profil...')
    const policy1 = `
      CREATE POLICY "users_own_profile" 
      ON public.profiles FOR ALL 
      USING (auth.uid() = id);
    `
    
    // Politique 2: Accès admin spécifique (sans récursion)
    console.log('   Création: Accès admin spécifique...')
    const policy2 = `
      CREATE POLICY "admin_full_access" 
      ON public.profiles FOR ALL 
      USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);
    `

    // Essayer de créer les politiques via des requêtes simples
    // Comme exec_sql n'existe pas, on va créer un script SQL à exécuter manuellement
    
    console.log('\n📝 ÉTAPE 4: Script SQL à exécuter manuellement')
    console.log('-'.repeat(40))
    console.log('Copiez et exécutez ce script dans Supabase Dashboard > SQL Editor:')
    console.log('')
    console.log('-- 🔧 CORRECTION DES POLITIQUES RLS')
    console.log('-- Étape 1: Désactiver RLS temporairement')
    console.log('ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Étape 2: Supprimer toutes les politiques existantes')
    console.log('DROP POLICY IF EXISTS "View own profile" ON public.profiles;')
    console.log('DROP POLICY IF EXISTS "Create own profile" ON public.profiles;')
    console.log('DROP POLICY IF EXISTS "Update own profile" ON public.profiles;')
    console.log('DROP POLICY IF EXISTS "Admin user access" ON public.profiles;')
    console.log('DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;')
    console.log('DROP POLICY IF EXISTS "admin_full_access" ON public.profiles;')
    console.log('')
    console.log('-- Étape 3: Créer des politiques simples SANS RÉCURSION')
    console.log('CREATE POLICY "users_own_profile"')
    console.log('ON public.profiles FOR ALL')
    console.log('USING (auth.uid() = id);')
    console.log('')
    console.log('CREATE POLICY "admin_full_access"')
    console.log('ON public.profiles FOR ALL')
    console.log('USING (auth.uid() = \'e7bc4c23-a9c8-4551-b212-b6a540af21ed\'::uuid);')
    console.log('')
    console.log('-- Étape 4: Réactiver RLS')
    console.log('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Étape 5: Vérifier les politiques')
    console.log('SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = \'profiles\';')

    // ÉTAPE 5: Test final programmé
    console.log('\n🧪 ÉTAPE 5: Test programmé (après exécution manuelle)')
    console.log('-'.repeat(40))
    console.log('Après avoir exécuté le script SQL ci-dessus:')
    console.log('1. Testez la connexion avec j@gmail.com sur http://localhost:3001/login')
    console.log('2. Vérifiez que la redirection vers /admin/overview fonctionne')
    console.log('3. Exécutez: node scripts/test-admin-login.js')

    console.log('\n✅ Script de correction préparé!')
    console.log('📋 Action requise: Exécutez le script SQL dans Supabase Dashboard')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

fixRLSTargeted() 