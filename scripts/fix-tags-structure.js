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

async function fixTagsStructure() {
  console.log('\n🔧 Correction de la structure des tags...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Variables d\'environnement manquantes')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Vérifier l'état actuel
    log.info('Étape 1: Vérification de l\'état actuel...')
    
    const { data: tagsWithoutTypeId, error: checkError } = await supabaseAdmin
      .from('tags')
      .select('id, name, tag_type, tag_type_id')
      .is('tag_type_id', null)
    
    if (checkError) {
      log.error(`Erreur vérification : ${checkError.message}`)
      return
    }
    
    log.info(`${tagsWithoutTypeId?.length || 0} tags sans tag_type_id trouvés`)
    
    // 2. Récupérer les types de tags
    const { data: tagTypes, error: typesError } = await supabaseAdmin
      .from('tag_types')
      .select('*')
    
    if (typesError) {
      log.error(`Erreur récupération types : ${typesError.message}`)
      return
    }
    
    log.success(`${tagTypes.length} types de tags trouvés`)
    
    // 3. Corriger les tags sans tag_type_id
    if (tagsWithoutTypeId && tagsWithoutTypeId.length > 0) {
      log.info('Étape 2: Correction des tags sans tag_type_id...')
      
      for (const tag of tagsWithoutTypeId) {
        let targetType = null
        
        // Mapper les anciens types vers les nouveaux
        switch (tag.tag_type) {
          case 'categories':
          case 'category':
            targetType = tagTypes.find(t => t.slug === 'categories')
            break
          case 'besoins':
          case 'need':
            targetType = tagTypes.find(t => t.slug === 'besoins')
            break
          case 'types_peau':
          case 'skin_type':
            targetType = tagTypes.find(t => t.slug === 'types-peau')
            break
          case 'ingredients':
          case 'ingredient':
            targetType = tagTypes.find(t => t.slug === 'ingredients')
            break
        }
        
        if (targetType) {
          const { error: updateError } = await supabaseAdmin
            .from('tags')
            .update({ tag_type_id: targetType.id })
            .eq('id', tag.id)
          
          if (updateError) {
            log.error(`Erreur mise à jour tag "${tag.name}": ${updateError.message}`)
          } else {
            log.success(`Tag "${tag.name}" mis à jour vers ${targetType.name}`)
          }
        } else {
          log.warning(`Type inconnu pour tag "${tag.name}": ${tag.tag_type}`)
        }
      }
    }
    
    // 4. Supprimer les tags orphelins
    log.info('Étape 3: Suppression des tags orphelins...')
    
    const { data: orphanTags, error: orphanError } = await supabaseAdmin
      .from('tags')
      .delete()
      .is('tag_type_id', null)
      .select()
    
    if (orphanError) {
      log.error(`Erreur suppression orphelins : ${orphanError.message}`)
    } else {
      log.success(`${orphanTags?.length || 0} tags orphelins supprimés`)
    }
    
    // 5. Vérification finale
    log.info('Étape 4: Vérification finale...')
    
    const { data: allTags, error: finalError } = await supabaseAdmin
      .from('tags')
      .select(`
        *,
        tag_types (
          name,
          slug,
          color,
          icon
        )
      `)
    
    if (finalError) {
      log.error(`Erreur vérification finale : ${finalError.message}`)
    } else {
      log.success(`${allTags.length} tags total après correction`)
      
      // Grouper par type
      const byType = allTags.reduce((acc, tag) => {
        const typeName = tag.tag_types?.name || 'Inconnu'
        acc[typeName] = (acc[typeName] || 0) + 1
        return acc
      }, {})
      
      log.info('Répartition par type :')
      Object.entries(byType).forEach(([type, count]) => {
        log.info(`  - ${type}: ${count} tags`)
      })
    }
    
    console.log('\n✅ Correction de structure terminée!\n')
    
  } catch (error) {
    log.error(`Erreur générale : ${error.message}`)
    console.error(error)
  }
}

// Exécuter le script
fixTagsStructure().catch(console.error) 