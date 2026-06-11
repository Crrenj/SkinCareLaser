import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "promotions",
    navLabel: "Promotions",
    title: "Promotions — des remises datées, visibles sur toute la boutique",
    route: "/admin/promotions",
    intro:
      "Cet écran gère les campagnes de remise : un pourcentage (ex. −20 %) ou un montant fixe en pesos (ex. −100 DOP), appliqué à des produits précis, à toute une marque, à une gamme ou à un tag, pendant une période que vous choisissez. Dès qu'une promotion est en ligne, le client voit partout le prix remisé avec l'ancien prix barré et le pourcentage de réduction : catalogue, fiche produit, accueil, favoris, panier, recherche. Le prix remisé est aussi celui qui est enregistré dans la réservation du client — et donc celui que la comptabilité comptera comme vente.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Catalogue / Promotions" },
            { w: 4, kind: "button", label: "+ Nouvelle promotion", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "text", label: "Campagnes de remise (% ou montant fixe) appliquées aux produits ciblés…" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Nom · Remise · Période · Cibles · Statut · crayon · corbeille", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "panel", label: "Badge : En ligne / Programmée / Expirée / Hors ligne", hotspot: 3 },
            { w: 6, kind: "panel", label: "Crayon = modifier · Corbeille = supprimer", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Volet : nom · % ou DOP · valeur · début/fin · case Active · cibles", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Bouton « Nouvelle promotion »",
        desc: "Ouvre le volet de création à droite. Rien n'est enregistré tant que vous ne cliquez pas sur « Créer la promotion » en bas du volet.",
      },
      {
        n: 2,
        label: "Liste des campagnes",
        desc: "Une ligne par promotion : son nom, la remise (avec % ou DOP), la période « début → fin », jusqu'à trois cibles (au-delà, un compteur « +N »), et son statut. Les plus récentes sont en haut.",
      },
      {
        n: 3,
        label: "Badge de statut",
        desc: "Calculé automatiquement, il n'y a rien à cliquer : « Programmée » avant la date de début, « En ligne » pendant la période, « Expirée » après la date de fin, « Hors ligne » si la case « Active » est décochée. Seules les promotions « En ligne » changent les prix.",
      },
      {
        n: 4,
        label: "Boutons en bout de ligne",
        desc: "Le crayon ouvre le volet de modification (mêmes champs qu'à la création). La corbeille supprime la campagne après une fenêtre de confirmation.",
      },
      {
        n: 5,
        label: "Volet de création / modification",
        desc: "De haut en bas : nom de la campagne ; choix Pourcentage ou Montant fixe ; la valeur ; les dates et heures de début et de fin ; la case « Active (visible en boutique) » ; le bloc Cibles. Le bouton du bas reste grisé tant qu'il manque le nom, la valeur, une des deux dates ou au moins une cible.",
      },
    ],
    workflows: [
      {
        title: "Lancer une promotion datée",
        steps: [
          {
            title: "Ouvrir le volet",
            body: "Cliquez sur « Nouvelle promotion » et donnez un nom clair à la campagne (ex. « Soldes de janvier »). Ce nom n'est visible que dans l'admin.",
          },
          {
            title: "Choisir la remise",
            body: "Pourcentage (au maximum 100) ou montant fixe en DOP, puis la valeur. Un montant fixe plus grand que le prix d'un produit donne un prix de 0, jamais un prix négatif.",
          },
          {
            title: "Fixer la période",
            body: "Renseignez début et fin (date et heure). La fin doit être après le début. La promotion démarre et s'arrête toute seule à ces dates.",
          },
          {
            title: "Ajouter les cibles",
            body: "Choisissez le type : Produit (recherche par nom), Marque, Gamme ou Tag (liste déroulante puis « Ajouter »). Cibler une marque ou une gamme couvre tous ses produits, y compris ceux ajoutés au catalogue plus tard.",
          },
          {
            title: "Enregistrer",
            body: "Laissez la case « Active » cochée et cliquez sur « Créer la promotion ». Si la période est en cours, les prix remisés apparaissent sur la boutique en moins d'une minute.",
          },
          {
            title: "Vérifier sur le site",
            body: "Ouvrez la fiche d'un produit concerné sur le site public : le prix remisé s'affiche avec l'ancien prix barré et le badge de réduction.",
          },
        ],
      },
      {
        title: "Arrêter une promotion avant la date de fin",
        steps: [
          {
            title: "Ouvrir la promotion",
            body: "Dans la liste, cliquez sur le crayon de la campagne à couper.",
          },
          {
            title: "Décocher « Active »",
            body: "Décochez la case « Active (visible en boutique) ». La campagne reste enregistrée avec toutes ses dates et cibles.",
          },
          {
            title: "Enregistrer",
            body: "Cliquez sur « Enregistrer ». Les produits reviennent au prix normal sur la boutique en moins d'une minute. Le badge passe à « Hors ligne ».",
          },
          {
            title: "Savoir ce qui ne change pas",
            body: "Les réservations déjà créées pendant la promotion gardent leur prix remisé : rien ne bouge pour ces clients ni pour la comptabilité.",
          },
        ],
      },
      {
        title: "Modifier la remise d'une promotion en cours",
        steps: [
          {
            title: "Ouvrir avec le crayon",
            body: "Le volet s'ouvre pré-rempli avec les réglages actuels, cibles comprises.",
          },
          {
            title: "Changer la valeur",
            body: "Ajustez le pourcentage ou le montant, ou la période, ou les cibles. À l'enregistrement, la liste des cibles est remplacée par celle affichée dans le volet.",
          },
          {
            title: "Enregistrer et vérifier",
            body: "Le nouveau prix se reflète sur la boutique en moins d'une minute. Seules les réservations futures utiliseront ce nouveau prix : celles déjà passées gardent l'ancien.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Créer une promotion",
        where: "Bouton « Nouvelle promotion » en haut de page, puis « Créer la promotion » en bas du volet",
        does: "Enregistre une nouvelle campagne de remise avec son nom, son type (% ou montant fixe), sa valeur, sa période, son état actif/inactif et sa liste de cibles.",
        effects: [
          "La campagne est enregistrée dans la base de données et apparaît en haut de la liste.",
          "Si la case « Active » est cochée et que la période est en cours, le prix remisé s'applique sur toute la boutique en moins d'une minute : prix barré + badge de réduction.",
          "Toute réservation créée pendant la promotion enregistre le prix remisé — c'est ce prix que le client paie en pharmacie et que la comptabilité compte, même si la promotion s'arrête ou change ensuite. Seul un ajustement manuel du prix, ligne par ligne, depuis la réservation peut encore le modifier.",
          "Si un produit est touché par plusieurs promotions, c'est le prix le plus bas pour le client qui s'applique (les remises ne s'additionnent pas).",
          "Si une cible choisie n'existe plus (produit supprimé entre-temps), rien n'est enregistré et le message « Une cible sélectionnée n'existe plus » s'affiche.",
        ],
        severity: "caution",
        undo: "Ouvrez la promotion et décochez « Active » (ou supprimez-la) : les prix reviennent au prix normal en moins d'une minute. Les réservations déjà créées gardent toutefois leur prix remisé.",
        audited: true,
        publicImpact: "Le prix remisé (avec l'ancien prix barré et le badge −X %) s'affiche partout : catalogue, fiche produit, accueil, favoris, panier et recherche.",
        accountingImpact: "Les réservations passées pendant la promotion sont enregistrées au prix remisé : le chiffre d'affaires comptabilisé est le montant réellement encaissé.",
      },
      {
        label: "Modifier une promotion",
        where: "Crayon en bout de ligne, puis « Enregistrer » en bas du volet",
        does: "Remplace tous les réglages de la campagne par le contenu du volet : nom, type et valeur de remise, dates, case « Active », et la liste complète des cibles.",
        effects: [
          "Les nouveaux réglages s'appliquent aussitôt ; les prix sur la boutique suivent en moins d'une minute.",
          "La liste des cibles est intégralement remplacée : une cible retirée du volet ne bénéficie plus de la remise dès l'enregistrement.",
          "Les réservations déjà créées ne bougent pas : leur prix a été figé au moment où le client a réservé.",
          "Si une des cibles affichées correspond à un élément supprimé du catalogue, l'enregistrement est refusé : retirez d'abord la cible marquée « (supprimé) ».",
        ],
        severity: "caution",
        undo: "Rouvrez la promotion et remettez les valeurs précédentes (elles sont aussi consultables dans le journal d'audit).",
        audited: true,
        publicImpact: "Les nouveaux prix remisés remplacent les anciens sur tout le site en moins d'une minute.",
        accountingImpact: "Seules les réservations futures utilisent le nouveau prix ; les ventes déjà enregistrées conservent le leur.",
      },
      {
        label: "Mettre hors ligne / remettre en ligne (case « Active »)",
        where: "Case « Active (visible en boutique) » dans le volet de modification, puis « Enregistrer »",
        does: "Coupe ou relance la remise immédiatement, sans toucher aux dates ni aux cibles. C'est l'interrupteur principal de la campagne.",
        effects: [
          "Décochée : la remise cesse même si la période n'est pas terminée ; les produits reviennent au prix normal en boutique en moins d'une minute ; le badge passe à « Hors ligne ».",
          "Recochée : la remise repart aussitôt, à condition que la période soit encore en cours (sinon le badge indique « Programmée » ou « Expirée » et rien ne change pour le client).",
          "Les réservations déjà créées gardent leur prix remisé dans les deux cas.",
        ],
        severity: "caution",
        undo: "Recochez (ou décochez) la case et enregistrez à nouveau : l'effet est immédiat et la campagne n'est jamais perdue.",
        audited: true,
        publicImpact: "Active/désactive l'affichage du prix remisé sur tout le site public.",
      },
      {
        label: "Supprimer une promotion",
        where: "Corbeille en bout de ligne, puis confirmation dans la fenêtre « Supprimer »",
        does: "Efface définitivement la campagne et sa liste de cibles de la base de données, après confirmation.",
        effects: [
          "La campagne disparaît de la liste et ne peut pas être restaurée : pour la relancer, il faudra la recréer entièrement.",
          "Les prix remisés reviennent au prix normal sur la boutique en moins d'une minute.",
          "Les réservations et ventes déjà enregistrées gardent leur prix remisé : l'historique des clients et la comptabilité ne changent pas.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "Les produits concernés reviennent au prix normal sur tout le site public.",
        accountingImpact: "Aucun effet sur les ventes passées : leur prix a été figé au moment de chaque réservation.",
      },
    ],
    flows: [
      {
        title: "Cycle de vie d'une promotion",
        lanes: [
          [
            {
              label: "Programmée",
              tone: "neutral",
              note: "La date de début n'est pas encore arrivée : la campagne est enregistrée mais n'a aucun effet en boutique.",
            },
            {
              label: "En ligne",
              tone: "ok",
              note: "Période en cours et case « Active » cochée : prix remisé + prix barré sur la boutique, réservations enregistrées au prix remisé.",
            },
            {
              label: "Expirée",
              tone: "neutral",
              note: "À la date et l'heure de fin, la remise s'arrête toute seule. La campagne reste dans la liste pour mémoire.",
            },
          ],
          [
            {
              label: "Hors ligne",
              tone: "warn",
              note: "Case « Active » décochée : la remise est coupée immédiatement, quelle que soit la période. Recochez la case pour la relancer.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Il n'y a pas d'interrupteur dans la liste : pour couper ou relancer une promotion, ouvrez-la avec le crayon et cochez/décochez « Active », puis enregistrez.",
      "Plusieurs promotions sur le même produit ne s'additionnent jamais : c'est le prix le plus bas pour le client qui s'applique.",
      "Le prix payé est celui du moment où le client réserve : il garde son prix remisé même si vous arrêtez la promotion ensuite. À l'inverse, un panier rempli pendant la promotion mais réservé après la fin paie le prix normal.",
      "La date de fin est exclue : à l'heure de fin pile, la remise ne s'applique déjà plus. La fin doit être après le début, et un pourcentage ne peut pas dépasser 100.",
      "Un montant fixe plus grand que le prix d'un produit donne un prix de 0 DOP, jamais un prix négatif — vérifiez la valeur quand vous ciblez toute une marque dont les prix varient.",
      "Cibler une marque, une gamme ou un tag couvre automatiquement tous les produits rattachés, y compris ceux ajoutés au catalogue après la création de la promotion.",
      "Si un élément ciblé a été supprimé du catalogue, il s'affiche « (supprimé) » dans la liste, et vous devrez retirer cette cible avant de pouvoir enregistrer la moindre modification de la campagne.",
      "Les changements de prix apparaissent sur la boutique en moins d'une minute : si vous ne voyez rien, attendez quelques instants et rechargez la page publique.",
    ],
  },
]
