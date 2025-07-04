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
  blue: '\x1b[34m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
}

async function applyTagsMigration() {
  console.log('\n🔄 Application de la migration des tags (version directe)...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Variables d\'environnement manquantes')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    log.info('Vérification de l\'état actuel...')
    
    // Vérifier si la table tag_types existe déjà
    const { data: existingTagTypes, error: checkError } = await supabaseAdmin
      .from('tag_types')
      .select('*')
      .limit(1)
    
    if (checkError && checkError.code === 'PGRST116') {
      log.warning('La table tag_types n\'existe pas encore - migration nécessaire')
      log.error('La migration doit être appliquée directement dans la base de données')
      log.info('Utilisez le dashboard Supabase ou un client SQL pour exécuter le script db/modify_tags_structure.sql')
      return
    } else if (checkError) {
      log.error(`Erreur lors de la vérification : ${checkError.message}`)
      return
    } else {
      log.success('La table tag_types existe déjà')
    }
    
    // Vérifier les types de tags par défaut
    log.info('Vérification des types de tags par défaut...')
    
    const defaultTagTypes = [
      {
        slug: 'categories',
        name_en: 'Categories',
        name_fr: 'Catégories',
        icon: 'folder',
        color: 'blue'
      },
      {
        slug: 'besoins',
        name_en: 'Needs',
        name_fr: 'Besoins',
        icon: 'heart',
        color: 'green'
      },
      {
        slug: 'types-peau',
        name_en: 'Skin Types',
        name_fr: 'Types de peau',
        icon: 'user',
        color: 'orange'
      },
      {
        slug: 'ingredients',
        name_en: 'Ingredients',
        name_fr: 'Ingrédients',
        icon: 'beaker',
        color: 'purple'
      }
    ]
    
    for (const tagType of defaultTagTypes) {
      const { data: existing, error: checkExistingError } = await supabaseAdmin
        .from('tag_types')
        .select('*')
        .eq('slug', tagType.slug)
        .single()
      
      if (checkExistingError && checkExistingError.code === 'PGRST116') {
        // Le type n'existe pas, l'insérer
        const { error: insertError } = await supabaseAdmin
          .from('tag_types')
          .insert(tagType)
        
        if (insertError) {
          log.error(`Erreur insertion ${tagType.name_fr}: ${insertError.message}`)
        } else {
          log.success(`Type "${tagType.name_fr}" inséré`)
        }
      } else if (checkExistingError) {
        log.error(`Erreur vérification ${tagType.name_fr}: ${checkExistingError.message}`)
      } else {
        log.info(`Type "${tagType.name_fr}" existe déjà`)
      }
    }
    
    // Vérifier la migration des données existantes
    log.info('Vérification de la migration des données...')
    
    const { data: tagsWithoutType, error: checkTagsError } = await supabaseAdmin
      .from('tags')
      .select('*')
      .is('tag_type_id', null)
      .limit(5)
    
    if (checkTagsError) {
      log.error(`Erreur vérification tags : ${checkTagsError.message}`)
    } else if (tagsWithoutType.length > 0) {
      log.warning(`${tagsWithoutType.length} tags sans tag_type_id trouvés`)
      log.info('Migration des données nécessaire...')
      
      // Migrer les données
      const migrations = [
        { oldType: 'categories', newSlug: 'categories' },
        { oldType: 'besoins', newSlug: 'besoins' },
        { oldType: 'types_peau', newSlug: 'types-peau' },
        { oldType: 'ingredients', newSlug: 'ingredients' }
      ]
      
      for (const migration of migrations) {
        // Récupérer l'ID du nouveau type
        const { data: tagType, error: getTypeError } = await supabaseAdmin
          .from('tag_types')
          .select('id')
          .eq('slug', migration.newSlug)
          .single()
        
        if (getTypeError) {
          log.error(`Erreur récupération type ${migration.newSlug}: ${getTypeError.message}`)
          continue
        }
        
        // Mettre à jour les tags
        const { data: updatedTags, error: updateError } = await supabaseAdmin
          .from('tags')
          .update({ tag_type_id: tagType.id })
          .eq('type', migration.oldType)
          .select()
        
        if (updateError) {
          log.error(`Erreur migration ${migration.oldType}: ${updateError.message}`)
        } else {
          log.success(`${updatedTags.length} tags "${migration.oldType}" migrés vers "${migration.newSlug}"`)
        }
      }
    } else {
      log.success('Tous les tags ont déjà un tag_type_id')
    }
    
    // Vérification finale
    log.info('Vérification finale...')
    
    const { data: tagTypes, error: verifyError } = await supabaseAdmin
      .from('tag_types')
      .select('*')
    
    if (verifyError) {
      log.error(`Erreur vérification : ${verifyError.message}`)
    } else {
      log.success(`Migration vérifiée avec ${tagTypes.length} types de tags`)
      tagTypes.forEach(type => {
        log.info(`  - ${type.name_fr} (${type.slug})`)
      })
    }
    
    // Compter les tags par type
    const { data: tagCounts, error: countError } = await supabaseAdmin
      .from('tags')
      .select('tag_type_id, tag_types(name_fr)')
      .not('tag_type_id', 'is', null)
    
    if (countError) {
      log.error(`Erreur comptage tags : ${countError.message}`)
    } else {
      const counts = tagCounts.reduce((acc, tag) => {
        const typeName = tag.tag_types?.name_fr || 'Inconnu'
        acc[typeName] = (acc[typeName] || 0) + 1
        return acc
      }, {})
      
      log.info('Répartition des tags par type :')
      Object.entries(counts).forEach(([type, count]) => {
        log.info(`  - ${type}: ${count} tags`)
      })
    }
    
    console.log('\n✅ Migration des tags terminée avec succès!\n')
    
  } catch (error) {
    log.error(`Erreur générale : ${error.message}`)
    console.error(error)
  }
}

// Exécuter le script
applyTagsMigration().catch(console.error) 