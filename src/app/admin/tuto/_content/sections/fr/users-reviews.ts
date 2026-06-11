import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "users",
    navLabel: "Clients",
    title: "Clients — tous les comptes inscrits sur le site",
    route: "/admin/users",
    intro:
      "Cette page liste toutes les personnes qui ont un compte sur le site : les clients, mais aussi les membres de l'équipe (qui sont des comptes clients avec des droits d'administration en plus). Pour chacun, vous voyez son nom, son adresse e-mail, son téléphone, sa langue préférée, la date de création du compte et sa dernière connexion. Règle d'affichage des noms : un membre de l'équipe apparaît sous son pseudo, un client sous son nom et son prénom. C'est aussi ici qu'un super-admin peut donner ou retirer l'accès au panneau d'administration : on ne crée pas de compte spécial pour un employé, on promeut un compte déjà inscrit sur le site. Les admins « simples » voient la liste mais ne peuvent rien y modifier.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Clients — titre et fil d'ariane Admin" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "kpi", label: "Utilisateurs (page)", hotspot: 1 },
            { w: 4, kind: "kpi", label: "Administrateurs" },
            { w: 4, kind: "kpi", label: "Avec téléphone" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "input", label: "🔍 Chercher email, nom, téléphone…", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Utilisateur · Contact · Langue · Créé · Dernière connexion · Rôle", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "button", label: "Promouvoir admin / Admin (colonne Rôle)", hotspot: 4 },
            { w: 5, kind: "toolbar", label: "Page 1 · Précédent · Suivant", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Tuiles de chiffres",
        desc: "Trois compteurs : utilisateurs affichés, administrateurs et comptes avec téléphone. Attention : ils ne comptent que la page affichée (50 comptes au maximum), pas toute la base de données.",
      },
      {
        n: 2,
        label: "Recherche",
        desc: "Filtre par e-mail, nom, prénom, pseudo ou téléphone, sans tenir compte des majuscules. Taper vous ramène toujours à la première page, et la recherche ne fouille que les 50 comptes de la page affichée : si la personne n'apparaît pas, effacez la recherche puis parcourez les pages avec « Suivant ».",
      },
      {
        n: 3,
        label: "Tableau des comptes",
        desc: "Une ligne par compte. Le nom suit la règle : pseudo pour un membre de l'équipe, nom + prénom pour un client (un tiret si le profil n'a aucun nom). Cliquer sur l'e-mail ouvre votre messagerie ; cliquer sur le téléphone ouvre une conversation WhatsApp. La langue « auto » signifie que la personne n'a pas choisi de langue préférée. « Jamais » en dernière connexion : le compte n'a jamais servi à se connecter (par exemple un compte créé au comptoir par l'équipe).",
      },
      {
        n: 4,
        label: "Colonne Rôle",
        desc: "Si vous êtes super-admin, un bouton apparaît sur chaque ligne (sauf les super-admins) : « Promouvoir admin » pour un client, « Admin » pour retirer les droits d'un membre de l'équipe. Si vous êtes admin simple, vous voyez seulement des pastilles « Admin » / « Super-admin » en lecture, ou un tiret pour les clients.",
      },
      {
        n: 5,
        label: "Pagination",
        desc: "La liste avance par pages de 50 comptes. « Suivant » se grise quand la page affichée n'est pas pleine : soit il n'y a plus rien après, soit une recherche en cours réduit la page — effacez-la pour pouvoir continuer à naviguer.",
      },
    ],
    workflows: [
      {
        title: "Retrouver un client et le contacter",
        steps: [
          {
            title: "Chercher le compte",
            body: "Tapez une partie de son e-mail, de son nom ou de son téléphone dans le champ de recherche. La liste se met à jour au fil de la frappe.",
          },
          {
            title: "Élargir si besoin",
            body: "La recherche ne couvre que les 50 comptes de la page affichée, et taper vous ramène toujours à la première page. Si rien ne sort, effacez la recherche puis parcourez les pages avec « Suivant » pour repérer le compte à l'œil.",
          },
          {
            title: "Contacter",
            body: "Cliquez sur son e-mail pour ouvrir votre messagerie, ou sur son téléphone pour ouvrir une conversation WhatsApp directement.",
          },
        ],
      },
      {
        title: "Donner l'accès au panneau à un nouvel employé",
        steps: [
          {
            title: "Lui faire créer un compte normal",
            body: "L'employé s'inscrit sur le site public comme n'importe quel client. Il n'existe pas de compte « admin » séparé : on ajoute des droits à un compte existant.",
          },
          {
            title: "Retrouver son compte",
            body: "Connecté en super-admin, cherchez son e-mail dans cette page.",
          },
          {
            title: "Promouvoir",
            body: "Cliquez « Promouvoir admin » au bout de sa ligne, puis confirmez dans la petite fenêtre. L'accès est immédiat.",
          },
          {
            title: "Vérifier",
            body: "Le bouton de sa ligne affiche maintenant « Admin ». La personne peut ouvrir le panneau d'administration dès sa prochaine navigation, tout en gardant son compte client (panier, réservations, favoris).",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Promouvoir admin",
        where: "Bouton dans la colonne « Rôle », sur la ligne d'un client — visible uniquement si vous êtes super-admin",
        does: "Donne à ce compte l'accès complet au panneau d'administration, avec le rôle « Admin ».",
        effects: [
          "Une fenêtre de confirmation rappelle l'e-mail concerné ; rien ne se passe si vous annulez.",
          "La personne accède immédiatement à tout le panneau : produits, prix, stock, réservations, ventes, clients, et la comptabilité (y compris les coûts d'achat et les marges).",
          "Elle garde tout son compte client : panier, réservations, favoris, profil — rien n'est perdu.",
          "Si son profil a un pseudo, son nom s'affiche désormais sous ce pseudo dans les listes (règle d'affichage des membres de l'équipe) ; sinon, son nom et son prénom restent affichés.",
          "L'opération est inscrite au journal d'audit.",
        ],
        severity: "caution",
        undo: "Cliquez le même bouton (devenu « Admin ») pour retirer les droits — tout redevient comme avant.",
        audited: true,
      },
      {
        label: "Admin (retirer les droits)",
        where: "Le même bouton, sur la ligne d'un membre de l'équipe (rôle Admin) — visible uniquement si vous êtes super-admin",
        does: "Retire l'accès au panneau d'administration de ce compte.",
        effects: [
          "Une fenêtre de confirmation rappelle l'e-mail concerné ; rien ne se passe si vous annulez.",
          "La personne ne peut plus ouvrir le panneau d'administration dès sa prochaine navigation.",
          "Son compte client reste intact : elle peut toujours se connecter au site, réserver, voir son historique.",
          "Impossible sur vous-même et sur un super-admin : le site bloque ces deux cas, même en insistant.",
          "L'opération est inscrite au journal d'audit.",
        ],
        severity: "safe",
        undo: "Cliquez « Promouvoir admin » sur la même ligne pour rendre les droits.",
        audited: true,
      },
    ],
    gotchas: [
      "Les trois tuiles de chiffres comptent la page affichée (50 comptes au maximum), pas le total de tous les inscrits.",
      "La recherche ne fouille que les 50 comptes de la page en cours, et taper vous ramène toujours à la première page. Tant qu'une recherche est active, « Suivant » reste le plus souvent grisé : pour chercher au-delà, effacez le texte et parcourez les pages une à une.",
      "Un tiret à la place du nom signifie que le profil n'a ni nom ni pseudo (l'e-mail, affiché juste en dessous, reste le repère fiable).",
      "« Promouvoir admin » donne toujours le rôle « Admin » standard : la personne peut tout faire dans le panneau, sauf gérer l'équipe d'administration. Les changements de rôle (passer quelqu'un super-admin) se font sur la page « Admins » du menu, pas ici.",
      "Vous ne pouvez ni vous retirer vos propres droits, ni toucher un autre super-admin — c'est une protection contre les blocages accidentels, pas une panne.",
      "Si vous êtes admin simple, le bouton n'apparaît pas du tout : la gestion des droits est réservée aux super-admins.",
      "Cet écran ne permet ni de supprimer un compte client, ni de modifier ses informations : c'est le client qui gère son profil depuis son espace personnel sur le site.",
      "« Jamais » en dernière connexion est normal pour les comptes créés par l'équipe au comptoir (le client ne s'est encore jamais connecté lui-même).",
    ],
  },
  {
    id: "reviews",
    navLabel: "Avis",
    title: "Avis produits — modérer ce que les clients publient",
    route: "/admin/reviews",
    intro:
      "Les clients connectés peuvent laisser un avis (une note de 1 à 5 étoiles, plus un titre et un texte facultatifs) en bas de chaque fiche produit du site. Chaque avis arrive ici avec le statut « En attente » et reste invisible pour tout le monde tant que vous ne l'avez pas approuvé. Seuls les avis approuvés apparaissent sur la fiche produit publique, et eux seuls comptent dans la note moyenne affichée (cette note est aussi transmise aux moteurs de recherche). La page s'ouvre directement sur le filtre « En attente » : c'est votre file de modération. Un client ne peut avoir qu'un seul avis par produit.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Avis produits — titre et fil d'ariane Admin / Clients" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "tabs", label: "Tous · En attente · Approuvés · Rejetés", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "★★★★☆ · statut · Achat vérifié · titre + texte · produit · auteur · date", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "button", label: "✓ Approuver", hotspot: 3 },
            { w: 4, kind: "button", label: "✕ Rejeter", hotspot: 4 },
            { w: 4, kind: "button", label: "🗑 Supprimer", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Filtres par statut",
        desc: "Quatre pastilles : Tous, En attente, Approuvés, Rejetés. La page s'ouvre sur « En attente » — si elle semble vide, ce n'est pas qu'il n'y a aucun avis : cliquez « Tous » pour tout voir.",
      },
      {
        n: 2,
        label: "Liste des avis",
        desc: "Du plus récent au plus ancien (200 au maximum). Chaque ligne montre les étoiles, la pastille de statut, la mention « Achat vérifié » le cas échéant, le titre et le texte de l'avis, puis le produit concerné, le nom de l'auteur (ou « Client » s'il n'en a pas) et la date.",
      },
      {
        n: 3,
        label: "Bouton Approuver (coche)",
        desc: "Publie l'avis sur la fiche produit du site. Le bouton n'apparaît que si l'avis n'est pas déjà approuvé.",
      },
      {
        n: 4,
        label: "Bouton Rejeter (croix)",
        desc: "Garde l'avis hors du site, sans le supprimer. Le bouton n'apparaît que si l'avis n'est pas déjà rejeté. Sert aussi à dépublier un avis déjà approuvé.",
      },
      {
        n: 5,
        label: "Bouton Supprimer (corbeille)",
        desc: "Efface l'avis pour de bon. Une petite notification de confirmation apparaît en haut à droite de l'écran avec un bouton « Supprimer » : si vous l'ignorez, rien n'est supprimé.",
      },
    ],
    workflows: [
      {
        title: "Modérer les avis en attente",
        steps: [
          {
            title: "Ouvrir la file",
            body: "La page s'ouvre déjà sur « En attente » : ce sont les avis que personne ne voit encore.",
          },
          {
            title: "Lire l'avis",
            body: "Vérifiez la note, le texte et le produit concerné. La mention « Achat vérifié » indique que ce client a réellement retiré une réservation contenant ce produit — c'est calculé automatiquement, vous ne pouvez pas la modifier.",
          },
          {
            title: "Trancher",
            body: "Cliquez la coche pour publier l'avis sur la fiche produit, ou la croix pour le garder hors du site. La ligne disparaît aussitôt de la file « En attente ».",
          },
          {
            title: "Vérifier sur le site (facultatif)",
            body: "L'avis approuvé apparaît sur la fiche produit publique au bout d'une minute environ, et la note moyenne du produit se met à jour.",
          },
        ],
      },
      {
        title: "Retirer un avis déjà publié",
        steps: [
          {
            title: "Filtrer les avis publiés",
            body: "Cliquez la pastille « Approuvés » pour ne voir que les avis actuellement visibles sur le site.",
          },
          {
            title: "Retrouver l'avis",
            body: "Repérez la ligne grâce au nom du produit, à l'auteur ou à la date.",
          },
          {
            title: "Rejeter plutôt que supprimer",
            body: "Cliquez la croix : l'avis quitte la fiche produit (sous une minute environ) mais reste conservé dans le filtre « Rejetés », au cas où il faudrait le republier. La suppression, elle, est définitive.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Approuver",
        where: "Bouton coche au bout de chaque ligne (sauf les avis déjà approuvés)",
        does: "Publie l'avis sur la fiche produit du site public.",
        effects: [
          "Le statut passe à « Approuvé » et la ligne quitte la file « En attente ».",
          "L'avis apparaît sur la fiche produit publique au bout d'une minute environ (la fiche affiche les 50 avis approuvés les plus récents).",
          "La note entre dans la moyenne et le compteur d'avis affichés sur la fiche produit ; cette moyenne est aussi transmise aux moteurs de recherche.",
          "Le client n'est pas prévenu : aucune notification ne lui est envoyée.",
        ],
        severity: "caution",
        undo: "Cliquez « Rejeter » sur le même avis : il disparaît du site et la moyenne se recalcule.",
        audited: true,
        publicImpact: "L'avis et sa note deviennent visibles par tous sur la fiche produit.",
      },
      {
        label: "Rejeter",
        where: "Bouton croix au bout de chaque ligne (sauf les avis déjà rejetés)",
        does: "Garde l'avis hors du site public, sans l'effacer.",
        effects: [
          "Le statut passe à « Rejeté » : l'avis n'est visible nulle part sur le site, pas même par son auteur.",
          "Si l'avis était approuvé, il disparaît de la fiche produit sous une minute environ et la note moyenne se recalcule sans lui.",
          "L'avis reste consultable ici dans le filtre « Rejetés » et peut être republié à tout moment.",
          "Le client n'est pas prévenu et ne peut pas voir que son avis a été rejeté.",
        ],
        severity: "caution",
        undo: "Cliquez « Approuver » sur le même avis pour le republier.",
        audited: true,
        publicImpact: "Si l'avis était publié, il disparaît de la fiche produit et la moyenne change.",
      },
      {
        label: "Supprimer",
        where: "Bouton corbeille au bout de chaque ligne, puis bouton « Supprimer » dans la notification de confirmation en haut à droite",
        does: "Efface définitivement l'avis de la base de données.",
        effects: [
          "L'avis disparaît pour toujours : note, titre, texte, mention d'achat vérifié — aucune corbeille de récupération.",
          "S'il était approuvé, il disparaît aussi de la fiche produit et la moyenne se recalcule.",
          "Comme un client n'a droit qu'à un avis par produit, la suppression lui permet d'en écrire un nouveau sur ce produit.",
          "Le client n'est pas prévenu.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "Si l'avis était publié, il disparaît de la fiche produit.",
      },
    ],
    flows: [
      {
        title: "Vie d'un avis client",
        lanes: [
          [
            {
              label: "Le client écrit un avis",
              note: "Depuis le bas de la fiche produit, connecté à son compte. Le site lui répond « Votre avis sera publié après modération ».",
            },
            {
              label: "En attente",
              tone: "warn",
              note: "Invisible pour tout le monde sur le site. C'est la file qui s'affiche à l'ouverture de cette page.",
            },
            {
              label: "Approuvé",
              tone: "ok",
              note: "Visible sur la fiche produit, compté dans la note moyenne. Reste dépubliable à tout moment via « Rejeter ».",
            },
          ],
          [
            {
              label: "Rejeté",
              tone: "warn",
              note: "Caché du site mais conservé ici. Peut être republié plus tard via « Approuver ».",
            },
          ],
          [
            {
              label: "Le client modifie son avis",
              tone: "warn",
              note: "S'il dépose un nouvel avis sur le même produit, il remplace l'ancien et repasse « En attente » — même un avis approuvé disparaît alors du site jusqu'à votre prochaine validation.",
            },
          ],
          [
            {
              label: "Supprimé",
              tone: "bad",
              note: "Définitif, sans récupération possible. Le client peut ensuite écrire un nouvel avis sur ce produit.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "La page s'ouvre sur le filtre « En attente » : une liste vide signifie seulement qu'il n'y a rien à modérer — cliquez « Tous » pour voir l'ensemble.",
      "Seuls les avis approuvés sont visibles sur le site. Un avis en attente ou rejeté n'apparaît nulle part, même pas pour le client qui l'a écrit.",
      "Si un client redépose un avis sur le même produit, la nouvelle version remplace l'ancienne et revient « En attente » : un avis déjà approuvé disparaît alors du site jusqu'à ce que vous validiez la nouvelle version.",
      "La mention « Achat vérifié » est posée automatiquement quand le client a retiré en pharmacie une réservation contenant ce produit. Vous ne pouvez ni l'ajouter ni la retirer.",
      "Après une approbation ou un rejet, la fiche produit publique se met à jour sous une minute environ — inutile de s'inquiéter si le changement n'est pas instantané.",
      "Préférez « Rejeter » à « Supprimer » pour retirer un avis : le rejet se rattrape, la suppression est définitive. La suppression libère aussi le droit du client à écrire un nouvel avis sur ce produit.",
      "La confirmation de suppression est une petite notification en haut à droite de l'écran, pas une fenêtre au centre : si vous ne cliquez pas son bouton « Supprimer », rien n'est effacé.",
      "Le client n'est jamais prévenu d'une approbation, d'un rejet ou d'une suppression — aucun message ne lui est envoyé.",
      "La liste affiche les 200 avis les plus récents du filtre choisi.",
      "Supprimer un produit du catalogue efface aussi tous ses avis, définitivement.",
    ],
  },
]
