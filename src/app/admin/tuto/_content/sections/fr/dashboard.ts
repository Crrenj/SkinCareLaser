import type { TutoSection } from "../../types"

export const sections: TutoSection[] = [
  {
    id: "dashboard",
    navLabel: "Tableau de bord",
    title: "Vue d'ensemble — le tableau de bord",
    route: "/admin",
    intro:
      "C'est la page d'accueil de l'administration : vous y arrivez juste après la connexion. Elle montre toute la pharmacie d'un coup d'œil — réservations, revenus, stock, catalogue, clients, messages — sans rien modifier. Tout y est en lecture seule : cliquer sur une tuile ou une carte vous emmène simplement vers la page concernée. Les chiffres sont calculés au moment où la page s'affiche.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Vue d'ensemble · date du jour", hotspot: 1 },
            { w: 2, kind: "button", label: "+ Produit" },
            { w: 2, kind: "button", label: "Rechercher" },
          ],
        },
        {
          blocks: [
            { w: 2, kind: "kpi", label: "Produits", hotspot: 2 },
            { w: 2, kind: "kpi", label: "Réservations" },
            { w: 2, kind: "kpi", label: "Stock !", hotspot: 3 },
            { w: 2, kind: "kpi", label: "Messages !" },
            { w: 2, kind: "kpi", label: "Clients" },
            { w: 2, kind: "kpi", label: "Paniers" },
          ],
        },
        {
          blocks: [
            { w: 8, kind: "panel", label: "01 · Réservations — graphique 7 jours", hotspot: 4 },
            { w: 4, kind: "panel", label: "Par statut", hotspot: 5 },
          ],
        },
        {
          blocks: [{ w: 12, kind: "table", label: "Réservations récentes", hotspot: 6 }],
        },
        {
          blocks: [
            { w: 7, kind: "panel", label: "02 · Préparation du catalogue", hotspot: 7 },
            { w: 5, kind: "panel", label: "Inventaire", hotspot: 8 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "panel", label: "Répartition par marque" },
            { w: 4, kind: "panel", label: "Top produits" },
            { w: 4, kind: "panel", label: "Stock critique" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "panel", label: "03 · Clients", hotspot: 9 },
            { w: 4, kind: "panel", label: "Activité" },
            { w: 4, kind: "panel", label: "Contenu" },
          ],
        },
        {
          blocks: [{ w: 12, kind: "table", label: "Messages récents" }],
        },
        {
          blocks: [{ w: 12, kind: "table", label: "Accès rapides (13 raccourcis)", hotspot: 10 }],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "En-tête",
        desc: "Fil d'ariane « Admin / Vue d'ensemble », titre avec la date du jour, et deux boutons à droite : « Ajouter un produit » et « Rechercher ». Tous deux mènent à la page Produits ; le formulaire de création ne s'ouvre pas tout seul, cliquez le bouton « Ajouter un produit » de la page Produits une fois sur place.",
      },
      {
        n: 2,
        label: "Bande de 6 tuiles",
        desc: "Le pouls de la pharmacie : produits actifs (avec le nombre de marques et de gammes), réservations actives (en attente + confirmées, avec le total confirmé en DOP), stock critique, messages non lus, clients inscrits (avec les nouveaux de la semaine) et paniers en cours. Chaque tuile, sauf « Paniers », est cliquable et mène à la page concernée.",
      },
      {
        n: 3,
        label: "Anneau d'alerte",
        desc: "Quand quelque chose demande une action, le contour de la tuile prend une couleur d'alerte rougeâtre. Deux tuiles peuvent s'allumer : « Stock critique » (au moins un produit actif sous 5 unités, épuisés compris) et « Messages non lus » (au moins un message ouvert).",
      },
      {
        n: 4,
        label: "Graphique des réservations (7 jours)",
        desc: "Deux courbes : « Réservé » = total de toutes les réservations créées chaque jour (sauf les annulées) ; « Confirmé » = la part de ces réservations aujourd'hui confirmées ou retirées. Les flèches comparent à la semaine précédente, et le taux de conversion indique la part du réservé qui se concrétise.",
      },
      {
        n: 5,
        label: "Réservations par statut",
        desc: "Les 5 statuts (en attente, confirmée, retirée, expirée, annulée) avec leur nombre et leur montant. Au-dessus : le revenu confirmé (réservations confirmées + retirées) et le panier moyen — attention, ces deux chiffres couvrent TOUTES les réservations depuis l'ouverture, pas seulement la semaine.",
      },
      {
        n: 6,
        label: "Réservations récentes",
        desc: "Les 5 dernières réservations : référence, nom du client, origine (compte, web sans compte, ou comptoir), statut et montant. Cliquer une ligne ouvre la page Réservations — la réservation n'y est pas présélectionnée, retrouvez-la par sa référence. Les réservations déjà retirées se consultent dans la page Ventes.",
      },
      {
        n: 7,
        label: "Préparation du catalogue",
        desc: "Un score moyen de complétude des fiches produit, suivi de 7 barres : image, prix configuré, volume, bénéfices, conseil du pharmacien, liste d'ingrédients et fiche technique PDF. Vert = bien couvert, rouge = presque vide. Sous cette carte se trouvent aussi la répartition par marque, le top produits des 30 derniers jours et la liste du stock critique.",
      },
      {
        n: 8,
        label: "Inventaire",
        desc: "Unités totales en stock, valeur du stock au prix de vente, et répartition des produits : en stock (5 unités ou plus), stock bas (1 à 4) et épuisé (0). Un avertissement orange signale les produits encore au prix provisoire de 100 DOP, jamais configuré.",
      },
      {
        n: 9,
        label: "Clients et activité",
        desc: "Trois cartes : Clients (total des comptes, nouveaux sur 7 et 30 jours, part avec téléphone, langue préférée), Activité (paniers contenant des articles, favoris, inscrits à la newsletter et confirmés) et Contenu (articles de blog publiés, bannières actives, étiquettes). Plus bas : les 5 derniers messages reçus.",
      },
      {
        n: 10,
        label: "Accès rapides",
        desc: "13 raccourcis vers les principales sections de l'administration (certaines pages, comme Comptabilité, Promotions ou Ventes, n'y figurent pas : passez par le menu de gauche). Le premier, « Añadir producto », mène à la page Produits ; le formulaire de création s'ouvre depuis le bouton de cette page.",
      },
    ],
    workflows: [
      {
        title: "Faire le point en début de journée",
        steps: [
          {
            title: "Ouvrir la Vue d'ensemble",
            body: "C'est la page sur laquelle vous arrivez après la connexion. Laissez-la se charger entièrement : tous les chiffres sont calculés à cet instant.",
          },
          {
            title: "Lire la bande de tuiles",
            body: "Repérez d'abord les tuiles au contour rougeâtre : elles signalent du stock critique ou des messages non lus à traiter.",
          },
          {
            title: "Traiter le stock critique",
            body: "Cliquez sur la tuile « Stock crítico » pour ouvrir la page Stock et réapprovisionner ou désactiver les produits concernés.",
          },
          {
            title: "Parcourir les réservations récentes",
            body: "Vérifiez qu'aucune réservation en attente ne traîne : elles expirent automatiquement après 24 heures sans action.",
          },
          {
            title: "Répondre aux messages",
            body: "Cliquez sur la tuile « Mensajes sin leer » ou sur un message en bas de page pour ouvrir la boîte de réception (menu « Tickets »).",
          },
        ],
      },
      {
        title: "Vérifier la santé du catalogue",
        steps: [
          {
            title: "Lire le score de préparation",
            body: "Le grand pourcentage de la carte « Preparación del catálogo » indique la complétude moyenne des fiches produit. Plus il est vert, plus le catalogue est présentable.",
          },
          {
            title: "Identifier ce qui manque",
            body: "Chaque barre montre combien de fiches ont une image, un prix configuré, un volume, des bénéfices, un conseil, des ingrédients ou une fiche PDF.",
          },
          {
            title: "Surveiller les prix provisoires",
            body: "L'encart orange de la carte « Inventario » compte les produits encore à 100 DOP : ce prix d'attente s'affiche tel quel sur le site public tant qu'il n'est pas remplacé.",
          },
          {
            title: "Compléter les fiches",
            body: "Ouvrez la page Produits (bouton « Rechercher » ou tuile « Productos activos ») et complétez les fiches une par une.",
          },
        ],
      },
      {
        title: "Suivre les ventes de la semaine",
        steps: [
          {
            title: "Comparer Réservé et Confirmé",
            body: "Sur le graphique, l'écart entre les deux courbes montre les réservations qui n'aboutissent pas encore.",
          },
          {
            title: "Regarder les flèches de tendance",
            body: "Flèche verte vers le haut : mieux que la semaine précédente. Flèche rouge vers le bas : moins bien.",
          },
          {
            title: "Identifier les produits qui marchent",
            body: "La carte « Top productos » classe les 4 produits les plus retirés sur 30 jours, en unités et en DOP.",
          },
          {
            title: "Ouvrir le détail",
            body: "Les liens « Ver detalle » et « Ver todas » mènent à la page Réservations pour agir sur chaque dossier.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Ajouter un produit",
        where: "En-tête de la page, à droite du titre",
        does: "Vous emmène sur la page Produits, où vous pourrez créer le produit.",
        effects: [
          "Vous quittez le tableau de bord pour la page Produits.",
          "Le formulaire de création ne s'ouvre pas tout seul : cliquez le bouton « Ajouter un produit » de la page Produits.",
          "Rien n'est enregistré tant que vous ne validez pas ce formulaire.",
        ],
        severity: "safe",
        undo: "Revenez en arrière ou ouvrez une autre page : aucune donnée n'est créée.",
      },
    ],
    flows: [
      {
        title: "Les statuts de réservation tels qu'affichés sur le tableau",
        lanes: [
          [
            {
              label: "En attente (« Reservada »)",
              tone: "neutral",
              note: "Le client vient de réserver. Sans action de votre part, la réservation expire toute seule après 24 heures.",
            },
            {
              label: "Confirmée (« Confirmada »)",
              tone: "neutral",
              note: "Vous avez confirmé au client que sa commande l'attend en pharmacie.",
            },
            {
              label: "Retirée (« Entregada »)",
              tone: "ok",
              note: "Le client est passé : le stock est décompté à ce moment-là et la vente entre en comptabilité. Son montant comptait déjà dans le « revenu confirmé » dès la confirmation.",
            },
          ],
          [
            { label: "En attente", tone: "neutral" },
            {
              label: "Expirée (« Expirada »)",
              tone: "warn",
              note: "24 heures sans suite : la réservation se ferme automatiquement, sans toucher au stock.",
            },
          ],
          [
            { label: "En attente ou confirmée", tone: "neutral" },
            {
              label: "Annulée (« Cancelada »)",
              tone: "bad",
              note: "La réservation est annulée : elle ne compte ni dans le revenu confirmé ni dans le panier moyen.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Les textes à l'intérieur des cartes du tableau de bord sont en espagnol, quelle que soit la langue choisie en haut de page. Seuls le menu, le fil d'ariane, le titre et les boutons de l'en-tête suivent votre langue.",
      "« Valor stock » est la valeur du stock au prix de VENTE (prix × unités). La valeur au coût d'achat se consulte dans Comptabilité.",
      "La pastille « en promo » compte les produits dont la fiche porte un ancien prix barré saisi à la main — pas les campagnes de la page Promotions.",
      "« Top productos » ne compte que les réservations réellement retirées au cours des 30 derniers jours. Une réservation en attente ou confirmée mais pas encore retirée n'y apparaît pas.",
      "« Ingreso confirmado » et « cesta media » (carte « Reservas por estado ») couvrent toutes les réservations depuis l'ouverture, pas seulement les 7 jours du graphique voisin.",
      "Les lettres sous le graphique (L, M, M, J, V, S, D) ne correspondent pas toujours aux vrais jours : le graphique couvre en réalité les 7 derniers jours, le point le plus à droite étant aujourd'hui.",
      "Le tableau de bord considère qu'un prix d'exactement 100 DOP est un prix provisoire jamais configuré : c'est ce que compte l'avertissement orange de la carte « Inventario ».",
      "Les chiffres sont figés au moment où la page s'affiche. Rechargez la page pour les actualiser.",
      "La légende des réservations récentes mentionne un marqueur 💬 (« le client a ouvert WhatsApp »), mais il ne s'affiche jamais : cette information n'est enregistrée nulle part pour le moment.",
    ],
  },
  {
    id: "chrome",
    navLabel: "Navigation générale",
    title: "Se repérer : barre latérale et en-tête",
    route: "/admin",
    intro:
      "Deux éléments vous accompagnent sur toutes les pages de l'administration : la barre latérale à gauche (le menu, avec ses compteurs et votre carte d'identité) et l'en-tête en haut de chaque page (le fil d'ariane, le titre, le choix de la langue et le mode clair/sombre). Cette section explique comment les lire et ce que font leurs boutons.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 3, kind: "panel", label: "FARMAU · Admin", hotspot: 1 },
            { w: 9, kind: "toolbar", label: "Fil d'ariane / Titre — FR ES EN · clair/sombre", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "panel", label: "Menu : 6 groupes + badges", hotspot: 3 },
            { w: 9, kind: "panel", label: "Contenu de la page" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "panel", label: "Carte identité · déconnexion", hotspot: 4 },
            { w: 9, kind: "panel" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "panel", label: "Voir le site · Mon compte", hotspot: 5 },
            { w: 9, kind: "panel" },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Logo et pastille Admin",
        desc: "En haut de la barre latérale, « FARMAU » ramène toujours à la Vue d'ensemble. La pastille « Admin » rappelle que vous êtes côté administration, pas sur le site public.",
      },
      {
        n: 2,
        label: "En-tête de page",
        desc: "Présent sur toutes les pages : le fil d'ariane en petites capitales (les éléments précédents sont cliquables), le titre de la page, puis les outils — sélecteur de langue FR/ES/EN et bascule clair/sombre — et enfin les boutons propres à la page (par exemple « Ajouter un produit »).",
      },
      {
        n: 3,
        label: "Menu par groupes",
        desc: "Six groupes : Général (Vue d'ensemble, Comptabilité, Guide d'utilisation), Catalogue (Produits, Marques, Stock, Étiquettes, Promotions), Opérations (Réservations, Ventes, Tickets, Page d'accueil, Blog), Clients (Utilisateurs, Avis, Newsletter), Configuration (Boutique, Apparence) et Accès (Administrateurs, Journal). La page courante est surlignée avec un filet coloré à gauche. Certaines entrées portent un badge : un compteur gris sur Produits (nombre de produits actifs) et des badges de couleur vive sur Stock (produits sous 5 unités), Réservations (en attente ou confirmées, à traiter) et Tickets (messages ouverts).",
      },
      {
        n: 4,
        label: "Carte d'identité et déconnexion",
        desc: "En bas du menu : un rond avec vos initiales, votre pseudo (ou le début de votre adresse email si vous n'avez pas de pseudo), la mention « Admin », et à droite une icône de sortie pour vous déconnecter.",
      },
      {
        n: 5,
        label: "Ponts vers le côté client",
        desc: "« Voir le site » ouvre la boutique publique dans un nouvel onglet, dans la langue actuellement choisie pour l'administration. « Mon compte » mène à votre profil personnel (pseudo, téléphone, mot de passe) — votre compte administrateur est aussi un compte client normal.",
      },
    ],
    workflows: [
      {
        title: "Changer la langue de l'administration",
        steps: [
          {
            title: "Repérer le sélecteur",
            body: "Dans l'en-tête de n'importe quelle page admin, à droite du titre, trois boutons : FR, ES, EN.",
          },
          {
            title: "Cliquer la langue voulue",
            body: "La page se recharge dans la nouvelle langue. La langue active est sur fond clair et n'est pas cliquable.",
          },
          {
            title: "C'est mémorisé",
            body: "Le choix est conservé sur ce navigateur pendant un an : toutes les pages admin s'afficheront dans cette langue, jusqu'à votre prochain changement.",
          },
        ],
      },
      {
        title: "Vérifier le site comme un client",
        steps: [
          {
            title: "Cliquer « Voir le site »",
            body: "En bas de la barre latérale. La boutique s'ouvre dans un nouvel onglet : votre onglet d'administration reste ouvert.",
          },
          {
            title: "Naviguer librement",
            body: "Vous êtes connecté avec le même compte : vous pouvez tester le panier, les favoris, une réservation, comme n'importe quel client.",
          },
          {
            title: "Revenir à l'administration",
            body: "Fermez l'onglet boutique ou revenez simplement à l'onglet précédent. Rien n'a changé côté admin.",
          },
        ],
      },
      {
        title: "Lire les alertes du menu",
        steps: [
          {
            title: "Badges de couleur vive = à traiter",
            body: "Stock (des produits passent sous 5 unités), Réservations (en attente ou confirmées, pas encore retirées) et Tickets (messages ouverts).",
          },
          {
            title: "Badge gris = simple compteur",
            body: "Sur Produits, le badge gris indique le nombre de produits actifs du catalogue. Ce n'est pas une alerte.",
          },
          {
            title: "Les compteurs se rafraîchissent en naviguant",
            body: "Ils se mettent à jour à chaque changement de page, avec un léger différé possible. Au-delà de 99, ils affichent « 99+ ».",
          },
        ],
      },
    ],
    actions: [
      {
        label: "FR · ES · EN (sélecteur de langue)",
        where: "En-tête de chaque page admin, à droite du titre",
        does: "Change la langue des menus et des pages de l'administration, et rien d'autre.",
        effects: [
          "La préférence est enregistrée sur ce navigateur pour un an.",
          "La page se recharge immédiatement dans la nouvelle langue.",
          "Le site public n'est pas affecté : chaque visiteur y choisit sa propre langue.",
          "Les autres administrateurs et les autres ordinateurs ne sont pas affectés.",
        ],
        severity: "safe",
        undo: "Cliquez sur une autre langue : le changement est immédiat.",
      },
      {
        label: "Soleil / Lune (mode clair ou sombre)",
        where: "En-tête de chaque page admin, à côté du sélecteur de langue",
        does: "Bascule l'affichage de l'administration entre mode clair et mode sombre.",
        effects: [
          "L'administration change d'apparence immédiatement, sans rechargement.",
          "Le choix est mémorisé sur cet appareil et ce navigateur uniquement.",
          "Le site public et les autres administrateurs ne voient aucun changement.",
        ],
        severity: "safe",
        undo: "Cliquez sur l'autre icône pour revenir au mode précédent.",
      },
      {
        label: "Se déconnecter (icône de sortie)",
        where: "En bas de la barre latérale, à droite de votre nom",
        does: "Ferme votre session et vous renvoie à la page de connexion.",
        effects: [
          "Votre session est fermée sur ce navigateur.",
          "Comme votre compte administrateur est aussi votre compte client, vous êtes déconnecté du site public en même temps sur ce navigateur.",
          "Personne ne peut plus utiliser l'administration sur ce poste sans se reconnecter.",
        ],
        severity: "safe",
        undo: "Reconnectez-vous avec votre adresse email et votre mot de passe.",
      },
    ],
    gotchas: [
      "Le sélecteur FR/ES/EN ne change que la langue de l'ADMINISTRATION. Sur le site public, la langue fait partie de l'adresse de la page et chaque visiteur choisit la sienne.",
      "Le mode clair/sombre de l'en-tête est propre à votre appareil. La PALETTE de couleurs, en revanche, se règle dans Apparence et s'applique au site public ET à l'administration, pour tout le monde.",
      "Se déconnecter ferme tout le compte sur ce navigateur : vous êtes aussi déconnecté du côté boutique (un seul compte sert aux deux casquettes).",
      "Le nom affiché dans la carte d'identité est votre pseudo de profil ; vous le modifiez via « Mon compte ». Sans pseudo, c'est le début de votre adresse email qui s'affiche.",
      "Les badges du menu se rafraîchissent quand vous changez de page, avec un léger différé possible : un compteur peut rester affiché quelques secondes après que vous avez traité l'élément.",
      "Le badge Stock compte les produits actifs sous 5 unités, y compris les produits totalement épuisés.",
      "Il n'y a pas de page de profil dans l'administration : votre profil personnel se gère côté boutique, via le lien « Mon compte ».",
    ],
  },
]
