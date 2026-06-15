'use client'

import Image from 'next/image'
import { Eye, EyeOff, Pencil, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AdminPagination } from '@/components/admin/dashboard/AdminPagination'
import type { Product, Tag, TagType } from '../_lib/types'

type ProductsTableProps = {
  products: Product[]
  loading: boolean
  tagTypes: TagType[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  /** Publier/masquer du site (route dédiée auditée /active — barrière L-3). */
  onToggleActive: (product: Product) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Seuil « stock faible » configuré (shop_settings.low_stock_threshold). */
  lowStockThreshold: number
}

export function ProductsTable({
  products,
  loading,
  tagTypes,
  onEdit,
  onDelete,
  onToggleActive,
  page,
  totalPages,
  onPageChange,
  lowStockThreshold,
}: ProductsTableProps) {
  const t = useTranslations('Admin.product')
  const tCommon = useTranslations('Admin.common')
  const tStock = useTranslations('Admin.stockState')
  const colorOf = (tag: Tag) =>
    tagTypes.find((tt) => tt.id === tag.tag_type_id)?.color || 'var(--color-ink-500)'

  if (loading) {
    return (
      <div className="bg-sand-50 border border-sand-300 rounded-xl py-12 text-center text-ink-500 text-[13.5px]">
        <Loader2 className="w-5 h-5 mx-auto mb-3 animate-spin text-clay-700" />
        {tCommon('loading')}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-sand-50 border border-sand-300 rounded-xl py-14 text-center text-ink-500 text-[13.5px]">
        {t('emptyState')}
      </div>
    )
  }

  return (
    <div className="bg-sand-50 border border-sand-300 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(31,27,22,0.06),0_12px_32px_-8px_rgba(31,27,22,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead className="bg-sand-100 border-b border-sand-300">
            <tr>
              <Th>{t('columnProduct')}</Th>
              <Th>{t('columnBrand')}</Th>
              <Th>{t('columnTags')}</Th>
              <Th align="right">{t('columnPrice')}</Th>
              <Th align="right">{t('columnStock')}</Th>
              <Th align="right">{t('columnStatus')}</Th>
              <Th className="w-[88px]"></Th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const productTags = (product.product_tags || product.tags || []) as
                | { tag: Tag }[]
                | Tag[]
              const tagList = productTags.map((t) => ('tag' in t ? t.tag : (t as Tag)))
              const stockState =
                product.stock > lowStockThreshold ? 'ok' : product.stock > 0 ? 'low' : 'out'
              return (
                <tr
                  key={product.id}
                  className={`border-b border-sand-200 last:border-b-0 transition-colors hover:bg-sand-100 ${
                    stockState === 'low'
                      ? 'bg-[rgba(181,133,43,0.04)]'
                      : stockState === 'out'
                        ? 'bg-[rgba(139,58,46,0.04)]'
                        : ''
                  } ${product.is_active ? '' : 'opacity-60'}`}
                >
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-[42px] h-[42px] bg-sand-200 border border-sand-300 rounded-md flex items-center justify-center text-ink-500 shrink-0 overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt=""
                            width={42}
                            height={42}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <b className="block text-[13.5px] font-medium text-ink-900 truncate">
                          {product.name}
                        </b>
                        <small className="block text-[11.5px] text-ink-500 font-mono truncate">
                          {product.slug}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle text-ink-800">
                    {product.brand?.name || '—'}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {tagList.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border bg-sand-50"
                          style={{
                            borderColor: 'var(--color-sand-300)',
                            color: 'var(--color-ink-800)',
                          }}
                        >
                          <span
                            aria-hidden
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: colorOf(tag) }}
                          />
                          {tag.name}
                        </span>
                      ))}
                      {tagList.length > 3 && (
                        <span className="text-[11px] text-ink-500 self-center">
                          +{tagList.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <span className="font-serif text-[16px] text-ink-900 leading-none whitespace-nowrap">
                      {product.price}
                      <small className="font-sans text-[10.5px] text-ink-500 ml-1">
                        {product.currency.toUpperCase()}
                      </small>
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <span
                      className={`font-mono text-[12.5px] font-medium whitespace-nowrap ${
                        stockState === 'out'
                          ? 'text-brick-600'
                          : stockState === 'low'
                            ? 'text-[#B5852B]'
                            : 'text-ink-900'
                      }`}
                    >
                      {product.stock}
                      <small className="text-ink-500 font-sans text-[10.5px] font-normal ml-1">
                        {tStock('units')}
                      </small>
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <span className="inline-flex flex-col items-end gap-1">
                      <StockPill state={stockState} tStock={tStock} />
                      {!product.is_active && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap bg-ink-500/12 text-ink-700">
                          <EyeOff className="w-3 h-3" aria-hidden />
                          {t('offlinePill')}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {/* Sur une ligne hors ligne, le <tr> est déjà opacity-60 :
                        on NE recompose PAS l'opacité ici (0.6×0.6=0.36 → icônes
                        illisibles). Actions à pleine opacité, la ligne porte la
                        teinte. Lignes actives : ghost-au-repos habituel. */}
                    <div
                      className={`flex gap-1 justify-end transition-opacity ${
                        product.is_active ? 'opacity-60 group-hover:opacity-100' : 'opacity-100'
                      }`}
                    >
                      <RowAction
                        label={t('toggleActiveAria', { name: product.name })}
                        title={product.is_active ? t('toggleHideTitle') : t('toggleShowTitle')}
                        onClick={() => onToggleActive(product)}
                      >
                        {product.is_active ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </RowAction>
                      <RowAction
                        label={t('editAria', { name: product.name })}
                        title={t('editTitle')}
                        onClick={() => onEdit(product)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </RowAction>
                      <RowAction
                        label={t('deleteAria', { name: product.name })}
                        title={t('deleteTitle')}
                        onClick={() => onDelete(product.id)}
                        danger
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </RowAction>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}

function Th({
  children = null,
  align = 'left',
  className = '',
}: {
  children?: React.ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
}) {
  return (
    <th
      className={`text-${align} px-4 py-2.5 text-[11px] font-semibold text-ink-500 tracking-[0.12em] uppercase whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  )
}

function StockPill({
  state,
  tStock,
}: {
  state: 'ok' | 'low' | 'out'
  tStock: (key: 'ok' | 'low' | 'out') => string
}) {
  const map = {
    ok: { bg: 'bg-olive-600/15', text: 'text-olive-600', dot: 'bg-olive-600' },
    low: { bg: 'bg-[rgba(181,133,43,0.15)]', text: 'text-[#7A5A1C]', dot: 'bg-[#B5852B]' },
    out: { bg: 'bg-brick-600/12', text: 'text-brick-600', dot: 'bg-brick-600' },
  } as const
  const s = map[state]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${s.bg} ${s.text}`}
    >
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {tStock(state)}
    </span>
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
