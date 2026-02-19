/**
 * Script d'analyse complète de la base de données
 * Analyse la structure, les tables, les politiques RLS, les fonctions, etc.
 */

import { createClient } from '@supabase/supabase-js'

// Configuration directe
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9mcWpxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQzOTkyOSwiZXhwIjoyMDY2MDE1OTI5fQ.98FXsrhus3HOPJrh10GxmWB7THDFr3HN6MhWfwMplfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeDatabaseStructure() {
  console.log('🔍 ANALYSE COMPLÈTE DE LA BASE DE DONNÉES')
  console.log('=' .repeat(60))

  try {
    // 1. ANALYSER LES TABLES
    console.log('\n📊 1. TABLES DE LA BASE DE DONNÉES')
    console.log('-'.repeat(40))
    
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          table_name,
          table_type,
          CASE 
            WHEN table_name IN (
              SELECT tablename FROM pg_tables 
              WHERE schemaname = 'public' 
              AND rowsecurity = true
            ) THEN 'Activé'
            ELSE 'Désactivé'
          END as rls_status
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    })

    if (tablesError) {
      console.log('❌ Erreur récupération tables:', tablesError.message)
    } else {
      console.log('Tables trouvées:')
      console.log(JSON.stringify(tables, null, 2))
    }

    // 2. ANALYSER LES POLITIQUES RLS
    console.log('\n🔐 2. POLITIQUES RLS')
    console.log('-'.repeat(40))
    
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql_query: `
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
      `
    })

    if (policiesError) {
      console.log('❌ Erreur récupération politiques:', policiesError.message)
    } else {
      console.log('Politiques RLS trouvées:')
      console.log(JSON.stringify(policies, null, 2))
    }

    // 3. ANALYSER LES FONCTIONS
    console.log('\n⚙️ 3. FONCTIONS PERSONNALISÉES')
    console.log('-'.repeat(40))
    
    const { data: functions, error: functionsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          routine_name,
          routine_type,
          data_type,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_name LIKE '%admin%' OR routine_name LIKE '%user%'
        ORDER BY routine_name;
      `
    })

    if (functionsError) {
      console.log('❌ Erreur récupération fonctions:', functionsError.message)
    } else {
      console.log('Fonctions trouvées:')
      console.log(JSON.stringify(functions, null, 2))
    }

    // 4. ANALYSER LA TABLE PROFILES
    console.log('\n👤 4. STRUCTURE DE LA TABLE PROFILES')
    console.log('-'.repeat(40))
    
    const { data: profilesStructure, error: profilesError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        ORDER BY ordinal_position;
      `
    })

    if (profilesError) {
      console.log('❌ Erreur structure profiles:', profilesError.message)
    } else {
      console.log('Structure de la table profiles:')
      console.log(JSON.stringify(profilesStructure, null, 2))
    }

    // 5. ANALYSER LES DONNÉES PROFILES
    console.log('\n📋 5. DONNÉES DE LA TABLE PROFILES')
    console.log('-'.repeat(40))
    
    const { data: profilesData, error: profilesDataError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          id,
          display_name,
          is_admin,
          role,
          created_at
        FROM public.profiles
        ORDER BY created_at;
      `
    })

    if (profilesDataError) {
      console.log('❌ Erreur données profiles:', profilesDataError.message)
    } else {
      console.log('Données de la table profiles:')
      console.log(JSON.stringify(profilesData, null, 2))
    }

    // 6. ANALYSER LA TABLE ADMIN_USERS
    console.log('\n🔑 6. TABLE ADMIN_USERS')
    console.log('-'.repeat(40))
    
    const { data: adminUsers, error: adminUsersError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          user_id,
          created_at
        FROM public.admin_users
        ORDER BY created_at;
      `
    })

    if (adminUsersError) {
      console.log('❌ Erreur admin_users:', adminUsersError.message)
    } else {
      console.log('Données de la table admin_users:')
      console.log(JSON.stringify(adminUsers, null, 2))
    }

    // 7. ANALYSER LES TRIGGERS
    console.log('\n🔄 7. TRIGGERS')
    console.log('-'.repeat(40))
    
    const { data: triggers, error: triggersError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          trigger_name,
          event_manipulation,
          event_object_table,
          action_statement
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        ORDER BY event_object_table, trigger_name;
      `
    })

    if (triggersError) {
      console.log('❌ Erreur triggers:', triggersError.message)
    } else {
      console.log('Triggers trouvés:')
      console.log(JSON.stringify(triggers, null, 2))
    }

    // 8. RÉSUMÉ ET DIAGNOSTIC
    console.log('\n🎯 8. RÉSUMÉ ET DIAGNOSTIC')
    console.log('-'.repeat(40))
    
    console.log('Analyse terminée. Recherche de problèmes potentiels:')
    
    // Vérifier les politiques problématiques
    if (policies) {
      const profilesPolicies = policies.filter(p => p.tablename === 'profiles')
      console.log(`\n📊 Politiques sur la table profiles: ${profilesPolicies.length}`)
      
      profilesPolicies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
        if (policy.qual && policy.qual.includes('is_user_admin')) {
          console.log('     ⚠️  RÉCURSION DÉTECTÉE: Utilise is_user_admin()')
        }
      })
    }

    // Vérifier les fonctions problématiques
    if (functions) {
      const adminFunctions = functions.filter(f => f.routine_name.includes('admin'))
      console.log(`\n⚙️  Fonctions admin: ${adminFunctions.length}`)
      
      adminFunctions.forEach(func => {
        console.log(`   - ${func.routine_name}`)
        if (func.routine_definition && func.routine_definition.includes('profiles')) {
          console.log('     ⚠️  RÉCURSION POTENTIELLE: Référence à profiles')
        }
      })
    }

    console.log('\n✅ Analyse complète terminée!')
    console.log('📝 Utilisez ces informations pour planifier la correction.')

  } catch (error) {
    console.error('❌ Erreur globale:', error.message)
  }
}

analyzeDatabaseStructure() 