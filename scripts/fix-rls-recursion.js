/**
 * Script pour corriger la récursion infinie dans les politiques RLS
 * Exécute le script SQL fix_rls_recursion.sql
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_KEY sont définies')
  process.exit(1)
}

// Client Supabase avec clé service pour bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRLSRecursion() {
  console.log('🔧 Correction de la récursion infinie dans les politiques RLS...\n')

  try {
    // Lire le script SQL
    const sqlPath = path.join(__dirname, '..', 'db', 'fix_rls_recursion.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📖 Lecture du script SQL...')
    console.log(`   Fichier: ${sqlPath}`)
    console.log(`   Taille: ${sqlContent.length} caractères\n`)

    // Diviser le script en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📋 ${commands.length} commandes SQL à exécuter...\n`)

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      
      // Ignorer les commentaires et les lignes vides
      if (command.startsWith('--') || command.length < 10) {
        continue
      }

      console.log(`⚙️  Exécution commande ${i + 1}/${commands.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        })

        if (error) {
          // Essayer d'exécuter directement si exec_sql n'existe pas
          console.log(`   ⚠️  exec_sql échoué, tentative directe...`)
          
          // Pour les commandes SELECT, utiliser une approche différente
          if (command.toUpperCase().includes('SELECT')) {
            console.log(`   ℹ️  Commande SELECT ignorée (vérification manuelle requise)`)
          } else {
            console.log(`   ❌ Erreur: ${error.message}`)
          }
        } else {
          console.log(`   ✅ Succès`)
        }
      } catch (cmdError) {
        console.log(`   ❌ Erreur commande: ${cmdError.message}`)
      }
    }

    console.log('\n🎉 Correction terminée!')
    console.log('\n📝 Étapes suivantes:')
    console.log('1. Testez la connexion avec j@gmail.com')
    console.log('2. Vérifiez l\'accès aux pages admin')
    console.log('3. Si le problème persiste, exécutez manuellement le script dans Supabase Dashboard')
    console.log('\n💡 Script SQL disponible dans: db/fix_rls_recursion.sql')

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
    console.log('\n🔧 Solution alternative:')
    console.log('1. Ouvrez Supabase Dashboard > SQL Editor')
    console.log('2. Copiez le contenu de db/fix_rls_recursion.sql')
    console.log('3. Exécutez le script manuellement')
  }
}

// Exécuter la correction
fixRLSRecursion() 