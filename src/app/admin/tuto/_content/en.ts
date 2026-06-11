import type { TutoContent } from './types'
import { orderSections } from './assemble'
import { sections as dashboard } from './sections/en/dashboard'
import { sections as contabilidad } from './sections/en/contabilidad'
import { sections as products } from './sections/en/products'
import { sections as brands } from './sections/en/brands'
import { sections as stock } from './sections/en/stock'
import { sections as tags } from './sections/en/tags'
import { sections as promotions } from './sections/en/promotions'
import { sections as reservations } from './sections/en/reservations'
import { sections as ventas } from './sections/en/ventas'
import { sections as messagesNewsletter } from './sections/en/messages-newsletter'
import { sections as homeBlog } from './sections/en/home-blog'
import { sections as usersReviews } from './sections/en/users-reviews'
import { sections as settingsAppearance } from './sections/en/settings-appearance'
import { sections as adminsLogs } from './sections/en/admins-logs'
import { sections as concepts } from './sections/en/concepts'

export const en: TutoContent = {
  intro: {
    title: 'How to read this guide',
    body: [
      'This guide covers every screen of the admin panel: what it is for, what each button does and, above all, what happens next — on the public site, on stock, on the accounting.',
      'Every section follows the same plan: a diagram of the screen with numbered markers, the most common procedures, then the list of actions with their consequences. Read the “Navigation” and “Key concepts” sections first; the rest can be consulted as needed, in the order of the left-hand menu.',
      'Before any action you do not know yet, check its risk badge and the “To undo” line: some operations have no way back.',
    ],
    severityLegend: {
      safe: 'Safe — undone in one click, no effect outside the panel.',
      caution: 'Caution — visible to customers or the accounting, or painful to undo.',
      danger: 'Danger — irreversible: data can be lost for good.',
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
