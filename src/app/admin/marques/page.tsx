'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { useBrandsData } from './_hooks/useBrandsData'
import {
  INITIAL_BRAND_FORM,
  INITIAL_RANGE_FORM,
  type Brand,
  type BrandFormState,
  type Range,
  type RangeFormState,
} from './_lib/types'
import { BrandStatsCards } from './_components/BrandStatsCards'
import { BrandsTable } from './_components/BrandsTable'
import { BrandFormModal } from './_components/BrandFormModal'
import { RangeFormModal } from './_components/RangeFormModal'
import { DeleteConfirmModal } from './_components/DeleteConfirmModal'

export default function MarquesPage() {
  const { brands, loading, refresh } = useBrandsData()
  const [searchTerm, setSearchTerm] = useState('')

  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showRangeModal, setShowRangeModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [editingRange, setEditingRange] = useState<Range | null>(null)
  const [brandLockedInRangeModal, setBrandLockedInRangeModal] = useState(false)
  const [deleteBrandId, setDeleteBrandId] = useState<string | null>(null)
  const [deleteRangeId, setDeleteRangeId] = useState<string | null>(null)

  const [brandForm, setBrandForm] = useState<BrandFormState>(INITIAL_BRAND_FORM)
  const [rangeForm, setRangeForm] = useState<RangeFormState>(INITIAL_RANGE_FORM)

  const openBrandModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand)
      setBrandForm({ name: brand.name, slug: brand.slug })
    } else {
      setEditingBrand(null)
      setBrandForm(INITIAL_BRAND_FORM)
    }
    setShowBrandModal(true)
  }

  const openRangeModal = (range?: Range, brandId?: string) => {
    if (range) {
      setEditingRange(range)
      setRangeForm({ name: range.name, slug: range.slug, brand_id: range.brand_id })
      setBrandLockedInRangeModal(false)
    } else {
      setEditingRange(null)
      setRangeForm({ name: '', slug: '', brand_id: brandId || '' })
      setBrandLockedInRangeModal(!!brandId)
    }
    setShowRangeModal(true)
  }

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingBrand
        ? `/api/admin/brands/${editingBrand.id}`
        : '/api/admin/brands'
      const method = editingBrand ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandForm),
      })
      if (res.ok) {
        refresh()
        setShowBrandModal(false)
      } else {
        const error = await res.json()
        toast.error('Erreur: ' + error.error)
      }
    } catch (error) {
      console.error('Erreur sauvegarde brand:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

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
        body: JSON.stringify(rangeForm),
      })
      if (res.ok) {
        refresh()
        setShowRangeModal(false)
      } else {
        const error = await res.json()
        toast.error('Erreur: ' + error.error)
      }
    } catch (error) {
      console.error('Erreur sauvegarde range:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleBrandDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' })
      if (res.ok) {
        refresh()
        setDeleteBrandId(null)
      } else {
        const error = await res.json()
        toast.error('Erreur: ' + error.error)
      }
    } catch (error) {
      console.error('Erreur suppression brand:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleRangeDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ranges/${id}`, { method: 'DELETE' })
      if (res.ok) {
        refresh()
        setDeleteRangeId(null)
      } else {
        const error = await res.json()
        toast.error('Erreur: ' + error.error)
      }
    } catch (error) {
      console.error('Erreur suppression range:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const filteredBrands = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Catálogo' },
          { label: 'Marcas' },
        ]}
        title="Marcas"
        actions={
          <button
            type="button"
            onClick={() => openBrandModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-clay-700 text-sand-50 text-[13px] font-medium rounded-md hover:bg-clay-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            Añadir marca
          </button>
        }
      />

      <div className="bg-sand-100 border-b border-sand-300 px-5 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 sticky top-[88px] z-[4]">
        <label className="flex items-center gap-2 bg-sand-50 border border-sand-300 rounded-md px-3 py-1.5 text-ink-700 min-w-0 flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="sr-only">Buscar una marca</span>
          <input
            type="search"
            placeholder="Buscar por nombre o slug…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[13.5px] text-ink-900 placeholder:text-ink-500"
          />
        </label>
      </div>

      <div className="px-5 lg:px-8 py-6 flex flex-col gap-6">
        <BrandStatsCards brands={brands} />
        <BrandsTable
          brands={filteredBrands}
          loading={loading}
          onEditBrand={openBrandModal}
          onDeleteBrand={setDeleteBrandId}
          onCreateRange={(brandId) => openRangeModal(undefined, brandId)}
          onEditRange={openRangeModal}
          onDeleteRange={setDeleteRangeId}
        />
      </div>

      <BrandFormModal
        open={showBrandModal}
        editingBrand={editingBrand}
        form={brandForm}
        onFormChange={setBrandForm}
        onClose={() => setShowBrandModal(false)}
        onSubmit={handleBrandSubmit}
      />

      <RangeFormModal
        open={showRangeModal}
        editingRange={editingRange}
        brands={brands}
        brandLocked={brandLockedInRangeModal}
        form={rangeForm}
        onFormChange={setRangeForm}
        onClose={() => setShowRangeModal(false)}
        onSubmit={handleRangeSubmit}
      />

      <DeleteConfirmModal
        id={deleteBrandId}
        title="Eliminar marca"
        description="¿Seguro que quieres eliminar esta marca? Esta acción es irreversible."
        labelId="brand-delete-modal-title"
        onCancel={() => setDeleteBrandId(null)}
        onConfirm={handleBrandDelete}
      />

      <DeleteConfirmModal
        id={deleteRangeId}
        title="Eliminar gama"
        description="¿Seguro que quieres eliminar esta gama? Esta acción es irreversible."
        labelId="range-delete-modal-title"
        onCancel={() => setDeleteRangeId(null)}
        onConfirm={handleRangeDelete}
      />
    </>
  )
}
