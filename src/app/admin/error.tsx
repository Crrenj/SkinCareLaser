'use client'

import Link from 'next/link'
import { ADMIN_HOME_PATH } from '@/lib/constants'

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-[48px] leading-[1.05] text-ink-900 mb-4">
        Error
      </h1>
      <p className="text-[15px] text-ink-700 max-w-md mb-8">
        Algo salió mal. Intenta de nuevo o vuelve al inicio.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="h-11 px-6 rounded-lg bg-clay-700 text-sand-50 text-[14px] font-medium hover:bg-clay-800 transition-colors"
        >
          Reintentar
        </button>
        <Link
          href={ADMIN_HOME_PATH}
          className="h-11 px-6 rounded-lg border border-sand-300 text-ink-900 text-[14px] font-medium flex items-center hover:bg-sand-200 transition-colors"
        >
          Inicio admin
        </Link>
      </div>
    </main>
  )
}
