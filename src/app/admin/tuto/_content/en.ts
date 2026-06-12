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
      'Every section starts with the essentials in one sentence. Need more? Expand it: the screen diagram, the procedures, the list of actions with their consequences. Read the “Navigation” and “Key concepts” sections first; the rest can be consulted as needed, in the order of the left-hand menu.',
      'Before any action you do not know yet, check its risk badge and the “To undo” line: some operations have no way back.',
    ],
    severityLegend: {
      safe: 'Safe — undone in one click, no effect outside the panel.',
      caution: 'Caution — visible to customers or the accounting, or painful to undo.',
      danger: 'Danger — irreversible: data can be lost for good.',
    },
  },
  groups: [
    { label: 'Getting started', ids: ['chrome', 'concepts'] },
    { label: 'Oversight', ids: ['dashboard', 'contabilidad'] },
    { label: 'Catalogue', ids: ['products', 'brands', 'stock', 'tags', 'promotions'] },
    { label: 'Activity', ids: ['reservations', 'ventas', 'messages'] },
    { label: 'Content', ids: ['home', 'blog'] },
    { label: 'Customers', ids: ['users', 'reviews', 'newsletter'] },
    { label: 'Settings', ids: ['settings', 'appearance'] },
    { label: 'Access', ids: ['admins', 'logs'] },
  ],
  summaries: {
    chrome:
      'Two fixtures present on every page: the sidebar on the left (the menu, its counters, your identity card) and the header at the top.',
    concepts:
      'Three threads explain almost the whole panel: the journey of an order, the life of a price and the life of a cost.',
    dashboard:
      'The landing page after signing in: the whole pharmacy at a glance, read-only — clicking a tile takes you to the screen concerned.',
    contabilidad:
      'The financial picture of the month: takings, cost of goods sold, expenses and net result — almost everything is computed automatically.',
    products:
      'The heart of the catalogue: create a product sheet, fix a name or a price, manage photos and visibility on the site.',
    brands:
      'The catalogue is organised in two levels — each brand contains ranges, and each product is attached to a range.',
    stock:
      'Shelf quantities and the four inventory operations: receipt, adjustment, loss, initialisation. This is where the average cost lives.',
    tags: 'Tags classify products by theme (needs, skin types, ingredients…) and feed the filters of the public catalogue.',
    promotions:
      'Dated discounts (− % or fixed amount) on products, a brand or a range — shown as a struck-through price on the site.',
    reservations:
      'The inbox of customer requests: contact, confirm, adjust a price if needed, then mark “Collected” at payment.',
    ventas:
      'The journal of everything actually sold and handed to the customer — collected reservations and direct counter sales.',
    messages:
      'Messages from the contact form and the help centre land here as tickets: read, reply, close.',
    home: 'Everything shown on the site homepage: order and visibility of sections, promo banners, and a preview.',
    blog: 'Write, publish and withdraw the articles of the public site blog — each article is written in a single language.',
    users:
      'Every account registered on the site: customers, and team members (customer accounts with extra rights).',
    reviews:
      'Moderate the product reviews (1 to 5 stars) that customers leave at the bottom of the site product pages.',
    newsletter:
      'The list of people subscribed to the newsletter, with their language, sign-up date and confirmation status.',
    settings:
      'The official information of the shop: contact details, pickup point and reservation rules.',
    appearance:
      'The visual dress of the public site: one palette among six, the default light/dark mode and the toggle left to the visitor.',
    admins:
      'Manage the team with access to the panel: two roles, and promoting (or removing) the admin hat of a customer account.',
    logs: 'The audit log: who created, edited or deleted what, and when — with the fields touched and their new values.',
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
