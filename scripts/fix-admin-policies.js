/**
 * Script pour ajouter les politiques admin manquantes
 */

import { createClient } from '@supabase/supabase-js'

// Configuration directe
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9mcWpxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQzOTkyOSwiZXhwIjoyMDY2MDE1OTI5fQ.98FXsrhus3HOPJrh10GxmWB7THDFr3HN6MhWfwMplfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAdminPolicies() {
  console.log('🔧 Ajout des politiques admin manquantes...\n')

  try {
    // 1. Désactiver RLS temporairement
    console.log('1. Désactivation temporaire de RLS...')
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;' 
    })

    // 2. Ajouter la politique admin pour voir tous les profils
    console.log('2. Ajout de la politique admin pour voir tous les profils...')
    await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE POLICY "Admins can view all profiles" 
        ON public.profiles FOR SELECT 
        USING (
          auth.uid() = id 
          OR (
            SELECT is_admin FROM public.profiles admin_check
            WHERE admin_check.id = auth.uid()
          ) = true
        );
      ` 
    })

    // 3. Ajouter la politique admin pour gérer tous les profils
    console.log('3. Ajout de la politique admin pour gérer tous les profils...')
    await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE POLICY "Admins can manage all profiles" 
        ON public.profiles FOR ALL 
        USING (
          (SELECT is_admin FROM public.profiles admin_check
           WHERE admin_check.id = auth.uid()) = true
        );
      ` 
    })

    // 4. Réactiver RLS
    console.log('4. Réactivation de RLS...')
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;' 
    })

    // 5. Tester l'accès admin
    console.log('5. Test de l\'accès admin...')
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'e7bc4c23-a9c8-4551-b212-b6a540af21ed')
      .single()

    if (testError) {
      console.log('❌ Erreur test:', testError.message)
    } else {
      console.log('✅ Profil admin trouvé:', testProfile.display_name)
    }

    console.log('\n✅ Politiques admin ajoutées!')
    console.log('🧪 Testez maintenant la connexion avec j@gmail.com')
    console.log('📋 La redirection vers /admin/overview devrait maintenant fonctionner')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.log('\n💡 Essayez d\'exécuter manuellement dans Supabase Dashboard:')
    console.log('1. ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;')
    console.log('2. CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() = id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);')
    console.log('3. ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;')
  }
}

fixAdminPolicies() 