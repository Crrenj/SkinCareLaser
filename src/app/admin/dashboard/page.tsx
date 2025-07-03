'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Page de redirection du dashboard vers overview
 * @returns Redirection vers /admin/overview
 */
export default function AdminDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Rediriger vers la nouvelle page overview
    router.replace('/admin/overview')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirection...</p>
      </div>
    </div>
  )
} 