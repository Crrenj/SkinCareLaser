'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { Plus, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { useBannersData } from './_hooks/useBannersData'
import {
  INITIAL_BANNER_FORM,
  LEGACY_TO_NEW,
  type BannerData,
  type BannerFormState,
} from './_lib/types'
import { BannersList } from './_components/BannersList'
import { BannersPreview } from './_components/BannersPreview'
import { BannerFormModal } from './_components/BannerFormModal'
import { BannerDeleteModal } from './_components/BannerDeleteModal'
import { HomeLayoutPanel } from '@/components/admin/HomeLayoutPanel'

export default function AnnoncePage() {
  const t = useTranslations('Admin.annonce')
  const tCrumbs = useTranslations('Admin.crumbs')
  const tCommon = useTranslations('Admin.common')
  const { banners, loading, refresh, toggleActive, swapPositions } = useBannersData()
  const [previewMode, setPreviewMode] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null)
  const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null)
  const [formData, setFormData] = useState<BannerFormState>(INITIAL_BANNER_FORM)
  const [saving, setSaving] = useState(false)

  const openModal = (banner?: BannerData) => {
    if (banner) {
      setEditingBanner(banner)
      const normalizedType = LEGACY_TO_NEW[banner.banner_type] ?? banner.banner_type
      const inferredDirection =
        banner.direction ?? (banner.banner_type === 'image_right' ? 'right' : 'left')
      setFormData({
        title: banner.title,
        description: banner.description,
        image_url: banner.image_url,
        link_url: banner.link_url || '',
        link_text: banner.link_text || '',
        banner_type: normalizedType,
        position: banner.position,
        is_active: banner.is_active,
        slot: banner.slot ?? 'banner',
        status: banner.status ?? 'draft',
        start_date: banner.start_date || '',
        end_date: banner.end_date || '',
        direction: inferredDirection,
        attribution_name: banner.attribution_name || '',
        attribution_title: banner.attribution_title || '',
        attribution_photo_url: banner.attribution_photo_url || '',
      })
    } else {
      setEditingBanner(null)
      setFormData({
        ...INITIAL_BANNER_FORM,
        position: banners.length + 1,
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const method = editingBanner ? 'PUT' : 'POST'
      const body = editingBanner ? { ...formData, id: editingBanner.id } : formData
      const res = await fetch('/api/admin/banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        await refresh()
        setShowModal(false)
        setEditingBanner(null)
      } else {
        toast.error(`${tCommon('saveError')}: ${data.error}`)
      }
    } catch (error) {
      logger.error('Erreur sauvegarde banner:', error)
      toast.error(tCommon('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await refresh()
        setDeleteBannerId(null)
      } else {
        const data = await res.json()
        toast.error(`${tCommon('deleteError')}: ${data.error}`)
      }
    } catch (error) {
      logger.error('Erreur suppression banner:', error)
      toast.error(tCommon('deleteError'))
    }
  }

  const activeBanners = banners.filter((b) => b.is_active)

  return (
    <>
      <PageHeader
        crumbs={[
          { label: tCrumbs('admin'), href: '/admin' },
          { label: tCrumbs('ops') },
          { label: tCrumbs('announce') },
        ]}
        title={t('title')}
        actions={
          <>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] rounded-md border transition-colors ${
                previewMode
                  ? 'bg-ink-900 text-sand-50 border-ink-900 hover:bg-ink-800'
                  : 'bg-transparent text-ink-700 border-sand-300 hover:bg-sand-100 hover:text-ink-900'
              }`}
            >
              {previewMode ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              {previewMode ? t('previewHide') : t('previewShow')}
            </button>
            <button
              type="button"
              onClick={() => openModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-clay-700 text-on-accent text-[13px] font-medium rounded-md hover:bg-clay-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
              {t('addButton')}
            </button>
          </>
        }
      />

      <div className="px-5 lg:px-8 py-6 flex flex-col gap-6">
        <p className="-mt-1 max-w-2xl text-[13.5px] text-ink-500">{t('intro')}</p>

        {previewMode && <BannersPreview banners={activeBanners} />}

        <HomeLayoutPanel />

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-serif text-[19px] text-ink-900">{t('bannersHeading')}</h2>
            <p className="mt-0.5 max-w-2xl text-[12.5px] text-ink-500">{t('bannersHint')}</p>
          </div>
          <BannersList
            banners={banners}
            loading={loading}
            onMove={swapPositions}
            onToggleActive={toggleActive}
            onEdit={openModal}
            onDelete={setDeleteBannerId}
          />
        </section>
      </div>

      <BannerFormModal
        open={showModal}
        editingBanner={editingBanner}
        form={formData}
        onFormChange={setFormData}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <BannerDeleteModal
        bannerId={deleteBannerId}
        onCancel={() => setDeleteBannerId(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}
