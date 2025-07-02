'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function TestRedirectPage() {
  const router = useRouter()
  const [status, setStatus] = useState<string[]>([])

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`])
  }

  const testNextRouter = () => {
    addStatus('Test router.push("/admin/dashboard")...')
    router.push('/admin/dashboard')
    addStatus('router.push() exécuté')
  }

  const testWindowLocation = () => {
    addStatus('Test window.location.href...')
    window.location.href = '/admin/dashboard'
    addStatus('window.location.href exécuté (ne devrait pas s\'afficher)')
  }

  const testWindowReplace = () => {
    addStatus('Test window.location.replace()...')
    window.location.replace('/admin/dashboard')
    addStatus('window.location.replace() exécuté (ne devrait pas s\'afficher)')
  }

  const testWindowAssign = () => {
    addStatus('Test window.location.assign()...')
    window.location.assign('/admin/dashboard')
    addStatus('window.location.assign() exécuté (ne devrait pas s\'afficher)')
  }

  const testRouterReplace = () => {
    addStatus('Test router.replace()...')
    router.replace('/admin/dashboard')
    addStatus('router.replace() exécuté')
  }

  const testAll = async () => {
    addStatus('Test de toutes les méthodes...')
    
    // 1. router.push
    addStatus('1. router.push()')
    router.push('/admin/dashboard')
    
    // 2. Attendre un peu puis window.location
    setTimeout(() => {
      addStatus('2. window.location.href (après 500ms)')
      window.location.href = '/admin/dashboard'
    }, 500)
  }

  const forceRedirect = () => {
    addStatus('Redirection forcée dans 1 seconde...')
    setTimeout(() => {
      window.location.href = window.location.origin + '/admin/dashboard'
    }, 1000)
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Redirection</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testNextRouter}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test router.push()
        </button>
        
        <button
          onClick={testRouterReplace}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-4"
        >
          Test router.replace()
        </button>
        
        <button
          onClick={testWindowLocation}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-4"
        >
          Test window.location.href
        </button>
        
        <button
          onClick={testWindowReplace}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-4"
        >
          Test window.location.replace()
        </button>
        
        <button
          onClick={testWindowAssign}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-4"
        >
          Test window.location.assign()
        </button>
        
        <button
          onClick={testAll}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 ml-4"
        >
          Test Toutes les méthodes
        </button>
        
        <button
          onClick={forceRedirect}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-4"
        >
          Forcer avec URL complète
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Statut :</h2>
        <div className="space-y-1">
          {status.map((s, i) => (
            <div key={i} className="text-sm font-mono">{s}</div>
          ))}
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-sm text-gray-600">
          URL actuelle : {typeof window !== 'undefined' ? window.location.href : 'SSR'}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Si la redirection ne fonctionne pas, essayez :
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
          <li>Vider le cache du navigateur</li>
          <li>Utiliser une fenêtre privée</li>
          <li>Vérifier la console pour des erreurs</li>
          <li>Accéder directement à <a href="/admin/dashboard" className="text-blue-500 underline">/admin/dashboard</a></li>
        </ul>
      </div>
    </div>
  )
} 