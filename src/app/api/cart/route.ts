import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { CartResponse } from '@/types/cart'
import { guardMutation } from '@/lib/csrf'
import { parseBody, cartItemBody } from '@/lib/schemas'
import { fetchEffectivePrices, applyPromo } from '@/lib/pricing'

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
      secure: process.env.NODE_ENV === 'production',
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
      logger.error('Erreur création panier:', cartError)
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
      logger.error('Erreur récupération items:', itemsError)
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

    const rows = (cartItems ?? []) as unknown as CartItemRow[]
    // Prix effectifs (promo) en batch → le panier facture et affiche le remisé.
    const priceMap = await fetchEffectivePrices(supabase, rows.map((r) => r.product_id))

    const items = rows.map((item) => {
      const brandName = item.products?.range?.brand?.name ?? null
      const { price, oldPrice } = applyPromo(
        item.products?.price ?? 0,
        null,
        priceMap.get(item.product_id),
      )
      return {
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.products
          ? {
              id: item.products.id,
              name: item.products.name,
              price,
              oldPrice,
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
    logger.error('Erreur API panier:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST : Ajouter/modifier un item dans le panier
export async function POST(request: NextRequest) {
  const guard = guardMutation(request, { json: true })
  if (guard) return guard

  try {
    const parsed = parseBody(cartItemBody, await request.json())
    if (!parsed.ok) return parsed.response
    const { productId, quantity } = parsed.data

    const { userId, anonId } = await resolveCartContext()
    const supabase = getDb()

    // Le contrôle de stock CUMULÉ (existant + delta <= stock) est fait
    // atomiquement dans la RPC add_to_cart (M1, FOR UPDATE). Ici on vérifie
    // seulement l'existence du produit. [C-13]
    const { error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single()

    if (productError) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
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
      // M1 : la RPC lève 'Stock insuffisant'/'Quantité invalide' (ERRCODE
      // check_violation 23514) → 400 client plutôt que 500. [C-13]
      if (rpcError.code === '23514' || /stock|quantit/i.test(rpcError.message)) {
        return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 })
      }
      logger.error('Erreur RPC add_to_cart:', rpcError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout au panier' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur POST panier:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PATCH : Définir la quantité ABSOLUE d'un item (stepper +/- du panier).
// À ne pas confondre avec POST/add_to_cart qui INCRÉMENTE : envoyer une
// quantité cible ici écrit la valeur telle quelle.
export async function PATCH(request: NextRequest) {
  const guard = guardMutation(request, { json: true })
  if (guard) return guard

  try {
    const parsed = parseBody(cartItemBody, await request.json())
    if (!parsed.ok) return parsed.response
    const { productId, quantity } = parsed.data

    const { userId, anonId } = await resolveCartContext()
    const supabase = getDb()

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Quantité absolue : on valide la cible (et non un delta) contre le stock.
    // cartItemBody borne déjà 1..99 (MAX_CART_QUANTITY). [C-28]
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

    if (cartError || !cartId) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du panier' },
        { status: 500 }
      )
    }

    // Écriture directe en service-role. Le cart_id est dérivé côté serveur
    // (user authentifié ou cookie httpOnly), donc on ne touche que le panier
    // de l'appelant — pas besoin d'une nouvelle RPC SECURITY DEFINER.
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('cart_id', cartId)
      .eq('product_id', productId)

    if (updateError) {
      logger.error('Erreur PATCH cart_items:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur PATCH panier:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE : Supprimer un item du panier
export async function DELETE(request: NextRequest) {
  const guard = guardMutation(request, { json: false })
  if (guard) return guard

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
      logger.error('Erreur RPC remove_from_cart:', rpcError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur DELETE panier:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
