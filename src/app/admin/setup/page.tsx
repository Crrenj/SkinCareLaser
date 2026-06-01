'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface ConfigStatus {
  supabaseUrl: boolean
  supabaseAnonKey: boolean
  supabaseServiceKey: boolean
  message?: string
}

export default function AdminSetupPage() {
  const t = useTranslations('Admin.setup')
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkConfiguration = useCallback(async () => {
    try {
      // Vérifier la configuration via une API simple
      const res = await fetch('/api/admin/products?page=1&limit=1')
      const data = await res.json()
      
      if (res.status === 500 && data.message?.includes('SUPABASE_SERVICE_KEY')) {
        setConfigStatus({
          supabaseUrl: true,
          supabaseAnonKey: true,
          supabaseServiceKey: false,
          message: data.message
        })
      } else if (res.ok) {
        setConfigStatus({
          supabaseUrl: true,
          supabaseAnonKey: true,
          supabaseServiceKey: true
        })
      } else {
        setConfigStatus({
          supabaseUrl: false,
          supabaseAnonKey: false,
          supabaseServiceKey: false,
          message: t('configError')
        })
      }
    } catch {
      setConfigStatus({
        supabaseUrl: false,
        supabaseAnonKey: false,
        supabaseServiceKey: false,
        message: t('checkFailed')
      })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    checkConfiguration()
  }, [checkConfiguration])

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircleIcon className="h-6 w-6 text-green-500" />
    ) : (
      <XCircleIcon className="h-6 w-6 text-red-500" />
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-ink-900 mb-8">{t('title')}</h1>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-ink-700">{t('checking')}</p>
        </div>
      ) : (
        <>
          {/* État de la configuration */}
          <div className="bg-sand-50 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('configTitle')}</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StatusIcon status={configStatus?.supabaseUrl || false} />
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL</span>
              </div>
              
              <div className="flex items-center gap-3">
                <StatusIcon status={configStatus?.supabaseAnonKey || false} />
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              </div>
              
              <div className="flex items-center gap-3">
                <StatusIcon status={configStatus?.supabaseServiceKey || false} />
                <span className="font-medium">SUPABASE_SERVICE_KEY</span>
                {!configStatus?.supabaseServiceKey && (
                  <span className="text-red-600 text-sm font-semibold">{t('required')}</span>
                )}
              </div>
            </div>
            
            {configStatus?.message && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">{configStatus.message}</p>
              </div>
            )}
          </div>

          {/* Instructions de configuration */}
          {!configStatus?.supabaseServiceKey && (
            <div className="bg-sand-50 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">
                {t('actionTitle')}
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">{t('step1Title')}</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>{t('step1li1')}</li>
                    <li>{t('step1li2')}</li>
                    <li>{t('step1li3')}</li>
                    <li>{t('step1li4')}</li>
                  </ol>
                </div>
                
                <div className="bg-sand-100 border border-sand-200 rounded-md p-4">
                  <h3 className="font-semibold text-ink-900 mb-2">{t('step2Title')}</h3>
                  <p className="text-sm text-ink-700 mb-2">
                    {t('step2Body')}
                  </p>
                  <pre className="bg-gray-900 text-ink-200 p-3 rounded-md text-sm overflow-x-auto">
{t('step2Code')}
                  </pre>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">{t('step3Title')}</h3>
                  <p className="text-sm text-yellow-800">
                    {t('step3Body')}
                  </p>
                  <pre className="bg-gray-900 text-ink-200 p-2 rounded-md text-sm mt-2">
npm run dev
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Succès */}
          {configStatus?.supabaseServiceKey && (
            <div className="bg-green-50 border border-green-200 rounded-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <h2 className="text-xl font-semibold text-green-900">{t('successTitle')}</h2>
              </div>
              
              <p className="text-green-800 mb-4">
                {t('successBody')}
              </p>
              
              <div className="flex gap-3">
                <Link 
                  href="/admin/product" 
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {t('goToProducts')}
                </Link>
                
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  {t('recheck')}
                </button>
              </div>
            </div>
          )}

          {/* Ressources supplémentaires */}
          <div className="mt-8 bg-sand-100 rounded-lg p-6">
            <h3 className="font-semibold text-ink-900 mb-3">{t('resourcesTitle')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/GUIDE_ADMIN_PRODUCTS.md" className="text-blue-600 hover:underline">
                  {t('resourceGuide')}
                </Link>
              </li>
              <li>
                <a
                  href="https://supabase.com/docs/guides/api#api-url-and-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {t('resourceDocs')}
                </a>
              </li>
              <li className="text-ink-700">
                {t('resourceTip')}
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
} 