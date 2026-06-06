import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseBody, productUpdate } from '@/lib/schemas'
import { apiError } from '@/lib/apiError'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const parsed = parseBody(productUpdate, body)
    if (!parsed.ok) return parsed.response
    const { id } = await params

    // parsed.data (strict) ferme le mass-assignment : seules name/slug/
    // description/price/stock sont mises à jour (cf. POST). [C-09]
    const { brand_id: _brandId, range_id, selectedTags, imageFile, ...updateFields } =
      parsed.data

    let newImageUrl: string | null = null
    if (imageFile && updateFields.slug) {
      let brandName = ''
      if (range_id && range_id !== '') {
        const { data: range } = await supabaseAdmin
          .from('ranges')
          .select('brands(name)')
          .eq('id', range_id)
          .single()
        brandName = (range?.brands as { name?: string } | null)?.name?.toLowerCase() || ''
      }

      const { data: existingImages } = await supabaseAdmin
        .from('product_images')
        .select('url')
        .eq('product_id', id)

      for (const existing of existingImages ?? []) {
        const oldPath = existing.url.split('/storage/v1/object/public/product-image/')[1]
        if (oldPath) {
          await supabaseAdmin.storage.from('product-image').remove([oldPath])
        }
      }

      const imageBuffer = Buffer.from(imageFile, 'base64')
      const imagePath = brandName
        ? `${brandName}/${updateFields.slug}.png`
        : `${updateFields.slug}.png`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('product-image')
        .upload(imagePath, imageBuffer, { contentType: 'image/png', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('product-image')
        .getPublicUrl(imagePath)

      newImageUrl = publicUrl
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ ...updateFields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Un produit avec ce slug existe déjà' },
          { status: 409 },
        )
      }
      throw error
    }

    if (range_id && range_id !== '') {
      await supabaseAdmin.from('products').update({ range_id }).eq('id', id)
    }

    if (newImageUrl) {
      await supabaseAdmin.from('product_images').delete().eq('product_id', id)
      await supabaseAdmin.from('product_images').insert({
        product_id: id,
        url: newImageUrl,
        alt: `Image de ${updateFields.name || 'produit'}`,
      })
    }

    if (selectedTags && Array.isArray(selectedTags)) {
      await supabaseAdmin.from('product_tags').delete().eq('product_id', id)
      if (selectedTags.length > 0) {
        const productTagsData = selectedTags.map((tagId: string) => ({
          product_id: id,
          tag_id: tagId,
        }))
        await supabaseAdmin.from('product_tags').insert(productTagsData)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    return apiError('Erreur lors de la mise à jour', error, 500)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  try {
    const { id } = await params

    const { data: existingImages } = await supabaseAdmin
      .from('product_images')
      .select('url')
      .eq('product_id', id)

    for (const existing of existingImages ?? []) {
      const imagePath = existing.url
        .split('/storage/v1/object/public/product-image/')[1]
      if (imagePath) {
        await supabaseAdmin.storage.from('product-image').remove([imagePath])
      }
    }

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError('Erreur lors de la suppression', error, 500)
  }
}
