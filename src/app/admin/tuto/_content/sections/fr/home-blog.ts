import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "home",
    navLabel: "Page d'accueil",
    title: "Page d'accueil — sections, bannières promo et aperçu",
    route: "/admin/annonce",
    intro:
      "Cet écran pilote tout ce qui s'affiche sur la page d'accueil du site public. Il comporte deux blocs : « Sections de l'accueil » (l'ordre et la visibilité des huit grandes sections : héro, meilleures ventes, par besoin, citation pharmacien, marques, expertise, routine, bannières promo) et « Bannières promo » (les encarts publicitaires que vous créez vous-même, en trois formats). Un bouton « Aperçu » affiche la vraie page d'accueil dans un cadre réduit, telle que les clients la voient. Tout changement ici est visible par tous les visiteurs du site.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 6, kind: "text", label: "Admin / Opérations / Page d'accueil" },
            { w: 3, kind: "button", label: "Aperçu", hotspot: 1 },
            { w: 3, kind: "button", label: "+ Créer une bannière", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Aperçu — page d'accueil (site réduit dans un cadre, flèche pour rafraîchir)", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "panel", label: "Sections de l'accueil : n° · nom · Visible/Masquée · œil · flèches ↑↓", hotspot: 4 },
            { w: 3, kind: "button", label: "Enregistrer l'ordre", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Bannières promo : vignette · titre · badge En ligne/Hors ligne · ↑↓ · œil · crayon · corbeille", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Volet bannière : type (editorial/hero/quote) · Visible sur le site · contenu · image et lien · guide des types", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Bouton « Aperçu »",
        desc: "Affiche ou masque le cadre d'aperçu en haut de l'écran. C'est la vraie page d'accueil (version française) en miniature : ce que vous voyez est ce que les clients voient.",
      },
      {
        n: 2,
        label: "Bouton « Créer une bannière »",
        desc: "Ouvre le volet de création d'une bannière à droite. Rien n'est enregistré tant que vous ne cliquez pas « Créer la bannière » en bas du volet.",
      },
      {
        n: 3,
        label: "Cadre d'aperçu",
        desc: "Montre la version enregistrée de l'accueil. Après un enregistrement, patientez quelques instants puis cliquez la petite flèche en haut à droite du cadre pour le recharger. S'il n'y a aucune bannière en ligne, un message l'indique sous le cadre.",
      },
      {
        n: 4,
        label: "Panneau « Sections de l'accueil »",
        desc: "Les huit sections de la page d'accueil, dans leur ordre d'affichage. L'œil affiche ou masque une section, les flèches la montent ou la descendent. Une section masquée apparaît grisée avec la mention « Masquée ». Les sections ne peuvent pas être supprimées.",
      },
      {
        n: 5,
        label: "Bouton « Enregistrer l'ordre »",
        desc: "Important : dans ce panneau, les flèches et l'œil ne font que préparer le changement. Rien n'est appliqué tant que vous ne cliquez pas ce bouton (il reste grisé s'il n'y a rien à enregistrer).",
      },
      {
        n: 6,
        label: "Liste des bannières promo",
        desc: "Une ligne par bannière : vignette, titre (cliquable pour modifier), badge « En ligne » ou « Hors ligne », puis les boutons : flèches pour l'ordre, œil pour activer/désactiver, crayon pour modifier, corbeille pour supprimer. Contrairement au panneau du dessus, ces boutons enregistrent immédiatement, sans bouton de confirmation d'ordre.",
      },
      {
        n: 7,
        label: "Volet de création / modification d'une bannière",
        desc: "De haut en bas : le choix du type (editorial, hero ou quote), l'interrupteur « Visible sur le site », le bloc Contenu (titre, description ou citation, et pour editorial le côté de l'image, pour quote la signature : nom, titre, photo), le bloc Image et lien (image + destination et texte du bouton), et tout en bas le « Guide des types » avec trois schémas qui montrent où va chaque champ.",
      },
    ],
    workflows: [
      {
        title: "Mettre une bannière promotionnelle en ligne",
        steps: [
          {
            title: "Créer la bannière",
            body: "Cliquez « Créer une bannière » et choisissez le type : editorial (image + texte côte à côte), hero (grande image plein écran avec texte par-dessus) ou quote (citation sur fond sombre, avec signature).",
          },
          {
            title: "Remplir le contenu",
            body: "Le titre est toujours obligatoire. L'image et la description le sont aussi, sauf pour le type quote (la description y devient la citation ; l'image principale n'est pas affichée sur ce type, inutile d'en envoyer une — seule la photo de la signature apparaît). Le guide en bas du volet montre où chaque champ apparaîtra.",
          },
          {
            title: "Ajouter le bouton (facultatif)",
            body: "« CTA destination » est l'adresse vers laquelle le bouton envoie le client (par exemple une page du catalogue), « CTA label » est le texte du bouton. Sans ces champs, la bannière s'affiche sans bouton.",
          },
          {
            title: "Enregistrer",
            body: "Laissez « Visible sur le site » activé et cliquez « Créer la bannière ». Elle apparaît en bas de la liste avec le badge « En ligne ».",
          },
          {
            title: "Vérifier que la section est activée",
            body: "Dans le panneau « Sections de l'accueil », la ligne « Bannières promo » doit être marquée « Visible ». Sinon, aucune bannière n'apparaît sur le site, même « En ligne ».",
          },
          {
            title: "Contrôler sur le site",
            body: "Ouvrez l'aperçu (ou la page d'accueil publique) : la bannière apparaît en moins d'une minute. Cliquez la flèche de rafraîchissement du cadre si besoin.",
          },
        ],
      },
      {
        title: "Réorganiser ou masquer une section de l'accueil",
        steps: [
          {
            title: "Déplacer ou masquer",
            body: "Dans « Sections de l'accueil », utilisez les flèches pour changer l'ordre et l'œil pour masquer ou réafficher une section. Les lignes masquées passent en grisé.",
          },
          {
            title: "Enregistrer l'ordre",
            body: "Cliquez « Enregistrer l'ordre ». Tant que vous ne l'avez pas fait, rien n'est appliqué — si vous quittez la page avant, vos changements sont perdus.",
          },
          {
            title: "Vérifier",
            body: "Le site public prend le nouvel agencement immédiatement : rechargez la page d'accueil publique (ou l'aperçu) pour contrôler le résultat dans les trois langues.",
          },
        ],
      },
      {
        title: "Couper temporairement une bannière",
        steps: [
          {
            title: "Cliquer l'œil",
            body: "Dans la liste des bannières, cliquez l'œil de la ligne concernée. Le badge passe à « Hors ligne » immédiatement, sans étape de confirmation.",
          },
          {
            title: "Vérifier sur le site",
            body: "La bannière disparaît de la page d'accueil publique en moins d'une minute. La bannière et tout son contenu restent enregistrés.",
          },
          {
            title: "La remettre plus tard",
            body: "Re-cliquez l'œil : le badge repasse à « En ligne » et la bannière revient sur le site, à la même place dans l'ordre.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Enregistrer l'ordre des sections",
        where: "Panneau « Sections de l'accueil » : flèches + œil, puis bouton « Enregistrer l'ordre »",
        does: "Applique le nouvel ordre et la visibilité des huit sections de la page d'accueil. Les flèches et l'œil seuls ne font que préparer le changement : seul ce bouton enregistre.",
        effects: [
          "L'ordre et la visibilité sont enregistrés dans la base de données.",
          "La page d'accueil publique est régénérée immédiatement dans les trois langues : les visiteurs voient le nouvel agencement dès le prochain chargement.",
          "Une section masquée disparaît complètement de l'accueil (elle n'est pas supprimée : son contenu revient dès qu'elle est réaffichée).",
          "Masquer la section « Bannières promo » cache toutes les bannières d'un coup, même celles marquées « En ligne ».",
        ],
        severity: "caution",
        undo: "Remettez l'ordre et la visibilité souhaités, puis cliquez à nouveau « Enregistrer l'ordre » : l'effet est immédiat et rien n'est jamais perdu.",
        audited: true,
        publicImpact: "L'agencement de la page d'accueil change pour tous les visiteurs, immédiatement.",
      },
      {
        label: "Créer une bannière",
        where: "Bouton « Créer une bannière » en haut, puis « Créer la bannière » en bas du volet",
        does: "Enregistre un nouvel encart promotionnel (type editorial, hero ou quote) avec son titre, son texte, son image, son bouton éventuel et son état visible/masqué.",
        effects: [
          "La bannière est enregistrée dans la base de données et s'ajoute en fin de liste.",
          "Si « Visible sur le site » est activé ET que la section « Bannières promo » est marquée « Visible », elle apparaît sur la page d'accueil publique en moins d'une minute.",
          "Pour les types editorial et hero, l'enregistrement est refusé s'il manque l'image ou la description (un message l'indique). Pour le type quote, seuls le titre et la citation comptent : l'image principale n'est pas affichée sur le site pour ce type (seule la photo de la signature apparaît).",
        ],
        severity: "caution",
        undo: "Cliquez l'œil de la ligne pour la mettre « Hors ligne », ou supprimez-la avec la corbeille.",
        audited: true,
        publicImpact: "Un nouvel encart apparaît sur la page d'accueil pour tous les visiteurs, en moins d'une minute.",
      },
      {
        label: "Modifier une bannière",
        where: "Crayon en bout de ligne (ou clic sur le titre), puis « Enregistrer » en bas du volet",
        does: "Remplace le contenu de la bannière par ce qui est affiché dans le volet : type, titre, textes, image, bouton, état visible/masqué.",
        effects: [
          "Le nouveau contenu est enregistré et remplace l'ancien.",
          "La page d'accueil publique reflète la modification en moins d'une minute.",
          "Changer le type (par exemple editorial → quote) change complètement la mise en page de l'encart sur le site.",
        ],
        severity: "caution",
        undo: "Rouvrez la bannière et resaisissez les valeurs précédentes (notez-les avant de modifier : elles ne sont pas conservées ailleurs).",
        audited: true,
        publicImpact: "L'encart change d'apparence sur la page d'accueil en moins d'une minute.",
      },
      {
        label: "Activer / désactiver une bannière (œil)",
        where: "Œil sur la ligne de la bannière, dans la liste « Bannières promo »",
        does: "Bascule la bannière entre « En ligne » et « Hors ligne ». L'enregistrement est immédiat : pas de fenêtre de confirmation ni de bouton à cliquer ensuite.",
        effects: [
          "Le badge de la ligne change immédiatement.",
          "La bannière apparaît ou disparaît de la page d'accueil publique en moins d'une minute (à condition que la section « Bannières promo » soit visible).",
          "Tout le contenu de la bannière est conservé : c'est un simple interrupteur.",
        ],
        severity: "caution",
        undo: "Re-cliquez l'œil : la bannière revient exactement comme avant.",
        audited: true,
        publicImpact: "Affiche ou retire l'encart de la page d'accueil pour tous les visiteurs.",
      },
      {
        label: "Monter / descendre une bannière (flèches)",
        where: "Flèches ↑↓ sur la ligne de la bannière, dans la liste « Bannières promo »",
        does: "Échange la position de la bannière avec sa voisine. L'enregistrement est immédiat, sans confirmation.",
        effects: [
          "L'ordre de la liste change tout de suite dans l'admin.",
          "Sur la page d'accueil publique, les bannières s'affichent dans ce même ordre ; le changement est visible en moins d'une minute.",
        ],
        severity: "caution",
        undo: "Cliquez la flèche opposée pour revenir à l'ordre précédent.",
        audited: true,
        publicImpact: "L'ordre des encarts change sur la page d'accueil.",
      },
      {
        label: "Supprimer une bannière",
        where: "Corbeille en bout de ligne, puis « Oui, supprimer » dans la fenêtre de confirmation",
        does: "Efface définitivement la bannière de la base de données : titre, textes, réglages. Une fenêtre de confirmation s'affiche d'abord.",
        effects: [
          "La bannière disparaît de la liste et ne peut pas être restaurée : pour la remettre, il faudra la recréer entièrement (l'image elle-même reste dans l'espace de stockage, mais tout le reste est perdu).",
          "Elle disparaît de la page d'accueil publique en moins d'une minute.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "L'encart disparaît de la page d'accueil pour tous les visiteurs.",
      },
    ],
    gotchas: [
      "Deux logiques d'enregistrement cohabitent : le panneau « Sections de l'accueil » n'applique rien tant que vous n'avez pas cliqué « Enregistrer l'ordre », alors que les flèches et l'œil de la liste des bannières enregistrent immédiatement, sans confirmation.",
      "Une bannière « En ligne » reste invisible si la section « Bannières promo » est masquée dans le panneau du haut. Vérifiez toujours les deux.",
      "Le nouvel ordre des sections est appliqué immédiatement sur le site ; les changements de bannières peuvent mettre jusqu'à une minute à apparaître. Si vous ne voyez rien, attendez un peu et rechargez.",
      "L'aperçu montre la version enregistrée (en français) : il n'affiche jamais un volet en cours de saisie. Enregistrez d'abord, puis cliquez la flèche de rafraîchissement du cadre.",
      "Les huit sections de l'accueil ne peuvent pas être supprimées, seulement masquées ou déplacées. Évitez de masquer « Accueil (héro) » : c'est le tout premier écran que voient les clients.",
      "La section « Citation pharmacien » n'affiche quelque chose que si au moins un produit du catalogue a un conseil du pharmacien renseigné ; sinon elle reste vide même marquée « Visible ».",
      "Pour le type quote, le champ « Description » devient la citation elle-même et la signature (nom, titre, photo) s'affiche dessous ; le bouton n'existe pas sur ce type. Le côté de l'image (gauche/droite) ne concerne que le type editorial.",
      "La suppression d'une bannière est définitive : préférez l'œil (« Hors ligne ») si vous pensez la réutiliser plus tard.",
    ],
  },
  {
    id: "blog",
    navLabel: "Blog",
    title: "Blog — écrire, publier et retirer des articles",
    route: "/admin/blog",
    intro:
      "Cet écran gère les articles du blog du site public : conseils, actualités de la pharmacie, dossiers sur les soins. Un article est écrit dans une seule langue (français, espagnol ou anglais), avec un titre, une adresse de page, un contenu mis en forme dans un éditeur visuel, un extrait, une image de couverture et un auteur. Tant que la case « Publié » n'est pas cochée, l'article est un brouillon invisible des clients. Une fois publié, il apparaît sur le site en moins d'une minute.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "N articles" },
            { w: 4, kind: "button", label: "Nouvel article", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Liste : titre · badge Publié/Brouillon · langue · /adresse-de-la-page · date", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "panel", label: "Boutons « Modifier »", hotspot: 3 },
            { w: 6, kind: "panel", label: "« Supprimer » — immédiat, sans confirmation", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Fenêtre article : titre · adresse · langue · auteur · extrait · éditeur de texte · couverture · case Publié", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Bouton « Nouvel article »",
        desc: "Ouvre la fenêtre de rédaction vide. Rien n'est enregistré tant que vous ne cliquez pas « Enregistrer » en bas.",
      },
      {
        n: 2,
        label: "Liste des articles",
        desc: "Une ligne par article, du plus récent au plus ancien : le titre (cliquable pour modifier), le badge « Publié » (vert) ou « Brouillon » (gris), l'étiquette de langue (FR/ES/EN), l'adresse de la page et la date de publication.",
      },
      {
        n: 3,
        label: "Bouton « Modifier »",
        desc: "Ouvre la fenêtre de rédaction pré-remplie avec le contenu actuel de l'article (cliquer le titre fait pareil).",
      },
      {
        n: 4,
        label: "Bouton « Supprimer »",
        desc: "Attention : la suppression part immédiatement au clic, sans fenêtre de confirmation. L'article est effacé définitivement.",
      },
      {
        n: 5,
        label: "Fenêtre de rédaction",
        desc: "De haut en bas : Titre (à la création, il remplit automatiquement l'adresse de la page) ; adresse de la page ; Langue et Auteur ; Extrait (le résumé affiché sur la liste du blog) ; Contenu (éditeur visuel : gras, italique, titres, listes, citation, lien, image, annuler/rétablir) ; Image de couverture (envoyée depuis votre ordinateur) ; et la case « Publié ».",
      },
    ],
    workflows: [
      {
        title: "Écrire et publier un article",
        steps: [
          {
            title: "Créer le brouillon",
            body: "Cliquez « Nouvel article » et tapez le titre : l'adresse de la page se remplit toute seule. Choisissez la langue de rédaction et l'auteur.",
          },
          {
            title: "Rédiger le contenu",
            body: "Écrivez dans l'éditeur visuel : la barre d'outils permet le gras, l'italique, deux niveaux de titres, les listes, les citations, les liens et l'insertion d'images. Pas besoin de connaissances techniques.",
          },
          {
            title: "Soigner l'extrait et la couverture",
            body: "L'extrait est le petit résumé affiché sur la page du blog ; l'image de couverture illustre la vignette et le haut de l'article. Les deux sont facultatifs mais recommandés.",
          },
          {
            title: "Publier",
            body: "Cochez « Publié » puis cliquez « Enregistrer ». La date de publication est posée à ce moment-là.",
          },
          {
            title: "Vérifier sur le site",
            body: "L'article apparaît sur la page Blog du site public en moins d'une minute, avec une petite étiquette indiquant sa langue.",
          },
        ],
      },
      {
        title: "Corriger un article déjà publié",
        steps: [
          {
            title: "Ouvrir l'article",
            body: "Cliquez son titre ou le bouton « Modifier » : la fenêtre s'ouvre pré-remplie.",
          },
          {
            title: "Faire la correction",
            body: "Modifiez le texte, l'image ou l'extrait. Évitez de toucher à l'adresse de la page : la changer casserait les liens déjà partagés (l'ancienne adresse mènerait à une page introuvable).",
          },
          {
            title: "Enregistrer",
            body: "La version corrigée remplace l'ancienne sur le site en moins d'une minute. La date de publication d'origine est conservée.",
          },
        ],
      },
      {
        title: "Retirer un article du site sans le supprimer",
        steps: [
          {
            title: "Ouvrir l'article",
            body: "Cliquez « Modifier » sur la ligne de l'article publié.",
          },
          {
            title: "Décocher « Publié »",
            body: "Décochez la case en bas de la fenêtre, puis « Enregistrer ». Le badge repasse à « Brouillon ».",
          },
          {
            title: "Vérifier",
            body: "L'article disparaît de la page Blog en moins d'une minute (sa page directe devient introuvable). Tout son contenu reste conservé dans l'admin.",
          },
          {
            title: "Le republier plus tard",
            body: "Recochez « Publié » et enregistrez : l'article revient sur le site avec sa date de publication d'origine, qui ne change pas.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Créer un article",
        where: "Bouton « Nouvel article », puis « Enregistrer » en bas de la fenêtre",
        does: "Enregistre un nouvel article avec son titre, son adresse de page, sa langue, son contenu, son extrait, sa couverture, son auteur et son état publié ou brouillon.",
        effects: [
          "L'article est enregistré dans la base de données et apparaît en haut de la liste.",
          "Brouillon (case décochée) : invisible des clients, vous pouvez y revenir quand vous voulez.",
          "Publié (case cochée) : la date de publication est posée et l'article apparaît sur la page Blog du site en moins d'une minute.",
          "Le titre et l'adresse de la page sont obligatoires. Si l'adresse est déjà utilisée par un autre article, l'enregistrement est refusé avec un message.",
        ],
        severity: "caution",
        undo: "Décochez « Publié » pour le retirer du site, ou supprimez l'article.",
        audited: true,
        publicImpact: "S'il est publié, l'article apparaît sur la page Blog du site en moins d'une minute, dans toutes les versions du site.",
      },
      {
        label: "Modifier un article",
        where: "Titre de l'article ou bouton « Modifier », puis « Enregistrer »",
        does: "Remplace le contenu de l'article par ce qui est affiché dans la fenêtre (titre, adresse, langue, texte, extrait, couverture, auteur, état publié).",
        effects: [
          "La nouvelle version remplace l'ancienne — l'ancien texte n'est pas conservé.",
          "Si l'article est publié, la version corrigée est servie aux visiteurs en moins d'une minute.",
          "Changer l'adresse de la page rend l'ancienne adresse introuvable : les liens déjà partagés ne fonctionneront plus.",
          "La date de publication d'origine ne bouge pas, même après plusieurs modifications.",
        ],
        severity: "caution",
        undo: "Rouvrez l'article et resaisissez le texte précédent (il n'est pas conservé ailleurs : copiez-le avant une grosse refonte).",
        audited: true,
        publicImpact: "Les visiteurs voient la nouvelle version de l'article en moins d'une minute.",
      },
      {
        label: "Publier / dépublier (case « Publié »)",
        where: "Case « Publié » en bas de la fenêtre de rédaction, puis « Enregistrer »",
        does: "Met l'article en ligne ou le retire du site, sans toucher à son contenu. C'est l'interrupteur principal de l'article.",
        effects: [
          "Cochée : l'article apparaît sur la page Blog en moins d'une minute. À la toute première publication, la date de publication est posée ; elle ne changera plus ensuite, même après un retrait puis une republication.",
          "Décochée : l'article disparaît du site en moins d'une minute (sa page devient introuvable), mais tout est conservé dans l'admin avec le badge « Brouillon ».",
        ],
        severity: "caution",
        undo: "Recochez (ou décochez) la case et enregistrez à nouveau : rien n'est jamais perdu.",
        audited: true,
        publicImpact: "Fait apparaître ou disparaître l'article sur le site public, en moins d'une minute.",
      },
      {
        label: "Supprimer un article",
        where: "Bouton « Supprimer » en bout de ligne",
        does: "Efface définitivement l'article de la base de données. Attention : la suppression part immédiatement au clic, il n'y a PAS de fenêtre de confirmation.",
        effects: [
          "L'article disparaît de la liste et ne peut pas être restauré : titre, texte et extrait sont perdus (les images déjà envoyées restent dans l'espace de stockage, mais il faudra tout réécrire).",
          "S'il était publié, il disparaît du site en moins d'une minute et son adresse devient introuvable.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "L'article disparaît de la page Blog et son adresse mène à une page introuvable.",
      },
    ],
    flows: [
      {
        title: "Vie d'un article",
        lanes: [
          [
            {
              label: "Brouillon",
              tone: "neutral",
              note: "Visible uniquement dans l'admin. Vous pouvez le retravailler autant que nécessaire.",
            },
            {
              label: "Publié",
              tone: "ok",
              note: "En ligne sur la page Blog en moins d'une minute. La date de publication est posée à la première publication et ne change plus.",
            },
            {
              label: "Retiré (re-brouillon)",
              tone: "warn",
              note: "Case « Publié » décochée : l'article quitte le site mais reste conservé dans l'admin. Recochez pour le republier.",
            },
          ],
          [
            {
              label: "Supprimé",
              tone: "bad",
              note: "Effacé définitivement, sans confirmation préalable. Impossible à restaurer.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "« Supprimer » efface l'article immédiatement, SANS fenêtre de confirmation. Si vous hésitez, décochez plutôt « Publié » : l'article quitte le site mais reste récupérable.",
      "L'adresse de la page se remplit automatiquement depuis le titre à la création seulement ; en modification, elle ne suit plus le titre. La changer sur un article publié casse les liens déjà partagés.",
      "Deux articles ne peuvent pas avoir la même adresse de page : l'enregistrement est refusé avec le message « Un article avec ce slug existe déjà ».",
      "L'article n'est pas traduit automatiquement : il s'affiche tel que rédigé. La page Blog du site montre tous les articles publiés quelle que soit la langue choisie par le visiteur, avec une petite étiquette (FR/ES/EN) indiquant la langue de rédaction.",
      "La date de publication est figée à la première publication : dépublier puis republier ne la rajeunit pas.",
      "Comptez jusqu'à une minute avant de voir un changement (publication, correction, retrait) sur le site public. Si rien ne bouge, attendez un peu et rechargez la page.",
      "Le contenu se rédige dans un éditeur visuel (gras, titres, listes, liens, images) : inutile — et impossible — d'y coller du code.",
    ],
  },
]
