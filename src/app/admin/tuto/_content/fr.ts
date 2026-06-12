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
      "Chaque section commence par l'essentiel en une phrase. Besoin de plus ? Dépliez : le schéma de l'écran, les modes opératoires, la liste des actions avec leurs conséquences. Les sections « Navigation » et « Concepts clés » se lisent en premier ; le reste se consulte au besoin, dans l'ordre du menu de gauche.",
      "Avant toute action que vous ne connaissez pas encore, regardez sa pastille de risque et la ligne « Pour annuler » : certaines opérations n'ont aucun retour en arrière.",
    ],
    severityLegend: {
      safe: "Sans risque — annulable en un clic, aucun effet en dehors de l'admin.",
      caution: 'Attention — visible par les clients ou la comptabilité, ou pénible à défaire.',
      danger: 'Danger — irréversible : des données peuvent être perdues définitivement.',
    },
  },
  groups: [
    { label: 'Pour commencer', ids: ['chrome', 'concepts'] },
    { label: 'Pilotage', ids: ['dashboard', 'contabilidad'] },
    { label: 'Catalogue', ids: ['products', 'brands', 'stock', 'tags', 'promotions'] },
    { label: 'Activité', ids: ['reservations', 'ventas', 'messages'] },
    { label: 'Contenu', ids: ['home', 'blog'] },
    { label: 'Clients', ids: ['users', 'reviews', 'newsletter'] },
    { label: 'Réglages', ids: ['settings', 'appearance'] },
    { label: 'Accès', ids: ['admins', 'logs'] },
  ],
  summaries: {
    chrome:
      "Deux repères présents sur toutes les pages : la barre latérale à gauche (le menu, ses compteurs, votre carte d'identité) et l'en-tête en haut.",
    concepts:
      "Trois fils rouges expliquent presque tout le panneau : le parcours d'une commande, la vie d'un prix et la vie d'un coût.",
    dashboard:
      "La page d'arrivée après connexion : toute la pharmacie d'un coup d'œil, en lecture seule — cliquer une tuile mène à l'écran concerné.",
    contabilidad:
      'Le bilan financier du mois : encaissé, coût des produits vendus, dépenses et résultat net — presque tout est calculé automatiquement.',
    products:
      'Le cœur du catalogue : créer une fiche produit, corriger un nom ou un prix, gérer les photos et la visibilité sur le site.',
    brands:
      "Le catalogue s'organise en deux niveaux — chaque marque contient des gammes, et chaque produit est rattaché à une gamme.",
    stock:
      "Les quantités en rayon et les quatre opérations d'inventaire : réception, ajustement, perte, initialisation. C'est ici que vit le coût moyen.",
    tags: 'Les étiquettes classent les produits par thème (besoins, types de peau, ingrédients…) et alimentent les filtres du catalogue public.',
    promotions:
      'Des remises datées (− % ou montant fixe) sur des produits, une marque ou une gamme — affichées en prix barré sur le site.',
    reservations:
      "La boîte de réception des demandes clients : contacter, confirmer, ajuster un prix si besoin, puis marquer « Remise » à l'encaissement.",
    ventas:
      'Le journal de tout ce qui a été réellement vendu et remis au client — réservations remises et ventes comptoir directes.',
    messages:
      "Les messages du formulaire de contact et du centre d'aide arrivent ici sous forme de tickets : lire, répondre, clore.",
    home: "Tout ce qui s'affiche sur la page d'accueil du site : ordre et visibilité des sections, bannières promo, et aperçu.",
    blog: 'Écrire, publier et retirer les articles du blog du site public — chaque article est rédigé dans une seule langue.',
    users:
      "Tous les comptes inscrits sur le site : les clients, et les membres de l'équipe (des comptes clients avec des droits en plus).",
    reviews:
      'Modérer les avis produits (note de 1 à 5 étoiles) que les clients laissent en bas des fiches du site.',
    newsletter:
      "La liste des personnes abonnées à la newsletter, avec leur langue, leur date d'inscription et leur statut de confirmation.",
    settings:
      'Les informations officielles de la boutique : coordonnées de contact, point de retrait et règles de réservation.',
    appearance:
      "L'habillage visuel du site public : une palette parmi six, le mode clair/sombre par défaut et la bascule laissée au visiteur.",
    admins:
      "Gérer l'équipe qui a accès au panneau : deux rôles, et la promotion (ou le retrait) de la casquette admin d'un compte client.",
    logs: "Le journal d'audit : qui a créé, modifié ou supprimé quoi, et quand — avec les champs touchés et leurs nouvelles valeurs.",
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
