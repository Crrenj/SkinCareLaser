'use client'
import { useState } from 'react'
import { PhotoIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabaseClient'

interface DirectImageUploadProps {
  onUploadComplete: (url: string) => void
  currentImageUrl?: string
  productSlug: string
}

/**
 * Upload direct via Supabase client
 * Nécessite les policies configurées dans Dashboard
 */
export default function DirectImageUpload({ 
  onUploadComplete, 
  currentImageUrl, 
  productSlug 
}: DirectImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validations
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB')
      return
    }

    setUploading(true)

    try {
      // Preview local
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)

      // Upload direct vers Supabase Storage
      const fileName = `${productSlug}/${Date.now()}-${file.name}`
      
      const { data, error } = await supabase.storage
        .from('product-image')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        })

      if (error) {
        // Si erreur 403, c'est un problème de policy
        if (error.message.includes('403')) {
          throw new Error('Accès refusé. Vérifiez que vous êtes admin.')
        }
        throw error
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('product-image')
        .getPublicUrl(fileName)

      onUploadComplete(publicUrl)
      alert('Image uploadée avec succès!')
      
    } catch (error: any) {
      console.error('Erreur upload:', error)
      alert('Erreur: ' + error.message)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  // Fonction pour supprimer une image
  const handleDelete = async () => {
    if (!currentImageUrl || !confirm('Supprimer cette image ?')) return

    setUploading(true)
    try {
      // Extraire le path depuis l'URL
      const url = new URL(currentImageUrl)
      const path = url.pathname.split('/').slice(-2).join('/')

      const { error } = await supabase.storage
        .from('product-image')
        .remove([path])

      if (error) throw error

      onUploadComplete('') // Notifier la suppression
      setPreview(null)
      alert('Image supprimée')
      
    } catch (error: any) {
      alert('Erreur suppression: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const imageToShow = preview || currentImageUrl

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Image du produit (Upload direct)
      </label>
      
      {imageToShow ? (
        <div className="relative w-32 h-32 border rounded-lg overflow-hidden group">
          <img 
            src={imageToShow} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          {currentImageUrl && (
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded 
                opacity-0 group-hover:opacity-100 transition-opacity
                disabled:opacity-50"
              title="Supprimer"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <PhotoIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      {uploading && (
        <p className="text-sm text-gray-500">Traitement...</p>
      )}
      
      <p className="text-xs text-gray-400">
        Formats: PNG, JPG, WebP (max 5MB)
      </p>
    </div>
  )
} 