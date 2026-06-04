import { WidgetCard } from './WidgetCard'
import { MiniStat } from './MiniStat'

export type EngagementStats = {
  /** Paniers contenant au moins 1 article. */
  activeCarts: number
  totalCarts: number
  cartUnits: number
  /** Paniers rattachés à un compte. */
  userCarts: number
  wishlists: number
  wishlistProducts: number
  newsletter: number
  newsletterConfirmed: number
}

export function EngagementWidget({
  data,
  className,
}: {
  data: EngagementStats
  className?: string
}) {
  return (
    <WidgetCard
      title="Actividad"
      subtitle="Carritos, favoritos y newsletter"
      gap="gap-3"
      className={className}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <MiniStat
          label="Carritos activos"
          value={String(data.activeCarts)}
          sub={`${data.cartUnits} uds · ${data.totalCarts} totales`}
        />
        <MiniStat
          label="Favoritos"
          value={String(data.wishlists)}
          sub={`${data.wishlistProducts} productos`}
        />
        <MiniStat
          label="Newsletter"
          value={String(data.newsletter)}
          sub={`${data.newsletterConfirmed} confirmados`}
          href="/admin/newsletter"
        />
        <MiniStat
          label="Con cuenta"
          value={String(data.userCarts)}
          sub="carritos de clientes"
        />
      </div>
    </WidgetCard>
  )
}
