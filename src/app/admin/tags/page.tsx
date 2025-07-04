'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  TagIcon,
  FolderIcon,
  XMarkIcon,
  SparklesIcon,
  HeartIcon,
  UserGroupIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

interface Tag {
  id: string
  name: string
  slug: string
  tag_type: 'category' | 'need' | 'skin_type' | 'ingredient'
}

interface TagCategory {
  type: 'category' | 'need' | 'skin_type' | 'ingredient'
  name: string
  nameFr: string
  icon: any
  color: string
  tags: Tag[]
}

export default function TagsPage() {
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showTagModal, setShowTagModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  
  const [tagForm, setTagForm] = useState({
    name: '',
    slug: '',
    tag_type: '' as Tag['tag_type']
  })

  // Configuration des catégories de tags
  const categoryConfig: Record<string, { name: string, nameFr: string, icon: any, color: string }> = {
    category: { 
      name: 'Categories', 
      nameFr: 'Catégories', 
      icon: FolderIcon, 
      color: '#3B82F6' 
    },
    need: { 
      name: 'Needs', 
      nameFr: 'Besoins', 
      icon: SparklesIcon, 
      color: '#10B981' 
    },
    skin_type: { 
      name: 'Skin Types', 
      nameFr: 'Types de peau', 
      icon: UserGroupIcon, 
      color: '#F59E0B' 
    },
    ingredient: { 
      name: 'Ingredients', 
      nameFr: 'Ingrédients', 
      icon: BeakerIcon, 
      color: '#8B5CF6' 
    }
  }

  // Charger les tags depuis l'API
  const fetchTags = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tags')
      const data = await res.json()
      
      if (res.ok && Array.isArray(data)) {
        // Grouper les tags par catégorie
        const grouped: TagCategory[] = Object.entries(categoryConfig).map(([type, config]) => ({
          type: type as Tag['tag_type'],
          name: config.name,
          nameFr: config.nameFr,
          icon: config.icon,
          color: config.color,
          tags: data.filter((tag: Tag) => tag.tag_type === type)
        }))

        setTagCategories(grouped)
      } else {
        console.error('Erreur chargement tags:', data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const openTagModal = (categoryType: Tag['tag_type'], tag?: Tag) => {
    setSelectedCategoryType(categoryType)
    if (tag) {
      setEditingTag(tag)
      setTagForm({
        name: tag.name,
        slug: tag.slug,
        tag_type: tag.tag_type
      })
    } else {
      setEditingTag(null)
      setTagForm({
        name: '',
        slug: '',
        tag_type: categoryType
      })
    }
    setShowTagModal(true)
  }

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingTag 
        ? `/api/admin/tags/${editingTag.id}`
        : '/api/admin/tags'
      
      const method = editingTag ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagForm)
      })
      
      const data = await res.json()
      
      if (res.ok) {
        fetchTags()
        setShowTagModal(false)
      } else {
        alert(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (tagId: string) => {
    try {
      const res = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchTags()
        setShowDeleteConfirm(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const getTotalTags = () => {
    return tagCategories.reduce((sum, cat) => sum + cat.tags.length, 0)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Tags</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {tagCategories.map((category) => (
          <div key={category.type} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div 
                className="flex-shrink-0 p-3 rounded-lg"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <category.icon 
                  className="h-6 w-6" 
                  style={{ color: category.color }}
                />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{category.nameFr}</p>
                <p className="text-2xl font-semibold text-gray-900">{category.tags.length}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grille des catégories */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          tagCategories.map((category) => (
            <div 
              key={category.type} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div 
                className="h-1"
                style={{ backgroundColor: category.color }}
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <category.icon 
                        className="h-7 w-7" 
                        style={{ color: category.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{category.nameFr}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {category.tags.length} tag{category.tags.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openTagModal(category.type)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: category.color }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nouveau tag
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {category.tags.map((tag) => (
                    <div 
                      key={tag.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div 
                          className="w-2 h-2 rounded-full mr-3 flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium text-gray-700 truncate">{tag.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openTagModal(category.type, tag)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Modifier le tag"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(tag.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer le tag"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {category.tags.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <TagIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Aucun tag dans cette catégorie</p>
                      <button
                        onClick={() => openTagModal(category.type)}
                        className="mt-3 text-sm font-medium hover:underline"
                        style={{ color: category.color }}
                      >
                        Ajouter le premier tag
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de tag */}
      {showTagModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingTag ? 'Modifier le tag' : 'Nouveau tag'}
              </h3>
              <button
                onClick={() => setShowTagModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleTagSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 font-medium">
                  {categoryConfig[tagForm.tag_type]?.nameFr || selectedCategoryType}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du tag
                </label>
                <input
                  type="text"
                  required
                  value={tagForm.name}
                  onChange={(e) => {
                    setTagForm(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: editingTag ? prev.slug : generateSlug(e.target.value)
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Hydratant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  required
                  value={tagForm.slug}
                  onChange={(e) => setTagForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: hydratant"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Identifiant unique pour l'URL (lettres minuscules et tirets)
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTag ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-sm text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce tag ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
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