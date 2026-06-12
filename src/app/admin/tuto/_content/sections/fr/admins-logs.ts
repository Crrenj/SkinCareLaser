import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "admins",
    navLabel: "Administrateurs",
    title: "Administrateurs — gérer l'équipe qui a accès au panneau",
    route: "/admin/admins",
    intro:
      "Cette page liste l'équipe d'administration de la pharmacie. Il existe deux rôles : « Admin » peut tout faire dans le panneau (produits, stock, réservations, comptabilité…) sauf gérer l'équipe ; « Super-admin » peut en plus ajouter ou retirer des membres et changer leur rôle. Important : un administrateur n'est pas un compte à part — c'est un compte client normal du site auquel on a ajouté des droits. Il garde tout son côté client (panier, réservations, favoris, profil) ; on ne lui retire rien. Tout membre de l'équipe peut consulter cette page et modifier les pseudos (le crayon) ; en revanche, seuls les super-admins voient les boutons de gestion et la zone « Ajouter un administrateur ». Si vous êtes admin simple, un bandeau vous le rappelle : « Seul un super-admin peut gérer l'équipe. »",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Administrateurs — titre et fil d'ariane Admin" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "kpi", label: "Membres de l'équipe", hotspot: 1 },
            { w: 4, kind: "kpi", label: "Super-admins" },
            { w: 4, kind: "kpi", label: "Admins" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Équipe admin — Membre · Rôle · Membre depuis · Actions", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "button", label: "✏ Crayon (pseudo)", hotspot: 3 },
            { w: 4, kind: "button", label: "Super-admin", hotspot: 4 },
            { w: 4, kind: "button", label: "Révoquer", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 8, kind: "input", label: "🔍 Ajouter un administrateur — chercher email, nom…", hotspot: 6 },
            { w: 4, kind: "button", label: "Rechercher" },
          ],
        },
        {
          blocks: [
            { w: 8, kind: "panel", label: "Résultats : comptes trouvés" },
            { w: 4, kind: "button", label: "Rendre admin", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Tuiles de chiffres",
        desc: "Trois compteurs : la taille de l'équipe, le nombre de super-admins et le nombre d'admins simples. Ils couvrent toute l'équipe (la liste n'est pas paginée).",
      },
      {
        n: 2,
        label: "Tableau de l'équipe",
        desc: "Une ligne par membre, du plus ancien au plus récent. Vous voyez le pseudo (à défaut, le nom et prénom du profil — un tiret seulement si le profil est vide), l'e-mail en dessous, le rôle en pastille, et la date d'entrée dans l'équipe. Votre propre ligne porte la pastille « Vous ». Les lignes des super-admins affichent un cadenas « Protégé » à la place des boutons de gestion : personne ne peut toucher à leur accès depuis le panneau (leur pseudo, lui, reste modifiable au crayon).",
      },
      {
        n: 3,
        label: "Crayon — modifier le pseudo",
        desc: "Présent sur chaque ligne, pour tous les admins. Le pseudo est le nom sous lequel un membre de l'équipe apparaît partout dans le panneau (listes, journal d'audit…). La coche enregistre, la croix annule. Chaque changement est inscrit au journal d'audit.",
      },
      {
        n: 4,
        label: "Bouton Super-admin",
        desc: "Visible uniquement pour les super-admins, sur les lignes des admins simples. Promeut le membre super-admin après une fenêtre de confirmation. Attention : une fois promu, il devient « Protégé » — plus personne ne pourra le rétrograder ou le révoquer depuis le panneau.",
      },
      {
        n: 5,
        label: "Bouton Révoquer",
        desc: "Visible uniquement pour les super-admins, sur les lignes des admins simples. Retire l'accès au panneau après une fenêtre de confirmation. Le compte client de la personne reste intact.",
      },
      {
        n: 6,
        label: "Ajouter un administrateur",
        desc: "Zone visible uniquement pour les super-admins. Tapez au moins deux caractères (e-mail, nom, prénom, pseudo ou téléphone) puis lancez la recherche : elle retrouve un compte déjà inscrit sur le site. Elle ne parcourt que les 50 premiers comptes — si la personne ne sort pas, passez par la page « Clients » et ses boutons « Suivant ».",
      },
      {
        n: 7,
        label: "Rendre admin",
        desc: "Sur chaque résultat de recherche qui n'est pas déjà admin. Donne immédiatement l'accès au panneau avec le rôle « Admin ». Les comptes déjà membres affichent « Déjà admin » à la place.",
      },
    ],
    workflows: [
      {
        title: "Donner l'accès au panneau à un nouvel employé",
        steps: [
          {
            title: "Lui faire créer un compte normal",
            body: "L'employé s'inscrit sur le site public comme n'importe quel client. Il n'existe pas de compte « admin » séparé : on ajoute des droits à un compte existant.",
          },
          {
            title: "Chercher son compte",
            body: "Connecté en super-admin, tapez son e-mail ou son nom dans la zone « Ajouter un administrateur » en bas de page, puis lancez la recherche.",
          },
          {
            title: "Le rendre admin",
            body: "Cliquez « Rendre admin » sur sa ligne. L'accès est immédiat et la personne apparaît aussitôt dans le tableau de l'équipe.",
          },
          {
            title: "Lui poser un pseudo",
            body: "Cliquez le crayon sur sa nouvelle ligne et saisissez le nom sous lequel l'équipe le verra dans tout le panneau (par exemple son prénom).",
          },
        ],
      },
      {
        title: "Retirer l'accès d'un membre qui quitte l'équipe",
        steps: [
          {
            title: "Repérer sa ligne",
            body: "Dans le tableau « Équipe admin », retrouvez le membre par son pseudo ou son e-mail.",
          },
          {
            title: "Révoquer",
            body: "Cliquez « Révoquer » puis confirmez. Dès sa prochaine navigation, le panneau lui est fermé.",
          },
          {
            title: "Vérifier",
            body: "La personne disparaît du tableau. Son compte client continue de fonctionner normalement (connexion, réservations, historique), et ses actions passées restent visibles dans le journal d'audit.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Crayon (modifier le pseudo)",
        where: "Sur chaque ligne du tableau « Équipe admin », à côté du nom — visible pour tous les admins",
        does: "Change le pseudo d'un membre de l'équipe, c'est-à-dire le nom sous lequel il apparaît dans tout le panneau.",
        effects: [
          "Le nouveau pseudo s'affiche aussitôt ici, et partout où les membres de l'équipe sont nommés (page Clients, journal d'audit…).",
          "Tout admin peut renommer n'importe quel membre, y compris lui-même et les super-admins — c'est un simple libellé d'affichage, pas un privilège.",
          "Le pseudo est limité à 60 caractères et ne peut pas être vide.",
          "Cela ne touche ni son e-mail, ni son mot de passe, ni son nom et prénom. En revanche, le pseudo correspond au champ « Nom affiché » du profil : la personne le voit aussi dans son espace personnel sur le site, et peut elle-même le modifier là-bas.",
          "Le changement est inscrit au journal d'audit, avec le nouveau pseudo et l'auteur de la modification.",
        ],
        severity: "safe",
        undo: "Cliquez à nouveau le crayon et ressaisissez l'ancien pseudo.",
        audited: true,
      },
      {
        label: "Rendre admin",
        where: "Dans les résultats de la zone « Ajouter un administrateur » — visible uniquement si vous êtes super-admin",
        does: "Donne à un compte déjà inscrit sur le site l'accès complet au panneau, avec le rôle « Admin ».",
        effects: [
          "La personne accède immédiatement à tout le panneau : produits, prix, stock, réservations, ventes, clients et la comptabilité (y compris les coûts d'achat et les marges).",
          "Elle garde tout son compte client : panier, réservations, favoris, profil — rien n'est perdu.",
          "Elle apparaît dans le tableau de l'équipe et son nom suit désormais la règle des membres : pseudo d'abord.",
          "Elle ne peut PAS gérer l'équipe : ce droit reste réservé aux super-admins.",
          "Aucun message n'est envoyé à la personne : prévenez-la vous-même.",
          "L'opération est inscrite au journal d'audit.",
        ],
        severity: "caution",
        undo: "Cliquez « Révoquer » sur sa ligne dans le tableau de l'équipe — tout redevient comme avant.",
        audited: true,
      },
      {
        label: "Super-admin (promouvoir)",
        where: "Au bout de la ligne d'un admin simple, dans le tableau de l'équipe — visible uniquement si vous êtes super-admin",
        does: "Donne à un admin le pouvoir de gérer l'équipe : ajouter des membres, révoquer des accès, promouvoir d'autres super-admins.",
        effects: [
          "Une fenêtre de confirmation rappelle l'e-mail concerné et prévient : « Il pourra gérer l'équipe admin. » Rien ne se passe si vous annulez.",
          "Le membre devient aussitôt super-admin et sa ligne passe en « Protégé » : les boutons de gestion disparaissent (seul le crayon du pseudo reste).",
          "À partir de là, PERSONNE ne peut le rétrograder ou le révoquer depuis le panneau — pas même vous, pas même un autre super-admin. Le seul retour en arrière passe par le technicien, directement dans la base de données.",
          "C'est une protection volontaire : elle empêche qu'un super-admin évince les autres ou que l'équipe se retrouve sans personne aux commandes.",
          "L'opération est inscrite au journal d'audit.",
        ],
        severity: "danger",
        audited: true,
      },
      {
        label: "Révoquer",
        where: "Au bout de la ligne d'un admin simple, dans le tableau de l'équipe — visible uniquement si vous êtes super-admin",
        does: "Retire l'accès au panneau d'administration de ce membre.",
        effects: [
          "Une fenêtre de confirmation rappelle l'e-mail concerné ; rien ne se passe si vous annulez.",
          "Dès sa prochaine navigation, la personne ne peut plus ouvrir le panneau et disparaît du tableau de l'équipe.",
          "Son compte client reste intact : elle peut toujours se connecter au site, réserver, consulter son historique.",
          "Impossible sur vous-même et sur un super-admin : le site bloque ces deux cas, même en insistant.",
          "Ses actions passées restent dans le journal d'audit, sous son nom.",
          "L'opération est inscrite au journal d'audit.",
        ],
        severity: "safe",
        undo: "Recherchez son compte dans « Ajouter un administrateur » et cliquez « Rendre admin » pour lui rendre l'accès.",
        audited: true,
      },
    ],
    flows: [
      {
        title: "Parcours d'un membre de l'équipe",
        lanes: [
          [
            {
              label: "Client inscrit",
              note: "Un compte normal du site, créé par la personne elle-même. C'est le point de départ obligatoire.",
            },
            {
              label: "Admin",
              tone: "ok",
              note: "Accès à tout le panneau, sauf la gestion de l'équipe. Garde son compte client. Réversible à tout moment par un super-admin.",
            },
            {
              label: "Super-admin",
              tone: "warn",
              note: "Gère l'équipe en plus. Devient « Protégé » : aucun retour en arrière possible depuis le panneau, seulement par le technicien.",
            },
          ],
          [
            {
              label: "Admin révoqué",
              tone: "neutral",
              note: "Redevient un simple client du site. Rien n'est perdu côté client, et ses actions passées restent au journal d'audit.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Vous ne pouvez jamais modifier votre propre accès (vous promouvoir, vous rétrograder ou vous révoquer) : le site le bloque pour éviter qu'une équipe se retrouve sans responsable par accident.",
      "Un super-admin est intouchable depuis le panneau : ni rétrogradation, ni révocation, ni par vous, ni par un autre super-admin. Réfléchissez avant de promouvoir — le retour en arrière exige l'intervention du technicien dans la base de données.",
      "Le crayon de pseudo est ouvert à TOUS les admins, sur toutes les lignes (y compris les super-admins et vous-même). Chaque renommage fait depuis cette page est inscrit au journal d'audit, avec son auteur. Mais un membre peut aussi changer son propre pseudo depuis son espace personnel sur le site — ce changement-là n'apparaît pas au journal.",
      "Le pseudo ne change ni l'e-mail, ni le mot de passe, ni le nom et prénom. C'est le champ « Nom affiché » du profil, que la personne gère aussi elle-même dans son espace personnel sur le site : si vous le modifiez ici, elle le verra changé là-bas (et inversement).",
      "La recherche « Ajouter un administrateur » ne parcourt que les 50 premiers comptes du site. Si la personne n'apparaît pas, passez par la page « Clients » : la recherche y fonctionne page par page et le bouton « Promouvoir admin » y fait la même chose.",
      "« Rendre admin » donne toujours le rôle « Admin » standard. Pour confier la gestion de l'équipe, il faut ensuite cliquer « Super-admin » sur sa ligne.",
      "Personne n'est prévenu automatiquement d'une promotion ou d'une révocation : aucun message n'est envoyé. Prévenez la personne vous-même.",
      "Donner l'accès admin, c'est donner accès à la comptabilité complète : coûts d'achat, marges, chiffre d'affaires. À réserver aux personnes de confiance.",
      "Les dates « Membre depuis » s'affichent au format espagnol, quelle que soit la langue du panneau.",
    ],
  },
  {
    id: "logs",
    navLabel: "Journal",
    title: "Journal d'activité — qui a fait quoi, et quand",
    route: "/admin/logs",
    intro:
      "Le journal d'activité enregistre automatiquement les créations, les modifications et les suppressions faites depuis le panneau d'administration : produits, prix, stock, réceptions, pertes, réservations, ventes, dépenses, promotions, réglages de la boutique, apparence, page d'accueil, articles de blog, bannières, modération d'avis, messages, comptes clients créés depuis le panneau, suppressions d'abonnés newsletter, étiquettes, marques, gammes, images envoyées, et tout changement d'accès admin. Chaque ligne dit qui a agi, quand, sur quoi, avec un court résumé. C'est un outil de transparence d'équipe : en cas de doute (« qui a changé ce prix ? »), la réponse est ici. Cette page est en lecture seule : on y consulte, on n'y modifie rien — et aucune ligne ne peut être effacée depuis le panneau. À l'inverse, les simples consultations ne sont jamais enregistrées : ouvrir une page, regarder une réservation ou la comptabilité ne laisse aucune trace. Les actions des clients sur le site public (réserver, écrire un avis, s'inscrire à la newsletter) n'apparaissent pas non plus : le journal couvre ce qui se fait dans le panneau.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Journal d'activité — titre et fil d'ariane Admin" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "toolbar", label: "Entité · Action · Auteur", hotspot: 1 },
            { w: 4, kind: "toolbar", label: "Du · Au (dates)", hotspot: 2 },
            { w: 3, kind: "toolbar", label: "☑ Fort impact uniquement", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Quand · Auteur · Action · Entité · Résumé", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "› Ligne dépliée : détail des champs modifiés", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "text", label: "Page 1" },
            { w: 6, kind: "toolbar", label: "Précédent · Suivant", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Filtres Entité, Action, Auteur",
        desc: "Trois menus déroulants. « Entité » = le type d'élément touché (Producto, Reserva, Stock, Gasto…— libellés en espagnol). « Action » = Création, Modification ou Suppression. « Auteur » propose les membres actuels de l'équipe admin. Chaque choix recharge la liste et revient à la page 1.",
      },
      {
        n: 2,
        label: "Filtres de dates « Du » / « Au »",
        desc: "Bornent la période affichée. Attention : les journées sont comptées en heure universelle, pas en heure locale — une action faite en soirée peut se retrouver classée sur le jour suivant. Au moindre doute, élargissez la période d'un jour de chaque côté.",
      },
      {
        n: 3,
        label: "Case « Fort impact uniquement »",
        desc: "Ne garde que les opérations sensibles : tout ce qui touche l'argent, le stock, les prix, les accès admin et la configuration de la boutique. Les lignes concernées portent aussi un petit bouclier orange dans la colonne Entité. Un lien « Réinitialiser » apparaît dès qu'un filtre est actif.",
      },
      {
        n: 4,
        label: "Tableau du journal",
        desc: "Du plus récent au plus ancien, 50 lignes par page. Chaque ligne : la date et l'heure, l'auteur (son pseudo, avec l'e-mail en dessous), une pastille d'action (Création en vert, Modification en gris, Suppression en rouge), l'entité touchée et un résumé en espagnol. « Système » comme auteur signifie que l'action n'a pas d'auteur identifiable : action automatique du site, ou auteur dont le compte a depuis été supprimé.",
      },
      {
        n: 5,
        label: "Chevron › — voir les détails",
        desc: "Quand une ligne porte une petite flèche à gauche, cliquez-la pour déplier le détail des champs modifiés, présenté dans un format technique brut. Les mots de passe et les fichiers n'y figurent jamais, et les textes très longs sont coupés.",
      },
      {
        n: 6,
        label: "Pagination",
        desc: "La liste avance par pages de 50 lignes. « Suivant » se grise quand la page en cours n'est pas pleine — il n'y a plus rien après.",
      },
    ],
    workflows: [
      {
        title: "Retrouver qui a modifié un produit ou un prix",
        steps: [
          {
            title: "Filtrer par entité",
            body: "Choisissez « Producto » dans le menu « Entité » (les libellés du menu sont en espagnol).",
          },
          {
            title: "Resserrer la période",
            body: "Si vous savez à peu près quand le changement a eu lieu, posez les dates « Du » et « Au » pour raccourcir la liste.",
          },
          {
            title: "Lire le résumé",
            body: "Chaque ligne nomme le produit touché et l'auteur. La pastille indique s'il s'agit d'une création, d'une modification ou d'une suppression.",
          },
          {
            title: "Déplier au besoin",
            body: "Cliquez la petite flèche à gauche de la ligne pour voir exactement quels champs ont été changés et leurs nouvelles valeurs.",
          },
        ],
      },
      {
        title: "Faire un point hebdomadaire sur les opérations sensibles",
        steps: [
          {
            title: "Activer « Fort impact uniquement »",
            body: "La liste ne garde que ce qui touche l'argent, le stock, les prix, les accès et la configuration.",
          },
          {
            title: "Poser la période",
            body: "Renseignez « Du » et « Au » sur la semaine écoulée.",
          },
          {
            title: "Parcourir par auteur",
            body: "Au besoin, filtrez par membre de l'équipe avec le menu « Auteur » pour suivre l'activité de chacun.",
          },
        ],
      },
    ],
    actions: [],
    gotchas: [
      "Les consultations ne sont jamais enregistrées : regarder une page, une réservation ou la comptabilité ne laisse aucune trace. Le journal ne montre que les créations, modifications et suppressions.",
      "Les actions des clients sur le site public (réserver, écrire un avis, s'inscrire à la newsletter) n'apparaissent pas ici : le journal couvre les actions faites depuis le panneau d'administration.",
      "Rien n'est modifiable ni effaçable sur cette page, par personne — et les lignes ne sont pas supprimées automatiquement avec le temps. Le journal sert justement de mémoire durable.",
      "« Système » comme auteur n'est pas une anomalie : c'est une action sans auteur identifiable — automatique, ou dont l'auteur a supprimé son compte depuis (ses anciennes lignes restent, mais perdent son nom).",
      "Le menu « Auteur » ne propose que l'équipe admin actuelle. Les lignes d'un membre révoqué existent toujours et affichent encore son nom, mais pour les retrouver il faut passer par les dates ou l'entité plutôt que par ce menu.",
      "Les résumés et les noms d'entités sont rédigés en espagnol, quelle que soit la langue choisie pour le panneau.",
      "« Fort impact » est une étiquette posée automatiquement sur les catégories sensibles (argent, stock, prix, accès, configuration). Elle peut couvrir des gestes anodins de ces catégories — un simple changement de pseudo d'admin est marqué « fort impact », par exemple.",
      "Le détail déplié ne contient jamais de mot de passe ni de fichier, et les numéros de téléphone des clients en sont tenus à l'écart. Les textes très longs y sont coupés.",
      "L'enregistrement du journal est conçu pour ne jamais bloquer le travail : dans de très rares cas de panne, une action peut manquer au journal alors qu'elle a bien eu lieu.",
      "Tout membre de l'équipe (admin ou super-admin) peut consulter ce journal — y compris les lignes qui concernent les autres. C'est voulu : la transparence est réciproque.",
    ],
  },
]
