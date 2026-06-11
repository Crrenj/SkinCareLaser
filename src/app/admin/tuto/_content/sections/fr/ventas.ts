import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "ventas",
    navLabel: "Ventes",
    title: "Ventes — le journal des ventes et la vente comptoir",
    route: "/admin/ventas",
    intro:
      "Cet écran est le journal de tout ce qui a été réellement vendu et remis au client, quelle que soit l'origine : réservation passée sur le site (avec compte ou en invité) puis remise en pharmacie, ou vente directe au comptoir. En haut, quatre cartes donnent le chiffre d'affaires du jour, celui du mois, le nombre de ventes du mois et le panier moyen. C'est aussi ici que vous enregistrez une vente comptoir avec le bouton « Vente comptoir » : le client repart immédiatement avec la marchandise, le stock baisse à la validation et la vente entre aussitôt dans le chiffre d'affaires. Chaque ligne porte sa date de retrait ; les ventes comptoir et les ventes d'un visiteur sans compte portent en plus une pastille d'origine (« Comptoir », « Anonyme (web) ») — une ligne sans pastille est celle d'un client à compte.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin › Opérations › Ventes" },
            { w: 4, kind: "button", label: "+ Vente comptoir", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "CA aujourd'hui", hotspot: 2 },
            { w: 3, kind: "kpi", label: "CA ce mois" },
            { w: 3, kind: "kpi", label: "Ventes ce mois" },
            { w: 3, kind: "kpi", label: "Panier moyen" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "toolbar", label: "Rechercher une vente…", hotspot: 3 },
            { w: 4, kind: "tabs", label: "Toutes · Comptoir · Compte · Invité", hotspot: 4 },
            { w: 3, kind: "input", label: "Trier par" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "X sélectionnées · Rappel WhatsApp · Annuler", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Référence · Client · Articles · Total · Statut · Date · Actions", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "text", label: "Pagination (25 par page)" },
            { w: 8, kind: "drawer", label: "Tiroir : détail de la vente · note · annulation", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Vente comptoir",
        desc: "Ouvre le tiroir de vente : identité du client (compte existant, création de compte express, ou anonyme), produits, note interne, puis « Enregistrer la vente ».",
      },
      {
        n: 2,
        label: "Cartes de chiffre d'affaires",
        desc: "CA du jour, CA du mois, nombre de ventes du mois et panier moyen — calculés sur la date de retrait de chaque vente. Une vente annulée en sort immédiatement.",
      },
      {
        n: 3,
        label: "Recherche",
        desc: "Filtre le journal par référence (FAR-…), nom, téléphone ou email du client, au sein de l'onglet d'origine en cours.",
      },
      {
        n: 4,
        label: "Onglets d'origine",
        desc: "Toutes les lignes ici sont des ventes remises : les onglets filtrent donc par origine — Comptoir (enregistrée par vous), Compte (client connecté sur le site), Invité (visiteur du site sans compte). Chaque onglet affiche son compteur.",
      },
      {
        n: 5,
        label: "Barre d'actions par lot",
        desc: "Apparaît dès qu'au moins une ligne est cochée : rappel WhatsApp groupé (un onglet par client ayant un téléphone) et annulation groupée des ventes cochées.",
      },
      {
        n: 6,
        label: "Le journal",
        desc: "Une ligne par vente : référence, client (nom, téléphone, et une pastille « Comptoir » ou « Anonyme (web) » quand la vente n'est pas liée à un compte), nombre d'articles, total en pesos, statut « Remise » et la date de retrait dans la colonne Date. Cliquer la ligne ouvre le tiroir de détail.",
      },
      {
        n: 7,
        label: "Le tiroir de détail",
        desc: "Coordonnées du client, liste des produits avec leurs prix (verrouillés : la vente est déjà comptabilisée), total, note interne à enregistrement automatique, bouton WhatsApp et lien d'annulation en bas.",
      },
    ],
    workflows: [
      {
        title: "Encaisser une vente au comptoir",
        steps: [
          {
            title: "Cliquez « Vente comptoir »",
            body: "Le tiroir de vente s'ouvre. Par défaut le client est « Anonyme » : parfait pour une vente rapide sans suivi.",
          },
          {
            title: "Choisissez l'identité du client (facultatif)",
            body: "Trois voies : « Compte existant » (retrouvez-le par nom ou téléphone — la vente entrera dans son historique), « Créer un compte » (prénom + téléphone, le client finalisera par WhatsApp), ou « Anonyme ».",
          },
          {
            title: "Ajoutez les produits",
            body: "Tapez au moins deux lettres et cliquez le produit : il s'ajoute au prix actuel (promotions comprises). Ajustez prix et quantité ligne par ligne si besoin, ou ajoutez une « Ligne libre » pour un article hors catalogue.",
          },
          {
            title: "Validez avec « Enregistrer la vente »",
            body: "La vente est immédiatement comptée comme remise : le stock baisse tout de suite, le coût est figé pour la marge, et la vente entre dans le chiffre d'affaires du jour. Le bouton reste grisé tant qu'il n'y a pas au moins un produit.",
          },
        ],
      },
      {
        title: "Créer un compte express pour un client de passage",
        steps: [
          {
            title: "Dans le tiroir de vente, choisissez « Créer un compte »",
            body: "Saisissez le prénom et le téléphone (le nom est facultatif). C'est tout ce qu'il faut au comptoir — pas d'email ni de mot de passe à inventer.",
          },
          {
            title: "Enregistrez la vente",
            body: "Le compte est créé au moment de la validation, puis la vente y est rattachée : elle apparaîtra dans l'historique du client sur le site.",
          },
          {
            title: "Transmettez le lien de configuration",
            body: "Une fenêtre « Compte créé » s'affiche avec deux options : « Envoyer par WhatsApp » (message pré-rédigé avec le lien) ou « Copier le lien ». C'est la seule occasion de récupérer ce lien — ne fermez pas la fenêtre sans l'avoir transmis.",
          },
          {
            title: "Le client finalise chez lui",
            body: "En ouvrant le lien, il est connecté à son compte et choisit son mot de passe et sa vraie adresse email. Il retrouve alors son historique d'achats et peut réserver sur le site.",
          },
        ],
      },
      {
        title: "Annuler une vente enregistrée par erreur",
        steps: [
          {
            title: "Retrouvez la vente",
            body: "Utilisez la recherche (référence, nom, téléphone) ou les onglets d'origine, puis cliquez la ligne pour ouvrir le tiroir de détail.",
          },
          {
            title: "Cliquez le lien d'annulation en bas du tiroir",
            body: "Une fenêtre de confirmation rappelle les conséquences : le stock sera restauré et la ligne quittera le journal.",
          },
          {
            title: "Confirmez « Annuler la vente »",
            body: "Le stock des produits est automatiquement re-crédité et la vente sort du chiffre d'affaires. La ligne reste consultable dans l'écran Réservations, onglet « Annulées ».",
          },
          {
            title: "Ré-enregistrez si nécessaire",
            body: "Une annulation est définitive : si c'était une erreur de saisie (mauvais prix, mauvais produit), refaites simplement une « Vente comptoir » correcte.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "« Vente comptoir » → « Enregistrer la vente »",
        where: "Bouton en haut à droite de l'écran, puis bouton en bas du tiroir de vente",
        does: "Enregistre une vente immédiate : le client paie et repart avec la marchandise, tout est comptabilisé sur-le-champ.",
        effects: [
          "La vente naît directement au statut « Remise », avec la pastille d'origine « Comptoir » et la date de retrait du moment — elle apparaît aussitôt dans le journal.",
          "Le stock de chaque produit du catalogue baisse immédiatement de la quantité vendue (jamais en dessous de 0 ; les « lignes libres » et les produits à stock illimité ne sont pas touchés).",
          "Le coût d'achat moyen du moment est figé sur chaque ligne pour calculer la marge de cette vente — il ne changera plus ensuite.",
          "Les prix saisis dans le tiroir sont enregistrés tels quels et deviennent définitifs : aucun ajustement de prix possible après validation.",
          "Si vous avez choisi « Compte existant » ou « Créer un compte », la vente est rattachée au compte du client et entre dans son historique sur le site.",
          "Le bouton reste grisé tant qu'il n'y a pas au moins un produit valide ; en mode vente, l'identité « Anonyme » suffit.",
        ],
        severity: "caution",
        undo: "Annulez la vente depuis le journal : le stock est re-crédité et elle sort du chiffre d'affaires (la ligne annulée reste visible dans Réservations › Annulées).",
        audited: true,
        publicImpact: "La disponibilité affichée des produits baisse sur le site ; si la vente est liée à un compte, le client la voit dans son historique d'achats (onglet « Achats » de son compte).",
        accountingImpact: "Entre immédiatement dans le chiffre d'affaires du jour et du mois (cartes du haut et écran Comptabilité), avec la marge calculée sur le coût figé.",
      },
      {
        label: "« Créer un compte » (volet Client du tiroir de vente)",
        where: "Tiroir de vente, section Client — deuxième onglet, champs prénom / nom / téléphone",
        does: "Crée un vrai compte client à partir d'un simple prénom et téléphone, au moment où vous validez la vente.",
        effects: [
          "Le compte est créé AVANT l'enregistrement de la vente : si la vente échoue ensuite, le compte existe quand même.",
          "Une adresse email provisoire interne et un mot de passe aléatoire sont posés automatiquement — le client les remplacera lui-même via le lien de configuration.",
          "Le profil du client est rempli avec son prénom, son nom, son téléphone et la langue en cours.",
          "Un lien de configuration est généré et présenté dans la fenêtre « Compte créé », à transmettre au client (WhatsApp ou copie).",
          "Si le téléphone correspond déjà à un compte, aucun doublon n'est créé : la vente est rattachée au compte existant et aucun lien n'est généré.",
          "Le téléphone du client n'est pas inscrit dans le journal d'audit (donnée personnelle) — seuls le prénom et le nom y figurent.",
        ],
        severity: "caution",
        audited: true,
      },
      {
        label: "« Envoyer par WhatsApp » / « Copier le lien » (fenêtre « Compte créé »)",
        where: "Fenêtre qui s'affiche juste après l'enregistrement d'une vente avec création de compte",
        does: "Transmet au client le lien grâce auquel il choisira son mot de passe et son email.",
        effects: [
          "« Envoyer par WhatsApp » ouvre WhatsApp vers le numéro saisi, avec un message déjà rédigé contenant le lien ; « Copier le lien » le met dans le presse-papiers.",
          "Rien n'est enregistré dans la base de données : c'est à vous d'envoyer effectivement le message.",
          "Le lien connecte directement au compte du client : ne le transmettez qu'à lui.",
          "Une fois la fenêtre fermée, le lien n'est plus récupérable nulle part dans le panneau — transmettez-le avant de fermer.",
        ],
        severity: "safe",
      },
      {
        label: "« Annuler la réservation » (tiroir) / « Annuler » (lot)",
        where: "Lien souligné en bas du tiroir de détail, ou barre d'actions par lot — la fenêtre de confirmation s'intitule « Annuler la vente »",
        does: "Annule définitivement une vente remise (erreur de saisie, retour immédiat).",
        effects: [
          "Le statut passe à « Annulée » : la ligne quitte le journal des ventes et reste consultable dans l'écran Réservations, onglet « Annulées ».",
          "Le stock des produits du catalogue est automatiquement re-crédité des quantités vendues (les lignes libres ne sont pas concernées).",
          "La vente sort du chiffre d'affaires : les cartes du haut et l'écran Comptabilité ne la comptent plus.",
          "C'est définitif : aucun bouton ne permet de ré-enregistrer une vente annulée — refaites une « Vente comptoir » si besoin.",
          "En lot, chaque vente cochée est annulée l'une après l'autre, après une seule confirmation.",
          "Le client n'est PAS prévenu automatiquement.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "La disponibilité des produits remonte sur le site ; le client à compte voit « Annulée » dans son espace.",
        accountingImpact: "Retire la vente du chiffre d'affaires et de la marge du mois.",
      },
      {
        label: "Note interne (zone de texte du tiroir)",
        where: "Tiroir de détail, section « Note interne · équipe FARMAU uniquement »",
        does: "Mémorise une consigne pour l'équipe sur cette vente (ex. « Payé en espèces, demande une facture »).",
        effects: [
          "L'enregistrement est automatique : environ une seconde après votre dernière frappe, la mention « Enregistré » s'affiche.",
          "La note n'est jamais visible par le client — ni sur le site, ni dans les messages WhatsApp.",
        ],
        severity: "safe",
        undo: "Modifiez ou effacez le texte : il se ré-enregistre tout seul.",
        audited: true,
      },
      {
        label: "« Ouvrir WhatsApp » / « Rappel WhatsApp » (lot)",
        where: "Bouton vert d'une ligne, du tiroir, ou de la barre d'actions par lot",
        does: "Ouvre WhatsApp vers le client avec un message déjà rédigé : référence, liste des produits et total.",
        effects: [
          "N'enregistre rien : la vente ne change pas — utile pour un suivi après l'achat.",
          "Le bouton n'apparaît que si la vente a un numéro de téléphone (une vente anonyme n'en a pas).",
          "En lot, un onglet WhatsApp s'ouvre pour CHAQUE vente cochée ayant un téléphone — autorisez les fenêtres surgissantes si rien ne s'ouvre.",
        ],
        severity: "safe",
      },
    ],
    flows: [
      {
        title: "D'où viennent les lignes du journal — et comment elles en sortent",
        lanes: [
          [
            {
              label: "Vente comptoir",
              tone: "neutral",
              note: "Vous l'enregistrez ici : elle naît déjà remise, le stock baisse à la validation.",
            },
            {
              label: "Au journal",
              tone: "ok",
              note: "Comptée dans le CA du jour et du mois, marge figée au coût du moment.",
            },
          ],
          [
            {
              label: "Réservation (site ou manuelle)",
              tone: "neutral",
              note: "Gérée dans l'écran Réservations : contact WhatsApp, confirmation…",
            },
            {
              label: "Marquée « Remise »",
              tone: "neutral",
              note: "Le client est passé payer : stock décrémenté, coût figé.",
            },
            {
              label: "Au journal",
              tone: "ok",
              note: "La ligne quitte l'écran Réservations et rejoint ce journal, à sa date de retrait.",
            },
          ],
          [
            {
              label: "Au journal",
              tone: "ok",
              note: "Vente comptabilisée…",
            },
            {
              label: "Annulée",
              tone: "warn",
              note: "Stock re-crédité automatiquement, vente retirée du CA. La ligne part dans Réservations › Annulées — définitif.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Cet écran ne montre QUE les ventes remises. Les réservations en attente, confirmées, expirées ou annulées vivent dans l'écran Réservations.",
      "Une vente comptoir décrémente le stock immédiatement, contrairement à une réservation (qui ne le décrémente qu'à la remise). Vérifiez bien le tiroir avant de valider.",
      "Les prix d'une vente sont définitifs dès la validation : le crayon d'ajustement n'apparaît pas dans le tiroir (il n'existe que sur l'écran Réservations, tant que la commande n'est pas remise). Pour corriger un prix, annulez la vente et ré-enregistrez-la.",
      "Le prix proposé à l'ajout d'un produit est le prix actuel du site, promotions comprises — modifiable ligne par ligne AVANT de valider seulement.",
      "Les « lignes libres » (articles hors catalogue) comptent dans le total et le chiffre d'affaires, mais ne touchent jamais le stock et n'ont pas de coût pour la marge.",
      "Le compte express est créé avant la vente : si l'enregistrement de la vente échoue ensuite, le compte existe quand même. Si le téléphone est déjà connu, le compte existant est réutilisé sans créer de doublon.",
      "La fenêtre « Compte créé » est l'unique occasion de transmettre le lien de configuration : fermée sans envoi ni copie, le lien est perdu (le compte existe mais le client ne pourra pas y accéder seul).",
      "Le lien de configuration connecte directement au compte du client : ne l'envoyez qu'au client concerné, jamais à un tiers.",
      "Annuler une vente est définitif et ne prévient pas le client ; la ligne annulée reste consultable dans Réservations › Annulées, avec votre nom au journal d'audit.",
      "Les cartes de chiffre d'affaires se basent sur la date de retrait : une vente remise le mois dernier ne compte pas dans « CA ce mois », même si elle est encore listée plus bas.",
      "Une vente anonyme n'a ni nom ni téléphone : pas de bouton WhatsApp, et elle n'est identifiable que par sa référence FAR-…. Notez la référence si le client veut un suivi.",
      "Le lien d'annulation en bas du tiroir s'intitule « Annuler la réservation » (libellé partagé avec l'écran Réservations), mais la confirmation parle bien d'« Annuler la vente » : c'est la même action.",
    ],
  },
]
