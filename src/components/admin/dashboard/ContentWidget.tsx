import { WidgetCard } from './WidgetCard'
import { MiniStat } from './MiniStat'

export type ContentStats = {
  posts: number
  postsPublished: number
  banners: number
  bannersActive: number
  tags: number
  tagTypes: number
  productTags: number
}

export function ContentWidget({ data, className }: { data: ContentStats; className?: string }) {
  return (
    <WidgetCard
      title="Contenido y taxonomía"
      subtitle="Blog, banners y etiquetas"
      gap="gap-3"
      className={className}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <MiniStat
          label="Blog"
          value={String(data.postsPublished)}
          sub={`${data.posts} entradas · publicadas`}
          href="/admin/blog"
        />
        <MiniStat
          label="Banners"
          value={String(data.bannersActive)}
          sub={`${data.banners} totales · activos`}
          href="/admin/annonce"
        />
        <MiniStat
          label="Etiquetas"
          value={String(data.tags)}
          sub={`${data.tagTypes} tipos`}
          href="/admin/tags"
        />
        <MiniStat
          label="Asociaciones"
          value={String(data.productTags)}
          sub="producto–etiqueta"
        />
      </div>
    </WidgetCard>
  )
}
