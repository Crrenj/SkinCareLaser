#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration Supabase
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9manFxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU2NjY3OSwiZXhwIjoyMDQ4MTQyNjc5fQ.JpgUGZXKNe6G6HWpZJzCPCXdGhTJLMJaXrHXzPFPFdk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupMessagesSystem() {
  console.log('🚀 Initialisation du système de messages de contact...')
  
  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '..', 'db', 'create_messages_system.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Diviser le contenu en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Exécution de ${commands.length} commandes SQL...`)
    
    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';'
      console.log(`⏳ Commande ${i + 1}/${commands.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        if (error) {
          console.error(`❌ Erreur commande ${i + 1}:`, error.message)
        } else {
          console.log(`✅ Commande ${i + 1} réussie`)
        }
      } catch (err) {
        console.error(`❌ Erreur commande ${i + 1}:`, err.message)
      }
    }
    
    // Vérifier la création de la table
    console.log('\n🔍 Vérification de la table contact_messages...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('contact_messages')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Erreur vérification table:', tableError.message)
    } else {
      console.log('✅ Table contact_messages créée avec succès')
    }
    
    // Tester les fonctions
    console.log('\n🧪 Test des fonctions...')
    
    // Test de la fonction de statistiques
    const { data: stats, error: statsError } = await supabase.rpc('get_messages_stats')
    if (statsError) {
      console.error('❌ Erreur fonction stats:', statsError.message)
    } else {
      console.log('✅ Fonction get_messages_stats:', stats)
    }
    
    // Test de création de message
    const { data: createResult, error: createError } = await supabase.rpc('create_contact_message', {
      p_email: 'j@gmail.com',
      p_subject: 'Test système',
      p_message: 'Test de création de message via script'
    })
    
    if (createError) {
      console.error('❌ Erreur création message:', createError.message)
    } else {
      console.log('✅ Test création message:', createResult)
    }
    
    // Afficher les messages existants
    console.log('\n📋 Messages existants:')
    const { data: messages, error: messagesError } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (messagesError) {
      console.error('❌ Erreur récupération messages:', messagesError.message)
    } else {
      console.log(`📊 ${messages.length} messages trouvés:`)
      messages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.user_email} - ${msg.subject} (${msg.status})`)
      })
    }
    
    console.log('\n🎉 Système de messages configuré avec succès!')
    console.log('\n📝 Prochaines étapes:')
    console.log('1. Accédez à /admin/messages pour voir l\'interface admin')
    console.log('2. Testez le formulaire de contact sur /contact')
    console.log('3. Vérifiez que seuls les emails d\'utilisateurs existants peuvent envoyer des messages')
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
    process.exit(1)
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMessagesSystem()
}

export { setupMessagesSystem } 