'use client'

import React, { useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
  Loader2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Brand, Range } from '../_lib/types'

type BrandsTableProps = {
  brands: Brand[]
  loading: boolean
  onEditBrand: (brand: Brand) => void
  onDeleteBrand: (id: string) => void
  onCreateRange: (brandId: string) => void
  onEditRange: (range: Range) => void
  onDeleteRange: (id: string) => void
}

export function BrandsTable({
  brands,
  loading,
  onEditBrand,
  onDeleteBrand,
  onCreateRange,
  onEditRange,
  onDeleteRange,
}: BrandsTableProps) {
  const t = useTranslations('Admin.marques')
  const tCommon = useTranslations('Admin.common')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (brandId: string) => {
    const next = new Set(expanded)
    if (next.has(brandId)) next.delete(brandId)
    else next.add(brandId)
    setExpanded(next)
  }

  if (loading) {
    return (
      <div className="bg-sand-50 border border-sand-300 rounded-xl py-12 text-center text-ink-500 text-[13.5px]">
        <Loader2 className="w-5 h-5 mx-auto mb-3 animate-spin text-clay-700" />
        {tCommon('loading')}
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div
        className="bg-sand-50 border border-sand-300 rounded-xl py-14 text-center text-ink-500 text-[13.5px]"
        dangerouslySetInnerHTML={{ __html: t.raw('emptyState') as string }}
      />
    )
  }

  return (
    <div className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(31,27,22,0.06),0_12px_32px_-8px_rgba(31,27,22,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead className="bg-sand-100 border-b border-sand-300">
            <tr>
              <Th>{t('columnBrand')}</Th>
              <Th>{t('columnSlug')}</Th>
              <Th>{t('columnRanges')}</Th>
              <Th className="w-[120px]"></Th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => {
              const ranges = brand.ranges ?? []
              const isOpen = expanded.has(brand.id)
              return (
                <React.Fragment key={brand.id}>
                  <tr className="border-b border-sand-200 transition-colors hover:bg-sand-100">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggle(brand.id)}
                          aria-label={
                            isOpen
                              ? t('collapseAria', { name: brand.name })
                              : t('expandAria', { name: brand.name })
                          }
                          aria-expanded={isOpen}
                          className="w-6 h-6 inline-flex items-center justify-center rounded-md text-ink-500 hover:bg-sand-200 hover:text-ink-900 transition-colors"
                        >
                          {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="font-serif text-[18px] text-ink-900 leading-none">
                          {brand.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="font-mono text-[11.5px] text-ink-700">{brand.slug}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2 text-ink-800">
                        <span className="font-mono text-[12.5px] text-ink-500">
                          {ranges.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => onCreateRange(brand.id)}
                          aria-label={t('addRangeAria', { name: brand.name })}
                          title={t('addRange')}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md text-olive-600 hover:bg-olive-600/10 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex gap-1 justify-end">
                        <RowAction
                          label={t('editAria', { name: brand.name })}
                          title={t('editTitle')}
                          onClick={() => onEditBrand(brand)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </RowAction>
                        <RowAction
                          label={t('deleteAria', { name: brand.name })}
                          title={t('deleteTitle')}
                          onClick={() => onDeleteBrand(brand.id)}
                          danger
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </RowAction>
                      </div>
                    </td>
                  </tr>
                  {isOpen &&
                    ranges.map((range) => (
                      <tr
                        key={`range-${range.id}`}
                        className="border-b border-sand-200 bg-sand-100/60"
                      >
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-2.5 pl-9 text-ink-700">
                            <Layers className="w-3 h-3 text-ink-400" />
                            <span className="text-[13px]">{range.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="font-mono text-[11px] text-ink-500 pl-9 block">
                            {range.slug}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-clay-200 text-clay-800">
                            {t('rangeLabel')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex gap-1 justify-end">
                            <RowAction
                              label={t('editRangeAria', { name: range.name })}
                              title={t('editRangeTitle')}
                              onClick={() => onEditRange(range)}
                            >
                              <Pencil className="w-3 h-3" />
                            </RowAction>
                            <RowAction
                              label={t('deleteRangeAria', { name: range.name })}
                              title={t('deleteRangeTitle')}
                              onClick={() => onDeleteRange(range.id)}
                              danger
                            >
                              <Trash2 className="w-3 h-3" />
                            </RowAction>
                          </div>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({
  children = null,
  className = '',
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={`text-left px-4 py-2.5 text-[11px] font-semibold text-ink-500 tracking-[0.12em] uppercase whitespace-nowrap ${className}`}
    >
      {children}
    </th>
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
