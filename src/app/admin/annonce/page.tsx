'use client'

import { useState } from 'react'
import { PlusIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useBannersData } from './_hooks/useBannersData'
import {
  INITIAL_BANNER_FORM,
  LEGACY_TO_NEW,
  type BannerData,
  type BannerFormState,
} from './_lib/types'
import { BannerStatsCards } from './_components/BannerStatsCards'
import { BannersList } from './_components/BannersList'
import { BannersPreview } from './_components/BannersPreview'
import { BannerFormModal } from './_components/BannerFormModal'
import { BannerDeleteModal } from './_components/BannerDeleteModal'

export default function AnnoncePage() {
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
        start_date: banner.start_date || '',
        end_date: banner.end_date || '',
        direction: inferredDirection,
        attribution_name: banner.attribution_name || '',
        attribution_title: banner.attribution_title || '',
        attribution_photo_url: banner.attribution_photo_url || '',
      })
    } else {
      setEditingBanner(null)
      setFormData({ ...INITIAL_BANNER_FORM, position: banners.length + 1 })
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
        toast.error('Erreur lors de la sauvegarde: ' + data.error)
      }
    } catch (error) {
      console.error('Erreur sauvegarde banner:', error)
      toast.error('Erreur lors de la sauvegarde')
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
        toast.error('Erreur lors de la suppression: ' + data.error)
      }
    } catch (error) {
      console.error('Erreur suppression banner:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const activeBanners = banners.filter((b) => b.is_active)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Bannières</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center px-4 py-2 rounded-md ${
              previewMode
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {previewMode ? (
              <EyeSlashIcon className="h-5 w-5 mr-2" />
            ) : (
              <EyeIcon className="h-5 w-5 mr-2" />
            )}
            {previewMode ? "Quitter l'aperçu" : 'Aperçu'}
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Créer une bannière
          </button>
        </div>
      </div>

      <BannerStatsCards banners={banners} />

      {previewMode && <BannersPreview banners={activeBanners} />}

      <BannersList
        banners={banners}
        loading={loading}
        onMove={swapPositions}
        onToggleActive={toggleActive}
        onEdit={openModal}
        onDelete={setDeleteBannerId}
      />

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
    </div>
  )
}
