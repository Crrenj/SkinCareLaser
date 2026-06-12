'use client'

import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { useConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useProductsData } from './_hooks/useProductsData'
import {
  INITIAL_PRODUCT_FORM,
  type Product,
  type ProductFormState,
} from './_lib/types'
import { ProductsTable } from './_components/ProductsTable'
import { ProductFormModal } from './_components/ProductFormModal'

export default function ProductPage() {
  const t = useTranslations('Admin.product')
  const tCrumbs = useTranslations('Admin.crumbs')
  const tCommon = useTranslations('Admin.common')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { products, brands, tags, tagTypes, loading, totalPages, lowStockThreshold, refreshProducts } =
    useProductsData({ page: currentPage, search: searchTerm })

  // Filet : si la page courante dépasse (ex. suppression du dernier produit
  // de la dernière page), on redescend sur la dernière page valide — sinon
  // écran « aucun produit » sans pagination pour revenir.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormState>(INITIAL_PRODUCT_FORM)
  const { confirm, dialog } = useConfirmDialog()

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
        toast.error(`${tCommon('saveError')}: ${error.error}`)
      }
    } catch (error) {
      logger.error('Erreur sauvegarde:', error)
      toast.error(tCommon('saveError'))
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm(t('deleteConfirmBody'), {
      title: t('deleteConfirmTitle'),
      confirmLabel: tCommon('delete'),
      cancelLabel: tCommon('cancel'),
      tone: 'danger',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        refreshProducts()
      } else {
        const error = await res.json()
        toast.error(`${tCommon('deleteError')}: ${error.error}`)
      }
    } catch (error) {
      logger.error('Erreur suppression:', error)
      toast.error(tCommon('deleteError'))
    }
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: tCrumbs('admin'), href: '/admin' },
          { label: tCrumbs('catalog') },
          { label: tCrumbs('products') },
        ]}
        title={t('title')}
        actions={
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-clay-700 text-on-accent text-[13px] font-medium rounded-md hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            {t('addButton')}
          </button>
        }
      />

      <div className="bg-sand-100 border-b border-sand-300 px-5 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 sticky top-[88px] z-[4]">
        <label className="flex items-center gap-2 bg-sand-50 border border-sand-300 rounded-md px-3 py-1.5 text-ink-700 min-w-0 flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="sr-only">{tCommon('search')}</span>
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
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
          onDelete={handleDelete}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          lowStockThreshold={lowStockThreshold}
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

      {dialog}
    </>
  )
}
