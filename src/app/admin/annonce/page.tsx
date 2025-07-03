'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'

interface Announcement {
  id: string
  title: string
  description: string
  image_url: string | null
  link_url: string | null
  link_text: string | null
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    link_text: '',
    is_active: true,
    start_date: '',
    end_date: '',
    imageFile: null as string | null
  })

  // Simuler les données pour l'instant
  useEffect(() => {
    const mockData: Announcement[] = [
      {
        id: '1',
        title: 'Promo Été 2024',
        description: 'Jusqu\'à 30% de réduction sur tous les produits solaires',
        image_url: '/image/femme_produit_bras.png',
        link_url: '/catalogue?category=solaire',
        link_text: 'Voir les produits',
        position: 1,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        click_count: 156,
        view_count: 2340
      },
      {
        id: '2',
        title: 'Nouveau Sérum Anti-Âge',
        description: 'Découvrez notre nouveau sérum révolutionnaire',
        image_url: '/image/produit_serum.png',
        link_url: '/product/serum-anti-age',
        link_text: 'Découvrir',
        position: 2,
        is_active: true,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: null,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        click_count: 89,
        view_count: 1205
      },
      {
        id: '3',
        title: 'Consultation Gratuite',
        description: 'Profitez d\'une consultation gratuite avec nos experts',
        image_url: '/image/equipe.png',
        link_url: '/contact',
        link_text: 'Réserver',
        position: 3,
        is_active: false,
        start_date: null,
        end_date: null,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        click_count: 45,
        view_count: 678
      }
    ]
    setAnnouncements(mockData.sort((a, b) => a.position - b.position))
    setLoading(false)
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1]
        setFormData(prev => ({ ...prev, imageFile: base64 || null }))
      }
      reader.readAsDataURL(file)
    }
  }

  const openModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement)
      setFormData({
        title: announcement.title,
        description: announcement.description,
        image_url: announcement.image_url || '',
        link_url: announcement.link_url || '',
        link_text: announcement.link_text || '',
        is_active: announcement.is_active,
        start_date: announcement.start_date || '',
        end_date: announcement.end_date || '',
        imageFile: null
      })
    } else {
      setEditingAnnouncement(null)
      setFormData({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        link_text: '',
        is_active: true,
        start_date: '',
        end_date: '',
        imageFile: null
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Ici vous ajouteriez la logique pour sauvegarder dans la base de données
    console.log('Sauvegarde annonce:', formData)
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    // Ici vous ajouteriez la logique pour supprimer de la base de données
    console.log('Suppression annonce:', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    setShowDeleteConfirm(null)
  }

  const toggleActive = async (id: string) => {
    setAnnouncements(prev => prev.map(announcement => 
      announcement.id === id 
        ? { ...announcement, is_active: !announcement.is_active, updated_at: new Date().toISOString() }
        : announcement
    ))
  }

  const movePosition = (id: string, direction: 'up' | 'down') => {
    const currentIndex = announcements.findIndex(a => a.id === id)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === announcements.length - 1)
    ) {
      return
    }

    const newAnnouncements = [...announcements]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    // Échanger les positions
    const temp = newAnnouncements[currentIndex]
    newAnnouncements[currentIndex] = newAnnouncements[targetIndex]
    newAnnouncements[targetIndex] = temp
    
    // Mettre à jour les numéros de position
    newAnnouncements[currentIndex].position = currentIndex + 1
    newAnnouncements[targetIndex].position = targetIndex + 1
    
    setAnnouncements(newAnnouncements)
  }

  const activeAnnouncements = announcements.filter(a => a.is_active)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Annonces</h1>
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
            Créer une annonce
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
              <p className="text-sm font-medium text-gray-500">Total Annonces</p>
              <p className="text-2xl font-semibold text-gray-900">{announcements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Annonces Actives</p>
              <p className="text-2xl font-semibold text-gray-900">{activeAnnouncements.length}</p>
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
                {announcements.reduce((sum, a) => sum + a.view_count, 0)}
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
                {announcements.reduce((sum, a) => sum + a.click_count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aperçu des annonces actives */}
      {previewMode && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aperçu - Page d'accueil</h2>
          <div className="space-y-4">
            {activeAnnouncements.map((announcement) => (
              <div key={announcement.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center space-x-4">
                  {announcement.image_url && (
                    <div className="flex-shrink-0">
                      <Image
                        src={announcement.image_url}
                        alt={announcement.title}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    <p className="text-gray-600 mt-1">{announcement.description}</p>
                    {announcement.link_url && announcement.link_text && (
                      <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                        {announcement.link_text}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des annonces */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {announcements.map((announcement, index) => (
              <div key={announcement.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {announcement.image_url ? (
                      <Image
                        src={announcement.image_url}
                        alt={announcement.title}
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
                        <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          announcement.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {announcement.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{announcement.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{announcement.view_count} vues</span>
                        <span>{announcement.click_count} clics</span>
                        {announcement.start_date && (
                          <span>Début: {new Date(announcement.start_date).toLocaleDateString('fr-FR')}</span>
                        )}
                        {announcement.end_date && (
                          <span>Fin: {new Date(announcement.end_date).toLocaleDateString('fr-FR')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-center space-y-1">
                      <button
                        onClick={() => movePosition(announcement.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-gray-500">#{announcement.position}</span>
                      <button
                        onClick={() => movePosition(announcement.id, 'down')}
                        disabled={index === announcements.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => toggleActive(announcement.id)}
                      className={`p-2 rounded-md ${
                        announcement.is_active 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {announcement.is_active ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                    </button>
                    
                    <button 
                      onClick={() => openModal(announcement)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    
                    <button 
                      onClick={() => setShowDeleteConfirm(announcement.id)}
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingAnnouncement ? 'Modifier l\'annonce' : 'Créer une annonce'}
            </h3>
            
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
                <label className="block text-sm font-medium text-gray-700">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  Annonce active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingAnnouncement ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-sm text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
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