require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Utiliser la clé de service pour contourner les politiques RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('URL:', supabaseUrl ? 'Définie' : 'Manquante')
console.log('Service Key:', supabaseServiceKey ? 'Définie' : 'Manquante')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables d\'environnement Supabase manquantes')
  console.error('Ajoutez SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixTags() {
  console.log('🔧 Correction des données des tags...')
  
  // 1. Supprimer les anciens tags incorrects
  console.log('\n1. Suppression des anciens tags...')
  const { error: deleteError } = await supabase
    .from('tags')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Supprimer tous les tags
  
  if (deleteError) {
    console.error('❌ Erreur suppression:', deleteError)
  } else {
    console.log('✅ Anciens tags supprimés')
  }
  
  // 2. Récupérer les IDs des types de tags
  console.log('\n2. Récupération des types de tags...')
  const { data: tagTypes, error: typesError } = await supabase
    .from('tag_types')
    .select('id, slug')
  
  if (typesError) {
    console.error('❌ Erreur types:', typesError)
    return
  }
  
  const typeMap = {}
  tagTypes.forEach(type => {
    typeMap[type.slug] = type.id
  })
  
  console.log('✅ Types récupérés:', Object.keys(typeMap))
  
  // 3. Créer les nouveaux tags
  console.log('\n3. Création des nouveaux tags...')
  
  const tagsToCreate = [
    // Catégories
    { name: 'Nettoyant', slug: 'nettoyant', tag_type: 'categories' },
    { name: 'Hydratant', slug: 'hydratant', tag_type: 'categories' },
    { name: 'Sérum', slug: 'serum', tag_type: 'categories' },
    { name: 'Masque', slug: 'masque', tag_type: 'categories' },
    { name: 'Exfoliant', slug: 'exfoliant', tag_type: 'categories' },
    { name: 'Protection Solaire', slug: 'protection-solaire', tag_type: 'categories' },
    
    // Besoins
    { name: 'Hydratation', slug: 'hydratation', tag_type: 'besoins' },
    { name: 'Anti-âge', slug: 'anti-age', tag_type: 'besoins' },
    { name: 'Acné', slug: 'acne', tag_type: 'besoins' },
    { name: 'Éclat', slug: 'eclat', tag_type: 'besoins' },
    { name: 'Protection', slug: 'protection', tag_type: 'besoins' },
    { name: 'Sensibilité', slug: 'sensibilite', tag_type: 'besoins' },
    { name: 'Taches', slug: 'taches', tag_type: 'besoins' },
    
    // Types de peau
    { name: 'Peau Grasse', slug: 'peau-grasse', tag_type: 'types-peau' },
    { name: 'Peau Sèche', slug: 'peau-seche', tag_type: 'types-peau' },
    { name: 'Peau Mixte', slug: 'peau-mixte', tag_type: 'types-peau' },
    { name: 'Peau Sensible', slug: 'peau-sensible', tag_type: 'types-peau' },
    { name: 'Tous Types', slug: 'tous-types', tag_type: 'types-peau' },
    
    // Ingrédients
    { name: 'Acide Hyaluronique', slug: 'acide-hyaluronique', tag_type: 'ingredients' },
    { name: 'Vitamine C', slug: 'vitamine-c', tag_type: 'ingredients' },
    { name: 'Rétinol', slug: 'retinol', tag_type: 'ingredients' },
    { name: 'Niacinamide', slug: 'niacinamide', tag_type: 'ingredients' },
    { name: 'AHA/BHA', slug: 'aha-bha', tag_type: 'ingredients' },
  ]
  
  for (const tag of tagsToCreate) {
    const typeId = typeMap[tag.tag_type]
    if (!typeId) {
      console.error(`❌ Type ${tag.tag_type} non trouvé`)
      continue
    }
    
    const { error: insertError } = await supabase
      .from('tags')
      .insert({
        name: tag.name,
        slug: tag.slug,
        tag_type_id: typeId
      })
    
    if (insertError) {
      console.error(`❌ Erreur création tag ${tag.name}:`, insertError)
    } else {
      console.log(`✅ Tag créé: ${tag.name}`)
    }
  }
  
  // 4. Vérifier le résultat
  console.log('\n4. Vérification finale...')
  const { data: finalTags, error: finalError } = await supabase
    .from('tags_with_types')
    .select('name, tag_type')
  
  if (finalError) {
    console.error('❌ Erreur vérification:', finalError)
  } else {
    console.log('✅ Tags créés:', finalTags?.length || 0)
    
    // Grouper par type
    const byType = {}
    finalTags?.forEach(tag => {
      byType[tag.tag_type] = byType[tag.tag_type] || []
      byType[tag.tag_type].push(tag.name)
    })
    
    Object.entries(byType).forEach(([type, tags]) => {
      console.log(`  ${type}: ${tags.length} tags - ${tags.join(', ')}`)
    })
  }
}

fixTags().catch(console.error) 