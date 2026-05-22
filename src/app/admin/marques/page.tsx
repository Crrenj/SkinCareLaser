'use client'

import { useState } from 'react'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des marques</h1>
        <button
          onClick={() => openBrandModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter une marque
        </button>
      </div>

      <BrandStatsCards brands={brands} />

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <label htmlFor="marques-search" className="sr-only">
            Rechercher une marque
          </label>
          <input
            id="marques-search"
            type="text"
            placeholder="Rechercher une marque..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <BrandsTable
        brands={filteredBrands}
        loading={loading}
        onEditBrand={openBrandModal}
        onDeleteBrand={setDeleteBrandId}
        onCreateRange={(brandId) => openRangeModal(undefined, brandId)}
        onEditRange={openRangeModal}
        onDeleteRange={setDeleteRangeId}
      />

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
        title="Supprimer la marque"
        description="Êtes-vous sûr de vouloir supprimer cette marque ? Cette action est irréversible."
        labelId="brand-delete-modal-title"
        onCancel={() => setDeleteBrandId(null)}
        onConfirm={handleBrandDelete}
      />

      <DeleteConfirmModal
        id={deleteRangeId}
        title="Supprimer la gamme"
        description="Êtes-vous sûr de vouloir supprimer cette gamme ? Cette action est irréversible."
        labelId="range-delete-modal-title"
        onCancel={() => setDeleteRangeId(null)}
        onConfirm={handleRangeDelete}
      />
    </div>
  )
}
