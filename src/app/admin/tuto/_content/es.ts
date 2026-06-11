import type { TutoContent } from './types'
import { orderSections } from './assemble'
import { sections as dashboard } from './sections/es/dashboard'
import { sections as contabilidad } from './sections/es/contabilidad'
import { sections as products } from './sections/es/products'
import { sections as brands } from './sections/es/brands'
import { sections as stock } from './sections/es/stock'
import { sections as tags } from './sections/es/tags'
import { sections as promotions } from './sections/es/promotions'
import { sections as reservations } from './sections/es/reservations'
import { sections as ventas } from './sections/es/ventas'
import { sections as messagesNewsletter } from './sections/es/messages-newsletter'
import { sections as homeBlog } from './sections/es/home-blog'
import { sections as usersReviews } from './sections/es/users-reviews'
import { sections as settingsAppearance } from './sections/es/settings-appearance'
import { sections as adminsLogs } from './sections/es/admins-logs'
import { sections as concepts } from './sections/es/concepts'

export const es: TutoContent = {
  intro: {
    title: 'Cómo leer esta guía',
    body: [
      'Esta guía describe cada pantalla del panel de administración: para qué sirve, qué hace cada botón y, sobre todo, qué pasa después — en el sitio público, en el stock, en la contabilidad.',
      'Cada sección sigue el mismo plan: un esquema de la pantalla con números, los procedimientos más frecuentes y la lista de acciones con sus consecuencias. Las secciones « Navegación » y « Conceptos clave » se leen primero; el resto se consulta cuando haga falta, en el orden del menú de la izquierda.',
      'Antes de cualquier acción que todavía no conozca, mire su nivel de riesgo y la línea « Para deshacer »: algunas operaciones no tienen vuelta atrás.',
    ],
    severityLegend: {
      safe: 'Sin riesgo — se deshace en un clic, sin efecto fuera del panel.',
      caution: 'Atención — visible para los clientes o la contabilidad, o difícil de deshacer.',
      danger: 'Peligro — irreversible: se pueden perder datos definitivamente.',
    },
  },
  sections: orderSections([
    dashboard,
    contabilidad,
    products,
    brands,
    stock,
    tags,
    promotions,
    reservations,
    ventas,
    messagesNewsletter,
    homeBlog,
    usersReviews,
    settingsAppearance,
    adminsLogs,
    concepts,
  ]),
}
