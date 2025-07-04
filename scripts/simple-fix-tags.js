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

async function simpleFixTags() {
  console.log('\n🔧 Correction simple de la structure des tags...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Variables d\'environnement manquantes')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Créer quelques tags de test directement
    log.info('Étape 1: Création de tags de test...')
    
    // Récupérer les types existants
    const { data: tagTypes, error: typesError } = await supabaseAdmin
      .from('tag_types')
      .select('*')
    
    if (typesError) {
      log.error(`Erreur récupération types : ${typesError.message}`)
      return
    }
    
    log.success(`${tagTypes.length} types trouvés`)
    
    // Trouver les types principaux
    const categoriesType = tagTypes.find(t => t.slug === 'categories')
    const besoinsType = tagTypes.find(t => t.slug === 'besoins')
    
    if (categoriesType) {
      log.info('Création de tags pour Catégories...')
      
      const categoryTags = [
        { name: 'Nettoyant', slug: 'nettoyant', tag_type_id: categoriesType.id },
        { name: 'Hydratant', slug: 'hydratant', tag_type_id: categoriesType.id },
        { name: 'Sérum', slug: 'serum', tag_type_id: categoriesType.id }
      ]
      
      for (const tag of categoryTags) {
        const { data: newTag, error: tagError } = await supabaseAdmin
          .from('tags')
          .upsert(tag, { onConflict: 'slug' })
          .select()
          .single()
        
        if (tagError) {
          log.error(`Erreur création tag ${tag.name}: ${tagError.message}`)
        } else {
          log.success(`Tag "${tag.name}" créé`)
        }
      }
    }
    
    if (besoinsType) {
      log.info('Création de tags pour Besoins...')
      
      const needTags = [
        { name: 'Peau sèche', slug: 'peau-seche', tag_type_id: besoinsType.id },
        { name: 'Anti-âge', slug: 'anti-age', tag_type_id: besoinsType.id },
        { name: 'Acné', slug: 'acne', tag_type_id: besoinsType.id }
      ]
      
      for (const tag of needTags) {
        const { data: newTag, error: tagError } = await supabaseAdmin
          .from('tags')
          .upsert(tag, { onConflict: 'slug' })
          .select()
          .single()
        
        if (tagError) {
          log.error(`Erreur création tag ${tag.name}: ${tagError.message}`)
        } else {
          log.success(`Tag "${tag.name}" créé`)
        }
      }
    }
    
    // 2. Vérifier les tags créés
    log.info('\nÉtape 2: Vérification des tags créés...')
    
    const { data: allTags, error: allTagsError } = await supabaseAdmin
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
    
    if (allTagsError) {
      log.error(`Erreur vérification tags : ${allTagsError.message}`)
    } else {
      log.success(`${allTags.length} tags total`)
      
      // Grouper par type
      const byType = allTags.reduce((acc, tag) => {
        const typeName = tag.tag_types?.name || 'Inconnu'
        if (!acc[typeName]) acc[typeName] = []
        acc[typeName].push(tag.name)
        return acc
      }, {})
      
      Object.entries(byType).forEach(([type, tagList]) => {
        log.info(`  - ${type}: ${tagList.join(', ')}`)
      })
    }
    
    // 3. Test de création via API
    log.info('\nÉtape 3: Test de création via API...')
    
    if (categoriesType) {
      const testTag = {
        name: 'Test API',
        slug: 'test-api',
        tag_type_id: categoriesType.id
      }
      
      const { data: apiTag, error: apiError } = await supabaseAdmin
        .from('tags')
        .insert(testTag)
        .select()
        .single()
      
      if (apiError) {
        log.error(`Erreur API : ${apiError.message}`)
        
        // Analyser l'erreur
        if (apiError.message.includes('tag_type')) {
          log.warning('Problème avec la colonne tag_type - structure à corriger')
        }
      } else {
        log.success(`Tag API créé avec ID: ${apiTag.id}`)
        
        // Nettoyer
        await supabaseAdmin
          .from('tags')
          .delete()
          .eq('id', apiTag.id)
        
        log.info('Tag de test supprimé')
      }
    }
    
    console.log('\n📊 Résumé :')
    
    const { data: finalTags } = await supabaseAdmin
      .from('tags')
      .select('id')
    
    const { data: finalTypes } = await supabaseAdmin
      .from('tag_types')
      .select('id')
    
    log.success(`${finalTypes?.length || 0} types de tags`)
    log.success(`${finalTags?.length || 0} tags`)
    
    if (finalTags && finalTags.length > 0) {
      log.success('✅ Le système de tags fonctionne !')
      log.info('Vous pouvez maintenant utiliser l\'interface /admin/tags')
    } else {
      log.error('❌ Problèmes persistants')
      log.info('Appliquez le script SQL : db/final_fix_tags_corrected.sql')
    }
    
  } catch (error) {
    log.error(`Erreur générale : ${error.message}`)
    console.error(error)
  }
}

// Exécuter la correction
simpleFixTags().catch(console.error) 