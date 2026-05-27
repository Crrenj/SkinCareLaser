import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { CartResponse, AddToCartRequest } from '@/types/cart'

/**
 * Résout l'identifiant du panier courant. Si l'utilisateur est authentifié,
 * on travaille avec son cart user_id (et on n'écrit pas le cookie anon).
 * Sinon on retombe sur le cookie `cart_id` UUID (créé à la volée si absent).
 */
async function resolveCartContext(): Promise<{
  userId: string | null
  anonId: string | null
}> {
  const supabaseSsr = await createSupabaseServerClient()
  const { data: { user } } = await supabaseSsr.auth.getUser()
  if (user) {
    return { userId: user.id, anonId: null }
  }

  const cookieStore = await cookies()
  let anonId = cookieStore.get('cart_id')?.value ?? null
  if (!anonId) {
    anonId = crypto.randomUUID()
    cookieStore.set('cart_id', anonId, {
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: true,
    })
  }
  return { userId: null, anonId }
}

/**
 * Les RLS de carts/cart_items reposent sur un claim JWT `anonymous_id` qui
 * n'est jamais émis par Supabase Auth pour les visiteurs anonymes. Conséquence :
 * tout SELECT/UPDATE direct retourne 0 rows en mode anon. On bypasse via
 * service role, la sécurité étant assurée côté route (chaque opération valide
 * que l'anon_id du cookie pointe bien sur le cart cible avant d'agir).
 */
function getDb() {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing')
  }
  return supabaseAdmin
}

// GET : Récupérer l'état du panier
export async function GET() {
  try {
    const { userId, anonId } = await resolveCartContext()
    const supabase = getDb()

    const { data: cartId, error: cartError } = await supabase.rpc('get_or_create_cart', {
      p_user_id: userId ?? undefined,
      p_anonymous_id: anonId ?? undefined,
    })

    if (cartError) {
      console.error('Erreur création panier:', cartError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du panier' },
        { status: 500 }
      )
    }

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
          volume,
          product_images (url, alt),
          range:ranges ( brand:brands (name) )
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

    // Shape retourné par Supabase avec les joins imbriqués — typé localement
    // (les types générés ne capturent pas bien les joins multi-niveau).
    type CartItemRow = {
      id: string
      cart_id: string
      product_id: string
      quantity: number
      products: {
        id: string
        name: string
        price: number
        currency: string
        stock: number | null
        volume: string | null
        product_images: { url: string; alt: string | null }[]
        range: { brand: { name: string } | null } | null
      } | null
    }

    const items = ((cartItems ?? []) as unknown as CartItemRow[]).map((item) => {
      const brandName = item.products?.range?.brand?.name ?? null
      return {
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.products
          ? {
              id: item.products.id,
              name: item.products.name,
              price: item.products.price,
              currency: item.products.currency,
              stock: item.products.stock ?? 0,
              volume: item.products.volume ?? null,
              brand: brandName,
              images: (item.products.product_images ?? []).map((img) => ({
                url: img.url,
                alt: img.alt ?? '',
              })),
            }
          : undefined,
      }
    })

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)

    const response: CartResponse = {
      cart: {
        id: cartId,
        user_id: userId,
        anonymous_id: anonId,
        created_at: new Date().toISOString(),
        items,
      },
      totalItems,
      totalPrice,
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
    const body: AddToCartRequest = await request.json()
    const { productId, quantity } = body

    if (!productId || quantity <= 0) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      )
    }

    const { userId, anonId } = await resolveCartContext()
    const supabase = getDb()

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

    if ((product.stock ?? 0) < quantity) {
      return NextResponse.json(
        { error: 'Stock insuffisant' },
        { status: 400 }
      )
    }

    const { data: cartId, error: cartError } = await supabase.rpc('get_or_create_cart', {
      p_user_id: userId ?? undefined,
      p_anonymous_id: anonId ?? undefined,
    })

    if (cartError) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du panier' },
        { status: 500 }
      )
    }

    const { error: rpcError } = await supabase.rpc('add_to_cart', {
      p_cart_id: cartId,
      p_product_id: productId,
      p_quantity: quantity,
      // anon_id seulement en mode anon (la RPC le valide contre le cart) ;
      // en mode user on passe undefined et le check est skippé.
      p_anon_id: anonId ?? undefined,
    })

    if (rpcError) {
      console.error('Erreur RPC add_to_cart:', rpcError)
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

    const { userId, anonId } = await resolveCartContext()
    const supabase = getDb()

    if (!userId && !anonId) {
      return NextResponse.json(
        { error: 'Panier non trouvé' },
        { status: 404 }
      )
    }

    // En mode service-role, auth.uid() = NULL côté RPC. On passe donc le
    // user_id explicitement quand on est authentifié.
    const { error: rpcError } = await supabase.rpc('remove_from_cart', {
      p_product_id: productId,
      p_anon_id: anonId ?? undefined,
      p_user_id: userId ?? undefined,
    })

    if (rpcError) {
      console.error('Erreur RPC remove_from_cart:', rpcError)
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
