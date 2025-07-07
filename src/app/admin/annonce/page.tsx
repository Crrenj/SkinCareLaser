'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Banner from '@/components/Banner'

import { 
  PlusIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  PencilIcon, 
  TrashIcon, 
  PhotoIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface BannerData {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string | null
  link_text: string | null
  banner_type: 'image_left' | 'image_right' | 'image_full' | 'card_style' | 'minimal' | 'gradient_overlay'
  position: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  click_count: number
  view_count: number
}

export default function AnnoncePage() {
  const [banners, setBanners] = useState<BannerData[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    link_text: '',
    banner_type: 'image_left' as 'image_left' | 'image_right' | 'image_full' | 'card_style' | 'minimal' | 'gradient_overlay',
    position: 1,
    is_active: true,
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/banners')
      const data = await response.json()
      
      if (response.ok) {
        setBanners(data.banners || [])
      } else {
        console.error('Erreur lors du chargement des bannières:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bannières:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (banner?: BannerData) => {
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        title: banner.title,
        description: banner.description,
        image_url: banner.image_url,
        link_url: banner.link_url || '',
        link_text: banner.link_text || '',
        banner_type: banner.banner_type,
        position: banner.position,
        is_active: banner.is_active,
        start_date: banner.start_date || '',
        end_date: banner.end_date || ''
      })
    } else {
      setEditingBanner(null)
      setFormData({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        link_text: '',
        banner_type: 'image_left',
        position: banners.length + 1,
        is_active: true,
        start_date: '',
        end_date: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const method = editingBanner ? 'PUT' : 'POST'
      const body = editingBanner 
        ? { ...formData, id: editingBanner.id }
        : formData
      
      const response = await fetch('/api/admin/banners', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchBanners()
        setShowModal(false)
        setEditingBanner(null)
      } else {
        console.error('Erreur lors de la sauvegarde:', data.error)
        alert('Erreur lors de la sauvegarde: ' + data.error)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/banners?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchBanners()
        setShowDeleteConfirm(null)
      } else {
        const data = await response.json()
        console.error('Erreur lors de la suppression:', data.error)
        alert('Erreur lors de la suppression: ' + data.error)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const toggleActive = async (id: string) => {
    const banner = banners.find(b => b.id === id)
    if (!banner) return
    
    try {
      const response = await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...banner,
          is_active: !banner.is_active
        })
      })
      
      if (response.ok) {
        await fetchBanners()
      } else {
        const data = await response.json()
        console.error('Erreur lors de la mise à jour:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const movePosition = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === id)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === banners.length - 1)
    ) {
      return
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const currentBanner = banners[currentIndex]
    const targetBanner = banners[targetIndex]
    
    try {
      // Mettre à jour les positions
      await Promise.all([
        fetch('/api/admin/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...currentBanner,
            position: targetBanner.position
          })
        }),
        fetch('/api/admin/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...targetBanner,
            position: currentBanner.position
          })
        })
      ])
      
      await fetchBanners()
    } catch (error) {
      console.error('Erreur lors du déplacement:', error)
    }
  }

  const activeBanners = banners.filter(b => b.is_active)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Bannières</h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center px-4 py-2 rounded-md ${
              previewMode 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {previewMode ? <EyeSlashIcon className="h-5 w-5 mr-2" /> : <EyeIcon className="h-5 w-5 mr-2" />}
            {previewMode ? 'Quitter l\'aperçu' : 'Aperçu'}
          </button>
          <button 
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Créer une bannière
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Bannières</p>
              <p className="text-2xl font-semibold text-gray-900">{banners.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bannières Actives</p>
              <p className="text-2xl font-semibold text-gray-900">{activeBanners.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vues Totales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {banners.reduce((sum, b) => sum + b.view_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Clics Totaux</p>
              <p className="text-2xl font-semibold text-gray-900">
                {banners.reduce((sum, b) => sum + b.click_count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aperçu des bannières actives */}
      {previewMode && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Aperçu - Page d'accueil</h2>
          

          
          <div className="space-y-6">
            {activeBanners.map((banner) => (
              <Banner
                key={banner.id}
                id={banner.id}
                title={banner.title}
                description={banner.description}
                imageUrl={banner.image_url}
                linkUrl={banner.link_url || undefined}
                linkText={banner.link_text || undefined}
                bannerType={banner.banner_type}
              />
            ))}
          </div>
        </div>
      )}

      {/* Liste des bannières */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {banners.map((banner, index) => (
              <div key={banner.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {banner.image_url ? (
                      <Image
                        src={banner.image_url}
                        alt={banner.title}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          banner.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {banner.is_active ? 'Actif' : 'Inactif'}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {banner.banner_type === 'image_left' ? 'Image gauche' : 
                           banner.banner_type === 'image_right' ? 'Image droite' : 
                           banner.banner_type === 'image_full' ? 'Image pleine' :
                           banner.banner_type === 'card_style' ? 'Carte' :
                           banner.banner_type === 'minimal' ? 'Minimal' :
                           banner.banner_type === 'gradient_overlay' ? 'Gradient' :
                           'Autre'}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{banner.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{banner.view_count} vues</span>
                        <span>{banner.click_count} clics</span>
                        {banner.start_date && (
                          <span>Début: {new Date(banner.start_date).toLocaleDateString('fr-FR')}</span>
                        )}
                        {banner.end_date && (
                          <span>Fin: {new Date(banner.end_date).toLocaleDateString('fr-FR')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-center space-y-1">
                      <button
                        onClick={() => movePosition(banner.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-gray-500">#{banner.position}</span>
                      <button
                        onClick={() => movePosition(banner.id, 'down')}
                        disabled={index === banners.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => toggleActive(banner.id)}
                      className={`p-2 rounded-md ${
                        banner.is_active 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {banner.is_active ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                    </button>
                    
                    <button 
                      onClick={() => openModal(banner)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    
                    <button 
                      onClick={() => setShowDeleteConfirm(banner.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingBanner ? 'Modifier la bannière' : 'Créer une bannière'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Titre</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type de bannière</label>
                <select
                  value={formData.banner_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, banner_type: e.target.value as any }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <optgroup label="Styles classiques">
                    <option value="image_left">Image à gauche</option>
                    <option value="image_right">Image à droite</option>
                    <option value="image_full">Image pleine largeur</option>
                  </optgroup>
                  <optgroup label="Nouveaux styles">
                    <option value="card_style">Style carte</option>
                    <option value="minimal">Style minimal</option>
                    <option value="gradient_overlay">Gradient overlay</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">URL de l'image</label>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://example.com/image.jpg"
                />
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800 font-medium mb-1">📏 Tailles recommandées :</p>
                  <div className="text-xs text-blue-700 space-y-1">
                    {formData.banner_type === 'image_left' || formData.banner_type === 'image_right' ? (
                      <p>• <strong>Images latérales :</strong> 400x300 pixels (ratio 4:3) pour un affichage optimal</p>
                    ) : formData.banner_type === 'image_full' ? (
                      <p>• <strong>Image pleine largeur :</strong> 1200x500 pixels (ratio 2.4:1) pour couvrir toute la largeur</p>
                    ) : formData.banner_type === 'card_style' ? (
                      <p>• <strong>Style carte :</strong> 400x300 pixels (ratio 4:3) pour un format carte</p>
                    ) : formData.banner_type === 'minimal' ? (
                      <p>• <strong>Style minimal :</strong> 64x64 pixels (carré) pour un petit avatar</p>
                    ) : formData.banner_type === 'gradient_overlay' ? (
                      <p>• <strong>Gradient overlay :</strong> 1200x400 pixels (ratio 3:1) pour un format panoramique</p>
                    ) : (
                      <p>• <strong>Taille standard :</strong> 400x300 pixels (ratio 4:3)</p>
                    )}
                    <p>• Format recommandé : JPG ou PNG</p>
                    <p>• Poids maximum : 500 KB pour des performances optimales</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) || 1 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Ordre d'affichage (1 = premier)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">URL du lien</label>
                  <input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Texte du bouton</label>
                  <input
                    type="text"
                    value={formData.link_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de début</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Bannière active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {saving ? 'Sauvegarde...' : (editingBanner ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Supprimer la bannière</h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer cette bannière ? Cette action ne peut pas être annulée.
              </p>
            </div>
            <div className="flex justify-center space-x-3 mt-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 