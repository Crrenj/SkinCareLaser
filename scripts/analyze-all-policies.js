/**
 * Script d'analyse complète de toutes les politiques RLS
 * Identifie toutes les politiques sur toutes les tables
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9mcWpxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQzOTkyOSwiZXhwIjoyMDY2MDE1OTI5fQ.98FXsrhus3HOPJrh10GxmWB7THDFr3HN6MhWfwMplfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Requêtes SQL pour l'analyse
const queries = {
  // 1. Toutes les politiques RLS
  allPolicies: `
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `,
  
  // 2. Toutes les tables avec RLS
  tablesWithRLS: `
    SELECT 
      schemaname,
      tablename,
      rowsecurity
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = true
    ORDER BY tablename;
  `,
  
  // 3. Toutes les fonctions
  allFunctions: `
    SELECT 
      routine_name,
      routine_type,
      data_type
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    ORDER BY routine_name;
  `,
  
  // 4. Structure de la table profiles
  profilesStructure: `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    ORDER BY ordinal_position;
  `,
  
  // 5. Toutes les tables
  allTables: `
    SELECT 
      table_name,
      table_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `
}

async function analyzeAllPolicies() {
  console.log('🔍 ANALYSE COMPLÈTE DES POLITIQUES RLS ET DE LA STRUCTURE')
  console.log('=' .repeat(70))
  console.log('Objectif: Identifier TOUTES les politiques et la source de la récursion\n')

  // 1. LISTER TOUTES LES POLITIQUES
  console.log('📋 1. TOUTES LES POLITIQUES RLS DANS LA BASE')
  console.log('-'.repeat(70))
  
  try {
    // Créer un client admin qui bypass RLS
    const { data, error } = await supabase.rpc('get_all_policies', {})
      .catch(() => ({ data: null, error: 'Function not found' }))
    
    if (error || !data) {
      console.log('⚠️  Fonction get_all_policies non disponible')
      console.log('💡 Exécutez cette requête dans Supabase SQL Editor:')
      console.log('\n' + queries.allPolicies + '\n')
    }
  } catch (e) {
    console.log('Erreur:', e.message)
  }

  // 2. LISTER TOUTES LES TABLES
  console.log('\n📊 2. TOUTES LES TABLES DE LA BASE')
  console.log('-'.repeat(70))
  
  const tables = [
    'profiles', 'admin_users', 'products', 'brands', 'ranges', 
    'product_ranges', 'tags', 'tag_types', 'product_tags', 
    'product_images', 'carts', 'cart_items', 'orders', 'order_items'
  ]
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count} enregistrements`)
      }
    } catch (e) {
      console.log(`⚠️  ${table}: Non accessible`)
    }
  }

  // 3. GÉNÉRER LE SCRIPT SQL D'ANALYSE
  console.log('\n📝 3. SCRIPT SQL D\'ANALYSE COMPLÈTE')
  console.log('-'.repeat(70))
  console.log('Copiez et exécutez ce script dans Supabase SQL Editor:\n')
  
  console.log('-- ======== ANALYSE COMPLÈTE DES POLITIQUES ========')
  console.log('-- 1. Toutes les politiques RLS')
  console.log(queries.allPolicies)
  
  console.log('\n-- 2. Tables avec RLS activé')
  console.log(queries.tablesWithRLS)
  
  console.log('\n-- 3. Toutes les fonctions')
  console.log(queries.allFunctions)
  
  console.log('\n-- 4. Recherche spécifique de politiques sur profiles')
  console.log(`
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
  `)
  
  console.log('\n-- 5. Recherche de références à is_user_admin')
  console.log(`
SELECT 
  tablename,
  policyname,
  qual
FROM pg_policies 
WHERE qual LIKE '%is_user_admin%'
   OR with_check LIKE '%is_user_admin%';
  `)

  // 4. SOLUTION PROPOSÉE
  console.log('\n🔧 4. SOLUTION PROPOSÉE')
  console.log('-'.repeat(70))
  console.log('Basé sur l\'analyse, voici le script de correction:')
  console.log(`
-- DÉSACTIVER RLS SUR TOUTES LES TABLES
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('profiles', 'admin_users', 'tag_types', 'brands', 'ranges', 'products'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, 'public', r.tablename);
    END LOOP;
END $$;

-- SUPPRIMER LA FONCTION PROBLÉMATIQUE
DROP FUNCTION IF EXISTS public.is_user_admin(uuid) CASCADE;

-- CRÉER DES POLITIQUES SIMPLES POUR PROFILES
CREATE POLICY "user_access_own_profile"
ON public.profiles FOR ALL
USING (auth.uid() = id);

CREATE POLICY "admin_access_all_profiles"
ON public.profiles FOR ALL
USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- RÉACTIVER RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- VÉRIFIER
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'profiles';
  `)

  console.log('\n✅ Analyse terminée!')
  console.log('📋 Exécutez les requêtes SQL ci-dessus pour obtenir la liste complète des politiques')
}

analyzeAllPolicies() 