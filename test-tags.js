require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('URL:', supabaseUrl ? 'Définie' : 'Manquante')
console.log('Key:', supabaseKey ? 'Définie' : 'Manquante')

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTags() {
  console.log('🔍 Test des tags...')
  
  // Test 1: Récupérer tous les tags
  console.log('\n1. Test récupération des tags :')
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
  
  if (tagsError) {
    console.error('❌ Erreur tags:', tagsError)
  } else {
    console.log('✅ Tags récupérés:', tags?.length || 0)
    if (tags?.length) {
      console.log('Premiers tags:', tags.slice(0, 3))
    }
  }
  
  // Test 2: Récupérer la vue tags_with_types
  console.log('\n2. Test vue tags_with_types :')
  const { data: tagsWithTypes, error: viewError } = await supabase
    .from('tags_with_types')
    .select('*')
  
  if (viewError) {
    console.error('❌ Erreur vue tags_with_types:', viewError)
  } else {
    console.log('✅ Vue tags_with_types:', tagsWithTypes?.length || 0)
    if (tagsWithTypes?.length) {
      console.log('Premiers tags avec types:', tagsWithTypes.slice(0, 3))
    }
  }
  
  // Test 3: Récupérer les tag_types
  console.log('\n3. Test tag_types :')
  const { data: tagTypes, error: typesError } = await supabase
    .from('tag_types')
    .select('*')
  
  if (typesError) {
    console.error('❌ Erreur tag_types:', typesError)
  } else {
    console.log('✅ Tag types récupérés:', tagTypes?.length || 0)
    if (tagTypes?.length) {
      console.log('Types disponibles:', tagTypes.map(t => t.slug))
    }
  }
  
  // Test 4: Grouper les tags par type comme dans la page catalogue
  console.log('\n4. Test groupement par type :')
  if (tagsWithTypes?.length) {
    const itemsByType = {}
    tagsWithTypes.forEach(t => {
      itemsByType[t.tag_type] = itemsByType[t.tag_type] || []
      itemsByType[t.tag_type].push(t.name)
    })
    
    console.log('✅ Groupement par type:')
    Object.entries(itemsByType).forEach(([type, items]) => {
      console.log(`  ${type}: ${items.length} tags`)
    })
  }
  
  // Test 5: Vérifier les produits avec tags
  console.log('\n5. Test produits avec tags :')
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      product_tags (
        tag:tags_with_types ( name, tag_type )
      )
    `)
    .limit(5)
  
  if (productsError) {
    console.error('❌ Erreur produits:', productsError)
  } else {
    console.log('✅ Produits avec tags:', products?.length || 0)
    if (products?.length) {
      products.forEach(p => {
        console.log(`  ${p.name}: ${p.product_tags?.length || 0} tags`)
      })
    }
  }
}

testTags().catch(console.error) 