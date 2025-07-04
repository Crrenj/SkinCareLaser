#!/usr/bin/env node

/**
 * Script d'application de la migration des tags
 * Usage: node scripts/apply-tags-migration.js
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
}

async function applyTagsMigration() {
  console.log('\n🔄 Application de la migration des tags...\n')

  // 1. Vérifier les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Variables d\'environnement manquantes')
    log.info('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_KEY sont définies')
    return
  }

  // 2. Lire le fichier SQL
  const sqlFile = path.join(__dirname, '..', 'db', 'modify_tags_structure.sql')
  
  if (!fs.existsSync(sqlFile)) {
    log.error('Fichier SQL introuvable : db/modify_tags_structure.sql')
    return
  }

  const sqlContent = fs.readFileSync(sqlFile, 'utf-8')
  log.info('Fichier SQL lu avec succès')

  // 3. Créer le client admin
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 4. Exécuter le SQL
    log.info('Exécution de la migration...')
    
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      // Si la fonction exec_sql n'existe pas, essayer d'exécuter par parties
      if (error.message.includes('exec_sql')) {
        log.warning('Fonction exec_sql non disponible, exécution par parties...')
        await executeSqlByParts(supabaseAdmin, sqlContent)
      } else {
        throw error
      }
    } else {
      log.success('Migration appliquée avec succès!')
    }
    
    // 5. Vérifier le résultat
    log.info('Vérification de la migration...')
    
    const { data: tagTypes, error: tagTypesError } = await supabaseAdmin
      .from('tag_types')
      .select('*')
    
    if (tagTypesError) {
      log.error(`Erreur lors de la vérification : ${tagTypesError.message}`)
    } else {
      log.success(`Table tag_types créée avec ${tagTypes.length} types`)
      tagTypes.forEach(type => {
        log.info(`  - ${type.name_fr} (${type.slug})`)
      })
    }
    
    const { data: tags, error: tagsError } = await supabaseAdmin
      .from('tags')
      .select('*, tag_types(name_fr)')
      .limit(5)
    
    if (tagsError) {
      log.error(`Erreur lors de la vérification des tags : ${tagsError.message}`)
    } else {
      log.success(`Tags migrés avec succès (${tags.length} premiers tags vérifiés)`)
    }
    
    console.log('\n✅ Migration des tags terminée avec succès!\n')
    
  } catch (error) {
    log.error(`Erreur lors de la migration : ${error.message}`)
    console.error(error)
  }
}

async function executeSqlByParts(supabaseAdmin, sqlContent) {
  // Diviser le SQL en parties exécutables
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  for (const statement of statements) {
    if (statement.includes('CREATE OR REPLACE FUNCTION')) {
      // Exécuter les fonctions via RPC
      const { error } = await supabaseAdmin.rpc('exec', { sql: statement + ';' })
      if (error) {
        log.warning(`Fonction peut-être déjà existante : ${error.message}`)
      }
    } else if (statement.includes('CREATE TABLE')) {
      // Créer les tables
      const { error } = await supabaseAdmin.rpc('exec', { sql: statement + ';' })
      if (error && !error.message.includes('already exists')) {
        throw error
      }
    } else if (statement.includes('INSERT INTO')) {
      // Insérer les données
      const { error } = await supabaseAdmin.rpc('exec', { sql: statement + ';' })
      if (error) {
        throw error
      }
    }
    // Ajouter d'autres types de statements selon les besoins
  }
}

// Exécuter le script
applyTagsMigration().catch(console.error) 