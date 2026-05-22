'use client'

import { useState } from 'react'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useProductsData } from './_hooks/useProductsData'
import {
  INITIAL_PRODUCT_FORM,
  type Product,
  type ProductFormState,
} from './_lib/types'
import { ProductsTable } from './_components/ProductsTable'
import { ProductFormModal } from './_components/ProductFormModal'
import { ProductDeleteModal } from './_components/ProductDeleteModal'

export default function ProductPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { products, brands, tags, tagTypes, loading, totalPages, refreshProducts } =
    useProductsData({ page: currentPage, search: searchTerm })

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormState>(INITIAL_PRODUCT_FORM)

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      const range = product.product_ranges?.[0]
      const selectedTags =
        product.product_tags?.map((pt) => pt.tag.id) ||
        product.tags?.map((t) => t.id) ||
        []
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        brand_id: product.brand?.id || '',
        range_id: range?.range_id || '',
        imageFile: null,
        selectedTags,
      })
    } else {
      setEditingProduct(null)
      setFormData(INITIAL_PRODUCT_FORM)
    }
    setShowModal(true)
  }

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
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        refreshProducts()
        setShowModal(false)
      } else {
        const error = await res.json()
        toast.error('Erreur: ' + error.error)
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        refreshProducts()
        setDeleteProductId(null)
      } else {
        const error = await res.json()
        toast.error('Erreur: ' + error.error)
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
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

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <label htmlFor="product-search" className="sr-only">
            Rechercher un produit
          </label>
          <input
            id="product-search"
            type="text"
            placeholder="Rechercher un produit..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      <ProductsTable
        products={products}
        loading={loading}
        tagTypes={tagTypes}
        onEdit={openModal}
        onDelete={setDeleteProductId}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <ProductFormModal
        open={showModal}
        editingProduct={editingProduct}
        form={formData}
        onFormChange={setFormData}
        brands={brands}
        tags={tags}
        tagTypes={tagTypes}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
      />

      <ProductDeleteModal
        productId={deleteProductId}
        onCancel={() => setDeleteProductId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
