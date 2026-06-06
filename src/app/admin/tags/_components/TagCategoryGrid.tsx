'use client'

import { Plus, Pencil, Trash2, Tag as TagIcon, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Tag, TagCategory } from '../_lib/types'

type TagCategoryGridProps = {
  categories: TagCategory[]
  loading: boolean
  onEditType: (categoryId: string) => void
  onDeleteType: (categoryId: string) => void
  onCreateTag: (categoryId: string) => void
  onEditTag: (categoryId: string, tag: Tag) => void
  onDeleteTag: (tagId: string) => void
}

export function TagCategoryGrid({
  categories,
  loading,
  onEditType,
  onDeleteType,
  onCreateTag,
  onEditTag,
  onDeleteTag,
}: TagCategoryGridProps) {
  const t = useTranslations('Admin.tags')
  const tCommon = useTranslations('Admin.common')

  if (loading) {
    return (
      <div className="bg-sand-50 border border-sand-300 rounded-xl py-12 text-center text-ink-500 text-[13.5px]">
        <Loader2 className="w-5 h-5 mx-auto mb-3 animate-spin text-clay-700" />
        {tCommon('loading')}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div
        className="bg-sand-50 border border-sand-300 rounded-xl py-14 text-center text-ink-500 text-[13.5px]"
        dangerouslySetInnerHTML={{ __html: t.raw('emptyState') as string }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {categories.map((category) => (
        <article
          key={category.id}
          className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(31,27,22,0.06),0_12px_32px_-8px_rgba(31,27,22,0.08)]"
        >
          <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-sand-300 bg-sand-100">
            <div className="flex items-center gap-3 min-w-0">
              <span
                aria-hidden
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: category.color }}
              />
              <div className="leading-tight min-w-0">
                <h3 className="font-serif text-[20px] text-ink-900 leading-tight truncate">
                  {category.name}
                </h3>
                <span className="font-mono text-[11px] tracking-[0.06em] text-ink-500">
                  {t('categoryCount', { count: category.tags.length })} · {category.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <HeaderAction
                label={t('editTypeAria', { name: category.name })}
                title={t('editTypeTitle')}
                onClick={() => onEditType(category.id)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </HeaderAction>
              <HeaderAction
                label={t('deleteTypeAria', { name: category.name })}
                title={t('deleteTypeTitle')}
                onClick={() => onDeleteType(category.id)}
                disabled={category.tags.length > 0}
                danger
              >
                <Trash2 className="w-3.5 h-3.5" />
              </HeaderAction>
              <button
                type="button"
                onClick={() => onCreateTag(category.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium bg-clay-700 text-on-accent rounded-md hover:bg-clay-800 transition-colors"
              >
                <Plus className="w-3 h-3" strokeWidth={2.4} />
                {t('addTagButton')}
              </button>
            </div>
          </header>

          {category.tags.length === 0 ? (
            <div className="px-5 py-10 text-center text-ink-500">
              <TagIcon className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-[13px] mb-2">{t('emptyCategoryTitle')}</p>
              <button
                type="button"
                onClick={() => onCreateTag(category.id)}
                className="text-[13px] font-medium text-clay-700 hover:text-clay-800 underline underline-offset-4 bg-transparent transition-colors"
              >
                {t('emptyCategoryCta')}
              </button>
            </div>
          ) : (
            <ul className="m-0 p-0 list-none divide-y divide-sand-200">
              {category.tags.map((tag) => (
                <li
                  key={tag.id}
                  className="group grid grid-cols-[14px_1fr_auto] gap-3 items-center px-5 py-2.5 hover:bg-sand-100 transition-colors"
                >
                  <span
                    aria-hidden
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: category.color }}
                  />
                  <div className="min-w-0 leading-tight">
                    <b className="block text-[13.5px] font-medium text-ink-900 truncate">
                      {tag.name}
                    </b>
                    <small className="block text-[11px] text-ink-500 font-mono">
                      {tag.slug}
                    </small>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RowAction
                      label={t('editTagAria', { name: tag.name })}
                      title={t('editTagTitle')}
                      onClick={() => onEditTag(category.id, tag)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </RowAction>
                    <RowAction
                      label={t('deleteTagAria', { name: tag.name })}
                      title={t('deleteTagTitle')}
                      onClick={() => onDeleteTag(tag.id)}
                      danger
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </RowAction>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  )
}

function HeaderAction({
  children,
  onClick,
  title,
  label,
  disabled = false,
  danger = false,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  label: string
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      disabled={disabled}
      className={`w-7 h-7 inline-flex items-center justify-center rounded-md border-0 bg-transparent text-ink-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        danger
          ? 'hover:bg-brick-600/10 hover:text-brick-600 disabled:hover:bg-transparent disabled:hover:text-ink-500'
          : 'hover:bg-sand-200 hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  )
}

function RowAction({
  children,
  onClick,
  title,
  label,
  danger = false,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  label: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      className={`w-7 h-7 inline-flex items-center justify-center rounded-md border-0 bg-transparent text-ink-500 transition-colors ${
        danger ? 'hover:bg-brick-600/10 hover:text-brick-600' : 'hover:bg-sand-200 hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  )
}
