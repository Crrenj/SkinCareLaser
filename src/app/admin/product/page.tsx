'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
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
        range_id: product.range_id || '',
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
    <>
      <PageHeader
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Catálogo' },
          { label: 'Productos' },
        ]}
        title="Productos"
        actions={
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-clay-700 text-sand-50 text-[13px] font-medium rounded-md hover:bg-clay-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            Añadir producto
          </button>
        }
      />

      <div className="bg-sand-100 border-b border-sand-300 px-5 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 sticky top-[88px] z-[4]">
        <label className="flex items-center gap-2 bg-sand-50 border border-sand-300 rounded-md px-3 py-1.5 text-ink-700 min-w-0 flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="sr-only">Buscar un producto</span>
          <input
            type="search"
            placeholder="Buscar por nombre, SKU…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[13.5px] text-ink-900 placeholder:text-ink-500"
          />
        </label>
      </div>

      <div className="px-5 lg:px-8 py-6">
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
      </div>

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
    </>
  )
}
