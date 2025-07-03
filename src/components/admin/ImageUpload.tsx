'use client'
import { useState } from 'react'
import { PhotoIcon } from '@heroicons/react/24/outline'

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  currentImageUrl?: string
  productSlug: string
}

/**
 * Composant d'upload d'image pour les admins
 * Utilise la route API /api/admin/upload
 */
export default function ImageUpload({ 
  onUploadComplete, 
  currentImageUrl, 
  productSlug 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB')
      return
    }

    setUploading(true)

    try {
      // Convertir en base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result?.toString().split(',')[1]
        if (!base64) return

        // Preview local
        setPreview(reader.result as string)

        // Préparer le nom du fichier
        const fileName = `${productSlug}/${Date.now()}-${file.name}`

        // Upload via API
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64,
            fileName,
            contentType: file.type
          })
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Erreur upload')
        }

        // Notifier le parent
        onUploadComplete(data.url)
        alert('Image uploadée avec succès!')
      }

      reader.readAsDataURL(file)
    } catch (error: any) {
      console.error('Erreur upload:', error)
      alert('Erreur: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const imageToShow = preview || currentImageUrl

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Image du produit
      </label>
      
      {/* Preview */}
      {imageToShow ? (
        <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
          <img 
            src={imageToShow} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <PhotoIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}

      {/* Input file */}
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
        <p className="text-sm text-gray-500">Upload en cours...</p>
      )}
    </div>
  )
} 