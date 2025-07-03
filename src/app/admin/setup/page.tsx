'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface ConfigStatus {
  supabaseUrl: boolean
  supabaseAnonKey: boolean
  supabaseServiceKey: boolean
  message?: string
}

export default function AdminSetupPage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
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
          message: 'Erreur de configuration générale'
        })
      }
    } catch (error) {
      setConfigStatus({
        supabaseUrl: false,
        supabaseAnonKey: false,
        supabaseServiceKey: false,
        message: 'Impossible de vérifier la configuration'
      })
    } finally {
      setLoading(false)
    }
  }

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircleIcon className="h-6 w-6 text-green-500" />
    ) : (
      <XCircleIcon className="h-6 w-6 text-red-500" />
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configuration du système admin</h1>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de la configuration...</p>
        </div>
      ) : (
        <>
          {/* État de la configuration */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">État de la configuration</h2>
            
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
                  <span className="text-red-600 text-sm font-semibold">⚠️ OBLIGATOIRE</span>
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
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">
                Action requise : Configurer la clé de service
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Étape 1 : Obtenir la clé de service</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Connectez-vous à votre <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline">dashboard Supabase</a></li>
                    <li>Sélectionnez votre projet</li>
                    <li>Allez dans <strong>Settings → API</strong></li>
                    <li>Copiez la clé <strong>service_role</strong> (pas anon !)</li>
                  </ol>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Étape 2 : Ajouter la clé au projet</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Créez ou modifiez le fichier <code className="bg-gray-200 px-1 py-0.5 rounded">.env.local</code> à la racine du projet :
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`# Ajoutez cette ligne à votre .env.local
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...votre-clé-ici`}
                  </pre>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Étape 3 : Redémarrer le serveur</h3>
                  <p className="text-sm text-yellow-800">
                    Après avoir ajouté la clé, arrêtez le serveur (Ctrl+C) et relancez :
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-2 rounded-md text-sm mt-2">
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
                <h2 className="text-xl font-semibold text-green-900">Configuration réussie !</h2>
              </div>
              
              <p className="text-green-800 mb-4">
                Toutes les variables d'environnement sont correctement configurées.
              </p>
              
              <div className="flex gap-3">
                <Link 
                  href="/admin/product" 
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Accéder à la gestion des produits
                </Link>
                
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Revérifier
                </button>
              </div>
            </div>
          )}

          {/* Ressources supplémentaires */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Ressources utiles</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/GUIDE_ADMIN_PRODUCTS.md" className="text-blue-600 hover:underline">
                  📖 Guide complet du système admin
                </Link>
              </li>
              <li>
                <a 
                  href="https://supabase.com/docs/guides/api#api-url-and-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  🔗 Documentation Supabase - API Keys
                </a>
              </li>
              <li className="text-gray-600">
                💡 Astuce : Ne partagez jamais votre clé de service !
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
} 