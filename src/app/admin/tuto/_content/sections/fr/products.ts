import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "products",
    navLabel: "Produits",
    title: "Produits — les fiches du catalogue",
    route: "/admin/product",
    intro:
      "Cet écran est le cœur du catalogue : la liste de toutes les fiches produit de la pharmacie, avec marque, étiquettes, prix et stock. C'est ici que vous créez une fiche, corrigez un nom, un prix, une photo ou une description, et que vous supprimez un produit. Gardez en tête que presque tout ce que vous enregistrez ici se voit sur le site public en une minute environ. La mise en ligne d'un produit caché, elle, ne se fait pas ici : c'est une action volontaire, regroupée avec l'inventaire dans l'écran Stock.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin › Catalogue › Produits" },
            { w: 4, kind: "button", label: "+ Ajouter un produit", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "Rechercher par nom, SKU…", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "table", label: "Produit · Marque · Étiquettes · Prix · Stock · Statut", hotspot: 3 },
            { w: 3, kind: "panel", label: "Crayon · Corbeille", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "text", label: "Page 1 sur 36" },
            { w: 5, kind: "tabs", label: "1 2 3 …", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "text", label: "Arrière-plan estompé" },
            { w: 7, kind: "drawer", label: "Tiroir « Nouveau produit / Modifier »", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Ajouter un produit",
        desc: "Ouvre le tiroir « Nouveau produit » sur la droite. Rien n'est créé tant que vous n'avez pas cliqué « Créer le produit » tout en bas du tiroir.",
      },
      {
        n: 2,
        label: "Recherche",
        desc: "Filtre la liste sur le nom et la description du produit (malgré la mention « SKU » du champ). La liste revient automatiquement à la page 1. Tapez les mots avec leurs accents exacts : « creme » ne trouvera pas « crème ».",
      },
      {
        n: 3,
        label: "La liste des produits",
        desc: "Chaque ligne montre la photo, le nom et l'adresse de la page, la marque, jusqu'à 3 étiquettes (puis un compteur « +n »), le prix en pesos, le stock en unités et une pastille d'état du stock : Normal, Stock bas (ligne teintée en jaune) ou Rupture (ligne teintée en rouge). 10 produits par page, les plus récents d'abord. Attention : les produits hors ligne (cachés du public) figurent aussi dans cette liste — repérés par une pastille « Hors ligne » et une ligne estompée.",
      },
      {
        n: 4,
        label: "Crayon et corbeille",
        desc: "En bout de ligne : le crayon ouvre la fiche pré-remplie pour la modifier ; la corbeille demande une confirmation puis supprime le produit définitivement.",
      },
      {
        n: 5,
        label: "Pagination",
        desc: "En bas de la liste : « Page X sur Y » et des boutons numérotés pour changer de page.",
      },
      {
        n: 6,
        label: "Le tiroir fiche produit",
        desc: "Le formulaire de création et de modification, en 4 blocs : Informations (nom, adresse de la page, image PNG, description courte), Inventaire (prix de vente en pesos, stock), Marque et gamme (la gamme se débloque après le choix de la marque), et les étiquettes du produit. En bas : « Annuler » et « Enregistrer » ou « Créer le produit ». La mention « Non enregistré » rappelle que rien n'est sauvegardé tant que vous n'avez pas validé.",
      },
    ],
    workflows: [
      {
        title: "Créer un nouveau produit",
        steps: [
          {
            title: "Ouvrez le formulaire",
            body: "Cliquez « Ajouter un produit » en haut à droite. Le tiroir « Nouveau produit » s'ouvre.",
          },
          {
            title: "Renseignez le nom",
            body: "L'adresse de la page se remplit automatiquement à partir du nom — ne la retouchez que si nécessaire. Ajoutez une description courte si vous l'avez.",
          },
          {
            title: "Posez le vrai prix et le stock",
            body: "Prix de vente en pesos et stock sont obligatoires. Ne laissez pas un prix provisoire : le produit sera en ligne dès l'enregistrement.",
          },
          {
            title: "Choisissez marque, gamme et étiquettes",
            body: "Si vous choisissez une marque sans choisir de gamme, la première gamme de la marque est attribuée automatiquement. Cochez les étiquettes (besoin, type de peau…) : ce sont elles qui font remonter le produit dans les filtres du catalogue public.",
          },
          {
            title: "Ajoutez la photo",
            body: "Un seul fichier, au format PNG. Elle sera publiée sur le site avec la fiche.",
          },
          {
            title: "Créez et vérifiez",
            body: "Cliquez « Créer le produit ». Si un autre produit a déjà la même adresse de page, l'enregistrement est refusé : modifiez-la et réessayez. La fiche est créée HORS LIGNE : elle n'apparaît pas encore sur le site — initialisez son stock (écran Stock) ou publiez-la avec l'icône œil de la liste.",
          },
        ],
      },
      {
        title: "Corriger une fiche (prix, photo, texte)",
        steps: [
          {
            title: "Retrouvez le produit",
            body: "Avec la recherche (mots avec leurs accents exacts) ou en parcourant les pages.",
          },
          {
            title: "Ouvrez la fiche",
            body: "Cliquez le crayon en bout de ligne : le tiroir s'ouvre, pré-rempli.",
          },
          {
            title: "Faites vos changements",
            body: "Nom, description, prix, stock, marque et gamme (pour changer de marque, choisissez aussi une gamme — sinon le changement est ignoré sans message), étiquettes. Attention à la photo : en téléverser une nouvelle efface TOUTES les photos existantes de la fiche, sans retour possible.",
          },
          {
            title: "Enregistrez",
            body: "Cliquez « Enregistrer » en bas du tiroir. Le site public reflète les changements en une minute environ.",
          },
          {
            title: "Cas particulier du prix",
            body: "Les réservations déjà passées gardent l'ancien prix, figé au moment de la réservation. Seules les nouvelles réservations prennent le nouveau prix.",
          },
        ],
      },
      {
        title: "Mettre en vente un produit encore caché",
        steps: [
          {
            title: "Allez dans l'écran Stock",
            body: "La mise en ligne ne se fait pas depuis l'écran Produits : elle est regroupée avec l'inventaire d'ouverture dans l'écran Stock.",
          },
          {
            title: "Ouvrez « Initialiser ce produit »",
            body: "Sur la ligne du produit concerné, cliquez l'action « Initialiser ce produit » : un tiroir dédié s'ouvre.",
          },
          {
            title: "Comptez et chiffrez",
            body: "Saisissez la quantité comptée en rayon. Si vous avez la facture, ajoutez le coût d'achat unitaire (la marge sera connue dès la première vente). Saisissez aussi le vrai prix de vente s'il faut remplacer le prix provisoire.",
          },
          {
            title: "Vérifiez la case « Activer le produit » puis validez",
            body: "La case « Activer le produit » est déjà cochée à l'ouverture du tiroir — décochez-la si le produit ne doit pas encore être mis en ligne. Cliquez « Initialiser » : le produit devient visible et réservable sur le site en une minute environ, et l'opération est consignée dans le journal d'audit.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Ajouter un produit → « Créer le produit »",
        where: "Bouton en haut à droite de l'écran, puis bouton de validation en bas du tiroir",
        does: "Crée une nouvelle fiche produit dans le catalogue.",
        effects: [
          "La fiche est enregistrée dans la base de données mais le produit naît HORS LIGNE : il n'apparaît au catalogue public, dans la recherche et sur sa propre page qu'une fois publié (icône œil de la liste ou initialisation du stock).",
          "Le nom, le prix (en pesos) et le stock sont obligatoires ; l'adresse de la page se déduit du nom mais reste modifiable avant validation.",
          "Si un autre produit a déjà la même adresse de page, l'enregistrement est refusé — changez-la et réessayez.",
          "Marque sans gamme choisie : la première gamme de la marque est attribuée automatiquement.",
          "La photo (PNG uniquement) est publiée sur l'espace de stockage public du site ; les étiquettes cochées sont rattachées à la fiche.",
          "Le stock saisi ici est posé tel quel, sans coût d'achat ni facture fournisseur : rien n'alimente la comptabilité. Pour une vraie livraison, utilisez la réception de l'écran Stock.",
        ],
        severity: "caution",
        undo: "Supprimez la fiche avec l'icône corbeille de la liste (suppression définitive — sans gravité juste après une création).",
        audited: true,
        publicImpact: "Aucun impact immédiat : le produit est créé hors ligne et reste invisible du public tant qu'il n'est pas publié (icône œil ou initialisation du stock).",
        accountingImpact: "Aucune écriture comptable : le stock saisi ici n'a ni coût d'achat ni facture — les marges et le registre 606 ne voient pas ces unités.",
      },
      {
        label: "Crayon → « Enregistrer » (modifier une fiche)",
        where: "Icône crayon en bout de ligne, puis bouton « Enregistrer » en bas du tiroir",
        does: "Met à jour la fiche : nom, adresse de la page, description, prix, stock, marque, gamme, photo, étiquettes.",
        effects: [
          "Les champs modifiés sont écrits dans la base de données ; le site public les reflète en une minute environ.",
          "Changer le nom ne change PAS l'adresse de la page : elle garde sa valeur d'origine, sauf si vous la modifiez vous-même (refusée si déjà prise par un autre produit).",
          "Changer la marque seule est ignoré sans message : en modification, le changement ne prend effet que si vous choisissez aussi une gamme de la nouvelle marque (contrairement à la création, aucune gamme n'est attribuée automatiquement).",
          "Téléverser une nouvelle photo efface d'abord TOUTES les photos existantes du produit (certaines fiches importées en ont plusieurs), puis publie la seule nouvelle. Les anciennes sont perdues définitivement.",
          "Les étiquettes cochées remplacent intégralement les anciennes.",
          "Les réservations déjà passées gardent le prix figé au moment de la réservation : seul l'avenir prend le nouveau prix.",
          "Modifier le chiffre de stock ici l'écrase tel quel, sans coût d'achat ni trace pour la comptabilité — pour une livraison fournisseur, passez par la réception de l'écran Stock.",
        ],
        severity: "caution",
        undo: "Rouvrez la fiche et ressaisissez les anciennes valeurs. Exception : les photos remplacées sont effacées définitivement.",
        audited: true,
        publicImpact: "Prix, textes, photo et étiquettes changent sur le site public en une minute environ.",
        accountingImpact: "Aucune écriture comptable : le stock écrasé ici n'a ni coût d'achat ni trace au registre 606, et les ventes passées gardent leur prix et leur coût figés.",
      },
      {
        label: "Corbeille (supprimer un produit)",
        where: "Icône corbeille en bout de ligne, avec fenêtre de confirmation",
        does: "Supprime définitivement la fiche produit et tout ce qui s'y rattache.",
        effects: [
          "Une fenêtre demande confirmation ; après validation, aucun retour possible.",
          "Les photos du produit sont effacées de l'espace de stockage public, puis la fiche est supprimée de la base de données.",
          "Le produit disparaît du site public, des paniers en cours des clients (sans les prévenir) et de leurs listes de favoris ; ses avis clients sont supprimés.",
          "L'historique des réceptions de stock du produit est effacé : les achats correspondants disparaissent du registre 606 des mois passés. Le registre de ses pertes déclarées est effacé aussi (les charges déjà comptées restent dans la comptabilité).",
          "Les ventes et réservations passées sont conservées : chaque ligne garde le nom et le prix enregistrés au moment de la vente. Le chiffre d'affaires et les marges des mois passés ne bougent pas.",
          "Recréer le produit à la main redonne une fiche vierge : l'historique effacé ne revient pas.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "Le produit disparaît du catalogue, des paniers en cours et des favoris des clients.",
        accountingImpact: "Les achats du produit disparaissent du registre 606 des mois passés ; le chiffre d'affaires et les marges déjà enregistrés restent intacts.",
      },
      {
        label: "« Activer le produit » (mise en ligne)",
        where: "Écran Stock → tiroir « Initialiser ce produit » (case « Activer ») — ou l'icône œil sur la ligne de l'écran Produits",
        does: "Rend un produit caché visible et réservable sur le site public.",
        effects: [
          "Le produit apparaît au catalogue public, dans la recherche et sur sa propre page en une minute environ.",
          "C'est une action volontaire et séparée : le formulaire de modification de l'écran Produits ne peut pas changer la visibilité d'un produit.",
          "Le tiroir regroupe tout ce qu'il faut faire avant : stock compté, coût d'achat éventuel, vrai prix de vente. Attention : la case « Activer le produit » est cochée d'office à l'ouverture du tiroir — décochez-la si ces points ne sont pas encore réglés.",
          "L'inverse existe aussi : l'icône œil de l'écran Produits masque un produit en ligne à tout moment (et le republie) — chaque bascule est consignée au journal d'audit.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "Le produit devient visible et réservable par tous les visiteurs du site.",
      },
    ],
    flows: [
      {
        title: "La vie d'une fiche produit",
        lanes: [
          [
            {
              label: "Créée dans cet écran",
              tone: "neutral",
              note: "En ligne dès l'enregistrement, sans étape de relecture.",
            },
            {
              label: "En ligne",
              tone: "ok",
              note: "Visible au catalogue, réservable, présente dans la recherche.",
            },
            {
              label: "Supprimée",
              tone: "bad",
              note: "Disparaît du site, des paniers et des favoris ; historique d'achats effacé.",
            },
          ],
          [
            {
              label: "Cachée (hors ligne)",
              tone: "warn",
              note: "Présente dans l'admin mais invisible du public — souvent avec un prix provisoire à corriger.",
            },
            {
              label: "Initialisée — écran Stock",
              tone: "neutral",
              note: "Stock compté, coût d'achat et vrai prix de vente posés.",
            },
            {
              label: "Mise en ligne",
              tone: "ok",
              note: "Action volontaire, consignée dans le journal d'audit.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Beaucoup de fiches importées affichent un prix provisoire de 100 pesos posé lors du chargement du catalogue. Remplacez-le par le vrai prix de vente avant de mettre le produit en avant ou en ligne.",
      "Un produit créé depuis cet écran naît HORS LIGNE : il reste invisible du public tant qu'il n'est pas publié (icône œil de la liste ou initialisation du stock). Préparez quand même le vrai prix et le bon stock avant de le publier.",
      "La colonne « Statut » indique l'état du stock (Normal / Stock bas / Rupture). La visibilité se lit à part : un produit hors ligne porte une pastille « Hors ligne » et sa ligne est estompée.",
      "L'icône œil de chaque ligne publie ou re-cache le produit à tout moment (chaque bascule est consignée au journal d'audit). La mise en ligne peut aussi se faire depuis l'écran Stock (tiroir « Initialiser ce produit »).",
      "Le formulaire n'accepte qu'UNE photo, au format PNG. En téléverser une nouvelle efface toutes les photos existantes de la fiche — y compris les fiches importées qui en avaient plusieurs.",
      "Modifier le stock depuis la fiche n'enregistre ni coût d'achat ni facture : la comptabilité (marges, registre 606) reste aveugle sur ces unités. Pour une vraie livraison, utilisez « Réception » dans l'écran Stock.",
      "La recherche de la liste est sensible aux accents et porte sur le nom et la description (pas sur une référence interne, malgré la mention « SKU » du champ).",
      "Le prix barré et les remises affichés sur le site viennent de l'écran Promotions, pas de ce formulaire : le prix saisi ici est le prix de base.",
      "Les badges « nouveauté » et « vedette », le conseil du pharmacien et les caractéristiques détaillées (contenance, texture…) ne se règlent dans aucun écran du panneau pour l'instant. Les informations de filtrage (type de peau, besoin…) passent par les étiquettes.",
    ],
  },
]
