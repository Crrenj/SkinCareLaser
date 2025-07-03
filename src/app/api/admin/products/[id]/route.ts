import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vérifier les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Accepter les deux noms possibles pour la clé de service
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configuration manquante:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  })
}

// Créer un client Supabase avec la clé service pour bypass RLS
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// PATCH /api/admin/products/[id] -> modification d'un produit
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { 
        error: 'Configuration manquante', 
        message: 'SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY non configurée. Consultez GUIDE_ADMIN_PRODUCTS.md' 
      },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { id } = await params
    
    // Extraire brand_id, range_id et imageFile qui ne doivent pas aller dans products
    const { brand_id, range_id, imageFile, ...productData } = body
    
    // Si une nouvelle image est fournie
    if (imageFile && productData.slug) {
      let brandName = ''
      
      // Récupérer le nom de la marque si range_id est fourni
      if (range_id) {
        const { data: range } = await supabaseAdmin
          .from('ranges')
          .select('brands(name)')
          .eq('id', range_id)
          .single()
        
        brandName = (range?.brands as any)?.name?.toLowerCase() || ''
      }
      
      // Supprimer l'ancienne image si elle existe
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('image_url, slug')
        .eq('id', id)
        .single()
      
      if (product?.image_url) {
        const oldPath = product.image_url.split('/storage/v1/object/public/product-image/')[1]
        if (oldPath) {
          await supabaseAdmin.storage
            .from('product-image')
            .remove([oldPath])
        }
      }
      
      // Upload de la nouvelle image
      const imageBuffer = Buffer.from(imageFile, 'base64')
      // Créer le chemin avec le dossier de la marque si elle existe
      const imagePath = brandName 
        ? `${brandName}/${productData.slug}.png`
        : `${productData.slug}.png`
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('product-image')
        .upload(imagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        })
      
      if (uploadError) throw uploadError
      
      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('product-image')
        .getPublicUrl(imagePath)
      
      productData.image_url = publicUrl
      delete productData.imageFile
    }
    
    // Mettre à jour le produit (sans brand_id ni range_id ni image_url)
    const { image_url, ...updateData } = productData
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Si range_id est fourni, mettre à jour la relation
    if (range_id) {
      // Supprimer l'ancienne relation
      await supabaseAdmin
        .from('product_ranges')
        .delete()
        .eq('product_id', id)
      
      // Créer la nouvelle relation
      await supabaseAdmin
        .from('product_ranges')
        .insert({
          product_id: id,
          range_id: range_id
        })
    }
    
    // Si une image a été uploadée, mettre à jour product_images
    if (image_url) {
      // Supprimer les anciennes images
      await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', id)
      
      // Ajouter la nouvelle image
      await supabaseAdmin
        .from('product_images')
        .insert({
          product_id: id,
          url: image_url,
          alt: `Image de ${updateData.name || 'produit'}`
        })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] -> suppression d'un produit
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { 
        error: 'Configuration manquante', 
        message: 'SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY non configurée. Consultez GUIDE_ADMIN_PRODUCTS.md' 
      },
      { status: 500 }
    )
  }

  try {
    const { id } = await params
    
    // Récupérer le produit pour supprimer l'image
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('image_url')
      .eq('id', id)
      .single()
    
    // Supprimer l'image du storage si elle existe
    if (product?.image_url) {
      const imagePath = product.image_url.split('/').pop()
      if (imagePath) {
        await supabaseAdmin.storage
          .from('product-image')
          .remove([imagePath])
      }
    }
    
    // Supprimer le produit
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
} 