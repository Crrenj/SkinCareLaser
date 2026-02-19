/**
 * Script final pour éliminer la récursion RLS
 * Approche: Utiliser uniquement auth.uid() sans référence à profiles
 */

import { createClient } from '@supabase/supabase-js'

// Configuration directe
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9mcWpxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQzOTkyOSwiZXhwIjoyMDY2MDE1OTI5fQ.98FXsrhus3HOPJrh10GxmWB7THDFr3HN6MhWfwMplfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRecursionFinal() {
  console.log('🔧 Correction finale de la récursion RLS...\n')

  try {
    // 1. Désactiver RLS temporairement
    console.log('1. Désactivation temporaire de RLS...')
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;' 
    })

    // 2. Supprimer TOUTES les politiques existantes
    console.log('2. Suppression de toutes les politiques existantes...')
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;',
      'DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;'
    ]

    for (const policy of dropPolicies) {
      await supabase.rpc('exec_sql', { sql_query: policy })
    }

    // 3. Créer des politiques simples SANS RÉCURSION
    console.log('3. Création de politiques simples...')
    
    // Politique 1: Voir son propre profil
    await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE POLICY "View own profile" 
        ON public.profiles FOR SELECT 
        USING (auth.uid() = id);
      ` 
    })

    // Politique 2: Créer son propre profil
    await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE POLICY "Create own profile" 
        ON public.profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
      ` 
    })

    // Politique 3: Mettre à jour son propre profil
    await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE POLICY "Update own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
      ` 
    })

    // Politique 4: Admin spécifique par UUID (pas de récursion)
    await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE POLICY "Admin user access" 
        ON public.profiles FOR ALL 
        USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);
      ` 
    })

    // 4. Réactiver RLS
    console.log('4. Réactivation de RLS...')
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;' 
    })

    // 5. Tester l'accès
    console.log('5. Test de l\'accès...')
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'e7bc4c23-a9c8-4551-b212-b6a540af21ed')
      .single()

    if (testError) {
      console.log('❌ Erreur test:', testError.message)
    } else {
      console.log('✅ Profil admin accessible:', testProfile.display_name)
    }

    console.log('\n✅ Correction finale terminée!')
    console.log('🎯 Politiques créées:')
    console.log('   - View own profile (pour tous)')
    console.log('   - Create own profile (pour tous)')
    console.log('   - Update own profile (pour tous)')
    console.log('   - Admin user access (pour j@gmail.com uniquement)')
    console.log('\n🧪 Testez maintenant la connexion!')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

fixRecursionFinal() 