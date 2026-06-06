'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { useConfirmDialog } from '@/components/admin/ConfirmDialog'
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

export default function MarquesPage() {
  const t = useTranslations('Admin.marques')
  const tCrumbs = useTranslations('Admin.crumbs')
  const tCommon = useTranslations('Admin.common')
  const { brands, loading, refresh } = useBrandsData()
  const [searchTerm, setSearchTerm] = useState('')

  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showRangeModal, setShowRangeModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [editingRange, setEditingRange] = useState<Range | null>(null)
  const [brandLockedInRangeModal, setBrandLockedInRangeModal] = useState(false)
  const { confirm, dialog } = useConfirmDialog()

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
        toast.error(`${tCommon('saveError')}: ${error.error}`)
      }
    } catch (error) {
      logger.error('Erreur sauvegarde brand:', error)
      toast.error(tCommon('saveError'))
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
        toast.error(`${tCommon('saveError')}: ${error.error}`)
      }
    } catch (error) {
      logger.error('Erreur sauvegarde range:', error)
      toast.error(tCommon('saveError'))
    }
  }

  const handleBrandDelete = async (id: string) => {
    const ok = await confirm(t('deleteBrandConfirmBody'), {
      title: t('deleteBrandConfirmTitle'),
      confirmLabel: tCommon('delete'),
      cancelLabel: tCommon('cancel'),
      tone: 'danger',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' })
      if (res.ok) {
        refresh()
      } else {
        const error = await res.json()
        toast.error(`${tCommon('deleteError')}: ${error.error}`)
      }
    } catch (error) {
      logger.error('Erreur suppression brand:', error)
      toast.error(tCommon('deleteError'))
    }
  }

  const handleRangeDelete = async (id: string) => {
    const ok = await confirm(t('deleteRangeConfirmBody'), {
      title: t('deleteRangeConfirmTitle'),
      confirmLabel: tCommon('delete'),
      cancelLabel: tCommon('cancel'),
      tone: 'danger',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/ranges/${id}`, { method: 'DELETE' })
      if (res.ok) {
        refresh()
      } else {
        const error = await res.json()
        toast.error(`${tCommon('deleteError')}: ${error.error}`)
      }
    } catch (error) {
      logger.error('Erreur suppression range:', error)
      toast.error(tCommon('deleteError'))
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
          { label: tCrumbs('admin'), href: '/admin' },
          { label: tCrumbs('catalog') },
          { label: tCrumbs('brands') },
        ]}
        title={t('title')}
        actions={
          <button
            type="button"
            onClick={() => openBrandModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-clay-700 text-on-accent text-[13px] font-medium rounded-md hover:bg-clay-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
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
          onDeleteBrand={handleBrandDelete}
          onCreateRange={(brandId) => openRangeModal(undefined, brandId)}
          onEditRange={openRangeModal}
          onDeleteRange={handleRangeDelete}
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

      {dialog}
    </>
  )
}
