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
  console.log('\n🔄 Application de la migration des tags (version simplifiée)...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Variables d\'environnement manquantes')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Créer la table tag_types
    log.info('Étape 1: Création de la table tag_types...')
    
    const { error: createTableError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.tag_types (
          id SERIAL PRIMARY KEY,
          slug VARCHAR(50) UNIQUE NOT NULL,
          name_en VARCHAR(100) NOT NULL,
          name_fr VARCHAR(100) NOT NULL,
          icon VARCHAR(50) NOT NULL DEFAULT 'tag',
          color VARCHAR(50) NOT NULL DEFAULT 'blue',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (createTableError) {
      log.error(`Erreur création table : ${createTableError.message}`)
      return
    }
    log.success('Table tag_types créée')
    
    // 2. Insérer les types de tags par défaut
    log.info('Étape 2: Insertion des types de tags par défaut...')
    
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
      const { error: insertError } = await supabaseAdmin
        .from('tag_types')
        .upsert(tagType, { onConflict: 'slug' })
      
      if (insertError) {
        log.error(`Erreur insertion ${tagType.name_fr}: ${insertError.message}`)
      } else {
        log.success(`Type "${tagType.name_fr}" inséré`)
      }
    }
    
    // 3. Ajouter la colonne tag_type_id à la table tags
    log.info('Étape 3: Ajout de la colonne tag_type_id...')
    
    const { error: addColumnError } = await supabaseAdmin.rpc('exec', {
      sql: `
        ALTER TABLE public.tags 
        ADD COLUMN IF NOT EXISTS tag_type_id INTEGER REFERENCES public.tag_types(id);
      `
    })
    
    if (addColumnError) {
      log.error(`Erreur ajout colonne : ${addColumnError.message}`)
      return
    }
    log.success('Colonne tag_type_id ajoutée')
    
    // 4. Migrer les données existantes
    log.info('Étape 4: Migration des données existantes...')
    
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
      const { error: updateError } = await supabaseAdmin
        .from('tags')
        .update({ tag_type_id: tagType.id })
        .eq('type', migration.oldType)
      
      if (updateError) {
        log.error(`Erreur migration ${migration.oldType}: ${updateError.message}`)
      } else {
        log.success(`Tags "${migration.oldType}" migrés vers "${migration.newSlug}"`)
      }
    }
    
    // 5. Vérification finale
    log.info('Étape 5: Vérification finale...')
    
    const { data: tagTypes, error: verifyError } = await supabaseAdmin
      .from('tag_types')
      .select('*')
    
    if (verifyError) {
      log.error(`Erreur vérification : ${verifyError.message}`)
    } else {
      log.success(`Migration terminée avec ${tagTypes.length} types de tags`)
      tagTypes.forEach(type => {
        log.info(`  - ${type.name_fr} (${type.slug})`)
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