import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "concepts",
    navLabel: "Concepts clés",
    title: "Les concepts clés — à comprendre avant tout le reste",
    route: "",
    intro:
      "Avant d'ouvrir les écrans un par un, prenez cinq minutes pour suivre trois fils rouges : le parcours d'une commande (de la réservation sur le site jusqu'à l'encaissement au comptoir), la vie d'un prix (du prix provisoire jusqu'au montant réellement encaissé) et la vie d'un coût (de la facture fournisseur jusqu'à la marge en comptabilité). Presque tout le panneau d'administration se comprend à partir de ces trois histoires. En dessous, vous trouverez les règles générales valables partout, et les confusions les plus fréquentes à éviter.",
    flows: [
      {
        title: "De la réservation à la vente",
        lanes: [
          [
            {
              label: "Le client réserve sur le site",
              note: "Depuis son panier, le client clique « Réserver ». Il obtient une référence (FAR-…). Important : le stock ne bouge pas à ce moment-là.",
            },
            {
              label: "Réservée — dans votre boîte de réception",
              tone: "warn",
              note: "La demande apparaît dans l'écran Réservations, onglet « Réservées ». Elle attend votre contact. Sans confirmation, elle expirera toute seule au bout de 24 heures.",
            },
            {
              label: "Confirmée — client prévenu",
              note: "Vous contactez le client (bouton WhatsApp avec message pré-rempli : référence et liste des produits), puis vous marquez la réservation « Confirmée ».",
            },
            {
              label: "Remise — payée et récupérée",
              tone: "ok",
              note: "Le client passe en pharmacie, vous encaissez et marquez « Remise ». C'est MAINTENANT que le stock baisse, que le coût est figé et que la vente entre en comptabilité. La ligne quitte les Réservations et rejoint l'écran Ventes.",
            },
          ],
          [
            {
              label: "Vente comptoir directe",
              note: "Pour un client qui achète sur place sans avoir réservé : écran Ventes → « Vente comptoir ». Client à compte (existant ou créé sur place) ou anonyme, au choix.",
            },
            {
              label: "Remise immédiate",
              tone: "ok",
              note: "La vente est enregistrée directement comme « Remise » : stock décrémenté aussitôt, vente en comptabilité aussitôt. Pas d'étape de confirmation.",
            },
          ],
          [
            {
              label: "Sans nouvelles du client…",
              tone: "warn",
              note: "Réservation web : 24 heures. Réservation créée par vous (téléphone, comptoir) : 30 jours.",
            },
            {
              label: "Expirée",
              tone: "bad",
              note: "Le passage à « Expirée » est automatique (vérification toutes les 15 minutes). Le client n'est pas prévenu. Comme le stock n'avait jamais bougé, il n'y a rien à remettre en rayon.",
            },
          ],
        ],
      },
      {
        title: "La vie d'un prix",
        lanes: [
          [
            {
              label: "Prix provisoire : 100 pesos",
              tone: "warn",
              note: "Tous les produits importés au départ portent un prix « bouchon » de 100 pesos. Tant qu'il n'est pas remplacé, c'est CE prix qui s'affiche et qui serait facturé.",
            },
            {
              label: "Vrai prix de vente",
              note: "Saisi sur la fiche du produit (écran Produits) ou via l'action « Initialiser ce produit » dans l'écran Stock.",
            },
            {
              label: "Promotion éventuelle",
              note: "Une campagne de promotion (écran Promotions) affiche le prix barré et la remise sur le site. Si plusieurs promotions visent le même produit, c'est la plus avantageuse pour le client qui s'applique.",
            },
            {
              label: "Figé dans la réservation",
              note: "Au moment où le client réserve, le prix du jour (promotion comprise) est recopié dans la réservation. Une promotion créée ou supprimée ensuite ne change rien aux réservations déjà passées.",
            },
            {
              label: "Ajustable avant l'encaissement",
              tone: "warn",
              note: "Dans le détail d'une réservation « Réservée » ou « Confirmée », vous pouvez corriger le prix d'une ligne (geste commercial, client fidèle). Le total est recalculé et la modification est consignée au journal d'audit. C'est pour cela que la fiche produit publique porte la mention « Prix indicatif — confirmé en pharmacie ».",
            },
            {
              label: "Verrouillé à la remise",
              tone: "ok",
              note: "Dès que la réservation est marquée « Remise », plus aucune modification de prix n'est possible : c'est ce montant qui compte en comptabilité.",
            },
          ],
        ],
      },
      {
        title: "La vie d'un coût",
        lanes: [
          [
            {
              label: "Réception avec coût",
              note: "À chaque livraison fournisseur, vous enregistrez une « Entrée de stock » dans l'écran Stock : quantités reçues ET coût unitaire payé (avec, en option, les informations de la facture fournisseur pour les déclarations fiscales).",
            },
            {
              label: "Coût moyen pondéré",
              note: "Le produit garde un coût moyen, recalculé automatiquement à chaque réception (mélange de l'ancien stock et du nouveau, au prorata des quantités).",
            },
            {
              label: "Figé à la vente",
              note: "Au moment de la remise, le coût moyen du jour est recopié une fois pour toutes dans la vente. Les réceptions suivantes ne changent plus la marge de cette vente.",
            },
            {
              label: "Marge en comptabilité",
              tone: "ok",
              note: "L'écran Comptabilité calcule : ventes encaissées − coût des produits vendus − dépenses = résultat. Les ventes dont le coût est inconnu sont signalées à part, jamais comptées comme « coût zéro ».",
            },
          ],
          [
            {
              label: "Perte / produit périmé",
              tone: "warn",
              note: "Produit périmé, abîmé, volé ou écart d'inventaire : utilisez l'action de perte dans l'écran Stock (raison à choisir : périmé, abîmé, vol, ajustement).",
            },
            {
              label: "Stock diminué + dépense au coût",
              tone: "bad",
              note: "Le stock baisse et une dépense « merma » entre en comptabilité, valorisée au coût moyen du produit (jamais au prix de vente). Si le coût est inconnu, le stock baisse quand même mais aucune dépense n'est créée.",
            },
          ],
        ],
      },
    ],
    actions: [
      {
        label: "Un compte = deux casquettes",
        where: "Tout le panneau",
        does:
          "Être admin n'est pas un compte à part : c'est votre compte client habituel, auquel on a ajouté la casquette admin. Vous gardez votre panier, vos réservations, vos favoris et votre profil personnels.",
        effects: [
          "En bas du menu admin : « Voir le site » ouvre la boutique, « Mon compte » ouvre votre espace client personnel.",
          "Depuis votre espace client, un lien « Panneau admin » vous ramène ici.",
          "Pour donner accès au panneau à un collègue, on promeut son compte client existant (écran Utilisateurs) — on ne crée pas de compte spécial.",
          "Retirer la casquette admin à quelqu'un ne supprime pas son compte client : il redevient simplement un client normal.",
        ],
        severity: "safe",
      },
      {
        label: "La langue du panneau est indépendante du site public",
        where: "En-tête de chaque page admin (boutons FR / ES / EN)",
        does:
          "Vous pouvez travailler dans le panneau en français, espagnol ou anglais. Ce choix ne concerne que VOTRE écran d'administration.",
        effects: [
          "Le site public garde ses trois langues, choisies par chaque visiteur — votre réglage admin n'y change rien.",
          "Vos collègues admins ont chacun leur propre langue de travail.",
          "Le choix est mémorisé sur votre navigateur pendant environ un an.",
        ],
        severity: "safe",
      },
      {
        label: "Le stock ne baisse JAMAIS à la réservation",
        where: "Réservations, Ventes, Stock",
        does:
          "Réserver ne met rien de côté dans la base de données. Le stock n'est décompté qu'au moment où vous marquez la réservation « Remise » (ou lors d'une vente comptoir, remise immédiatement).",
        effects: [
          "Deux clients peuvent réserver la même dernière unité : vérifiez le rayon avant de confirmer.",
          "Une réservation expirée ou annulée avant remise n'a aucun effet sur le stock — rien à remettre en rayon.",
          "Si vous annulez une vente déjà « Remise », le stock est automatiquement re-crédité.",
          "Le stock affiché sur le site ne descend jamais sous zéro, même si le décompte système était faux.",
        ],
        severity: "caution",
        accountingImpact: "La vente n'entre en comptabilité (chiffre d'affaires, coût, marge) qu'au moment de la remise.",
      },
      {
        label: "Les actions importantes sont consignées dans le journal d'audit",
        where: "Accès › Journal",
        does:
          "Presque chaque création, modification ou suppression faite dans le panneau (produits, prix, stock, réservations, promotions, réglages…) est notée automatiquement : qui, quoi, quand, et quels champs ont été modifiés (avec leurs nouvelles valeurs).",
        effects: [
          "Tous les admins peuvent consulter le journal — utile pour comprendre « qui a changé ce prix ».",
          "Les modifications sensibles (prix d'une réservation, par exemple) sont marquées « fort impact ».",
          "Les simples consultations d'écrans ne sont pas notées : seul ce qui modifie des données l'est.",
        ],
        severity: "safe",
      },
      {
        label: "Les réservations expirent toutes seules",
        where: "Réservations",
        does:
          "Une réservation web non confirmée passe automatiquement à « Expirée » après 24 heures (30 jours pour une réservation que vous créez vous-même). Une vérification tourne toutes les 15 minutes, sans intervention de votre part.",
        effects: [
          "Le client n'est pas prévenu de l'expiration : si vous voulez le relancer, faites-le avant la fin du délai.",
          "Une réservation « Confirmée » n'expire plus : confirmer protège la demande.",
          "Le stock n'ayant jamais bougé, une expiration ne demande aucun rangement.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "Réception ≠ ajustement. L'« Entrée de stock » (livraison fournisseur, avec coût) alimente le coût moyen et le registre des achats. « Ajuster l'inventaire » corrige juste le nombre d'unités, sans toucher au coût : si vous enregistrez une livraison comme un ajustement, le coût moyen devient faux et la marge avec.",
      "Le prix affiché sur le site peut différer du prix encaissé : vous pouvez ajuster le prix d'une ligne de réservation avant la remise. C'est assumé — la fiche produit publique annonce « Prix indicatif — confirmé en pharmacie ».",
      "Supprimer ≠ désactiver. Désactiver un produit le retire du site mais conserve tout (photos, historique, stock) : c'est réversible. Supprimer est définitif : photos, historique de réceptions et de pertes disparaissent avec lui. Seules les ventes passées survivent (elles gardent le nom et le prix en copie). En cas de doute, désactivez.",
      "Une promotion créée après coup ne change pas les réservations déjà passées : leur prix a été figé au moment de la réservation.",
      "Le catalogue est arrivé avec un prix provisoire de 100 pesos sur tous les produits. Tant que le vrai prix n'est pas saisi, c'est ce montant qui s'affiche et qui serait facturé — d'où l'action « Initialiser ce produit » dans l'écran Stock.",
      "Annuler une réservation jamais remise est sans conséquence (ni stock, ni comptabilité). Annuler une vente déjà remise re-crédite le stock et retire la vente du journal des ventes : à réserver aux vraies erreurs de caisse.",
    ],
  },
]
