'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { useConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useTagsData } from './_hooks/useTagsData'
import { generateSlug } from './_lib/icons'
import type {
  Tag,
  TagFormState,
  TagType,
  TypeFormState,
} from './_lib/types'
import { TagStatsCards } from './_components/TagStatsCards'
import { TagCategoryGrid } from './_components/TagCategoryGrid'
import { TagModal } from './_components/TagModal'
import { TagTypeModal } from './_components/TagTypeModal'

const INITIAL_TAG_FORM: TagFormState = { name: '', slug: '', tag_type_id: '' }
const INITIAL_TYPE_FORM: TypeFormState = {
  name: '',
  slug: '',
  icon: 'TagIcon',
  color: '#8E5232',
  initialTag: '',
}

export default function TagsPage() {
  const t = useTranslations('Admin.tags')
  const tCrumbs = useTranslations('Admin.crumbs')
  const tCommon = useTranslations('Admin.common')
  const { tagCategories, tagTypes, loading, refresh } = useTagsData()

  const [showTagModal, setShowTagModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editingType, setEditingType] = useState<TagType | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const { confirm, dialog } = useConfirmDialog()

  const [tagForm, setTagForm] = useState<TagFormState>(INITIAL_TAG_FORM)
  const [typeForm, setTypeForm] = useState<TypeFormState>(INITIAL_TYPE_FORM)

  const openTagModal = (categoryId: string, tag?: Tag) => {
    setSelectedCategoryId(categoryId)
    if (tag) {
      setEditingTag(tag)
      setTagForm({
        name: tag.name,
        slug: tag.slug,
        tag_type_id: tag.tag_type_id || categoryId,
      })
    } else {
      setEditingTag(null)
      setTagForm({ name: '', slug: '', tag_type_id: categoryId })
    }
    setShowTagModal(true)
  }

  const openTypeModal = (type?: TagType) => {
    if (type) {
      setEditingType(type)
      setTypeForm({
        name: type.name,
        slug: type.slug,
        icon: type.icon || 'TagIcon',
        color: type.color,
        initialTag: '',
      })
    } else {
      setEditingType(null)
      setTypeForm(INITIAL_TYPE_FORM)
    }
    setShowTypeModal(true)
  }

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTag ? `/api/admin/tags/${editingTag.id}` : '/api/admin/tags'
      const method = editingTag ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagForm),
      })
      const data = await res.json()
      if (res.ok) {
        refresh()
        setShowTagModal(false)
      } else {
        toast.error(data.error || tCommon('saveError'))
      }
    } catch (error) {
      logger.error('Erreur sauvegarde tag:', error)
      toast.error(tCommon('saveError'))
    }
  }

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingType
        ? `/api/admin/tag-types/${editingType.id}`
        : '/api/admin/tag-types'
      const method = editingType ? 'PATCH' : 'POST'
      const body: Record<string, unknown> = {
        name: typeForm.name,
        slug: typeForm.slug,
        icon: typeForm.icon,
        color: typeForm.color,
      }
      if (!editingType && typeForm.initialTag) {
        body.initial_tag = {
          name: typeForm.initialTag,
          slug: generateSlug(typeForm.initialTag),
        }
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        refresh()
        setShowTypeModal(false)
      } else {
        toast.error(data.error || tCommon('saveError'))
      }
    } catch (error) {
      logger.error('Erreur sauvegarde type:', error)
      toast.error(tCommon('saveError'))
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    const ok = await confirm(t('deleteTagConfirmBody'), {
      title: t('deleteTagConfirmTitle'),
      confirmLabel: tCommon('delete'),
      cancelLabel: tCommon('cancel'),
      tone: 'danger',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/tags/${tagId}`, { method: 'DELETE' })
      if (res.ok) {
        refresh()
      } else {
        const error = await res.json()
        toast.error(error.error || tCommon('deleteError'))
      }
    } catch (error) {
      logger.error('Erreur suppression tag:', error)
      toast.error(tCommon('deleteError'))
    }
  }

  const handleDeleteType = async (typeId: string) => {
    const ok = await confirm(t('deleteTypeConfirmBody'), {
      title: t('deleteTypeConfirmTitle'),
      confirmLabel: tCommon('delete'),
      cancelLabel: tCommon('cancel'),
      tone: 'danger',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/tag-types/${typeId}`, { method: 'DELETE' })
      if (res.ok) {
        refresh()
      } else {
        const error = await res.json()
        toast.error(error.error || tCommon('deleteError'))
      }
    } catch (error) {
      logger.error('Erreur suppression type:', error)
      toast.error(tCommon('deleteError'))
    }
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: tCrumbs('admin'), href: '/admin' },
          { label: tCrumbs('catalog') },
          { label: tCrumbs('tags') },
        ]}
        title={t('title')}
        actions={
          <button
            type="button"
            onClick={() => openTypeModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-clay-700 text-sand-50 text-[13px] font-medium rounded-md hover:bg-clay-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            {t('addTypeButton')}
          </button>
        }
      />

      <div className="px-5 lg:px-8 py-6 flex flex-col gap-6">
        <TagStatsCards categories={tagCategories} />
        <TagCategoryGrid
          categories={tagCategories}
          loading={loading}
          onEditType={(categoryId) =>
            openTypeModal(tagTypes.find((t) => t.id === categoryId))
          }
          onDeleteType={handleDeleteType}
          onCreateTag={(categoryId) => openTagModal(categoryId)}
          onEditTag={(categoryId, tag) => openTagModal(categoryId, tag)}
          onDeleteTag={handleDeleteTag}
        />
      </div>

      <TagTypeModal
        open={showTypeModal}
        editingType={editingType}
        form={typeForm}
        onFormChange={setTypeForm}
        onClose={() => setShowTypeModal(false)}
        onSubmit={handleTypeSubmit}
      />

      <TagModal
        open={showTagModal}
        editingTag={editingTag}
        selectedCategoryId={selectedCategoryId}
        categories={tagCategories}
        form={tagForm}
        onFormChange={setTagForm}
        onClose={() => setShowTagModal(false)}
        onSubmit={handleTagSubmit}
      />

      {dialog}
    </>
  )
}
