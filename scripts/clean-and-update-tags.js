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

async function cleanAndUpdateTags() {
  console.log('\n🔄 Nettoyage et mise à jour des tags...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Variables d\'environnement manquantes')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Appliquer le script SQL pour supprimer name_fr
    log.info('Étape 1: Suppression de la colonne name_fr...')
    
    // Utiliser l'API SQL directe si disponible
    const { error: dropColumnError } = await supabaseAdmin.rpc('exec', {
      sql: 'ALTER TABLE public.tag_types DROP COLUMN IF EXISTS name_fr;'
    })
    
    if (dropColumnError && !dropColumnError.message.includes('does not exist')) {
      log.error(`Erreur suppression colonne : ${dropColumnError.message}`)
    } else {
      log.success('Colonne name_fr supprimée (ou n\'existait pas)')
    }
    
    // 2. Mettre à jour les types existants avec les nouvelles données
    log.info('Étape 2: Mise à jour des types existants...')
    
    const updates = [
      { slug: 'category', name: 'Categories', icon: 'FolderIcon', color: '#3B82F6' },
      { slug: 'need', name: 'Needs', icon: 'HeartIcon', color: '#10B981' },
      { slug: 'skin_type', name: 'Skin Types', icon: 'UserGroupIcon', color: '#F59E0B' },
      { slug: 'ingredient', name: 'Ingredients', icon: 'BeakerIcon', color: '#8B5CF6' }
    ]
    
    for (const update of updates) {
      const { error: updateError } = await supabaseAdmin
        .from('tag_types')
        .update({
          name: update.name,
          icon: update.icon,
          color: update.color
        })
        .eq('slug', update.slug)
      
      if (updateError) {
        log.error(`Erreur mise à jour ${update.name}: ${updateError.message}`)
      } else {
        log.success(`Type "${update.name}" mis à jour`)
      }
    }
    
    // 3. Ajouter les nouveaux slugs si nécessaire
    log.info('Étape 3: Ajout des nouveaux slugs...')
    
    const newSlugs = [
      { oldSlug: 'category', newSlug: 'categories' },
      { oldSlug: 'need', newSlug: 'besoins' },
      { oldSlug: 'skin_type', newSlug: 'types-peau' },
      { oldSlug: 'ingredient', newSlug: 'ingredients' }
    ]
    
    for (const mapping of newSlugs) {
      // Vérifier si l'ancien slug existe
      const { data: oldType } = await supabaseAdmin
        .from('tag_types')
        .select('*')
        .eq('slug', mapping.oldSlug)
        .single()
      
      if (oldType) {
        // Vérifier si le nouveau slug existe déjà
        const { data: newType } = await supabaseAdmin
          .from('tag_types')
          .select('*')
          .eq('slug', mapping.newSlug)
          .single()
        
        if (!newType) {
          // Mettre à jour le slug
          const { error: updateSlugError } = await supabaseAdmin
            .from('tag_types')
            .update({ slug: mapping.newSlug })
            .eq('id', oldType.id)
          
          if (updateSlugError) {
            log.error(`Erreur mise à jour slug ${mapping.oldSlug} -> ${mapping.newSlug}: ${updateSlugError.message}`)
          } else {
            log.success(`Slug mis à jour: ${mapping.oldSlug} -> ${mapping.newSlug}`)
          }
        } else {
          log.info(`Slug ${mapping.newSlug} existe déjà`)
        }
      }
    }
    
    // 4. Vérification finale
    log.info('Étape 4: Vérification finale...')
    
    const { data: tagTypes, error: verifyError } = await supabaseAdmin
      .from('tag_types')
      .select('*')
      .order('created_at')
    
    if (verifyError) {
      log.error(`Erreur vérification : ${verifyError.message}`)
    } else {
      log.success(`Nettoyage terminé avec ${tagTypes.length} types de tags`)
      tagTypes.forEach(type => {
        log.info(`  - ${type.name} (${type.slug}) - ${type.icon} - ${type.color}`)
      })
    }
    
    // 5. Compter les tags par type
    const { data: tagCounts, error: countError } = await supabaseAdmin
      .from('tags')
      .select('tag_type_id, tag_types(name)')
      .not('tag_type_id', 'is', null)
    
    if (countError) {
      log.error(`Erreur comptage tags : ${countError.message}`)
    } else {
      const counts = tagCounts.reduce((acc, tag) => {
        const typeName = tag.tag_types?.name || 'Inconnu'
        acc[typeName] = (acc[typeName] || 0) + 1
        return acc
      }, {})
      
      log.info('Répartition des tags par type :')
      Object.entries(counts).forEach(([type, count]) => {
        log.info(`  - ${type}: ${count} tags`)
      })
    }
    
    console.log('\n✅ Nettoyage et mise à jour terminés avec succès!\n')
    
  } catch (error) {
    log.error(`Erreur générale : ${error.message}`)
    console.error(error)
  }
}

// Exécuter le script
cleanAndUpdateTags().catch(console.error) 