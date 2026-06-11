import type { TutoContent } from './types'
import { orderSections } from './assemble'
import { sections as dashboard } from './sections/fr/dashboard'
import { sections as contabilidad } from './sections/fr/contabilidad'
import { sections as products } from './sections/fr/products'
import { sections as brands } from './sections/fr/brands'
import { sections as stock } from './sections/fr/stock'
import { sections as tags } from './sections/fr/tags'
import { sections as promotions } from './sections/fr/promotions'
import { sections as reservations } from './sections/fr/reservations'
import { sections as ventas } from './sections/fr/ventas'
import { sections as messagesNewsletter } from './sections/fr/messages-newsletter'
import { sections as homeBlog } from './sections/fr/home-blog'
import { sections as usersReviews } from './sections/fr/users-reviews'
import { sections as settingsAppearance } from './sections/fr/settings-appearance'
import { sections as adminsLogs } from './sections/fr/admins-logs'
import { sections as concepts } from './sections/fr/concepts'

export const fr: TutoContent = {
  intro: {
    title: 'Comment lire ce guide',
    body: [
      "Ce guide décrit chaque écran du panneau d'administration : à quoi il sert, ce que fait chaque bouton, et surtout ce qui se passe ensuite — sur le site public, sur le stock, sur la comptabilité.",
      "Chaque section suit le même plan : un schéma de l'écran avec des pastilles numérotées, les modes opératoires les plus courants, puis la liste des actions avec leurs conséquences. Les sections « Navigation » et « Concepts clés » se lisent en premier ; le reste se consulte au besoin, dans l'ordre du menu de gauche.",
      "Avant toute action que vous ne connaissez pas encore, regardez sa pastille de risque et la ligne « Pour annuler » : certaines opérations n'ont aucun retour en arrière.",
    ],
    severityLegend: {
      safe: "Sans risque — annulable en un clic, aucun effet en dehors de l'admin.",
      caution: 'Attention — visible par les clients ou la comptabilité, ou pénible à défaire.',
      danger: 'Danger — irréversible : des données peuvent être perdues définitivement.',
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
