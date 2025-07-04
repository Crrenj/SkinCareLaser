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
  BeakerIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  FireIcon,
  GiftIcon,
  StarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarIcon,
  PaintBrushIcon,
  SwatchIcon,
  CubeIcon,
  GlobeAltIcon,
  LightBulbIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  HandRaisedIcon,
  FaceSmileIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

interface Tag {
  id: string
  name: string
  slug: string
  tag_type?: string
  tag_type_id?: string
}

interface TagType {
  id: string
  name: string
  slug: string
  icon?: string
  color: string
  created_at: string
  updated_at: string
  tags?: { count: number }[]
}

interface TagCategory {
  id: string
  type: string
  name: string
  icon: any
  color: string
  tags: Tag[]
}

export default function TagsPage() {
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([])
  const [tagTypes, setTagTypes] = useState<TagType[]>([])
  const [loading, setLoading] = useState(true)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editingType, setEditingType] = useState<TagType | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'tag' | 'type', id: string } | null>(null)
  
  const [tagForm, setTagForm] = useState({
    name: '',
    slug: '',
    tag_type_id: ''
  })

  const [typeForm, setTypeForm] = useState({
    name: '',
    slug: '',
    icon: 'TagIcon',
    color: '#3B82F6',
    initialTag: ''
  })

  // Map des icônes disponibles
  const iconMap: Record<string, any> = {
    FolderIcon,
    SparklesIcon,
    UserGroupIcon,
    BeakerIcon,
    TagIcon,
    HeartIcon,
    Cog6ToothIcon,
    SunIcon,
    MoonIcon,
    FireIcon,
    GiftIcon,
    StarIcon,
    ShieldCheckIcon,
    ClockIcon,
    CalendarIcon,
    PaintBrushIcon,
    SwatchIcon,
    CubeIcon,
    GlobeAltIcon,
    LightBulbIcon,
    BoltIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    HandRaisedIcon,
    FaceSmileIcon,
    AcademicCapIcon
  }

  const iconOptions = [
    { value: 'FolderIcon', label: 'Dossier', icon: FolderIcon },
    { value: 'TagIcon', label: 'Tag', icon: TagIcon },
    { value: 'HeartIcon', label: 'Cœur', icon: HeartIcon },
    { value: 'UserGroupIcon', label: 'Utilisateurs', icon: UserGroupIcon },
    { value: 'BeakerIcon', label: 'Bécher', icon: BeakerIcon },
    { value: 'SparklesIcon', label: 'Étoiles', icon: SparklesIcon },
    { value: 'SunIcon', label: 'Soleil', icon: SunIcon },
    { value: 'MoonIcon', label: 'Lune', icon: MoonIcon },
    { value: 'FireIcon', label: 'Feu', icon: FireIcon },
    { value: 'GiftIcon', label: 'Cadeau', icon: GiftIcon },
    { value: 'StarIcon', label: 'Étoile', icon: StarIcon },
    { value: 'ShieldCheckIcon', label: 'Bouclier', icon: ShieldCheckIcon },
    { value: 'ClockIcon', label: 'Horloge', icon: ClockIcon },
    { value: 'CalendarIcon', label: 'Calendrier', icon: CalendarIcon },
    { value: 'PaintBrushIcon', label: 'Pinceau', icon: PaintBrushIcon },
    { value: 'SwatchIcon', label: 'Palette', icon: SwatchIcon },
    { value: 'CubeIcon', label: 'Cube', icon: CubeIcon },
    { value: 'GlobeAltIcon', label: 'Globe', icon: GlobeAltIcon },
    { value: 'LightBulbIcon', label: 'Ampoule', icon: LightBulbIcon },
    { value: 'BoltIcon', label: 'Éclair', icon: BoltIcon },
    { value: 'MagnifyingGlassIcon', label: 'Loupe', icon: MagnifyingGlassIcon },
    { value: 'EyeIcon', label: 'Œil', icon: EyeIcon },
    { value: 'HandRaisedIcon', label: 'Main', icon: HandRaisedIcon },
    { value: 'FaceSmileIcon', label: 'Sourire', icon: FaceSmileIcon },
    { value: 'AcademicCapIcon', label: 'Diplôme', icon: AcademicCapIcon },
    { value: 'Cog6ToothIcon', label: 'Engrenage', icon: Cog6ToothIcon }
  ]

  const colorOptions = [
    '#3B82F6', // Bleu
    '#10B981', // Vert
    '#F59E0B', // Orange
    '#EF4444', // Rouge
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange foncé
    '#EC4899', // Rose
    '#6366F1', // Indigo
  ]

  // Charger les types de tags et les tags
  const fetchData = async () => {
    setLoading(true)
    try {
      // Charger les types de tags
      const typesRes = await fetch('/api/admin/tag-types')
      const typesData = await typesRes.json()
      
      // Charger les tags
      const tagsRes = await fetch('/api/admin/tags')
      const tagsData = await tagsRes.json()
      
      if (typesRes.ok && Array.isArray(typesData)) {
        setTagTypes(typesData)
        
        // Grouper les tags par type
        const grouped: TagCategory[] = typesData.map((type: TagType) => ({
          id: type.id,
          type: type.slug,
          name: type.name,
          icon: iconMap[type.icon || 'TagIcon'] || TagIcon,
          color: type.color,
          tags: tagsData.filter((tag: Tag) => tag.tag_type_id === type.id)
        }))

        setTagCategories(grouped)
      } else {
        console.error('Erreur chargement données:', typesData)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Gestion des tags
  const openTagModal = (categoryId: string, tag?: Tag) => {
    setSelectedCategoryId(categoryId)
    if (tag) {
      setEditingTag(tag)
      setTagForm({
        name: tag.name,
        slug: tag.slug,
        tag_type_id: tag.tag_type_id || categoryId
      })
    } else {
      setEditingTag(null)
      setTagForm({
        name: '',
        slug: '',
        tag_type_id: categoryId
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
        fetchData()
        setShowTagModal(false)
      } else {
        alert(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  // Gestion des types de tags
  const openTypeModal = (type?: TagType) => {
    if (type) {
      setEditingType(type)
      setTypeForm({
        name: type.name,
        slug: type.slug,
        icon: type.icon || 'TagIcon',
        color: type.color,
        initialTag: ''
      })
    } else {
      setEditingType(null)
      setTypeForm({
        name: '',
        slug: '',
        icon: 'TagIcon',
        color: '#3B82F6',
        initialTag: ''
      })
    }
    setShowTypeModal(true)
  }

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingType 
        ? `/api/admin/tag-types/${editingType.id}`
        : '/api/admin/tag-types'
      
      const method = editingType ? 'PATCH' : 'POST'
      
      const body: any = {
        name: typeForm.name,
        slug: typeForm.slug,
        icon: typeForm.icon,
        color: typeForm.color
      }

      // Ajouter le tag initial si c'est une création
      if (!editingType && typeForm.initialTag) {
        body.initial_tag = {
          name: typeForm.initialTag,
          slug: generateSlug(typeForm.initialTag)
        }
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await res.json()
      
      if (res.ok) {
        fetchData()
        setShowTypeModal(false)
      } else {
        alert(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) return

    try {
      const url = showDeleteConfirm.type === 'tag'
        ? `/api/admin/tags/${showDeleteConfirm.id}`
        : `/api/admin/tag-types/${showDeleteConfirm.id}`

      const res = await fetch(url, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchData()
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
        <button 
          onClick={() => openTypeModal()}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouveau type de tag
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {tagCategories.map((category) => (
          <div key={category.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
                <p className="text-sm font-medium text-gray-500">{category.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{category.tags.length}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Types de tags et leurs tags */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          tagCategories.map((category) => (
            <div 
              key={category.id} 
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
                      <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {category.tags.length} tag{category.tags.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openTypeModal(tagTypes.find(t => t.id === category.id))}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier le type"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({ type: 'type', id: category.id })}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer le type"
                      disabled={category.tags.length > 0}
                    >
                      <TrashIcon className={`h-5 w-5 ${category.tags.length > 0 ? 'opacity-50' : ''}`} />
                    </button>
                    <button
                      onClick={() => openTagModal(category.id)}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                      style={{ backgroundColor: category.color }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Nouveau tag
                    </button>
                  </div>
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
                          onClick={() => openTagModal(category.id, tag)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Modifier le tag"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm({ type: 'tag', id: tag.id })}
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
                        onClick={() => openTagModal(category.id)}
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

      {/* Modal de type de tag */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingType ? 'Modifier le type de tag' : 'Nouveau type de tag'}
              </h3>
              <button
                onClick={() => setShowTypeModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleTypeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  required
                  value={typeForm.name}
                  onChange={(e) => {
                    setTypeForm(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: editingType ? prev.slug : generateSlug(e.target.value)
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Texture"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  required
                  value={typeForm.slug}
                  onChange={(e) => setTypeForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: texture"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icône
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                  {iconOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTypeForm(prev => ({ ...prev, icon: option.value }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        typeForm.icon === option.value 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={option.label}
                    >
                      <option.icon className="h-5 w-5 mx-auto text-gray-700" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTypeForm(prev => ({ ...prev, color }))}
                      className={`w-full h-10 rounded-lg border-2 transition-all ${
                        typeForm.color === color 
                          ? 'border-gray-900 scale-110' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {!editingType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Premier tag (optionnel)
                  </label>
                  <input
                    type="text"
                    value={typeForm.initialTag}
                    onChange={(e) => setTypeForm(prev => ({ ...prev, initialTag: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Crémeuse"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Vous pouvez créer un premier tag pour ce type
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingType ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  {tagCategories.find(c => c.id === selectedCategoryId)?.name || 'Catégorie'}
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
              Êtes-vous sûr de vouloir supprimer {showDeleteConfirm.type === 'type' ? 'ce type de tag' : 'ce tag'} ? 
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
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