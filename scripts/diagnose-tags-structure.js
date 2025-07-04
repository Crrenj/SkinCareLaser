#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

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
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  debug: (msg) => console.log(`${colors.magenta}🔍${colors.reset} ${msg}`)
}

async function diagnoseTagsStructure() {
  console.log('\n🔍 Diagnostic de la structure des tags...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Variables d\'environnement manquantes')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Vérifier la structure de la table tags
    log.debug('1. Structure de la table tags')
    
    const { data: tagsStructure, error: tagsStructureError } = await supabaseAdmin.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'tags' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    })
    
    if (tagsStructureError) {
      log.error(`Erreur structure tags : ${tagsStructureError.message}`)
    } else {
      log.success('Structure de la table tags :')
      console.table(tagsStructure)
    }
    
    // 2. Vérifier la structure de la table tag_types
    log.debug('\n2. Structure de la table tag_types')
    
    const { data: tagTypesStructure, error: tagTypesStructureError } = await supabaseAdmin.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'tag_types' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    })
    
    if (tagTypesStructureError) {
      log.error(`Erreur structure tag_types : ${tagTypesStructureError.message}`)
    } else {
      log.success('Structure de la table tag_types :')
      console.table(tagTypesStructure)
    }
    
    // 3. Vérifier les contraintes
    log.debug('\n3. Contraintes sur la table tags')
    
    const { data: constraints, error: constraintsError } = await supabaseAdmin.rpc('exec', {
      sql: `
        SELECT 
          conname as constraint_name,
          contype as constraint_type,
          pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'public.tags'::regclass;
      `
    })
    
    if (constraintsError) {
      log.error(`Erreur contraintes : ${constraintsError.message}`)
    } else {
      log.success('Contraintes sur la table tags :')
      console.table(constraints)
    }
    
    // 4. Vérifier les vues existantes
    log.debug('\n4. Vues liées aux tags')
    
    const { data: views, error: viewsError } = await supabaseAdmin.rpc('exec', {
      sql: `
        SELECT schemaname, viewname, definition 
        FROM pg_views 
        WHERE viewname LIKE '%tag%';
      `
    })
    
    if (viewsError) {
      log.error(`Erreur vues : ${viewsError.message}`)
    } else {
      log.success('Vues liées aux tags :')
      views.forEach(view => {
        log.info(`  - ${view.viewname}`)
      })
    }
    
    // 5. Compter les données
    log.debug('\n5. Données actuelles')
    
    const { data: tagTypes, error: typesCountError } = await supabaseAdmin
      .from('tag_types')
      .select('id, name, slug')
    
    if (typesCountError) {
      log.error(`Erreur comptage types : ${typesCountError.message}`)
    } else {
      log.success(`${tagTypes.length} types de tags trouvés :`)
      tagTypes.forEach(type => {
        log.info(`  - ${type.name} (${type.slug})`)
      })
    }
    
    const { data: tags, error: tagsCountError } = await supabaseAdmin
      .from('tags')
      .select('id, name, tag_type_id')
    
    if (tagsCountError) {
      log.error(`Erreur comptage tags : ${tagsCountError.message}`)
    } else {
      log.success(`${tags.length} tags trouvés`)
      
      // Vérifier les tags sans tag_type_id
      const tagsWithoutType = tags.filter(tag => !tag.tag_type_id)
      if (tagsWithoutType.length > 0) {
        log.warning(`${tagsWithoutType.length} tags sans tag_type_id`)
      }
    }
    
    // 6. Test de la vue tags_with_types
    log.debug('\n6. Test de la vue tags_with_types')
    
    const { data: viewTest, error: viewTestError } = await supabaseAdmin
      .from('tags_with_types')
      .select('*')
      .limit(1)
    
    if (viewTestError) {
      log.error(`Erreur vue tags_with_types : ${viewTestError.message}`)
      log.warning('La vue doit être recréée')
    } else {
      log.success('Vue tags_with_types fonctionne')
    }
    
    console.log('\n📋 Résumé du diagnostic :')
    
    if (tagsStructureError || tagTypesStructureError) {
      log.error('❌ Problèmes de structure détectés')
    } else {
      log.success('✅ Structure des tables OK')
    }
    
    if (viewTestError) {
      log.error('❌ Vue tags_with_types à recréer')
    } else {
      log.success('✅ Vue tags_with_types OK')
    }
    
    if (tags && tags.filter(tag => !tag.tag_type_id).length > 0) {
      log.error('❌ Tags orphelins détectés')
    } else {
      log.success('✅ Tous les tags ont un type')
    }
    
    console.log('\n🔧 Action recommandée :')
    log.info('Exécutez le script SQL : db/final_fix_tags_corrected.sql')
    
  } catch (error) {
    log.error(`Erreur générale : ${error.message}`)
    console.error(error)
  }
}

// Exécuter le diagnostic
diagnoseTagsStructure().catch(console.error) 