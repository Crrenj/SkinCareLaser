'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { useConfirmDialog } from '@/components/admin/ConfirmDialog'
import { usePromotionsData } from './_hooks/usePromotionsData'
import { PromotionsTable } from './_components/PromotionsTable'
import { PromotionFormModal } from './_components/PromotionFormModal'
import type { Promotion } from './_lib/types'

export default function PromotionsPage() {
  const t = useTranslations('Admin.promotions')
  const tCrumbs = useTranslations('Admin.crumbs')
  const tCommon = useTranslations('Admin.common')
  const { promotions, loading, refresh } = usePromotionsData()
  const { confirm, dialog } = useConfirmDialog()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)

  type SubmitPayload = Parameters<
    React.ComponentProps<typeof PromotionFormModal>['onSubmit']
  >[0]

  const handleSubmit = async (payload: SubmitPayload) => {
    const res = await fetch(
      editing ? `/api/admin/promotions/${editing.id}` : '/api/admin/promotions',
      {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null
      toast.error(json?.error === 'invalid_target' ? t('errorInvalidTarget') : t('errorSave'))
      throw new Error('save_failed')
    }
    toast.success(editing ? t('savedEdit') : t('savedCreate'))
    setShowModal(false)
    setEditing(null)
    await refresh()
  }

  const handleDelete = async (promo: Promotion) => {
    const ok = await confirm(t('deleteConfirm', { name: promo.name }), {
      title: t('delete'),
      confirmLabel: t('delete'),
    })
    if (!ok) return
    const res = await fetch(`/api/admin/promotions/${promo.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error(t('errorDelete'))
      return
    }
    toast.success(t('deleted'))
    await refresh()
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: tCrumbs('admin'), href: '/admin' },
          { label: tCrumbs('catalog') },
          { label: t('crumb') },
        ]}
        title={t('title')}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setShowModal(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-on-accent bg-clay-700 rounded-md hover:bg-accent-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addButton')}
          </button>
        }
      />

      <div className="bg-sand-100 px-5 lg:px-8 py-6 lg:py-7 min-h-[calc(100vh-90px)]">
        <div className="max-w-[1240px] mx-auto flex flex-col gap-5">
          <p className="text-[13px] text-ink-500 max-w-prose">{t('intro')}</p>
          {loading ? (
            <div className="bg-sand-50 border border-sand-300 rounded-xl py-12 text-center text-ink-500 text-[13.5px]">
              {tCommon('loading')}
            </div>
          ) : (
            <PromotionsTable
              promotions={promotions}
              onEdit={(p) => {
                setEditing(p)
                setShowModal(true)
              }}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <PromotionFormModal
        open={showModal}
        editing={editing}
        onClose={() => {
          setShowModal(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
      {dialog}
    </>
  )
}
