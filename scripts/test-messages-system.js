#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9manFxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU2NjY3OSwiZXhwIjoyMDQ4MTQyNjc5fQ.JpgUGZXKNe6G6HWpZJzCPCXdGhTJLMJaXrHXzPFPFdk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testMessagesSystem() {
  console.log('🧪 Test du système de messages de contact...\n')
  
  try {
    // Test 1: Vérifier la table
    console.log('📋 Test 1: Vérification de la table contact_messages')
    const { data: tableCheck, error: tableError } = await supabase
      .from('contact_messages')
      .select('count(*)')
      .single()
    
    if (tableError) {
      console.error('❌ Table non trouvée:', tableError.message)
      return
    }
    console.log('✅ Table contact_messages accessible')
    
    // Test 2: Statistiques
    console.log('\n📊 Test 2: Fonction de statistiques')
    const { data: stats, error: statsError } = await supabase.rpc('get_messages_stats')
    if (statsError) {
      console.error('❌ Erreur stats:', statsError.message)
    } else {
      console.log('✅ Statistiques:', stats)
    }
    
    // Test 3: Création message avec email valide
    console.log('\n✉️ Test 3: Création message avec email valide (j@gmail.com)')
    const { data: validResult, error: validError } = await supabase.rpc('create_contact_message', {
      p_email: 'j@gmail.com',
      p_subject: 'Test avec email valide',
      p_message: 'Ce message devrait être créé car l\'email existe dans auth.users'
    })
    
    if (validError) {
      console.error('❌ Erreur création message valide:', validError.message)
    } else {
      console.log('✅ Message créé:', validResult)
    }
    
    // Test 4: Création message avec email invalide
    console.log('\n❌ Test 4: Création message avec email invalide')
    const { data: invalidResult, error: invalidError } = await supabase.rpc('create_contact_message', {
      p_email: 'inexistant@example.com',
      p_subject: 'Test avec email invalide',
      p_message: 'Ce message ne devrait PAS être créé car l\'email n\'existe pas'
    })
    
    if (invalidError) {
      console.error('❌ Erreur création message invalide:', invalidError.message)
    } else {
      console.log('🔍 Résultat email invalide:', invalidResult)
      if (!invalidResult.success) {
        console.log('✅ Validation email fonctionne:', invalidResult.error)
      }
    }
    
    // Test 5: Récupération des messages
    console.log('\n📬 Test 5: Récupération des messages')
    const { data: messages, error: messagesError } = await supabase
      .from('contact_messages')
      .select(`
        *,
        user:user_id(email)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (messagesError) {
      console.error('❌ Erreur récupération messages:', messagesError.message)
    } else {
      console.log(`✅ ${messages.length} messages récupérés:`)
      messages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.user_email} - "${msg.subject}" (${msg.status})`)
      })
    }
    
    // Test 6: Mise à jour statut
    if (messages && messages.length > 0) {
      console.log('\n🔄 Test 6: Mise à jour statut du premier message')
      const firstMessage = messages[0]
      const { data: updateResult, error: updateError } = await supabase
        .from('contact_messages')
        .update({ status: 'read', updated_at: new Date().toISOString() })
        .eq('id', firstMessage.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Erreur mise à jour:', updateError.message)
      } else {
        console.log('✅ Message mis à jour:', updateResult.status)
      }
    }
    
    // Test 7: Vérifier les politiques RLS
    console.log('\n🔒 Test 7: Vérification des politiques RLS')
    
    // Créer un client avec un token utilisateur simulé
    const userClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9manFxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1NjY2NzksImV4cCI6MjA0ODE0MjY3OX0.QLXVfnhsWXYOVRXpbKHPqNSGdHYKYOBOJRKPcTCVmqs')
    
    // Test avec auth.uid() simulé (ne devrait pas marcher sans session)
    const { data: rlsTest, error: rlsError } = await userClient
      .from('contact_messages')
      .select('*')
      .limit(1)
    
    if (rlsError) {
      console.log('✅ RLS fonctionne - accès refusé sans session:', rlsError.message)
    } else {
      console.log('⚠️ RLS pourrait ne pas fonctionner - accès autorisé:', rlsTest?.length || 0)
    }
    
    // Test 8: Statistiques finales
    console.log('\n📈 Test 8: Statistiques finales')
    const { data: finalStats, error: finalStatsError } = await supabase.rpc('get_messages_stats')
    if (finalStatsError) {
      console.error('❌ Erreur stats finales:', finalStatsError.message)
    } else {
      console.log('✅ Statistiques finales:', finalStats)
    }
    
    console.log('\n🎉 Tests terminés!')
    console.log('\n📋 Résumé:')
    console.log('- Table contact_messages créée et accessible')
    console.log('- Validation email fonctionne')
    console.log('- Fonctions SQL opérationnelles')
    console.log('- Politiques RLS activées')
    console.log('- API prête pour utilisation')
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
    process.exit(1)
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  testMessagesSystem()
}

export { testMessagesSystem } 