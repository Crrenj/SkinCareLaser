'use client'

import React, { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'

interface Brand {
  id: string
  name: string
  slug: string
  ranges?: Range[]
  created_at?: string
}

interface Range {
  id: string
  name: string
  slug: string
  brand_id: string
  brands?: Brand
}

export default function MarquesPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [ranges, setRanges] = useState<Range[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showRangeModal, setShowRangeModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [editingRange, setEditingRange] = useState<Range | null>(null)
  const [selectedBrandForRange, setSelectedBrandForRange] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showRangeDeleteConfirm, setShowRangeDeleteConfirm] = useState<string | null>(null)
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  
  // Formulaires
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  })

  const [rangeFormData, setRangeFormData] = useState({
    name: '',
    slug: '',
    brand_id: ''
  })

  // Charger les marques
  const fetchBrands = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/brands')
      const data = await res.json()
      
      if (res.ok && Array.isArray(data)) {
        setBrands(data)
      } else {
        console.error('Erreur API marques:', data)
        setBrands([])
        
        if (data.message?.includes('SUPABASE_SERVICE')) {
          alert('Configuration manquante: La clé de service Supabase n\'est pas configurée.')
        }
      }
    } catch (error) {
      console.error('Erreur chargement marques:', error)
      setBrands([])
    } finally {
      setLoading(false)
    }
  }

  // Charger les gammes
  const fetchRanges = async () => {
    try {
      const res = await fetch('/api/admin/ranges')
      const data = await res.json()
      
      if (res.ok && Array.isArray(data)) {
        setRanges(data)
      } else {
        console.error('Erreur API gammes:', data)
        setRanges([])
      }
    } catch (error) {
      console.error('Erreur chargement gammes:', error)
      setRanges([])
    }
  }

  useEffect(() => {
    fetchBrands()
    fetchRanges()
  }, [])

  // Générer le slug automatiquement
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Toggle expansion d'une marque
  const toggleBrandExpansion = (brandId: string) => {
    const newExpanded = new Set(expandedBrands)
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId)
    } else {
      newExpanded.add(brandId)
    }
    setExpandedBrands(newExpanded)
  }

  // Ouvrir le modal d'ajout/édition marque
  const openModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand)
      setFormData({
        name: brand.name,
        slug: brand.slug
      })
    } else {
      setEditingBrand(null)
      setFormData({
        name: '',
        slug: ''
      })
    }
    setShowModal(true)
  }

  // Ouvrir le modal d'ajout/édition gamme
  const openRangeModal = (range?: Range, brandId?: string) => {
    if (range) {
      setEditingRange(range)
      setRangeFormData({
        name: range.name,
        slug: range.slug,
        brand_id: range.brand_id
      })
    } else {
      setEditingRange(null)
      setRangeFormData({
        name: '',
        slug: '',
        brand_id: brandId || ''
      })
    }
    setSelectedBrandForRange(brandId || null)
    setShowRangeModal(true)
  }

  // Sauvegarder la marque
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingBrand 
        ? `/api/admin/brands/${editingBrand.id}`
        : '/api/admin/brands'
      
      const method = editingBrand ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        fetchBrands()
        setShowModal(false)
      } else {
        const error = await res.json()
        alert('Erreur: ' + error.error)
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  // Sauvegarder la gamme
  const handleRangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingRange 
        ? `/api/admin/ranges/${editingRange.id}`
        : '/api/admin/ranges'
      
      const method = editingRange ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rangeFormData)
      })
      
      if (res.ok) {
        fetchBrands()
        fetchRanges()
        setShowRangeModal(false)
      } else {
        const error = await res.json()
        alert('Erreur: ' + error.error)
      }
    } catch (error) {
      console.error('Erreur sauvegarde gamme:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  // Supprimer une marque
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/brands/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchBrands()
        setShowDeleteConfirm(null)
      } else {
        const error = await res.json()
        alert('Erreur: ' + error.error)
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Supprimer une gamme
  const handleRangeDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ranges/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchBrands()
        fetchRanges()
        setShowRangeDeleteConfirm(null)
      } else {
        const error = await res.json()
        alert('Erreur: ' + error.error)
      }
    } catch (error) {
      console.error('Erreur suppression gamme:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Filtrer les marques selon la recherche
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des marques</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter une marque
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <TagIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total marques</p>
              <p className="text-2xl font-semibold text-gray-900">{brands.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                <Squares2X2Icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total gammes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {brands.reduce((sum, brand) => sum + (brand.ranges?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Marques actives</p>
              <p className="text-2xl font-semibold text-gray-900">{brands.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Barre de recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une marque..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Table des marques avec gammes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : (
          <>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gammes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBrands.map((brand) => (
                  <React.Fragment key={brand.id}>
                    {/* Ligne principale de la marque */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleBrandExpansion(brand.id)}
                            className="mr-2 p-1 hover:bg-gray-100 rounded"
                          >
                            {expandedBrands.has(brand.id) ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                          <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{brand.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-900">
                            {brand.ranges?.length || 0} gamme(s)
                          </div>
                          <button
                            onClick={() => openRangeModal(undefined, brand.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50"
                            title="Ajouter une gamme"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => openModal(brand)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                            title="Modifier la marque"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(brand.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                            title="Supprimer la marque"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Lignes des gammes (si expandé) */}
                    {expandedBrands.has(brand.id) && brand.ranges && brand.ranges.map((range) => (
                      <tr key={`range-${range.id}`} className="bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center pl-8">
                            <Squares2X2Icon className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-700">{range.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500 pl-8">{range.slug}</div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Gamme
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => openRangeModal(range)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                              title="Modifier la gamme"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => setShowRangeDeleteConfirm(range.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                              title="Supprimer la gamme"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            
            {filteredBrands.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune marque trouvée</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal d'ajout/édition marque */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingBrand ? 'Modifier la marque' : 'Nouvelle marque'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la marque
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: editingBrand ? prev.slug : generateSlug(e.target.value)
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Avène"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: avene"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingBrand ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'ajout/édition gamme */}
      {showRangeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingRange ? 'Modifier la gamme' : 'Nouvelle gamme'}
              </h3>
              <button
                onClick={() => setShowRangeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleRangeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marque
                </label>
                <select
                  required
                  value={rangeFormData.brand_id}
                  onChange={(e) => setRangeFormData(prev => ({ ...prev, brand_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!selectedBrandForRange}
                >
                  <option value="">Sélectionner une marque</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la gamme
                </label>
                <input
                  type="text"
                  required
                  value={rangeFormData.name}
                  onChange={(e) => {
                    setRangeFormData(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: editingRange ? prev.slug : generateSlug(e.target.value)
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Hydrance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  required
                  value={rangeFormData.slug}
                  onChange={(e) => setRangeFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: hydrance"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRangeModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {editingRange ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression marque */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Supprimer la marque
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Êtes-vous sûr de vouloir supprimer cette marque ? Cette action est irréversible.
              </p>
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression gamme */}
      {showRangeDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Supprimer la gamme
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Êtes-vous sûr de vouloir supprimer cette gamme ? Cette action est irréversible.
              </p>
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  onClick={() => setShowRangeDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleRangeDelete(showRangeDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 