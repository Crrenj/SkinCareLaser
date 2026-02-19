/**
 * Script simple pour corriger la récursion RLS
 */

import { createClient } from '@supabase/supabase-js'

// Configuration directe
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9mcWpxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQzOTkyOSwiZXhwIjoyMDY2MDE1OTI5fQ.98FXsrhus3HOPJrh10GxmWB7THDFr3HN6MhWfwMplfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRLS() {
  console.log('🔧 Correction de la récursion RLS...\n')

  try {
    // 1. Désactiver RLS temporairement
    console.log('1. Désactivation temporaire de RLS...')
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;' 
    })

    // 2. Supprimer les anciennes politiques
    console.log('2. Suppression des anciennes politiques...')
    const dropPolicies = [
      'DROP POLICY IF EXISTS "View own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Admin view all" ON public.profiles;',
      'DROP POLICY IF EXISTS "Create own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Update own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Admin manage all" ON public.profiles;'
    ]

    for (const policy of dropPolicies) {
      await supabase.rpc('exec_sql', { sql_query: policy })
    }

    // 3. Créer les nouvelles politiques
    console.log('3. Création des nouvelles politiques...')
    
    // Politique pour voir son propre profil
    await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE POLICY "Users can view own profile" 
        ON public.profiles FOR SELECT 
        USING (auth.uid() = id);
      ` 
    })

    // Politique pour créer son profil
    await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE POLICY "Users can create own profile" 
        ON public.profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
      ` 
    })

    // Politique pour mettre à jour son profil
    await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE POLICY "Users can update own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
      ` 
    })

    // 4. Réactiver RLS
    console.log('4. Réactivation de RLS...')
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;' 
    })

    console.log('✅ Correction terminée!')
    console.log('🧪 Testez maintenant la connexion avec j@gmail.com')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.log('\n💡 Essayez d\'exécuter manuellement dans Supabase Dashboard:')
    console.log('1. ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;')
    console.log('2. DROP POLICY IF EXISTS "Admin view all" ON public.profiles;')
    console.log('3. CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);')
    console.log('4. ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;')
  }
}

fixRLS() 