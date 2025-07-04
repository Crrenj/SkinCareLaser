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
  test: (msg) => console.log(`${colors.magenta}🧪${colors.reset} ${msg}`)
}

async function testTagsSystem() {
  console.log('\n🧪 Tests complets du système de tags...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Variables d\'environnement manquantes')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test 1: Vérifier la structure de base
    log.test('Test 1: Vérification de la structure de base')
    
    const { data: tagTypes, error: typesError } = await supabaseAdmin
      .from('tag_types')
      .select('*')
    
    if (typesError) {
      log.error(`Erreur récupération types : ${typesError.message}`)
      return
    }
    
    log.success(`${tagTypes.length} types de tags trouvés`)
    tagTypes.forEach(type => {
      log.info(`  - ${type.name} (${type.slug}) - ${type.icon} - ${type.color}`)
    })
    
    // Test 2: Vérifier les tags existants
    log.test('\nTest 2: Vérification des tags existants')
    
    const { data: tags, error: tagsError } = await supabaseAdmin
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
    
    if (tagsError) {
      log.error(`Erreur récupération tags : ${tagsError.message}`)
      return
    }
    
    log.success(`${tags.length} tags trouvés`)
    
    // Grouper par type
    const byType = tags.reduce((acc, tag) => {
      const typeName = tag.tag_types?.name || 'Inconnu'
      if (!acc[typeName]) acc[typeName] = []
      acc[typeName].push(tag.name)
      return acc
    }, {})
    
    Object.entries(byType).forEach(([type, tagList]) => {
      log.info(`  - ${type}: ${tagList.join(', ')}`)
    })
    
    // Test 3: Test de création d'un nouveau type de tag
    log.test('\nTest 3: Création d\'un nouveau type de tag')
    
    const testType = {
      name: 'Test Type',
      slug: 'test-type',
      icon: 'StarIcon',
      color: '#FF6B6B'
    }
    
    const { data: newType, error: createTypeError } = await supabaseAdmin
      .from('tag_types')
      .insert(testType)
      .select()
      .single()
    
    if (createTypeError) {
      if (createTypeError.code === '23505') {
        log.warning('Type de test existe déjà, utilisation de l\'existant')
        const { data: existingType } = await supabaseAdmin
          .from('tag_types')
          .select('*')
          .eq('slug', testType.slug)
          .single()
        testType.id = existingType?.id
      } else {
        log.error(`Erreur création type : ${createTypeError.message}`)
        return
      }
    } else {
      log.success(`Type de test créé avec ID: ${newType.id}`)
      testType.id = newType.id
    }
    
    // Test 4: Test de création d'un tag
    log.test('\nTest 4: Création d\'un tag de test')
    
    const testTag = {
      name: 'Tag Test',
      slug: 'tag-test',
      tag_type_id: testType.id
    }
    
    const { data: newTag, error: createTagError } = await supabaseAdmin
      .from('tags')
      .insert(testTag)
      .select()
      .single()
    
    if (createTagError) {
      if (createTagError.code === '23505') {
        log.warning('Tag de test existe déjà')
      } else {
        log.error(`Erreur création tag : ${createTagError.message}`)
        return
      }
    } else {
      log.success(`Tag de test créé avec ID: ${newTag.id}`)
      testTag.id = newTag.id
    }
    
    // Test 5: Test de mise à jour d'un tag
    log.test('\nTest 5: Mise à jour du tag de test')
    
    if (testTag.id) {
      const { data: updatedTag, error: updateError } = await supabaseAdmin
        .from('tags')
        .update({ name: 'Tag Test Modifié' })
        .eq('id', testTag.id)
        .select()
        .single()
      
      if (updateError) {
        log.error(`Erreur mise à jour tag : ${updateError.message}`)
      } else {
        log.success(`Tag mis à jour: ${updatedTag.name}`)
      }
    }
    
    // Test 6: Test de la vue tags_with_types
    log.test('\nTest 6: Test de la vue tags_with_types')
    
    const { data: viewData, error: viewError } = await supabaseAdmin
      .from('tags_with_types')
      .select('*')
      .limit(5)
    
    if (viewError) {
      log.error(`Erreur vue : ${viewError.message}`)
    } else {
      log.success(`Vue fonctionne, ${viewData.length} tags récupérés`)
      viewData.forEach(tag => {
        log.info(`  - ${tag.name} (${tag.type_name})`)
      })
    }
    
    // Test 7: Test des APIs via fetch
    log.test('\nTest 7: Test des APIs via HTTP')
    
    try {
      // Test GET tag-types
      const typesResponse = await fetch('http://localhost:3001/api/admin/tag-types')
      if (typesResponse.ok) {
        const typesData = await typesResponse.json()
        log.success(`API tag-types: ${typesData.length} types récupérés`)
      } else {
        log.error(`API tag-types erreur: ${typesResponse.status}`)
      }
      
      // Test GET tags
      const tagsResponse = await fetch('http://localhost:3001/api/admin/tags')
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json()
        log.success(`API tags: ${tagsData.length} tags récupérés`)
      } else {
        log.error(`API tags erreur: ${tagsResponse.status}`)
      }
      
    } catch (fetchError) {
      log.warning('Tests HTTP ignorés (serveur non démarré)')
    }
    
    // Test 8: Nettoyage des données de test
    log.test('\nTest 8: Nettoyage des données de test')
    
    if (testTag.id) {
      const { error: deleteTagError } = await supabaseAdmin
        .from('tags')
        .delete()
        .eq('id', testTag.id)
      
      if (deleteTagError) {
        log.error(`Erreur suppression tag : ${deleteTagError.message}`)
      } else {
        log.success('Tag de test supprimé')
      }
    }
    
    if (testType.id) {
      const { error: deleteTypeError } = await supabaseAdmin
        .from('tag_types')
        .delete()
        .eq('id', testType.id)
      
      if (deleteTypeError) {
        log.error(`Erreur suppression type : ${deleteTypeError.message}`)
      } else {
        log.success('Type de test supprimé')
      }
    }
    
    // Résumé final
    log.test('\n📊 Résumé des tests')
    
    const { data: finalTags } = await supabaseAdmin
      .from('tags')
      .select('id')
    
    const { data: finalTypes } = await supabaseAdmin
      .from('tag_types')
      .select('id')
    
    log.success(`Système fonctionnel avec ${finalTypes?.length || 0} types et ${finalTags?.length || 0} tags`)
    
    console.log('\n✅ Tests terminés avec succès!\n')
    
  } catch (error) {
    log.error(`Erreur générale : ${error.message}`)
    console.error(error)
  }
}

// Exécuter les tests
testTagsSystem().catch(console.error) 