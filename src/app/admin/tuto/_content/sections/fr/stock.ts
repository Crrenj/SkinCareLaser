import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "stock",
    navLabel: "Stock",
    title: "Stock — inventaire, réceptions, pertes et coût moyen",
    route: "/admin/stock",
    intro:
      "Cet écran suit les quantités en rayon de tous les produits et porte les quatre opérations d'inventaire de la pharmacie : la réception d'une livraison fournisseur, l'ajustement d'un comptage, la déclaration d'une perte (produit périmé, abîmé, volé) et l'initialisation d'un produit pour le lancement. Il affiche aussi le coût d'achat et la marge de chaque produit. Le coût utilisé partout est le coût moyen pondéré : si vous avez 10 unités achetées à 80 pesos et que vous en recevez 10 autres à 100 pesos, le coût moyen devient 90 pesos par unité. Ce coût moyen sert à calculer les marges, la valeur de l'inventaire et le montant des pertes — et il ne se met à jour QUE par les réceptions. D'où la règle d'or de l'écran : une livraison passe TOUJOURS par la réception (qui ajoute les unités et enregistre le coût), jamais par l'ajustement (qui écrase le chiffre sans rien dire à la comptabilité).",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin › Catalogue › Stock" },
            { w: 4, kind: "button", label: "+ Entrée de stock", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "toolbar", label: "Rechercher un produit…", hotspot: 2 },
            { w: 5, kind: "tabs", label: "Tous · Normal · Bas · Rupture", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Total produits", hotspot: 4 },
            { w: 3, kind: "kpi", label: "Stock normal" },
            { w: 3, kind: "kpi", label: "Stock bas" },
            { w: 3, kind: "kpi", label: "Rupture" },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "table", label: "Produit · Stock · Coût · Marge · Statut · Mis à jour", hotspot: 5 },
            { w: 3, kind: "panel", label: "4 icônes d'action par ligne", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "text", label: "Arrière-plan estompé" },
            { w: 8, kind: "drawer", label: "Tiroirs : Réception · Initialisation · Perte + fenêtre Ajustement", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Entrée de stock",
        desc: "Ouvre le tiroir de réception de marchandise, vide. Vous y ajoutez les produits livrés un par un. Le « + » d'une ligne du tableau ouvre le même tiroir avec le produit déjà pré-rempli.",
      },
      {
        n: 2,
        label: "Recherche",
        desc: "Filtre la liste sur le nom du produit. Tapez les mots avec leurs accents exacts : « creme » ne trouvera pas « crème ».",
      },
      {
        n: 3,
        label: "Onglets de statut",
        desc: "Filtrent la liste par état du stock : Tous, Normal, Bas, Rupture — chaque onglet affiche son compteur. L'onglet Rupture passe en rouge quand il est sélectionné.",
      },
      {
        n: 4,
        label: "Les 4 tuiles d'état",
        desc: "Le résumé chiffré : nombre total de produits, en stock normal (au-dessus du seuil de stock faible), en stock bas (au seuil ou moins, hors rupture) et en rupture (0 unité). Le seuil se règle dans Boutique & réservation → Inventaire (10 par défaut).",
      },
      {
        n: 5,
        label: "Le tableau",
        desc: "Une ligne par produit : nom et marque, stock en unités, coût d'achat moyen, marge (part du prix de vente qui reste après le coût — en rouge si le produit est vendu à perte), pastille de statut et date de dernière mise à jour. Un tiret « — » dans Coût ou Marge signifie qu'aucune réception n'a encore enregistré de coût. Les lignes en stock bas se teintent en jaune, celles en rupture en rouge. Tri possible sur Produit et Stock ; les en-têtes Statut et Mis à jour se cliquent aussi, mais reclassent en réalité la liste par nom de produit.",
      },
      {
        n: 6,
        label: "Les 4 actions de ligne",
        desc: "De gauche à droite : « Initialiser ce produit » (presse-papiers — le tiroir de lancement), « Entrée de stock » (+ — réception pré-remplie), « Ajuster l'inventaire » (crayon — corriger le chiffre), « Enregistrer une perte » (colis marqué d'un moins — périmé, abîmé, vol).",
      },
      {
        n: 7,
        label: "Tiroirs et fenêtre d'opération",
        desc: "Chaque opération s'ouvre par-dessus l'écran : trois tiroirs sur la droite (réception, initialisation, perte) et une petite fenêtre centrale pour l'ajustement. Rien n'est enregistré tant que vous n'avez pas cliqué le bouton de validation en bas.",
      },
    ],
    workflows: [
      {
        title: "Recevoir une livraison fournisseur",
        steps: [
          {
            title: "Ouvrez le tiroir de réception",
            body: "Cliquez « Entrée de stock » en haut à droite. Une réception correspond à UNE facture fournisseur — si vous avez deux factures, faites deux réceptions.",
          },
          {
            title: "Ajoutez les produits livrés",
            body: "Tapez au moins deux lettres dans la recherche du tiroir et cliquez le produit dans la liste. Re-cliquer le même produit augmente sa quantité d'une unité.",
          },
          {
            title: "Saisissez quantité et coût par ligne",
            body: "Le coût est le prix payé au fournisseur PAR UNITÉ — pas le prix de vente. Chaque ligne doit avoir une quantité d'au moins 1 et un coût supérieur à 0, sinon le bouton de validation reste grisé.",
          },
          {
            title: "Renseignez la facture (recommandé)",
            body: "Dépliez « Données d'achat (606) » : fournisseur, RNC, NCF, date de facture. La case « Prix avec ITBIS inclus » est cochée par défaut. Ces informations alimentent le registre des achats remis aux impôts.",
          },
          {
            title: "Vérifiez puis validez",
            body: "Le coût total et le nombre d'unités s'affichent en bas. Relisez bien les chiffres : une fois enregistrée, la réception ne peut plus être supprimée depuis le panneau. Cliquez « Enregistrer l'entrée ».",
          },
        ],
      },
      {
        title: "Déclarer des produits périmés ou abîmés (perte)",
        steps: [
          {
            title: "Trouvez la ligne du produit",
            body: "Avec la recherche ou les onglets, puis cliquez l'icône de colis marqué d'un moins : le tiroir « Enregistrer une perte / produit périmé » s'ouvre.",
          },
          {
            title: "Saisissez quantité et motif",
            body: "Choisissez le motif (Périmé, Abîmé, Vol / perte, Ajustement d'inventaire) et ajoutez une note interne si utile, par exemple le numéro de lot.",
          },
          {
            title: "Vérifiez le « Coût de la perte »",
            body: "Le tiroir affiche le montant qui partira en charge : coût moyen × quantité. S'il indique « Coût inconnu », le stock baissera mais AUCUNE charge n'ira dans la comptabilité.",
          },
          {
            title: "Validez",
            body: "Cliquez « Enregistrer la perte » : les unités sortent du stock et la charge apparaît automatiquement dans l'écran Comptabilité, datée du jour.",
          },
        ],
      },
      {
        title: "Initialiser un produit pour le lancement",
        steps: [
          {
            title: "Ouvrez le tiroir d'initialisation",
            body: "Cliquez l'icône presse-papiers sur la ligne du produit. Le tiroir rappelle son stock et son prix actuels — un badge « placeholder » signale le prix provisoire de 100 pesos hérité de l'import du catalogue.",
          },
          {
            title: "Comptez les unités en rayon",
            body: "Saisissez la quantité réellement comptée. Attention : le formulaire accepte 0 — si vous validez avec 0 et sans coût, le stock du produit sera fixé à 0.",
          },
          {
            title: "Ajoutez le coût d'achat si vous l'avez",
            body: "Facture sous la main ? Saisissez le coût par unité : l'opération sera traitée comme une réception et la marge sera connue dès la première vente. Sinon, laissez vide : le stock sera simplement fixé au chiffre compté.",
          },
          {
            title: "Posez le vrai prix de vente",
            body: "Si le prix actuel est le prix provisoire, saisissez le vrai prix : il remplacera celui affiché sur le site (visible en une minute environ).",
          },
          {
            title: "Décidez de la mise en ligne, puis validez",
            body: "La case « Activer le produit » est cochée par défaut — décochez-la si le produit n'est pas prêt à être vendu. Le panneau du bas récapitule le mode retenu (réception ou ajustement) et le stock final avant de cliquer « Initialiser ».",
          },
        ],
      },
    ],
    actions: [
      {
        label: "« Entrée de stock » → « Enregistrer l'entrée » (réception de marchandise)",
        where: "Bouton en haut à droite de l'écran, ou icône « + » sur une ligne (produit pré-rempli), puis bouton en bas du tiroir",
        does: "Enregistre l'arrivée d'une livraison fournisseur : les unités s'AJOUTENT au stock et le coût d'achat est mémorisé.",
        effects: [
          "Chaque ligne (produit, quantité, coût payé par unité) s'ajoute au stock existant — rien n'est écrasé.",
          "Le coût moyen pondéré du produit est recalculé : l'ancien stock à l'ancien coût et les unités reçues au nouveau coût sont moyennés ensemble. S'il n'y avait pas encore de coût (ou plus de stock), le coût de la livraison devient le coût moyen.",
          "Chaque ligne est inscrite définitivement à l'historique des achats, qui alimente le registre 606 remis aux impôts — avec fournisseur, RNC, NCF et date de facture si vous avez rempli la section « Données d'achat (606) ». Une réception = une facture.",
          "Avec la case « Prix avec ITBIS inclus » cochée (par défaut), la comptabilité saura séparer la taxe du prix payé dans l'export des achats ; décochez-la pour un produit exonéré.",
          "Le bouton reste grisé tant que chaque ligne n'a pas une quantité d'au moins 1 ET un coût supérieur à 0 (un coût à 0 fausserait le coût moyen).",
          "Une fois validée, la réception ne peut plus être supprimée ni modifiée depuis le panneau : on peut corriger le chiffre de stock après coup par un ajustement, mais le coût moyen recalculé et la ligne du registre des achats restent.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "La disponibilité affichée des produits (en stock / stock bas / rupture) remonte sur le site en une minute environ.",
        accountingImpact: "Alimente le registre des achats (606) du mois et la valeur de l'inventaire ; fixe le coût moyen qui sert à calculer les marges.",
      },
      {
        label: "Crayon → « Enregistrer » (ajuster l'inventaire)",
        where: "Icône crayon sur une ligne du tableau, puis fenêtre « Ajuster l'inventaire »",
        does: "Remplace le chiffre de stock par la quantité exacte que vous saisissez (comptage, correction d'erreur).",
        effects: [
          "Le chiffre saisi ÉCRASE l'ancien : si le produit affichait 12 unités et que vous tapez 8, il en a 8 — pas 20. C'est l'inverse de la réception, qui additionne.",
          "Aucun coût n'est enregistré et la comptabilité ne voit rien passer : ni achat au registre 606, ni charge, ni recalcul du coût moyen.",
          "À utiliser uniquement pour faire coller le chiffre à la réalité du rayon. Jamais pour saisir une livraison (la comptabilité resterait aveugle sur ces unités) ni pour déclarer du périmé (utilisez la perte, qui crée la charge correspondante).",
        ],
        severity: "caution",
        undo: "Rouvrez la fenêtre et ressaisissez l'ancien chiffre.",
        audited: true,
        publicImpact: "La disponibilité affichée du produit change sur le site en une minute environ ; à 0, les clients ne peuvent plus le réserver.",
      },
      {
        label: "« Enregistrer une perte » (merma : périmé, abîmé, volé)",
        where: "Icône de colis marqué d'un moins sur une ligne, puis tiroir « Enregistrer une perte / produit périmé »",
        does: "Sort des unités du stock ET enregistre automatiquement la perte en charge dans la comptabilité, au coût moyen.",
        effects: [
          "Le stock du produit baisse de la quantité saisie (jamais en dessous de 0).",
          "Si le coût moyen du produit est connu, une charge « Mermas y pérdidas » est créée automatiquement dans la comptabilité, datée du jour : coût moyen × quantité. Le tiroir affiche ce montant avant validation.",
          "Si le coût est inconnu (aucune réception n'a jamais enregistré de coût), le stock baisse quand même mais AUCUNE charge n'est créée — le résultat du mois ne verra pas cette perte.",
          "La perte est consignée dans un registre interne des pertes, avec le coût figé du moment, le motif choisi (Périmé, Abîmé, Vol / perte, Ajustement d'inventaire) et votre note.",
          "Elle ne touche ni le coût moyen ni le registre des achats : c'est une sortie, pas un achat.",
          "Attention : la charge est calculée sur la quantité saisie, même si elle dépasse le stock affiché — le stock s'arrête à 0, mais la charge compte toutes les unités déclarées.",
        ],
        severity: "caution",
        undo: "Partiellement : remontez le stock via « Ajuster l'inventaire » et supprimez la charge correspondante dans l'écran Comptabilité (corbeille de la liste des charges). La ligne du registre interne des pertes, elle, reste.",
        audited: true,
        publicImpact: "La disponibilité affichée du produit baisse sur le site ; à 0, il passe en rupture et n'est plus réservable.",
        accountingImpact: "Crée une charge « Mermas y pérdidas » au coût moyen dans le résultat du mois (sauf coût inconnu : aucune charge).",
      },
      {
        label: "« Initialiser ce produit » → « Initialiser »",
        where: "Icône presse-papiers sur une ligne, puis tiroir « Initialiser le produit »",
        does: "Prépare un produit pour le lancement en une seule fois : stock compté, coût d'achat éventuel, prix de vente, et mise en ligne.",
        effects: [
          "Aucun champ n'est bloquant : le bouton « Initialiser » s'allume dès qu'il y a au moins une action utile (quantité comptée, prix saisi ou case « Activer le produit » cochée). Le coût d'achat, le prix de vente et l'activation sont optionnels.",
          "AVEC un coût d'achat : l'opération est traitée comme une RÉCEPTION — la quantité s'AJOUTE au stock actuel, le coût moyen est enregistré (marge connue dès la première vente) et une ligne entre à l'historique des achats (sans facture fournisseur).",
          "SANS coût : l'opération est traitée comme un AJUSTEMENT — le stock est FIXÉ à la quantité comptée (y compris 0), sans rien pour la comptabilité ; la marge ne sera connue qu'au premier réapprovisionnement. Le panneau du bas affiche le mode retenu et le stock résultant AVANT validation.",
          "Cas particulier : coût renseigné mais quantité 0 — rien ne bouge côté stock.",
          "Prix de vente : remplace le prix affiché sur le site (répercuté en une minute environ). Le champ est pré-rempli avec le prix actuel, sauf s'il s'agit du prix provisoire de 100 pesos (signalé par un badge « placeholder »).",
          "Case « Activer le produit » (cochée par défaut) : rend le produit visible et réservable sur le site public. Une fois en ligne, aucun bouton ne permet de le re-cacher.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "Peut changer le prix affiché et mettre le produit en ligne sur le site public (visible en une minute environ).",
        accountingImpact: "Si un coût est saisi, l'opération entre à l'historique des achats (606) et fixe le coût moyen du produit.",
      },
    ],
    flows: [
      {
        title: "L'état du stock tel qu'affiché (tuiles, onglets, pastilles)",
        lanes: [
          [
            {
              label: "Normal",
              tone: "ok",
              note: "Au-dessus du seuil de stock faible.",
            },
            {
              label: "Stock bas",
              tone: "warn",
              note: "Au seuil de stock faible ou moins — la ligne se teinte en jaune. Pensez au réapprovisionnement.",
            },
            {
              label: "Rupture",
              tone: "bad",
              note: "0 unité — les clients ne peuvent plus réserver le produit.",
            },
          ],
        ],
      },
      {
        title: "Entrées et sorties d'unités",
        lanes: [
          [
            {
              label: "Réception fournisseur",
              tone: "neutral",
              note: "Les unités s'ajoutent, le coût moyen est recalculé, l'achat entre au registre 606.",
            },
            {
              label: "En stock",
              tone: "ok",
              note: "Visible et réservable sur le site public.",
            },
            {
              label: "Vente retirée",
              tone: "ok",
              note: "Le stock baisse au moment du retrait en pharmacie ; le coût du moment est figé sur la vente pour calculer sa marge.",
            },
          ],
          [
            {
              label: "En stock",
              tone: "neutral",
              note: "Produit en rayon.",
            },
            {
              label: "Perte déclarée",
              tone: "warn",
              note: "Périmé, abîmé, volé : les unités sortent immédiatement du stock.",
            },
            {
              label: "Charge en comptabilité",
              tone: "bad",
              note: "« Mermas y pérdidas » au coût moyen × quantité, datée du jour.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Réception ≠ ajustement, c'est LA distinction de l'écran : la réception ADDITIONNE les unités et enregistre un coût (comptabilité alimentée) ; l'ajustement ÉCRASE le chiffre et n'enregistre rien. Ne saisissez jamais une livraison via l'ajustement : ces unités resteraient invisibles pour les marges et le registre des achats.",
      "Une réception validée ne peut plus être supprimée ni corrigée depuis le panneau : relisez quantités et coûts AVANT de cliquer « Enregistrer l'entrée ». En cas d'erreur, seul le chiffre de stock se rattrape par un ajustement — le coût moyen et la ligne du registre des achats restent.",
      "L'ajustement ne touche jamais le coût moyen : si vous corrigez de grosses quantités à la main, la valeur d'inventaire et les marges peuvent s'éloigner de la réalité. Préférez les réceptions pour tout ce qui est un vrai achat.",
      "Perte : la charge est valorisée sur la quantité saisie, même au-delà du stock affiché (le stock s'arrête à 0, la charge compte tout). Vérifiez la quantité avant de valider.",
      "Perte d'un produit sans coût connu : le stock baisse mais aucune charge n'est créée — la perte n'apparaîtra pas dans le résultat du mois. Le tiroir le signale par « Coût inconnu ».",
      "Dans le tiroir d'initialisation, la case « Activer le produit » est COCHÉE par défaut : décochez-la si le produit n'est pas prêt à être vendu, car une fois en ligne, aucun bouton ne permet de le re-cacher.",
      "Le chiffre de stock ne bouge pas quand un client réserve : il baisse seulement quand la réservation est marquée « retirée » en pharmacie (écran Réservations).",
      "Le coût saisi à la réception est le prix payé au fournisseur PAR UNITÉ, taxes comprises par défaut (case « Prix avec ITBIS inclus ») — pas le prix de vente.",
      "Les colonnes Coût et Marge ne sont visibles que dans le panneau d'administration, jamais sur le site public. Une marge en rouge signifie que le produit est vendu moins cher que son coût d'achat.",
      "La recherche de la liste est sensible aux accents (« creme » ne trouve pas « crème »). Le seuil « Stock bas » se règle dans Boutique & réservation → Inventaire (10 par défaut, minimum 2).",
    ],
  },
]
