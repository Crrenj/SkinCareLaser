import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { CartResponse, AddToCartRequest } from '@/types/cart'

// Client Supabase normal
function createSupabaseClient() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return supabase
}

// GET : Récupérer l'état du panier
export async function GET() {
  try {
    const cookieStore = await cookies()
    let anonId = cookieStore.get('cart_id')?.value
    
    if (!anonId) {
      anonId = crypto.randomUUID()
      cookieStore.set('cart_id', anonId, {
        maxAge: 60 * 60 * 24 * 30, // 30 jours
        sameSite: 'lax',
        httpOnly: false // Permettre l'accès côté client
      })
    }
    
    const supabase = createSupabaseClient()
    
    // Récupérer ou créer le panier
    const { data: cartId, error: cartError } = await supabase
      .rpc('get_or_create_cart', { p_anon: anonId })
    
    if (cartError) {
      console.error('Erreur création panier:', cartError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du panier' },
        { status: 500 }
      )
    }
    
    // Récupérer les items du panier avec les détails produits
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        quantity,
        products (
          id,
          name,
          price,
          currency,
          stock,
          product_images (url, alt)
        )
      `)
      .eq('cart_id', cartId)
    
    if (itemsError) {
      console.error('Erreur récupération items:', itemsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du panier' },
        { status: 500 }
      )
    }
    
    // Formater la réponse avec typage correct
    const items = (cartItems as any[])?.map(item => ({
      id: item.id,
      cart_id: item.cart_id,
      product_id: item.product_id,
      quantity: item.quantity,
      product: item.products ? {
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        currency: item.products.currency,
        stock: item.products.stock,
        images: item.products.product_images || []
      } : undefined
    })) || []
    
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)
    
    const response: CartResponse = {
      cart: {
        id: cartId,
        user_id: null, // Sera mis à jour lors de la connexion
        anonymous_id: anonId,
        created_at: new Date().toISOString(),
        items
      },
      totalItems,
      totalPrice
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Erreur API panier:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST : Ajouter/modifier un item dans le panier
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    let anonId = cookieStore.get('cart_id')?.value
    
    if (!anonId) {
      anonId = crypto.randomUUID()
      cookieStore.set('cart_id', anonId, {
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        httpOnly: false
      })
    }
    
    const body: AddToCartRequest = await request.json()
    const { productId, quantity } = body
    
    if (!productId || quantity <= 0) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      )
    }
    
    const supabase = createSupabaseClient()
    
    // Vérifier le stock disponible
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock, price')
      .eq('id', productId)
      .single()
    
    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }
    
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Stock insuffisant' },
        { status: 400 }
      )
    }
    
    // Récupérer ou créer le panier
    const { data: cartId, error: cartError } = await supabase
      .rpc('get_or_create_cart', { p_anon: anonId })
    
    if (cartError) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du panier' },
        { status: 500 }
      )
    }
    
    // Utiliser directement la fonction RPC avec la signature correcte
    const { error: rpcError } = await supabase
      .rpc('add_to_cart', {
        p_cart_id: cartId,
        p_product_id: productId,
        p_qty: quantity
      })
    
    if (rpcError) {
      console.error('Erreur RPC:', rpcError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout au panier' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erreur POST panier:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE : Supprimer un item du panier
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    if (!productId) {
      return NextResponse.json(
        { error: 'ID produit requis' },
        { status: 400 }
      )
    }
    
    const cookieStore = await cookies()
    const anonId = cookieStore.get('cart_id')?.value
    
    if (!anonId) {
      return NextResponse.json(
        { error: 'Panier non trouvé' },
        { status: 404 }
      )
    }
    
    const supabase = createSupabaseClient()
    
    // Utiliser directement la fonction RPC pour la suppression
    const { error: rpcError } = await supabase
      .rpc('remove_from_cart', {
        p_product_id: productId,
        p_anon_id: anonId
      })
    
    if (rpcError) {
      console.error('Erreur RPC suppression:', rpcError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erreur DELETE panier:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 