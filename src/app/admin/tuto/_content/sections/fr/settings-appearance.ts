import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "settings",
    navLabel: "Paramètres boutique",
    title: "Boutique & réservation — coordonnées et point de retrait",
    route: "/admin/settings",
    intro:
      "Cet écran regroupe les informations officielles de la boutique : le nom et l'accroche (enregistrés, mais sans effet visible sur le site pour l'instant), les coordonnées de contact (email, téléphone, numéro WhatsApp) et le point de retrait des réservations (nom, adresse, horaires, téléphone). Ces valeurs alimentent le pied de page, la page Contact, la page Pharmacie, la page À propos, la page de confirmation, l'email de confirmation envoyé au client et les liens WhatsApp pré-remplis. Important : la boutique fonctionne en retrait en pharmacie uniquement, gratuit — il n'existe aucune livraison payante, donc aucun tarif de livraison à régler ici. Une remise employé (en %) s'y règle aussi : appliquée à la main lors d'une vente au comptoir et affichée à toute l'équipe dans le bandeau de l'admin.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Admin / Configuration / Boutique & réservation" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Identité de la boutique : nom (obligatoire) · accroche", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Contact & WhatsApp : email · téléphone · numéro WhatsApp", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Réservation & retrait : rappel du fonctionnement (3 étapes · conservation 24 h)", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "input", label: "Point de retrait : nom · adresse complète · horaires · téléphone pharmacie", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "input", label: "Personnel : remise employé (%) appliquée au comptoir", hotspot: 7 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "text", label: "Modifications non enregistrées", hotspot: 5 },
            { w: 3, kind: "button", label: "Annuler" },
            { w: 3, kind: "button", label: "Enregistrer", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Carte « Identité de la boutique »",
        desc: "Le nom de la boutique (obligatoire, ne peut pas être vide) et l'accroche. Attention : ces deux champs sont enregistrés, mais le site public affiche aujourd'hui un nom et un logo fixes — les modifier n'a pour l'instant aucun effet visible côté clients.",
      },
      {
        n: 2,
        label: "Carte « Contact & WhatsApp »",
        desc: "L'email et le téléphone affichés sur les pages Contact et Pharmacie et utilisés en solution de repli sur la page de confirmation. Le numéro WhatsApp sert à fabriquer les boutons « Confirmer ma réservation sur WhatsApp » donnés aux clients : saisissez-le au format international (par exemple +18094122468).",
      },
      {
        n: 3,
        label: "Encart « Réservation & retrait »",
        desc: "Un simple rappel du fonctionnement : le client réserve en ligne, vous le recontactez sur WhatsApp, il retire et règle en pharmacie. La conservation de 24 h des réservations y est rappelée. Rien dans cet encart n'est modifiable : c'est de l'information, pas un réglage.",
      },
      {
        n: 4,
        label: "Champs « Point de retrait »",
        desc: "Le nom, l'adresse complète, les horaires et le téléphone de la pharmacie où le client vient retirer sa réservation. Ces informations s'affichent sur la page À propos, dans le message WhatsApp pré-rempli de la page de confirmation et dans l'email de confirmation envoyé au client. Attention : l'adresse et les horaires affichés dans le tunnel de réservation et sur la page Pharmacie sont encore fixes — ces champs ne les changent pas.",
      },
      {
        n: 5,
        label: "Barre d'enregistrement",
        desc: "Cette barre sombre n'apparaît que lorsqu'au moins un champ a été modifié. Tant qu'elle est visible, rien n'est encore enregistré : si vous quittez la page sans cliquer « Enregistrer », vos changements sont perdus.",
      },
      {
        n: 6,
        label: "Bouton « Enregistrer »",
        desc: "Enregistre d'un coup tous les champs de l'écran. Le nom de la boutique doit être rempli et l'email de contact doit être une adresse valide, sinon un message d'erreur s'affiche et rien n'est enregistré.",
      },
      {
        n: 7,
        label: "Champ « Remise employé »",
        desc: "Section « Personnel » : un pourcentage (0 à 100) réservé au personnel. Dès qu'il dépasse 0, une bande « Promo employés · −X % » apparaît en haut de toutes les pages de l'admin, et une case « tarif employé » devient disponible à la vente comptoir. À 0, aucune remise et la bande disparaît. Cette remise ne touche jamais les prix du catalogue public.",
      },
    ],
    workflows: [
      {
        title: "Mettre à jour les coordonnées de contact",
        steps: [
          {
            title: "Modifier les champs",
            body: "Dans la carte « Contact & WhatsApp », corrigez l'email, le téléphone ou le numéro WhatsApp. La barre sombre « Modifications non enregistrées » apparaît en bas.",
          },
          {
            title: "Enregistrer",
            body: "Cliquez « Enregistrer » dans la barre du bas. Un message « Paramètres sauvegardés » confirme l'opération.",
          },
          {
            title: "Vérifier sur le site",
            body: "Ouvrez la page Contact et la page Pharmacie du site public : les nouvelles coordonnées apparaissent en quelques minutes au plus. Le pied de page et les boutons WhatsApp suivent aussi.",
          },
        ],
      },
      {
        title: "Changer les informations du point de retrait",
        steps: [
          {
            title: "Modifier le point de retrait",
            body: "Dans la carte « Réservation & retrait », sous le rappel du fonctionnement, corrigez le nom, l'adresse, les horaires ou le téléphone de la pharmacie.",
          },
          {
            title: "Enregistrer",
            body: "Cliquez « Enregistrer » dans la barre du bas.",
          },
          {
            title: "Vérifier le parcours client",
            body: "Les nouvelles informations apparaissent sur la page À propos, dans le message WhatsApp de la page de confirmation et dans les prochains emails de confirmation. En revanche, l'adresse affichée dans le tunnel de réservation et sur la page Pharmacie ne suit pas ces champs : elle est encore fixe. Les réservations déjà passées ne sont pas modifiées.",
          },
        ],
      },
      {
        title: "Régler une remise pour le personnel",
        steps: [
          {
            title: "Saisir le taux",
            body: "Dans la section « Personnel », entrez le pourcentage de remise employé (par exemple 15). Mettez 0 pour la désactiver.",
          },
          {
            title: "Enregistrer",
            body: "Cliquez « Enregistrer » dans la barre du bas.",
          },
          {
            title: "Vérifier",
            body: "Une bande « Promo employés · −X % » apparaît en haut de l'admin (visible par toute l'équipe), et à l'écran Ventes une case « tarif employé » est désormais proposée lors d'une vente comptoir.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Enregistrer",
        where: "Barre sombre en bas de l'écran (elle n'apparaît que si un champ a été modifié)",
        does: "Enregistre d'un coup les onze champs de l'écran : nom, accroche, email, téléphone, numéro WhatsApp, les quatre informations du point de retrait, le seuil de stock faible et la remise employé.",
        effects: [
          "Toutes les valeurs sont enregistrées ensemble dans la base de données (il n'existe qu'une seule fiche boutique).",
          "Le site public reprend les nouvelles valeurs en quelques minutes au plus : pied de page, page Contact, page Pharmacie, page À propos, page de confirmation.",
          "Les prochains emails de confirmation de réservation et les boutons WhatsApp donnés aux clients utilisent les nouvelles coordonnées.",
          "L'enregistrement est refusé avec un message si le nom de la boutique est vide, si l'email de contact n'est pas une adresse valide, ou si un champ dépasse 400 caractères.",
          "Un champ effacé (laissé vide) disparaît du site public : la ligne correspondante n'est plus affichée.",
        ],
        severity: "caution",
        undo: "Resaisissez les anciennes valeurs et enregistrez à nouveau. Elles ne sont pas conservées ailleurs : notez-les avant un gros changement.",
        audited: true,
        publicImpact: "Les coordonnées et le point de retrait changent pour tous les visiteurs du site, en quelques minutes au plus.",
      },
      {
        label: "Remise employé (%)",
        where: "Section « Personnel » — champ numérique (0 à 100), enregistré avec le bouton « Enregistrer »",
        does: "Définit le taux de remise réservé au personnel, appliqué manuellement lors d'une vente au comptoir.",
        effects: [
          "Le taux (0 à 100) est enregistré dans la fiche boutique avec les autres réglages.",
          "Dès qu'il dépasse 0, une bande « Promo employés · −X % » s'affiche en haut de TOUTES les pages de l'admin, visible par toute l'équipe, avec un lien vers ce réglage.",
          "À l'écran Ventes, une case « tarif employé » devient disponible : cochée lors d'une vente comptoir, elle applique ce taux (prix recalculé côté serveur).",
          "À 0, aucune remise n'est possible et la bande disparaît.",
          "Ce taux ne s'applique JAMAIS automatiquement aux prix du catalogue public : c'est un outil interne de comptoir.",
        ],
        severity: "caution",
        audited: true,
        accountingImpact: "Une vente comptoir avec tarif employé entre dans le chiffre d'affaires à son montant remisé — la marge est réduite d'autant.",
      },
      {
        label: "Annuler",
        where: "Barre sombre en bas de l'écran, à gauche d'« Enregistrer »",
        does: "Abandonne les modifications en cours et remet tous les champs à leur dernière valeur enregistrée.",
        effects: [
          "Les champs reviennent aux valeurs enregistrées ; rien n'est envoyé à la base de données.",
          "Ne fonctionne qu'avant d'avoir cliqué « Enregistrer » : après l'enregistrement, ce bouton ne ramène pas les anciennes valeurs.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "Le « Nom de la boutique » et l'« Accroche » sont enregistrés, mais le site public affiche aujourd'hui un nom et un logo fixes : modifier ces deux champs n'a pour l'instant aucun effet visible pour les clients.",
      "Aucune livraison : la boutique fonctionne uniquement en retrait en pharmacie, gratuit. Cet écran ne contient donc aucun tarif de livraison. D'anciens montants de livraison existent encore dans la base de données, mais ils ne sont utilisés nulle part — ignorez-les.",
      "L'encart « Réservation & retrait » (les trois étapes et la conservation 24 h) est un simple rappel : rien n'y est réglable. Le délai de 24 h avant expiration automatique d'une réservation est fixe et ne se change pas ici.",
      "Les champs « Point de retrait » ne changent pas tout le site : l'adresse et les horaires affichés à l'étape de retrait du tunnel de réservation et sur la page Pharmacie sont encore écrits en dur. Ces champs alimentent en revanche la page À propos, le message WhatsApp et l'email de confirmation envoyés au client.",
      "Saisissez le numéro WhatsApp au format international avec l'indicatif du pays (par exemple +18094122468). S'il est vide, les boutons « Confirmer sur WhatsApp » envoient le client vers la page Contact à la place, et la page de confirmation propose le téléphone ou l'email en secours.",
      "Un champ de contact laissé vide disparaît simplement du site : sans email de contact, la ligne email n'apparaît plus sur les pages Contact et Pharmacie.",
      "Rien n'est enregistré tant que la barre sombre « Modifications non enregistrées » est visible : si vous changez de page avant de cliquer « Enregistrer », tout est perdu.",
      "Les anciennes valeurs ne sont pas conservées : le journal d'audit enregistre ce qui a été changé et par qui, mais pas les valeurs précédentes. Notez-les avant un changement important.",
      "Comptez quelques minutes avant de voir les changements sur le site public : les pages se rafraîchissent automatiquement, mais pas instantanément.",
      "La remise employé est un outil INTERNE : elle ne baisse jamais les prix du catalogue public et ne s'applique qu'au comptoir, en cochant une case, à la main.",
      "La bande « Promo employés · −X % » est visible par tous les administrateurs (elle vit dans le bandeau de l'admin) ; elle disparaît dès que le taux repasse à 0.",
    ],
  },
  {
    id: "appearance",
    navLabel: "Apparence",
    title: "Thème du site — palette de couleurs, mode clair/sombre, bascule visiteur",
    route: "/admin/apariencia",
    intro:
      "Cet écran choisit l'habillage visuel du site : une palette de couleurs parmi six (Terra, Noir, Botánico, Coral, Marino, Ámbar), le mode par défaut du site public (clair, sombre, ou « système » qui suit le réglage de l'appareil du visiteur), et l'autorisation, pour les visiteurs, de basculer eux-mêmes entre clair et sombre via un bouton dans le pied de page. La palette choisie s'applique au site public ET au panneau admin ; l'icône d'onglet du navigateur (le colibri) suit aussi le thème. Tout le contenu (produits, textes, photos) reste identique : seules les couleurs changent.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Admin / Personnalisation / Thème du site" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "panel", label: "Terra ✓ (aperçu + 3 pastilles)", hotspot: 1 },
            { w: 4, kind: "panel", label: "Noir" },
            { w: 4, kind: "panel", label: "Botánico" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "panel", label: "Coral" },
            { w: 4, kind: "panel", label: "Marino" },
            { w: 4, kind: "panel", label: "Ámbar" },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "tabs", label: "Mode par défaut : Clair · Sombre · Système", hotspot: 2 },
            { w: 6, kind: "tabs", label: "Le visiteur peut changer : Oui · Non", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "text", label: "Dernière modification · date · le site public se met à jour au prochain chargement" },
            { w: 3, kind: "button", label: "Annuler", hotspot: 4 },
            { w: 3, kind: "button", label: "Enregistrer le thème", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Grille des six palettes",
        desc: "Chaque carte montre un aperçu (le fond du thème avec le colibri), une bande de trois pastilles de couleurs, le nom de la palette et ses teintes. Cliquez une carte pour la sélectionner : une coche et une bordure colorée marquent votre choix. Rien ne change tant que vous n'avez pas enregistré.",
      },
      {
        n: 2,
        label: "« Mode par défaut »",
        desc: "Le mode dans lequel le site public s'affiche pour les visiteurs : Clair, Sombre, ou Système (le site suit alors le réglage clair/sombre de l'appareil de chaque visiteur). Ce réglage ne concerne pas le panneau admin, qui a sa propre bascule en haut de chaque page.",
      },
      {
        n: 3,
        label: "« Le visiteur peut changer »",
        desc: "Sur « Oui », un bouton soleil/lune apparaît dans le pied de page du site public : chaque visiteur peut basculer entre clair et sombre, et son choix est retenu sur son appareil. Sur « Non », le bouton disparaît et les choix déjà faits par les visiteurs sont ignorés : tout le monde voit le mode par défaut.",
      },
      {
        n: 4,
        label: "Bouton « Annuler »",
        desc: "Remet la sélection (palette, mode, bascule visiteur) telle qu'elle était au dernier enregistrement. Grisé s'il n'y a rien à annuler. Sans effet une fois l'enregistrement fait.",
      },
      {
        n: 5,
        label: "Bouton « Enregistrer le thème »",
        desc: "Applique vos choix. Le panneau admin et l'icône d'onglet changent immédiatement, sans recharger la page ; le site public prend la nouvelle palette au prochain chargement de page de chaque visiteur.",
      },
    ],
    workflows: [
      {
        title: "Changer la palette de couleurs du site",
        steps: [
          {
            title: "Choisir une carte",
            body: "Cliquez la palette voulue dans la grille : la coche et la bordure confirment la sélection. Les pastilles de chaque carte donnent une idée des teintes (fond clair, fond sombre, couleur d'accent).",
          },
          {
            title: "Enregistrer",
            body: "Cliquez « Enregistrer le thème ». Un message « Thème enregistré » confirme. Le panneau admin prend les nouvelles couleurs immédiatement — c'est normal, pas besoin de recharger.",
          },
          {
            title: "Vérifier le site public",
            body: "Ouvrez ou rechargez une page du site public : la nouvelle palette s'affiche. L'icône d'onglet du navigateur (le colibri) a aussi changé de couleurs.",
          },
          {
            title: "Revenir en arrière si besoin",
            body: "Pas convaincu ? Resélectionnez l'ancienne palette et enregistrez à nouveau : tout revient exactement comme avant, rien n'est perdu.",
          },
        ],
      },
      {
        title: "Passer le site public en mode sombre par défaut",
        steps: [
          {
            title: "Choisir « Sombre »",
            body: "Dans « Mode par défaut », cliquez « Sombre ». Choisissez « Système » si vous préférez que le site suive le réglage de l'appareil de chaque visiteur.",
          },
          {
            title: "Décider pour la bascule visiteur",
            body: "Avec « Le visiteur peut changer : Oui », un visiteur qui préfère le clair pourra revenir au clair via le bouton du pied de page. Sur « Non », tout le monde reste en sombre.",
          },
          {
            title: "Enregistrer et contrôler",
            body: "Cliquez « Enregistrer le thème », puis parcourez quelques pages du site public en sombre : le mode sombre est récent, vérifiez que tout vous semble lisible.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Enregistrer le thème",
        where: "En bas de l'écran, à droite (grisé tant que rien n'a été modifié)",
        does: "Enregistre ensemble la palette choisie, le mode par défaut et l'autorisation de bascule visiteur, puis applique le tout.",
        effects: [
          "Les trois réglages sont enregistrés dans la base de données (la même fiche boutique que les paramètres).",
          "Le panneau admin prend les nouvelles couleurs immédiatement, sans recharger la page.",
          "L'icône d'onglet du navigateur (le colibri) passe aux couleurs du nouveau thème, tout de suite.",
          "Le site public affiche la nouvelle palette au prochain chargement de page de chaque visiteur.",
          "Si la bascule visiteur passe à « Non », le bouton soleil/lune disparaît du pied de page et les préférences clair/sombre déjà enregistrées par les visiteurs sont ignorées.",
        ],
        severity: "caution",
        undo: "Resélectionnez l'ancienne palette et les anciens réglages, puis enregistrez à nouveau : le retour est exact, rien n'est jamais perdu.",
        audited: true,
        publicImpact: "Toutes les couleurs du site changent pour tous les visiteurs (contenu, prix et photos restent identiques).",
      },
      {
        label: "Annuler",
        where: "En bas de l'écran, à gauche d'« Enregistrer le thème »",
        does: "Abandonne la sélection en cours et revient aux réglages du dernier enregistrement.",
        effects: [
          "La carte sélectionnée, le mode par défaut et la bascule visiteur reviennent à leur état enregistré ; rien n'est envoyé à la base de données.",
          "Sans effet une fois « Enregistrer le thème » cliqué : il faut alors resélectionner l'ancien thème et réenregistrer.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "Cliquer une carte de thème ne change rien tout seul : la sélection n'est appliquée qu'au clic sur « Enregistrer le thème ». Les cartes montrent des pastilles de couleurs, pas un aperçu en direct des pages.",
      "La palette s'applique au site public ET au panneau admin. En revanche, le « Mode par défaut » (clair/sombre) ne concerne que le site public : le panneau admin a sa propre bascule clair/sombre en haut de chaque page, personnelle à chaque membre de l'équipe.",
      "« Le visiteur peut changer : Non » fait deux choses : le bouton soleil/lune disparaît du pied de page, et les préférences clair/sombre déjà choisies par les visiteurs sont ignorées — tout le monde revoit le mode par défaut.",
      "Après l'enregistrement, le panneau admin et l'icône d'onglet changent immédiatement ; le site public, lui, prend la nouvelle palette au prochain chargement de page (le texte en bas de l'écran le rappelle).",
      "Le mode sombre est récent : quelques bandes décoratives du site peuvent paraître inversées en sombre (lisibles, mais différentes). Parcourez le site public après l'avoir activé pour vérifier que le rendu vous convient.",
      "Changer de thème ne touche ni aux produits, ni aux prix, ni aux textes, ni aux photos : uniquement les couleurs. C'est entièrement réversible — Terra est la palette d'origine de la boutique.",
    ],
  },
]
