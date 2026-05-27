import { NextRequest, NextResponse } from 'next/server'

const VERCEL_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : null
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? null

function getAllowedOrigins(): string[] {
  const origins: string[] = ['http://localhost:3000']
  if (SITE_URL) origins.push(SITE_URL)
  if (VERCEL_URL) origins.push(VERCEL_URL)
  return origins
}

export function checkOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  if (!origin) return null

  const allowed = getAllowedOrigins()
  if (allowed.some((o) => origin === o)) return null

  return NextResponse.json(
    { error: 'origin_rejected' },
    { status: 403 },
  )
}
