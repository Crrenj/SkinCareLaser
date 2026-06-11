import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "tags",
    navLabel: "Étiquettes",
    title: "Étiquettes — les filtres et besoins du catalogue",
    route: "/admin/tags",
    intro:
      "Les étiquettes classent les produits par thème : besoins (hydratation, anti-âge…), types de peau, ingrédients, etc. Elles s'organisent en deux niveaux : des types d'étiquettes (les familles), qui contiennent chacun des étiquettes. Cet écran sert à créer, renommer et supprimer types et étiquettes. Attention : on n'attache PAS les étiquettes aux produits ici — cela se fait dans la fiche de chaque produit, sur la page Produits. Ce que vous faites ici alimente le site public : les filtres du catalogue, les pages « Besoins » et les cartes « Besoins » de la page d'accueil. (Les étiquettes ne sont en revanche jamais affichées sur les fiches produit du site : elles servent à filtrer, pas à décrire.)",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Catalogue / Étiquettes", hotspot: 1 },
            { w: 4, kind: "button", label: "+ Nouveau type d'étiquette", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Types", hotspot: 3 },
            { w: 3, kind: "kpi", label: "Étiquettes" },
            { w: 3, kind: "kpi", label: "● Besoins" },
            { w: 3, kind: "kpi", label: "● Types de peau" },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "panel", label: "● Besoins · 14 étiquettes", hotspot: 4 },
            { w: 2, kind: "button", label: "✎ · 🗑", hotspot: 5 },
            { w: 3, kind: "button", label: "+ Étiquette", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Hydratation · adresse de page · ✎ 🗑 au survol", hotspot: 7 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "● Types de peau — carte suivante, même structure" },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "En-tête",
        desc: "Fil d'ariane « Admin / Catalogue / Étiquettes » et titre de la page. Rien à modifier ici.",
      },
      {
        n: 2,
        label: "Bouton « Nouveau type d'étiquette »",
        desc: "Ouvre une fenêtre pour créer une nouvelle famille : nom, adresse de page (remplie automatiquement pendant que vous tapez le nom), icône, couleur, et — en option — une première étiquette créée dans la foulée.",
      },
      {
        n: 3,
        label: "Cartes de chiffres",
        desc: "Nombre de types, nombre total d'étiquettes, puis le détail des deux premiers types. Recalculées à chaque affichage — lecture seule.",
      },
      {
        n: 4,
        label: "Carte d'un type",
        desc: "Chaque type d'étiquette a sa propre carte : pastille de couleur, nom, nombre d'étiquettes et adresse de page. Les étiquettes du type sont listées en dessous.",
      },
      {
        n: 5,
        label: "Crayon et corbeille du type",
        desc: "Le crayon modifie le type (nom, adresse, icône, couleur). La corbeille le supprime — elle est grisée et inutilisable tant que le type contient encore au moins une étiquette.",
      },
      {
        n: 6,
        label: "Bouton « Étiquette »",
        desc: "Crée une nouvelle étiquette directement dans ce type. La fenêtre qui s'ouvre s'intitule « Nouveau tag » — tag et étiquette désignent la même chose.",
      },
      {
        n: 7,
        label: "Ligne d'étiquette",
        desc: "Nom de l'étiquette et, en dessous, son adresse de page. Le crayon (modifier) et la corbeille (supprimer) n'apparaissent qu'au survol de la ligne avec la souris.",
      },
    ],
    workflows: [
      {
        title: "Créer une nouvelle famille de filtres",
        steps: [
          {
            title: "Créer le type",
            body: "Cliquez sur « Nouveau type d'étiquette ». Donnez-lui un nom clair (l'adresse se remplit toute seule), choisissez une icône et une couleur — elles ne servent qu'à cet écran. Vous pouvez créer la première étiquette dans la même fenêtre.",
          },
          {
            title: "Ajouter ses étiquettes",
            body: "Sur la carte du nouveau type, cliquez sur « Étiquette » et créez les valeurs une par une (par exemple, pour un type « Texture » : crème, gel, huile…).",
          },
          {
            title: "Étiqueter les produits",
            body: "Allez sur la page Produits, ouvrez chaque fiche concernée et cochez les nouvelles étiquettes dans la zone prévue. C'est cette étape qui relie les produits aux filtres.",
          },
          {
            title: "Vérifier sur le site",
            body: "Dans le catalogue public, la nouvelle famille de filtres apparaît dans la colonne de gauche en une minute environ. Attention : les étiquettes y figurent même sans aucun produit (le compteur affiche 0).",
          },
        ],
      },
      {
        title: "Ajouter un nouveau besoin (ex. « Peaux sensibles »)",
        steps: [
          {
            title: "Créer l'étiquette dans le type « Besoins »",
            body: "Sur la carte « Besoins », cliquez sur « Étiquette », tapez le nom et vérifiez l'adresse proposée : elle formera le lien public /besoins/… de la page dédiée à ce besoin.",
          },
          {
            title: "Associer des produits",
            body: "Sur la page Produits, cochez cette étiquette sur tous les produits concernés. Sans produit associé, la page du besoin existe mais s'affiche vide.",
          },
          {
            title: "Savoir ce qui ne bouge pas tout seul",
            body: "Le menu « Besoins » de la barre de navigation du site est une liste fixe de cinq entrées : votre nouveau besoin n'y apparaîtra pas automatiquement. Les clients y accèdent par les filtres du catalogue ou par un lien direct.",
          },
        ],
      },
      {
        title: "Supprimer une étiquette devenue inutile",
        steps: [
          {
            title: "Mesurer l'impact avant de cliquer",
            body: "La suppression retire instantanément l'étiquette de TOUS les produits qui la portent, sans liste de contrôle préalable. Si vous hésitez, vérifiez d'abord dans le catalogue public combien de produits sont concernés via le filtre correspondant.",
          },
          {
            title: "Supprimer et confirmer",
            body: "Survolez la ligne de l'étiquette, cliquez sur la corbeille, puis confirmez dans la fenêtre qui rappelle que l'étiquette sera retirée de tous les produits associés.",
          },
          {
            title: "Comprendre que c'est définitif",
            body: "Recréer plus tard une étiquette au même nom ne ramène PAS les liens avec les produits : il faudrait ré-étiqueter chaque fiche une par une sur la page Produits.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Nouveau type d'étiquette",
        where: "Bouton en haut à droite de l'écran (ouvre une fenêtre au centre)",
        does: "Crée une nouvelle famille d'étiquettes : nom, adresse de page, icône, couleur, et en option une première étiquette.",
        effects: [
          "Le type est enregistré dans la base de données ; si le nom ou l'adresse est déjà pris par un autre type, la création est refusée avec un message.",
          "Si vous avez rempli le champ « Tag initial », une première étiquette est créée dans la foulée à l'intérieur du type.",
          "Le type apparaît aussitôt comme une nouvelle carte sur cet écran et dans les compteurs.",
          "Tant que le type ne contient aucune étiquette, il est invisible des clients. Dès qu'il en contient une, une nouvelle famille de filtres apparaît dans le catalogue public, en une minute environ.",
          "Le titre de cette famille côté client est dérivé de l'adresse du type (tirets remplacés par des espaces) — pas du nom saisi ici. Pour les familles historiques (besoins, types de peau, ingrédients…), le site affiche sa propre traduction.",
        ],
        severity: "caution",
        undo: "Supprimez d'abord l'éventuelle étiquette initiale, puis le type lui-même avec la corbeille.",
        audited: true,
        publicImpact: "Avec au moins une étiquette, une nouvelle famille de filtres apparaît dans le catalogue public en une minute environ.",
      },
      {
        label: "Modifier le type (crayon)",
        where: "Icône crayon dans l'en-tête de chaque carte de type",
        does: "Change le nom, l'adresse de page, l'icône et la couleur du type.",
        effects: [
          "Le nom, l'icône et la couleur ne changent l'affichage que sur cet écran d'administration — ils ne sont jamais montrés aux clients.",
          "Si le nouveau nom ou la nouvelle adresse est déjà pris par un autre type, la modification est refusée avec un message.",
          "Changer l'adresse d'un type que vous avez créé vous-même est peu risqué : seuls le titre de la famille de filtres du catalogue et les liens de filtre déjà partagés en dépendent.",
          "En revanche, ne changez pas l'adresse des types historiques. Celle de « types-peau » est utilisée telle quelle par le menu « Catalogue » de la barre de navigation du site (colonne types de peau) : la changer rendrait ces liens de menu inopérants. Et celles de « types-peau », « ingredients » et « categories » déclenchent le titre traduit de la famille dans les filtres.",
          "EXCEPTION CRITIQUE : ne changez jamais l'adresse du type « besoins ». Toutes les pages publiques /besoins/… et les liens du menu « Besoins » du site reposent sur cette adresse exacte : la changer afficherait « page introuvable » partout, et les cartes « Besoins » de la page d'accueil mèneraient vers un catalogue non filtré.",
        ],
        severity: "caution",
        undo: "Rouvrez le type avec le crayon et remettez les anciennes valeurs, en particulier l'ancienne adresse.",
        audited: true,
        publicImpact: "Changer l'adresse du type « besoins » casserait toutes les pages /besoins/… du site.",
      },
      {
        label: "Supprimer le type (corbeille)",
        where: "Icône corbeille dans l'en-tête de chaque carte de type",
        does: "Supprime définitivement un type d'étiquette VIDE, après confirmation.",
        effects: [
          "La corbeille est grisée et inutilisable tant que le type contient au moins une étiquette ; même en forçant, le serveur refuse avec le message « Impossible de supprimer ce type car il contient des tags ». Il faut d'abord supprimer ses étiquettes une par une.",
          "La fenêtre de confirmation annonce que « ce type et toutes ses étiquettes seront supprimés » — en réalité, la suppression n'est possible que si le type est déjà vide. Aucune étiquette ne peut donc disparaître par cette action.",
          "Si le type est vide, il est effacé définitivement de la base de données et disparaît de l'écran et des compteurs.",
          "Aucun impact sur le site public : un type sans étiquette n'y était de toute façon pas affiché.",
        ],
        severity: "caution",
        undo: "Recréez un type avec le même nom, la même adresse, la même icône et la même couleur : rien d'autre n'était enregistré.",
        audited: true,
      },
      {
        label: "Étiquette (bouton « + » de chaque carte)",
        where: "En-tête de chaque carte de type (ouvre la fenêtre « Nouveau tag »)",
        does: "Crée une étiquette dans ce type, avec un nom et une adresse de page.",
        effects: [
          "L'étiquette est enregistrée dans la base de données, rattachée au type de la carte (le type n'est pas modifiable dans la fenêtre).",
          "L'adresse se remplit automatiquement depuis le nom ; deux étiquettes du même type ne peuvent pas partager la même adresse (message « Ce tag existe déjà »), mais deux types différents le peuvent.",
          "L'étiquette apparaît aussitôt dans la liste de la carte et dans les compteurs.",
          "Elle apparaît dans les filtres du catalogue public en une minute environ — MÊME sans aucun produit associé (le compteur du filtre affiche alors 0).",
          "Si elle est créée dans le type « Besoins », une page publique /besoins/… devient accessible à son adresse (vide tant qu'aucun produit ne porte l'étiquette).",
          "Elle devient cochable sur les fiches produit de la page Produits : c'est là, et pas ici, qu'on l'attache aux produits.",
        ],
        severity: "caution",
        undo: "Supprimez l'étiquette avec la corbeille — sans conséquence tant qu'aucun produit ne lui a été associé.",
        audited: true,
        publicImpact: "L'étiquette apparaît dans les filtres du catalogue public en une minute environ, même avec zéro produit.",
      },
      {
        label: "Modifier l'étiquette (crayon)",
        where: "Icône crayon au survol de chaque ligne d'étiquette",
        does: "Change le nom et l'adresse de page de l'étiquette. Le type d'appartenance, lui, n'est pas modifiable.",
        effects: [
          "Le nouveau nom remplace l'ancien partout où il est affiché : filtres du catalogue, titre de la page « Besoins » et carte d'accueil le cas échéant (les fiches produit, elles, n'affichent pas les étiquettes). Le site public suit en une minute environ.",
          "Contrairement à la création, l'adresse ne suit plus le nom : elle reste telle quelle tant que vous ne la changez pas vous-même — c'est voulu, pour ne pas casser les liens existants.",
          "Si vous changez l'adresse d'une étiquette du type « Besoins », sa page publique /besoins/… déménage : l'ancienne adresse affiche « page introuvable » (liens déjà partagés et résultats Google compris).",
          "Si la nouvelle adresse est déjà prise par une autre étiquette du même type, la modification est refusée avec un message.",
          "Les produits associés le restent : seuls le nom et l'adresse changent, aucun lien n'est perdu.",
          "Il est impossible de déplacer une étiquette vers un autre type : il faudrait la supprimer puis la recréer ailleurs — en perdant ses liens avec les produits.",
        ],
        severity: "caution",
        undo: "Rouvrez l'étiquette avec le crayon et remettez l'ancien nom et l'ancienne adresse.",
        audited: true,
        publicImpact: "Le nom change partout sur le site ; un changement d'adresse casse les anciens liens vers la page du besoin.",
      },
      {
        label: "Supprimer l'étiquette (corbeille)",
        where: "Icône corbeille au survol de chaque ligne d'étiquette",
        does: "Supprime définitivement l'étiquette, après confirmation.",
        effects: [
          "Une fenêtre de confirmation prévient : « Cette étiquette sera retirée de tous les produits associés ».",
          "La suppression efface l'étiquette ET tous ses liens avec les produits, automatiquement et d'un seul coup — qu'elle soit posée sur 1 ou 100 produits, sans liste de contrôle préalable.",
          "Recréer plus tard une étiquette au même nom ne restaure RIEN : les produits ne la retrouvent pas, il faut ré-étiqueter chaque fiche à la main sur la page Produits.",
          "Sur le site public (en une minute environ) : l'étiquette disparaît des filtres du catalogue ; si c'était un besoin, sa page /besoins/… affiche « page introuvable ».",
          "Si l'étiquette faisait partie des trois besoins mis en avant sur la page d'accueil, sa carte disparaît et l'accueil bascule sur une sélection de secours prédéfinie.",
          "Si c'était l'un des cinq besoins du menu « Besoins » de la barre de navigation (hydratation, anti-âge, protection solaire, acné, taches), le lien du menu reste affiché mais mène à « page introuvable ».",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "L'étiquette et ses liens produits disparaissent du site ; une page /besoins/… peut devenir introuvable.",
      },
    ],
    gotchas: [
      "Cet écran gère le vocabulaire, pas les associations : pour attacher ou retirer une étiquette sur un produit, passez par la fiche du produit sur la page Produits.",
      "La suppression d'une étiquette est l'action la plus risquée de l'écran : elle détache instantanément tous les produits qui la portent, et recréer l'étiquette ne ramène pas ces liens. Aucune corbeille de récupération n'existe.",
      "Une étiquette apparaît dans les filtres du catalogue public même sans aucun produit (compteur 0). Évitez de créer des étiquettes « pour plus tard » : les clients les voient.",
      "Le type « besoins » est spécial : son adresse alimente toutes les pages publiques /besoins/… et les liens des cartes « Besoins » de la page d'accueil. Ne changez jamais son adresse, et réfléchissez à deux fois avant de toucher aux étiquettes qu'il contient.",
      "Le menu « Besoins » de la barre de navigation du site est une liste fixe de cinq entrées (hydratation, anti-âge, protection solaire, acné, taches) : créer un nouveau besoin ne l'y ajoute pas, et supprimer ou changer l'adresse d'un de ces cinq-là casse le lien du menu.",
      "Les trois cartes « Besoins » de la page d'accueil correspondent à des étiquettes marquées « mises en avant » directement dans la base de données : ce réglage n'est PAS modifiable depuis cet écran — voyez avec le responsable technique pour changer la sélection.",
      "L'icône et la couleur d'un type ne servent qu'à repérer les cartes sur cet écran d'administration : les clients ne les voient jamais.",
      "La fenêtre de confirmation de suppression d'un type annonce que ses étiquettes seraient supprimées avec lui — c'est trompeur : en pratique, la corbeille d'un type n'est cliquable que s'il est déjà vide, et le serveur refuse de toute façon de supprimer un type qui contient des étiquettes.",
      "Une étiquette ne peut pas changer de type après sa création : le crayon ne modifie que le nom et l'adresse. La déplacer = supprimer puis recréer, en perdant les associations produits.",
      "Le site public se met à jour tout seul en une minute environ (catalogue, pages besoins, accueil). Inutile de recharger en boucle.",
      "Dans les fenêtres de création et de modification, « tag » et « étiquette » désignent exactement la même chose, et le champ « Slug » correspond à l'adresse de la page sur le site.",
    ],
  },
]
