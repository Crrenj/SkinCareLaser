'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, MagnifyingGlassIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface Brand {
  id: string
  name: string
  ranges: Range[]
}

interface Range {
  id: string
  name: string
  brand_id: string
}

interface TagType {
  id: string
  name: string
  slug: string
  icon?: string
  color: string
}

interface Tag {
  id: string
  name: string
  slug: string
  tag_type_id: string
  tag_type?: TagType
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  currency: string
  stock: number
  image_url: string | null
  is_active: boolean
  brand?: Brand
  product_ranges?: any[]
  product_tags?: { tag: Tag }[]
  tags?: Tag[]
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [tagTypes, setTagTypes] = useState<TagType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  
  // Formulaire
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    stock: 0,
    brand_id: '',
    range_id: '',
    imageFile: null as string | null,
    selectedTags: [] as string[]
  })

  // Charger les produits avec tags
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/with-tags?page=${currentPage}&limit=10&search=${searchTerm}`)
      const data = await res.json()
      
      if (res.ok && data.products) {
        setProducts(data.products)
        setTotalPages(data.totalPages || 1)
      } else {
        console.error('Erreur API produits:', data)
        setProducts([])
        setTotalPages(1)
        
        if (data.message?.includes('SUPABASE_SERVICE')) {
          alert('Configuration manquante: La clé de service Supabase n\'est pas configurée.')
        }
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error)
      setProducts([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  // Charger les marques
  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands')
      const data = await res.json()
      if (Array.isArray(data)) {
        setBrands(data)
      } else {
        console.error('Réponse API marques invalide:', data)
        setBrands([])
      }
    } catch (error) {
      console.error('Erreur chargement marques:', error)
      setBrands([])
    }
  }

  // Charger les tags et types de tags
  const fetchTags = async () => {
    try {
      const [tagsRes, typesRes] = await Promise.all([
        fetch('/api/admin/tags'),
        fetch('/api/admin/tag-types')
      ])
      
      const [tagsData, typesData] = await Promise.all([
        tagsRes.json(),
        typesRes.json()
      ])
      
      if (Array.isArray(tagsData)) {
        setTags(tagsData)
      }
      if (Array.isArray(typesData)) {
        setTagTypes(typesData)
      }
    } catch (error) {
      console.error('Erreur chargement tags:', error)
      setTags([])
      setTagTypes([])
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchBrands()
    fetchTags()
  }, [currentPage, searchTerm])

  // Gérer l'upload d'image
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

  // Générer le slug automatiquement
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Ouvrir le modal d'ajout/édition
  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      const range = product.product_ranges?.[0]
      const productTags = product.product_tags?.map(pt => pt.tag.id) || product.tags?.map(t => t.id) || []
      
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        brand_id: product.brand?.id || '',
        range_id: range?.range_id || '',
        imageFile: null,
        selectedTags: productTags
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: 0,
        stock: 0,
        brand_id: '',
        range_id: '',
        imageFile: null,
        selectedTags: []
      })
    }
    setShowModal(true)
  }

  // Gérer la sélection des tags
  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }))
  }

  // Sauvegarder le produit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products'
      
      const method = editingProduct ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        fetchProducts()
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

  // Supprimer un produit
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchProducts()
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

  // Filtrer les gammes selon la marque sélectionnée
  const selectedBrandRanges = brands.find(b => b.id === formData.brand_id)?.ranges || []

  // Grouper les tags par type
  const tagsByType = tagTypes.reduce((acc, type) => {
    acc[type.id] = {
      type,
      tags: tags.filter(tag => tag.tag_type_id === type.id)
    }
    return acc
  }, {} as Record<string, { type: TagType; tags: Tag[] }>)

  // Obtenir la couleur d'un tag
  const getTagColor = (tag: Tag) => {
    const tagType = tagTypes.find(t => t.id === tag.tag_type_id)
    return tagType?.color || '#6B7280'
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des produits</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un produit
        </button>
      </div>
      
      {/* Barre de recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Table des produits */}
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
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <PhotoIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.brand?.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(product.product_tags || product.tags || []).slice(0, 3).map((tagData) => {
                          const tag = 'tag' in tagData ? tagData.tag : tagData
                          return (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getTagColor(tag) }}
                            >
                              {tag.name}
                            </span>
                          )
                        })}
                        {(product.product_tags || product.tags || []).length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{(product.product_tags || product.tags || []).length - 3} autres
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.price} {product.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' :
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock > 10 ? 'En stock' : product.stock > 0 ? 'Stock faible' : 'Rupture'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openModal(product)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Modifier"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(product.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal d'ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de base */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Informations de base</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          name: e.target.value,
                          slug: editingProduct ? prev.slug : generateSlug(e.target.value)
                        }))
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (DOP)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image (PNG)</label>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Marque et gamme */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Marque et gamme</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                    <select
                      value={formData.brand_id}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        brand_id: e.target.value,
                        range_id: ''
                      }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner une marque</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gamme</label>
                    <select
                      value={formData.range_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, range_id: e.target.value }))}
                      disabled={!formData.brand_id}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Sélectionner une gamme</option>
                      {selectedBrandRanges.map(range => (
                        <option key={range.id} value={range.id}>{range.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section Tags */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <TagIcon className="h-5 w-5 mr-2" />
                  Tags du produit
                </h4>
                <div className="space-y-4">
                  {Object.values(tagsByType).map(({ type, tags: typeTags }) => (
                    <div key={type.id} className="border border-gray-200 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.name}
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {typeTags.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                              formData.selectedTags.includes(tag.id)
                                ? 'text-white border-transparent'
                                : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                            style={{
                              backgroundColor: formData.selectedTags.includes(tag.id) ? type.color : undefined
                            }}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingProduct ? 'Mettre à jour' : 'Créer'}
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
              <TrashIcon className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">Confirmer la suppression</h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
              </p>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
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