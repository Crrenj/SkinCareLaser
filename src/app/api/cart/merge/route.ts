import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST() {
  const cookieStore = await cookies()
  const anonId = cookieStore.get('cart_id')?.value

  if (!anonId) {
    return NextResponse.json({ ok: true, merged: false })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { error } = await supabase.rpc('merge_anon_cart_to_user', {
    p_anon_id: anonId,
  })

  if (error) {
    console.error('[/api/cart/merge]', error)
    return NextResponse.json({ error: 'merge_failed' }, { status: 500 })
  }

  cookieStore.delete('cart_id')

  return NextResponse.json({ ok: true, merged: true })
}
