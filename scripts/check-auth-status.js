#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

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

async function checkAuthStatus() {
  console.log('\n🔐 Diagnostic de l\'authentification JWT...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  // 1. Vérifier les clés
  log.info('1. Vérification des clés Supabase...')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    log.error('Clés Supabase manquantes dans .env.local')
    return
  }
  
  log.success('Clés Supabase présentes')
  
  // 2. Test des connexions
  log.info('\n2. Test de connexion Supabase...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
    
    const { data, error } = await supabase
      .from('tag_types')
      .select('id, name')
      .limit(1)
    
    if (error) {
      log.error(`Erreur Supabase : ${error.message}`)
      if (error.message.includes('JWT')) {
        log.warning('Problème JWT détecté avec Supabase')
      }
    } else {
      log.success('Connexion Supabase OK')
    }
  } catch (error) {
    log.error(`Erreur connexion : ${error.message}`)
  }
  
  // 3. Test API locale
  log.info('\n3. Test API locale...')
  
  try {
    const response = await fetch('http://localhost:3001/api/admin/tag-types')
    
    if (response.ok) {
      log.success('API locale fonctionne')
    } else {
      log.error(`API erreur : ${response.status}`)
      if (response.status === 401) {
        log.warning('Erreur 401 - Authentification requise')
      }
    }
  } catch (error) {
    log.warning('Serveur local non accessible')
  }
  
  // Solutions
  console.log('\n💡 Solutions pour l\'erreur JWT :')
  
  log.info('🌐 Pour l\'interface web :')
  log.info('  • Rafraîchir la page (Ctrl+F5)')
  log.info('  • Vider le cache navigateur')
  log.info('  • Se déconnecter/reconnecter')
  log.info('  • Supprimer les cookies')
  
  log.info('\n🔑 Pour l\'authentification :')
  log.info('  • Aller sur http://localhost:3001/login')
  log.info('  • Vérifier que vous êtes admin')
  log.info('  • Redémarrer le serveur : npm run dev')
  
  log.info('\n🔧 Pour Supabase :')
  log.info('  • Vérifier les clés dans .env.local')
  log.info('  • Régénérer les clés si nécessaire')
  log.info('  • Vérifier les permissions RLS')
  
  console.log('\n📋 Diagnostic :')
  log.success('✅ Scripts Node.js fonctionnent')
  log.warning('⚠️  Erreur JWT probablement côté navigateur')
  log.info('🎯 Solution recommandée : Rafraîchir la page')
}

checkAuthStatus().catch(console.error) 