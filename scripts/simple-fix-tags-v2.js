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

async function simpleFixTagsV2() {
  console.log('\n🔧 Test de la structure des tags (version 2)...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Variables d\'environnement manquantes')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Vérifier la structure actuelle
    log.info('Étape 1: Vérification de la structure...')
    
    // Récupérer les types existants
    const { data: tagTypes, error: typesError } = await supabaseAdmin
      .from('tag_types')
      .select('*')
    
    if (typesError) {
      log.error(`Erreur récupération types : ${typesError.message}`)
      return
    }
    
    log.success(`${tagTypes.length} types trouvés`)
    
    // 2. Test de création d'un tag simple
    log.info('\nÉtape 2: Test de création d\'un tag simple...')
    
    const categoriesType = tagTypes.find(t => t.slug === 'categories')
    
    if (categoriesType) {
      // Vérifier si le tag existe déjà
      const { data: existingTag } = await supabaseAdmin
        .from('tags')
        .select('*')
        .eq('slug', 'test-creation')
        .single()
      
      if (existingTag) {
        log.info('Tag de test existe déjà, suppression...')
        await supabaseAdmin
          .from('tags')
          .delete()
          .eq('id', existingTag.id)
      }
      
      // Créer un nouveau tag
      const testTag = {
        name: 'Test Création',
        slug: 'test-creation',
        tag_type_id: categoriesType.id
      }
      
      const { data: newTag, error: createError } = await supabaseAdmin
        .from('tags')
        .insert(testTag)
        .select()
        .single()
      
      if (createError) {
        log.error(`Erreur création tag : ${createError.message}`)
        
        // Analyser l'erreur pour donner des conseils
        if (createError.message.includes('tag_type')) {
          log.warning('❌ Problème avec la colonne tag_type - Appliquez le script SQL')
        }
        if (createError.message.includes('created_at')) {
          log.warning('❌ Colonne created_at manquante - Appliquez le script SQL')
        }
        if (createError.message.includes('unique')) {
          log.warning('❌ Contrainte unique manquante - Appliquez le script SQL')
        }
      } else {
        log.success(`✅ Tag créé avec succès ! ID: ${newTag.id}`)
        
        // Test de mise à jour
        const { data: updatedTag, error: updateError } = await supabaseAdmin
          .from('tags')
          .update({ name: 'Test Création Modifié' })
          .eq('id', newTag.id)
          .select()
          .single()
        
        if (updateError) {
          log.error(`Erreur mise à jour : ${updateError.message}`)
        } else {
          log.success(`✅ Tag mis à jour : ${updatedTag.name}`)
        }
        
        // Nettoyer
        await supabaseAdmin
          .from('tags')
          .delete()
          .eq('id', newTag.id)
        
        log.info('Tag de test supprimé')
      }
    } else {
      log.error('Type "categories" non trouvé')
    }
    
    // 3. Test de la vue tags_with_types
    log.info('\nÉtape 3: Test de la vue tags_with_types...')
    
    const { data: viewData, error: viewError } = await supabaseAdmin
      .from('tags_with_types')
      .select('*')
      .limit(3)
    
    if (viewError) {
      log.error(`❌ Vue non fonctionnelle : ${viewError.message}`)
      log.warning('La vue doit être recréée avec le script SQL')
    } else {
      log.success(`✅ Vue fonctionne ! ${viewData.length} tags récupérés`)
      viewData.forEach(tag => {
        log.info(`  - ${tag.name} (${tag.type_name})`)
      })
    }
    
    // 4. Vérifier les tags existants
    log.info('\nÉtape 4: Vérification des tags existants...')
    
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
      log.error(`Erreur récupération tags : ${allTagsError.message}`)
    } else {
      log.success(`${allTags.length} tags total`)
      
      if (allTags.length > 0) {
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
      } else {
        log.warning('Aucun tag existant - créez-en via l\'interface')
      }
    }
    
    console.log('\n📊 Diagnostic final :')
    
    const issues = []
    
    // Vérifier si on peut créer des tags
    if (categoriesType) {
      const { error: testCreateError } = await supabaseAdmin
        .from('tags')
        .insert({
          name: 'Test Diagnostic',
          slug: 'test-diagnostic-' + Date.now(),
          tag_type_id: categoriesType.id
        })
        .select()
        .single()
      
      if (testCreateError) {
        issues.push('Création de tags impossible')
      } else {
        // Nettoyer immédiatement
        await supabaseAdmin
          .from('tags')
          .delete()
          .eq('slug', 'test-diagnostic-' + Date.now())
      }
    }
    
    if (viewError) {
      issues.push('Vue tags_with_types manquante')
    }
    
    if (issues.length === 0) {
      log.success('🎉 Système de tags entièrement fonctionnel !')
      log.info('Vous pouvez utiliser l\'interface /admin/tags')
    } else {
      log.error(`❌ ${issues.length} problème(s) détecté(s) :`)
      issues.forEach(issue => log.error(`  - ${issue}`))
      log.warning('Appliquez le script SQL : db/final_fix_tags_corrected_v2.sql')
    }
    
  } catch (error) {
    log.error(`Erreur générale : ${error.message}`)
    console.error(error)
  }
}

// Exécuter le test
simpleFixTagsV2().catch(console.error) 