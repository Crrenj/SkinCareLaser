import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "brands",
    navLabel: "Marques & gammes",
    title: "Marques et gammes — l'ossature du catalogue",
    route: "/admin/marques",
    intro:
      "Cet écran organise le catalogue en deux niveaux : chaque marque contient des gammes, et chaque produit est rattaché à une gamme (le rattachement du produit se fait sur la page Produits). Vous y créez, renommez et supprimez les marques et leurs gammes. Ce que vous faites ici se reflète sur le site public : la page « Marques », la page de chaque marque, les filtres du catalogue, les fiches produit et le bandeau de marques de la page d'accueil.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Catalogue / Marques", hotspot: 1 },
            { w: 4, kind: "button", label: "+ Ajouter une marque", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "Rechercher par nom ou slug…", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "kpi", label: "Marques", hotspot: 4 },
            { w: 4, kind: "kpi", label: "Gammes" },
            { w: 4, kind: "kpi", label: "Gammes / marque" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "› Marque · Slug · Gammes (+) · crayon · corbeille", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 1, kind: "text", label: "└" },
            { w: 11, kind: "table", label: "Gammes dépliées · crayon · corbeille", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "En-tête",
        desc: "Fil d'ariane « Admin / Catalogue / Marques » et titre de la page. Rien à modifier ici.",
      },
      {
        n: 2,
        label: "Bouton « Ajouter une marque »",
        desc: "Ouvre un volet à droite pour créer une nouvelle marque : nom + adresse de la page sur le site (le champ « Slug »). L'adresse se remplit toute seule pendant que vous tapez le nom.",
      },
      {
        n: 3,
        label: "Recherche",
        desc: "Filtre la liste des marques par nom ou par adresse de page, instantanément. C'est un simple filtre d'affichage : il ne modifie rien.",
      },
      {
        n: 4,
        label: "Trois cartes de chiffres",
        desc: "Nombre de marques, nombre total de gammes, et moyenne de gammes par marque. Recalculées à chaque affichage de la page — lecture seule.",
      },
      {
        n: 5,
        label: "Ligne de marque",
        desc: "De gauche à droite : la flèche déplie ou replie les gammes de la marque ; le nom ; l'adresse de page (colonne « Slug ») ; le nombre de gammes suivi d'un bouton « + » vert qui crée une gamme directement rattachée à cette marque ; puis le crayon (modifier) et la corbeille (supprimer).",
      },
      {
        n: 6,
        label: "Lignes de gammes",
        desc: "Quand une marque est dépliée, ses gammes apparaissent en dessous, légèrement décalées : nom, adresse de page, pastille « Gamme », puis crayon et corbeille propres à chaque gamme.",
      },
    ],
    workflows: [
      {
        title: "Référencer une nouvelle marque",
        steps: [
          {
            title: "Créer la marque",
            body: "Cliquez sur « Ajouter une marque ». Tapez le nom : l'adresse de page se remplit automatiquement. Vérifiez-la (elle formera le lien public /marques/...), puis validez.",
          },
          {
            title: "Créer sa première gamme",
            body: "Dans la ligne de la marque, cliquez sur le « + » vert de la colonne Gammes. La marque est déjà pré-remplie et non modifiable. Donnez un nom à la gamme et validez.",
          },
          {
            title: "Rattacher les produits",
            body: "Allez sur la page Produits pour créer ou modifier les produits et leur attribuer cette gamme. Sans produit actif, la marque et la gamme n'apparaissent pas encore dans les filtres du catalogue public.",
          },
          {
            title: "Vérifier sur le site",
            body: "La nouvelle marque apparaît sur la page publique « Marques » en quelques minutes, même sans produit. Évitez donc de créer la marque longtemps avant ses produits : sa carte afficherait « 0 produit ».",
          },
        ],
      },
      {
        title: "Renommer une marque sans casser les liens",
        steps: [
          {
            title: "Ouvrir la fiche",
            body: "Cliquez sur le crayon de la ligne de la marque.",
          },
          {
            title: "Changer uniquement le nom",
            body: "À la modification, l'adresse de page ne suit pas le nom : c'est voulu. Laissez-la telle quelle pour que les liens déjà partagés et référencés continuent de fonctionner.",
          },
          {
            title: "Enregistrer",
            body: "Le nouveau nom apparaît partout : dans l'administration tout de suite, sur le site public en une à cinq minutes selon les pages.",
          },
        ],
      },
      {
        title: "Supprimer une marque proprement",
        steps: [
          {
            title: "Vider les gammes de leurs produits",
            body: "Une gamme ne peut pas être supprimée tant qu'un produit y est rattaché — même un produit désactivé. Sur la page Produits, changez la gamme de ces produits ou supprimez-les.",
          },
          {
            title: "Supprimer chaque gamme",
            body: "Dépliez la marque et supprimez ses gammes une par une avec la corbeille. Tant qu'il reste une gamme, la suppression de la marque est refusée avec un message d'explication.",
          },
          {
            title: "Supprimer la marque",
            body: "Cliquez sur la corbeille de la marque et confirmez. La suppression est définitive ; la marque disparaît de la page publique « Marques » en quelques minutes.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Ajouter une marque",
        where: "Bouton en haut à droite de l'écran (ouvre un volet à droite)",
        does: "Crée une nouvelle marque avec un nom et une adresse de page sur le site.",
        effects: [
          "La marque est enregistrée dans la base de données ; l'adresse de page est mise en minuscules automatiquement.",
          "Si une autre marque porte déjà ce nom ou cette adresse, la création est refusée avec un message — rien n'est créé.",
          "La marque apparaît aussitôt dans la liste et dans les compteurs de l'écran.",
          "Elle apparaît sur la page publique « Marques » en cinq minutes au plus, même sans aucun produit (sa carte affiche alors 0 produit), ainsi que dans le bandeau de marques défilant de la page d'accueil (si cette section est activée).",
          "Elle n'apparaît dans les filtres du catalogue public que lorsqu'au moins un produit actif lui est rattaché via une gamme.",
          "Sa ligne reçoit aussitôt son propre bouton « + » pour lui créer des gammes ; elle apparaît aussi dans la liste des marques parentes quand vous modifiez une gamme existante.",
        ],
        severity: "caution",
        undo: "Supprimez la marque avec la corbeille : c'est possible sans obstacle tant qu'aucune gamme n'y est rattachée.",
        audited: true,
        publicImpact: "La marque devient visible sur la page publique « Marques » en quelques minutes, même vide.",
      },
      {
        label: "Modifier la marque (crayon)",
        where: "Icône crayon à droite de chaque ligne de marque",
        does: "Change le nom et/ou l'adresse de page de la marque.",
        effects: [
          "Le nouveau nom remplace l'ancien sur la liste admin, la page publique « Marques », la page de la marque, les filtres du catalogue, les fiches produit et le bandeau de la page d'accueil (une exception : le menu de navigation, voir les pièges).",
          "Le site public se met à jour tout seul en une à cinq minutes selon les pages.",
          "Si vous changez l'adresse de page, la page de la marque déménage : l'ancienne adresse affiche « page introuvable ». Les liens déjà partagés et les résultats Google pointent dans le vide jusqu'à leur mise à jour.",
          "Si le nom ou l'adresse est déjà pris par une autre marque, la modification est refusée avec un message.",
        ],
        severity: "caution",
        undo: "Rouvrez la fiche avec le crayon et remettez l'ancien nom et l'ancienne adresse.",
        audited: true,
        publicImpact: "Nom visible partout sur le site ; un changement d'adresse casse les anciens liens vers la page de la marque.",
      },
      {
        label: "Supprimer la marque (corbeille)",
        where: "Icône corbeille à droite de chaque ligne de marque",
        does: "Supprime définitivement la marque, après confirmation.",
        effects: [
          "Une fenêtre de confirmation s'affiche avant toute chose.",
          "La suppression est refusée tant que la marque contient au moins une gamme : un message vous demande de supprimer d'abord les gammes.",
          "Comme une gamme est elle-même protégée tant qu'elle a des produits, une marque qui a encore des produits ne peut jamais être supprimée par accident depuis cet écran.",
          "Si rien ne s'y oppose, la marque est effacée définitivement de la base de données.",
          "Elle disparaît de la liste, des compteurs, de la page publique « Marques » et du bandeau de la page d'accueil en quelques minutes.",
        ],
        severity: "danger",
        undo: "Recréez une marque avec exactement le même nom et la même adresse de page : sa page publique réapparaît à l'identique (le nom et l'adresse sont les deux seules informations de la marque que le site utilise).",
        audited: true,
        publicImpact: "La marque et sa page disparaissent du site public en quelques minutes.",
      },
      {
        label: "Ajouter une gamme (bouton « + » vert)",
        where: "Colonne Gammes de chaque ligne de marque (ouvre une fenêtre au centre)",
        does: "Crée une gamme rattachée à cette marque — la marque est pré-remplie et verrouillée.",
        effects: [
          "La gamme est enregistrée dans la base de données, rattachée à la marque.",
          "Si une gamme de la même marque utilise déjà cette adresse de page, la création est refusée (deux marques différentes peuvent en revanche avoir des gammes au même nom).",
          "La gamme apparaît dans la liste dépliée de la marque et dans les compteurs.",
          "Elle devient choisissable comme gamme d'un produit sur la page Produits.",
          "Elle n'apparaît dans le filtre « Gammes » du catalogue public que lorsqu'au moins un produit actif lui est rattaché — vide, elle est invisible des clients.",
        ],
        severity: "safe",
        undo: "Supprimez la gamme avec la corbeille : c'est possible sans obstacle tant qu'aucun produit n'y est rattaché.",
        audited: true,
      },
      {
        label: "Modifier la gamme (crayon)",
        where: "Icône crayon sur chaque ligne de gamme (marque dépliée)",
        does: "Change le nom, l'adresse de page, et — uniquement ici — la marque parente de la gamme.",
        effects: [
          "Le nouveau nom est repris par les filtres du catalogue et les fiches produit en une minute environ. L'adresse d'une gamme, elle, n'est affichée nulle part sur le site : la changer n'a pas d'effet public.",
          "Contrairement à la création, le choix de la marque parente est ici modifiable : changer de marque déplace la gamme ET tous ses produits sous l'autre marque.",
          "Après un déplacement, ces produits changent de page de marque sur le site public et de famille dans les filtres du catalogue.",
          "Si l'adresse de page est déjà prise par une autre gamme de la marque choisie, la modification est refusée avec un message.",
        ],
        severity: "caution",
        undo: "Rouvrez la gamme avec le crayon et remettez les anciennes valeurs, y compris la marque parente.",
        audited: true,
        publicImpact: "Le nom de la gamme alimente les filtres du catalogue ; un changement de marque parente déplace tous ses produits sous l'autre marque sur le site.",
      },
      {
        label: "Supprimer la gamme (corbeille)",
        where: "Icône corbeille sur chaque ligne de gamme (marque dépliée)",
        does: "Supprime définitivement la gamme, après confirmation.",
        effects: [
          "Une fenêtre de confirmation s'affiche avant toute chose.",
          "La suppression est refusée tant qu'au moins un produit est rattaché à la gamme — les produits désactivés comptent aussi. Il faut d'abord changer la gamme de ces produits ou les supprimer sur la page Produits.",
          "Si rien ne s'y oppose, la gamme est effacée définitivement de la base de données.",
          "Si c'était la dernière gamme de la marque, la marque redevient supprimable à son tour.",
        ],
        severity: "danger",
        undo: "Recréez une gamme avec le même nom et la même adresse de page, rattachée à la même marque.",
        audited: true,
      },
    ],
    gotchas: [
      "Il n'y a pas de logo de marque à téléverser sur cet écran : sur la page publique « Marques », la carte de chaque marque s'illustre automatiquement avec la photo d'un de ses produits actifs. Pour changer cette image, travaillez les photos des produits.",
      "L'adresse de page (colonne « Slug ») se génère toute seule depuis le nom à la création, mais ne suit plus le nom à la modification — c'est voulu, pour ne pas casser les liens existants. Évitez de la changer pour une marque déjà publiée. Pour une gamme, cette adresse est un simple identifiant interne : une gamme n'a pas de page à elle sur le site, et les filtres du catalogue se basent sur son nom.",
      "Une marque créée sans produit apparaît quand même sur la page publique « Marques », avec « 0 produit » sur sa carte. Créez la marque, ses gammes et ses produits dans la foulée.",
      "Les filtres du catalogue public n'affichent une marque ou une gamme que si elle a au moins un produit actif. Une gamme vide est invisible des clients.",
      "Les suppressions sont définitives : il n'existe aucune corbeille de récupération. Les garde-fous bloquent cependant la suppression d'une marque qui a des gammes, et d'une gamme qui a des produits — y compris des produits désactivés.",
      "Le site public se met à jour tout seul : la page « Marques » en cinq minutes au plus, la page d'une marque et le catalogue en une minute environ. Inutile de recharger en boucle.",
      "Deux marques ne peuvent pas partager le même nom ni la même adresse de page. Deux gammes de la même marque ne peuvent pas partager la même adresse, mais deux marques différentes peuvent avoir des gammes au même nom.",
      "La barre de recherche en haut de l'écran filtre uniquement l'affichage de la liste : elle ne modifie rien et ne touche pas au site public.",
      "Le grand menu « Catalogue » de la navigation publique met en avant quatre marques (Avène, ISDIN, Filorga, Uriage) écrites en dur dans le code : renommer l'une d'elles ou changer son adresse ne met pas ce menu à jour, et son lien peut alors mener à « page introuvable ». Signalez-le au développeur si l'une de ces quatre marques change.",
    ],
  },
]
