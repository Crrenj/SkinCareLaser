require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCatalogueData() {
  console.log('🧪 Test des données de la page catalogue...')
  
  // 1. Test de la requête produits (comme dans catalogue/page.tsx)
  console.log('\n1. Test requête produits avec tags :')
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      currency,
      product_images ( url, alt ),
      product_ranges (
        range:ranges (
          id,
          name,
          brand:brands ( id, name )
        )
      ),
      product_tags (
        tag:tags_with_types ( name, tag_type )
      )
    `)
    .limit(5) // Limiter pour le test
  
  if (pErr) {
    console.error('❌ Erreur produits:', pErr)
    return
  }
  
  console.log(`✅ ${products?.length || 0} produits récupérés`)
  
  // 2. Test de la requête tags (comme dans catalogue/page.tsx)
  console.log('\n2. Test requête tous les tags :')
  const { data: tags, error: tErr } = await supabase
    .from('tags_with_types')
    .select('name, tag_type')
  
  if (tErr) {
    console.error('❌ Erreur tags:', tErr)
    return
  }
  
  console.log(`✅ ${tags?.length || 0} tags récupérés`)
  
  // 3. Simulation du regroupement itemsByType
  console.log('\n3. Simulation regroupement itemsByType :')
  const itemsByType = {}
  tags?.forEach(t => {
    if (!itemsByType[t.tag_type]) {
      itemsByType[t.tag_type] = []
    }
    itemsByType[t.tag_type].push(t.name)
  })
  
  console.log('✅ itemsByType généré:')
  Object.entries(itemsByType).forEach(([type, tagList]) => {
    console.log(`  ${type}: ${tagList.length} tags - ${tagList.slice(0, 3).join(', ')}${tagList.length > 3 ? '...' : ''}`)
  })
  
  // 4. Test des produits mappés
  console.log('\n4. Test produits mappés :')
  const mappedProducts = products?.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.product_ranges?.[0]?.range?.brand?.name ?? '',
    range: p.product_ranges?.[0]?.range?.name ?? '',
    tags: p.product_tags.flatMap((pt) => ({ 
      label: pt.tag.name, 
      category: pt.tag.tag_type 
    }))
  })) ?? []
  
  console.log(`✅ ${mappedProducts.length} produits mappés:`)
  mappedProducts.forEach(p => {
    console.log(`  ${p.name}: ${p.tags?.length || 0} tags`)
    if (p.tags?.length > 0) {
      const tagsByCategory = {}
      p.tags.forEach(tag => {
        if (!tagsByCategory[tag.category]) tagsByCategory[tag.category] = []
        tagsByCategory[tag.category].push(tag.label)
      })
      Object.entries(tagsByCategory).forEach(([cat, tagList]) => {
        console.log(`    ${cat}: ${tagList.join(', ')}`)
      })
    }
  })
  
  // 5. Résumé pour le filtrage
  console.log('\n5. Résumé pour le système de filtrage :')
  console.log(`📊 Types de filtres disponibles: ${Object.keys(itemsByType).length}`)
  console.log(`📦 Produits avec tags: ${mappedProducts.filter(p => p.tags?.length > 0).length}/${mappedProducts.length}`)
  
  if (Object.keys(itemsByType).length > 0) {
    console.log('✅ Le système de filtrage devrait afficher les sections:')
    Object.keys(itemsByType).forEach(type => {
      const label = {
        'categories': 'CATÉGORIES',
        'besoins': 'BESOINS', 
        'types-peau': 'TYPE DE PEAU',
        'ingredients': 'INGRÉDIENTS'
      }[type] || type.toUpperCase()
      console.log(`  - ${label} (${itemsByType[type].length} options)`)
    })
  } else {
    console.log('⚠️ Aucun type de tag trouvé - les filtres seront vides')
  }
}

testCatalogueData().catch(console.error) 