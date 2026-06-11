import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "messages",
    navLabel: "Tickets",
    title: "Tickets de support — les messages du formulaire de contact",
    route: "/admin/messages",
    intro:
      "Quand un visiteur remplit le formulaire de la page Contact du site ou celui du centre d'aide, son message arrive ici sous forme de « ticket ». Chaque ticket contient l'adresse e-mail de la personne, un sujet et le message complet. Il arrive avec le statut « Ouvert » et la priorité « Normale ». Cet écran sert à suivre ces demandes : repérer les nouvelles, les lire, noter qu'on s'en occupe, puis les marquer résolues ou fermées. Important : le panneau n'envoie aucun e-mail — pour répondre au client, vous écrivez depuis la boîte mail de la pharmacie, en utilisant l'adresse affichée sur le ticket.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Tickets de support — titre et fil d'ariane Admin / Opérations" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "input", label: "🔍 Rechercher par sujet, email ou contenu…", hotspot: 1 },
            { w: 7, kind: "tabs", label: "Tous · Ouverts · En cours · Résolus · Fermés (+ compteurs)", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 2, kind: "kpi", label: "Total", hotspot: 3 },
            { w: 2, kind: "kpi", label: "Ouverts" },
            { w: 2, kind: "kpi", label: "En cours" },
            { w: 2, kind: "kpi", label: "Résolus" },
            { w: 2, kind: "kpi", label: "Fermés" },
            { w: 2, kind: "kpi", label: "Aujourd'hui · 7 jours" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "tabs", label: "Catégorie : Toutes · Bug / Technique · Commande & réservation · Produit & conseil · Compte & connexion · Autre", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "● Sujet · pastilles catégorie + statut · email · date · aperçu du message", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Fenêtre de détail : message complet · Priorité · Marquer en cours · Marquer résolu · Fermer le ticket · Supprimer", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Recherche",
        desc: "Filtre instantanément les lignes affichées par sujet, adresse e-mail ou contenu du message. Attention : elle ne fouille que les tickets déjà affichés à l'écran, pas toute la base de données.",
      },
      {
        n: 2,
        label: "Filtres par statut",
        desc: "Cinq pastilles : Tous, Ouverts, En cours, Résolus, Fermés. Le petit chiffre à côté de chaque pastille compte TOUS les tickets de ce statut dans la base de données. Cliquer recharge la liste.",
      },
      {
        n: 3,
        label: "Tuiles de chiffres",
        desc: "Sept compteurs : total, par statut, plus « Aujourd'hui » (tickets reçus ce jour) et « Cette semaine » (7 derniers jours). Lecture seule, recalculés à chaque affichage.",
      },
      {
        n: 4,
        label: "Filtre par catégorie",
        desc: "Affine la liste affichée par type de demande. Les messages du formulaire de la page Contact arrivent tous en « Autre » ; ceux du centre d'aide du site portent la catégorie choisie par le visiteur (Bug, Commande, Produit, Compte ou Autre).",
      },
      {
        n: 5,
        label: "Liste des tickets",
        desc: "Les tickets « Ouverts » (jamais traités) sont surlignés en couleur avec un point devant le sujet, et leur sujet est en gras. Une icône d'alerte (un rond avec un point d'exclamation) apparaît à gauche du sujet quand la priorité est Haute ou Urgente. Cliquer sur une ligne ouvre la fenêtre de détail.",
      },
      {
        n: 6,
        label: "Fenêtre de détail",
        desc: "S'ouvre au clic sur un ticket : message complet, adresse e-mail de la personne, date d'envoi, menu « Priorité », boutons de changement de statut (« Marquer en cours », « Marquer résolu », « Fermer le ticket » — celui du statut actuel est masqué, et il n'existe pas de bouton pour repasser un ticket en « Ouvert ») et bouton « Supprimer ». La touche Échap ou un clic à côté referme la fenêtre.",
      },
    ],
    workflows: [
      {
        title: "Traiter un message reçu du site",
        steps: [
          {
            title: "Repérer les nouveautés",
            body: "Ouvrez la page : les tickets jamais traités sont surlignés et marqués d'un point. La pastille « Ouverts » en haut indique combien il en reste.",
          },
          {
            title: "Lire le message",
            body: "Cliquez sur la ligne. La fenêtre de détail affiche le message complet, l'adresse e-mail de la personne et la date d'envoi.",
          },
          {
            title: "Répondre au client",
            body: "Copiez son adresse e-mail et répondez depuis la boîte mail de la pharmacie. Le panneau n'envoie pas d'e-mails lui-même.",
          },
          {
            title: "Mettre à jour le statut",
            body: "Cliquez « Marquer en cours » si le sujet demande encore du travail, ou « Marquer résolu » une fois la réponse envoyée. La date du traitement est alors enregistrée sur le ticket.",
          },
          {
            title: "Archiver plus tard",
            body: "Quand le sujet est clos pour de bon, « Fermer le ticket » le range dans le filtre « Fermés ». Il reste consultable.",
          },
        ],
      },
      {
        title: "Signaler une urgence à l'équipe",
        steps: [
          {
            title: "Ouvrir le ticket",
            body: "Cliquez sur la ligne concernée pour ouvrir la fenêtre de détail.",
          },
          {
            title: "Monter la priorité",
            body: "Dans le menu « Priorité », choisissez « Haute » ou « Urgente ». L'enregistrement est immédiat, il n'y a pas de bouton à valider.",
          },
          {
            title: "Vérifier dans la liste",
            body: "Une icône d'alerte apparaît devant le sujet (orangée pour Haute, rouge pour Urgente) : toute l'équipe voit d'un coup d'œil ce qui presse.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Changer le statut (Marquer en cours · Marquer résolu · Fermer le ticket)",
        where: "Fenêtre de détail d'un ticket",
        does: "Fait avancer le ticket dans son cycle de vie. Trois boutons existent (En cours, Résolu, Fermé) ; celui du statut actuel est masqué. Aucun bouton ne permet de repasser un ticket en « Ouvert ».",
        effects: [
          "Le statut du ticket change immédiatement et la fenêtre se referme.",
          "Les pastilles de filtre, les tuiles de chiffres et le surlignage de la liste se mettent à jour.",
          "« Marquer résolu » enregistre en plus la date et l'heure du traitement (« Traité le : ») et qui l'a fait ; cette mention reste affichée même si le statut change ensuite.",
        ],
        severity: "safe",
        undo: "Ouvrez le ticket et choisissez un autre statut parmi « En cours », « Résolu » et « Fermé ». Impossible en revanche de le repasser en « Ouvert ».",
        audited: true,
      },
      {
        label: "Changer la priorité",
        where: "Menu « Priorité » dans la fenêtre de détail",
        does: "Classe le ticket en Basse, Normale, Haute ou Urgente pour aider l'équipe à trier.",
        effects: [
          "L'enregistrement est immédiat dès que vous choisissez une valeur (pas de bouton « Enregistrer »).",
          "En Haute ou Urgente, une icône d'alerte apparaît devant le sujet dans la liste.",
          "Aucun effet pour le client : la priorité est purement interne.",
        ],
        severity: "safe",
        undo: "Choisissez une autre valeur dans le même menu.",
        audited: true,
      },
      {
        label: "Supprimer",
        where: "Bouton rouge dans la fenêtre de détail (avec demande de confirmation)",
        does: "Efface définitivement le ticket de la base de données.",
        effects: [
          "Le message, l'adresse e-mail et tout l'historique du ticket disparaissent pour toujours.",
          "Aucun e-mail n'est envoyé à la personne ; elle peut bien sûr réécrire via le formulaire du site.",
          "Les compteurs sont mis à jour immédiatement.",
        ],
        severity: "danger",
        audited: true,
      },
    ],
    flows: [
      {
        title: "Vie d'un message de contact",
        lanes: [
          [
            {
              label: "Ouvert",
              tone: "warn",
              note: "Le message vient d'arriver du site (formulaire Contact ou centre d'aide), avec la priorité « Normale ». Il est surligné dans la liste tant qu'il garde ce statut.",
            },
            {
              label: "En cours",
              note: "Quelqu'un s'en occupe. Utile quand la réponse demande une vérification ou l'avis d'un collègue.",
            },
            {
              label: "Résolu",
              tone: "ok",
              note: "La réponse a été envoyée au client. La date et l'auteur du traitement sont enregistrés sur le ticket.",
            },
            {
              label: "Fermé",
              note: "Sujet archivé. Le ticket reste consultable dans le filtre « Fermés ».",
            },
          ],
          [
            {
              label: "Supprimé",
              tone: "bad",
              note: "Possible à n'importe quel stade depuis la fenêtre de détail. Définitif : préférez « Fermer le ticket » pour garder l'historique.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "La liste n'affiche que les 10 tickets les plus récents du statut choisi, alors que les compteurs comptent tout. Si la pastille « Ouverts » indique 25, seuls les 10 derniers sont visibles à l'écran.",
      "La recherche et le filtre par catégorie ne fouillent que les tickets déjà affichés (donc 10 au maximum) — pas toute la base de données.",
      "Les messages du formulaire de la page Contact arrivent tous en catégorie « Autre » ; seuls ceux du centre d'aide portent une catégorie choisie par le visiteur. Cet écran ne permet pas de changer la catégorie d'un ticket.",
      "Le menu « Priorité » enregistre dès que vous choisissez une valeur — il n'y a pas de bouton de validation.",
      "« Marquer résolu » fixe la date « Traité le » sur le ticket ; si vous le repassez ensuite en « En cours » ou le fermez, cette date reste affichée.",
      "Le panneau n'envoie aucun e-mail au client, ni à la réception du message, ni au changement de statut, ni à la suppression. Toute réponse passe par votre boîte mail.",
      "La suppression est définitive, sans corbeille de récupération. Pour faire le ménage sans rien perdre, utilisez plutôt « Fermer le ticket ».",
    ],
  },
  {
    id: "newsletter",
    navLabel: "Newsletter",
    title: "Newsletter — la liste des abonnés",
    route: "/admin/newsletter",
    intro:
      "Cette page liste les personnes qui ont laissé leur adresse e-mail sur le site pour recevoir la newsletter. Pour chaque abonné, vous voyez sa langue, sa date d'inscription et — point essentiel — s'il a confirmé son inscription : après s'être inscrit, le visiteur reçoit un e-mail avec un lien de confirmation valable 24 heures ; tant qu'il n'a pas cliqué, la colonne « Confirmé » affiche un tiret. L'écran permet de chercher un abonné, de filtrer par langue, d'exporter la liste dans un fichier pour Excel et de retirer quelqu'un de la liste. Attention : l'envoi de la newsletter elle-même ne se fait pas ici — on exporte la liste, puis on envoie depuis un outil d'e-mailing externe.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Newsletter — titre et fil d'ariane Admin" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Total", hotspot: 1 },
            { w: 3, kind: "kpi", label: "FR" },
            { w: 3, kind: "kpi", label: "ES" },
            { w: 3, kind: "kpi", label: "EN" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "input", label: "🔍 Chercher email…", hotspot: 2 },
            { w: 4, kind: "input", label: "Toutes les langues ▾", hotspot: 3 },
            { w: 3, kind: "button", label: "⬇ Exporter CSV", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Email · Langue · Inscrit · Confirmé · Supprimer", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "text", label: "« Affichage limité à 500 lignes… » (n'apparaît que si la liste est pleine)", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Tuiles de chiffres",
        desc: "Total des abonnés affichés, puis la répartition par langue (FR, ES, EN). Attention : ces chiffres comptent la sélection à l'écran (500 lignes au maximum) et changent quand vous filtrez — ce n'est pas forcément le total absolu de la liste.",
      },
      {
        n: 2,
        label: "Recherche par e-mail",
        desc: "Tapez une partie d'une adresse : la liste se recharge depuis la base de données et ne montre que les correspondances, sans tenir compte des majuscules.",
      },
      {
        n: 3,
        label: "Filtre par langue",
        desc: "Limite la liste aux abonnés inscrits en français, espagnol ou anglais. La langue est celle de la page du site où la personne s'est inscrite.",
      },
      {
        n: 4,
        label: "Bouton « Exporter CSV »",
        desc: "Télécharge un fichier (ouvrable dans Excel) avec les abonnés correspondant aux filtres en cours, jusqu'à 1 000 lignes. Le fichier est nommé avec la date du jour.",
      },
      {
        n: 5,
        label: "Tableau des abonnés",
        desc: "Une ligne par abonné, du plus récent au plus ancien. Cliquer sur l'adresse e-mail ouvre votre logiciel de messagerie. La colonne « Confirmé » affiche la date de confirmation, ou un tiret si la personne n'a pas encore cliqué le lien reçu par e-mail. Le bouton « Supprimer » est au bout de chaque ligne.",
      },
      {
        n: 6,
        label: "Avertissement de limite",
        desc: "N'apparaît que quand la liste atteint 500 lignes : il reste alors des abonnés non affichés — affinez la recherche ou le filtre de langue pour les voir.",
      },
    ],
    workflows: [
      {
        title: "Préparer un envoi de newsletter",
        steps: [
          {
            title: "Choisir la langue",
            body: "Sélectionnez la langue de la campagne dans le filtre (par exemple « Español ») pour ne garder que les abonnés concernés.",
          },
          {
            title: "Exporter la liste",
            body: "Cliquez « Exporter CSV ». Le fichier téléchargé respecte les filtres en cours et contient jusqu'à 1 000 abonnés.",
          },
          {
            title: "Garder les confirmés",
            body: "Dans le fichier, écartez les lignes dont la colonne de confirmation est vide : ces personnes n'ont pas validé leur inscription, il ne faut pas leur écrire.",
          },
          {
            title: "Envoyer depuis votre outil",
            body: "Importez les adresses restantes dans votre outil d'envoi d'e-mails. Le panneau d'administration n'envoie pas la newsletter lui-même.",
          },
        ],
      },
      {
        title: "Retirer une personne qui ne veut plus recevoir d'e-mails",
        steps: [
          {
            title: "Retrouver l'abonné",
            body: "Tapez son adresse (ou une partie) dans le champ « Chercher email… ».",
          },
          {
            title: "Supprimer la ligne",
            body: "Cliquez « Supprimer » au bout de la ligne, puis confirmez. Le retrait est immédiat et définitif.",
          },
          {
            title: "Savoir ce qui suit",
            body: "La personne ne reçoit aucun message de notre part. Elle pourra se réinscrire à tout moment depuis le site si elle change d'avis.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Exporter CSV",
        where: "Bouton en haut à droite de la barre de filtres",
        does: "Télécharge la liste des abonnés correspondant aux filtres en cours dans un fichier pour Excel (jusqu'à 1 000 lignes).",
        effects: [
          "Le fichier contient, pour chaque abonné : un identifiant interne, l'adresse e-mail, la langue, la date d'inscription et la date de confirmation (vide si en attente).",
          "L'adresse IP des abonnés n'est jamais exportée (protection des données personnelles).",
          "Rien n'est modifié dans la base de données — c'est une simple copie. Le fichier contient toutefois des adresses personnelles : conservez-le en lieu sûr et ne le diffusez pas hors de la pharmacie.",
        ],
        severity: "caution",
      },
      {
        label: "Supprimer",
        where: "Bouton rouge au bout de chaque ligne du tableau (avec demande de confirmation)",
        does: "Retire définitivement l'abonné de la liste de diffusion.",
        effects: [
          "La ligne est effacée de la base de données : adresse, langue, dates d'inscription et de confirmation disparaissent pour toujours.",
          "Aucun e-mail n'est envoyé à la personne pour l'en informer.",
          "Elle peut se réinscrire elle-même à tout moment depuis le site (elle repassera alors par l'e-mail de confirmation).",
          "Les tuiles de chiffres se mettent à jour immédiatement.",
        ],
        severity: "danger",
        audited: true,
      },
    ],
    flows: [
      {
        title: "Parcours d'un abonné",
        lanes: [
          [
            {
              label: "Inscription sur le site",
              note: "Le visiteur laisse son adresse dans le formulaire newsletter du site. Il apparaît aussitôt dans la liste.",
            },
            {
              label: "E-mail de confirmation",
              tone: "warn",
              note: "Un e-mail avec un lien lui est envoyé. Le lien est valable 24 heures. En attendant, la colonne « Confirmé » affiche un tiret.",
            },
            {
              label: "Confirmé",
              tone: "ok",
              note: "La personne a cliqué le lien : la date apparaît dans la colonne « Confirmé ». Elle peut recevoir la newsletter.",
            },
          ],
          [
            {
              label: "Pas de clic sous 24 heures",
              tone: "warn",
              note: "L'inscription reste en attente. Si la personne s'inscrit à nouveau avec la même adresse, le site lui renvoie automatiquement un nouveau lien de confirmation.",
            },
          ],
          [
            {
              label: "Retiré de la liste",
              tone: "bad",
              note: "Par le bouton « Supprimer » de cet écran, ou par la personne elle-même depuis son compte client. Définitif, mais la réinscription reste possible.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Les tuiles de chiffres comptent ce qui est affiché à l'écran (500 lignes au maximum), pas forcément toute la liste — et elles changent dès que vous filtrez.",
      "La liste s'arrête à 500 lignes (un message le signale en bas). L'export, lui, va jusqu'à 1 000 lignes.",
      "L'export respecte les filtres en cours : pour exporter tout le monde, videz la recherche et remettez « Toutes les langues » avant de cliquer.",
      "Un tiret dans la colonne « Confirmé » signifie que la personne n'a pas validé son inscription : ne lui envoyez pas la newsletter.",
      "La suppression est immédiate, définitive et silencieuse (aucun e-mail à la personne). Il n'y a pas de corbeille de récupération.",
      "Certaines inscriptions sont confirmées d'office, sans e-mail : c'est le cas quand un client connecté se réabonne depuis son compte, ou si l'envoi d'e-mails n'est pas configuré sur le site.",
      "Cet écran ne sert qu'à gérer la liste : la rédaction et l'envoi de la newsletter se font dans un outil externe, à partir du fichier exporté.",
    ],
  },
]
