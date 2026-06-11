import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "reservations",
    navLabel: "Réservations",
    title: "Réservations — la boîte de réception des demandes clients",
    route: "/admin/reservations",
    intro:
      "Cet écran rassemble toutes les réservations en cours : celles passées sur le site (par un client avec compte ou un visiteur), et celles que vous créez vous-même pour un client au téléphone ou au comptoir. C'est ici que vous contactez le client sur WhatsApp, que vous confirmez sa venue, puis que vous marquez la réservation « Remise » quand il passe payer et récupérer ses produits. Les réservations remises quittent cet écran et rejoignent l'écran Ventes. Important : réserver ne bloque PAS le stock — les unités ne sortent du stock qu'au moment de la remise en pharmacie. Une réservation web est gardée 24 heures, une réservation manuelle 30 jours ; passé ce délai sans confirmation, elle expire toute seule.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 7, kind: "text", label: "Admin › Opérations › Réservations" },
            { w: 2, kind: "button", label: "Exporter CSV" },
            { w: 3, kind: "button", label: "+ Nouvelle manuelle", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "toolbar", label: "Rechercher par référence, client, téléphone…", hotspot: 2 },
            { w: 4, kind: "tabs", label: "Toutes · Réservées · Confirmées · Annulées · Expirées", hotspot: 3 },
            { w: 3, kind: "input", label: "Trier par" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "X sélectionnées · Rappel WhatsApp · Marquer · Annuler", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "table", label: "Référence · Client · Articles · Total · Statut · Date", hotspot: 5 },
            { w: 3, kind: "panel", label: "3 icônes d'action par ligne", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "text", label: "Pagination (25 par page)" },
            { w: 8, kind: "drawer", label: "Tiroir de détail : client · produits · total · note · actions", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Nouvelle manuelle",
        desc: "Ouvre le tiroir de création d'une réservation pour un client qui appelle ou se présente au comptoir : identité du client, produits, note interne.",
      },
      {
        n: 2,
        label: "Recherche",
        desc: "Filtre la liste par référence (FAR-…), nom, téléphone ou email du client. Elle ne fouille que les réservations de l'onglet en cours.",
      },
      {
        n: 3,
        label: "Onglets de statut",
        desc: "Chaque onglet affiche son compteur. « Réservées » = à contacter, « Confirmées » = client prévenu, plus « Annulées » et « Expirées ». « Toutes » regroupe tout SAUF les ventes remises, qui vivent dans l'écran Ventes.",
      },
      {
        n: 4,
        label: "Barre d'actions par lot",
        desc: "Apparaît dès qu'au moins une ligne est cochée : rappel WhatsApp groupé, avancement de statut groupé (seulement si toutes les lignes cochées sont au même statut « Réservée » ou « Confirmée ») et annulation groupée.",
      },
      {
        n: 5,
        label: "Le tableau",
        desc: "Une ligne par réservation : case à cocher, référence, client (nom, téléphone, pastille d'origine Comptoir ou Anonyme web), nombre d'articles, total en pesos, badge de statut et date. Cliquer la ligne ouvre le tiroir de détail.",
      },
      {
        n: 6,
        label: "Les actions de ligne",
        desc: "De gauche à droite : ouvrir WhatsApp avec le message pré-rempli (seulement si le client a un téléphone), la coche pour passer au statut suivant (« Marquer confirmée » puis « Marquer remise »), et « … » pour ouvrir le détail.",
      },
      {
        n: 7,
        label: "Le tiroir de détail",
        desc: "S'ouvre à droite : coordonnées du client (téléphone et email cliquables), liste des produits avec leur prix (crayon pour ajuster un prix tant que la réservation n'est pas remise), total, note interne à enregistrement automatique, puis les boutons WhatsApp, statut suivant et le lien « Annuler la réservation ».",
      },
    ],
    workflows: [
      {
        title: "Traiter une réservation reçue du site",
        steps: [
          {
            title: "Ouvrez l'onglet « Réservées »",
            body: "C'est la file d'attente : le compteur « à contacter » en haut de page vous dit combien de demandes attendent. Cliquez une ligne pour ouvrir le détail.",
          },
          {
            title: "Vérifiez les produits en rayon",
            body: "La réservation ne bloque pas le stock : assurez-vous que les produits demandés sont bien disponibles avant de promettre quoi que ce soit au client.",
          },
          {
            title: "Contactez le client sur WhatsApp",
            body: "Cliquez le bouton vert : WhatsApp s'ouvre avec un message déjà rédigé — référence, liste des produits et total. Convenez de l'heure de passage.",
          },
          {
            title: "Marquez la réservation « Confirmée »",
            body: "Une fois le client d'accord, cliquez « Marquer confirmée ». La réservation n'expirera plus automatiquement : c'est votre engagement de la garder.",
          },
          {
            title: "À son passage, marquez « Remise »",
            body: "Le client paie et repart avec ses produits : cliquez « Marquer remise ». Le stock est décrémenté, la vente entre dans la comptabilité du mois et la ligne part dans l'écran Ventes.",
          },
        ],
      },
      {
        title: "Créer une réservation pour un client au téléphone",
        steps: [
          {
            title: "Cliquez « Nouvelle manuelle »",
            body: "Le tiroir de création s'ouvre. Une réservation manuelle est gardée 30 jours (au lieu de 24 heures pour le site) — vous la gérez activement.",
          },
          {
            title: "Identifiez le client",
            body: "Trois voies : retrouver son compte existant, lui créer un compte express (prénom + téléphone), ou le saisir en invité avec au moins un téléphone. Si vous le liez à un compte qui a déjà une réservation active, la création sera refusée.",
          },
          {
            title: "Ajoutez les produits",
            body: "Tapez au moins deux lettres dans la recherche et cliquez le produit : il s'ajoute avec son prix courant. Vous pouvez modifier le prix et la quantité de chaque ligne, ou ajouter une « Ligne libre » pour un produit hors catalogue.",
          },
          {
            title: "Validez avec « Créer la réservation »",
            body: "Elle apparaît dans l'onglet « Réservées » avec la pastille d'origine « Comptoir ». Aucun email n'est envoyé pour une création manuelle — prévenez le client vous-même.",
          },
        ],
      },
      {
        title: "Accorder un tarif préférentiel",
        steps: [
          {
            title: "Ouvrez le détail de la réservation",
            body: "L'ajustement de prix n'est possible que sur une réservation « Réservée » ou « Confirmée » — jamais après la remise.",
          },
          {
            title: "Cliquez le crayon de la ligne produit",
            body: "Dans la section Produits du tiroir, chaque ligne porte un petit crayon. Un champ de saisie remplace le montant.",
          },
          {
            title: "Saisissez le nouveau prix unitaire et validez",
            body: "Cliquez la coche (ou appuyez sur Entrée). Le total de la réservation est recalculé immédiatement et le changement est consigné au journal d'audit avec l'ancien et le nouveau prix.",
          },
          {
            title: "Vérifiez le nouveau total",
            body: "C'est ce prix-là qui sera encaissé et comptabilisé à la remise — le prix affiché sur le site, lui, ne change pas.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "« Marquer confirmée » (ligne, tiroir ou lot « Marquer confirmées »)",
        where: "Coche d'une ligne « Réservée », bouton noir du tiroir, ou barre d'actions par lot",
        does: "Passe la réservation de « Réservée » à « Confirmée » : vous vous êtes mis d'accord avec le client.",
        effects: [
          "Le badge de statut passe à « Confirmée » et la date de confirmation est enregistrée dans la base de données.",
          "La réservation n'expire PLUS automatiquement : le compte à rebours (24 h pour le site, 30 jours pour une manuelle) ne s'applique qu'aux réservations « Réservées ».",
          "Le stock ne bouge pas — il ne sera décrémenté qu'à la remise.",
          "Aucun bouton ne permet de revenir à « Réservée » : la seule sortie est ensuite « Remise » ou l'annulation.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "Le client qui a un compte voit le statut « Confirmée » dans son compte, page « Historique d'achats » (onglet « Achats »).",
      },
      {
        label: "« Marquer remise » (ligne, tiroir ou lot « Marquer remises »)",
        where: "Coche d'une ligne « Confirmée », bouton noir du tiroir, ou barre d'actions par lot",
        does: "Enregistre que le client est passé payer et repartir avec ses produits : la réservation devient une vente.",
        effects: [
          "Le stock de chaque produit est décrémenté de la quantité réservée (jamais en dessous de 0 ; les lignes libres et les produits à stock illimité sont ignorés).",
          "Le coût d'achat moyen du moment est figé sur chaque ligne pour calculer la marge de cette vente — il ne changera plus, même si le coût du produit évolue ensuite.",
          "La vente entre dans le chiffre d'affaires du mois (écran Comptabilité) au prix facturé de chaque ligne.",
          "La ligne quitte cet écran et rejoint l'écran Ventes (journal des ventes remises).",
          "Les prix de la réservation deviennent verrouillés : plus aucun ajustement possible.",
        ],
        severity: "caution",
        undo: "Depuis l'écran Ventes : annuler la vente re-crédite automatiquement le stock et la retire du chiffre d'affaires.",
        audited: true,
        publicImpact: "La disponibilité affichée des produits baisse sur le site ; le client à compte voit « Récupérée » dans son historique d'achats.",
        accountingImpact: "Ajoute la vente au chiffre d'affaires du mois et fige le coût qui servira au calcul de la marge.",
      },
      {
        label: "« Annuler la réservation » (tiroir) / « Annuler » (lot)",
        where: "Lien souligné en bas du tiroir de détail, ou barre d'actions par lot",
        does: "Annule définitivement la réservation, après une fenêtre de confirmation.",
        effects: [
          "Le statut passe à « Annulée » — la ligne reste visible dans l'onglet « Annulées », rien n'est effacé.",
          "Le stock n'est pas touché : il n'avait jamais été décrémenté (la réservation n'était pas remise).",
          "C'est définitif : aucun bouton ne permet de réactiver une réservation annulée. S'il faut la reprendre, créez-en une nouvelle via « Nouvelle manuelle ».",
          "En lot, chaque réservation cochée est annulée l'une après l'autre, après une seule confirmation.",
          "Le client n'est PAS prévenu automatiquement — contactez-le sur WhatsApp si nécessaire.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "Le client à compte voit « Annulée » dans son espace, et peut de nouveau passer une réservation sur le site.",
      },
      {
        label: "Crayon « Ajuster le prix » d'une ligne produit",
        where: "Tiroir de détail, section Produits — visible seulement si la réservation est « Réservée » ou « Confirmée »",
        does: "Modifie le prix unitaire facturé d'un produit de CETTE réservation (tarif préférentiel pour un client fidèle).",
        effects: [
          "Le prix de la ligne est remplacé (arrondi au centime) et le total de la réservation est recalculé dans la foulée — ligne et total ne peuvent jamais se contredire.",
          "Refusé si la réservation est déjà remise, expirée ou annulée : message « Prix verrouillé ».",
          "Le changement est consigné au journal d'audit comme opération à fort impact, avec l'ancien et le nouveau prix.",
          "Ne change PAS le prix de la fiche produit ni des autres réservations : seul ce client, sur cette réservation, est concerné.",
          "C'est ce prix ajusté qui sera encaissé et comptabilisé à la remise.",
        ],
        severity: "caution",
        undo: "Tant que la réservation n'est pas remise, ressaisissez l'ancien prix de la même façon.",
        audited: true,
        publicImpact: "Le client à compte voit le nouveau total de sa réservation dans son espace ; le prix affiché en boutique ne change pas.",
        accountingImpact: "Le prix facturé entre tel quel dans le chiffre d'affaires à la remise.",
      },
      {
        label: "Note interne (zone de texte du tiroir)",
        where: "Tiroir de détail, section « Note interne · équipe FARMAU uniquement »",
        does: "Mémorise une consigne pour l'équipe (ex. « Le client préfère payer en espèces »).",
        effects: [
          "L'enregistrement est automatique : environ une seconde après votre dernière frappe, la mention « Enregistré » s'affiche.",
          "La note n'est jamais visible par le client — ni sur le site, ni dans les messages WhatsApp ou les emails.",
        ],
        severity: "safe",
        undo: "Modifiez ou effacez le texte : il se ré-enregistre tout seul.",
        audited: true,
      },
      {
        label: "« Nouvelle manuelle » → « Créer la réservation »",
        where: "Bouton en haut à droite de l'écran, puis bouton en bas du tiroir de création",
        does: "Crée une réservation pour un client qui appelle ou se présente au comptoir, sans passer par le site.",
        effects: [
          "La réservation naît au statut « Réservée », avec la pastille d'origine « Comptoir », et est gardée 30 jours avant expiration automatique.",
          "Les prix saisis dans le tiroir sont figés tels quels sur la réservation (vous pouvez les modifier ligne par ligne avant de valider).",
          "Le stock n'est pas touché à la création — il ne baissera qu'à la remise.",
          "Si vous liez la réservation à un compte client qui a déjà une réservation active, la création est refusée : « Ce client a déjà une réservation active. »",
          "Aucun email de confirmation n'est envoyé pour une création manuelle (contrairement aux réservations passées sur le site).",
          "Le bouton reste grisé tant qu'il n'y a pas au moins un produit et une identité client valide (l'invité exige au moins un téléphone).",
        ],
        severity: "caution",
        undo: "Annulez la réservation créée : elle restera listée dans « Annulées ».",
        audited: true,
      },
      {
        label: "« Ouvrir WhatsApp » / « Rappel WhatsApp » (lot)",
        where: "Bouton vert d'une ligne, du tiroir, ou de la barre d'actions par lot",
        does: "Ouvre WhatsApp vers le client avec un message déjà rédigé : référence, liste des produits et total.",
        effects: [
          "N'enregistre rien : ni le statut ni la réservation ne changent — c'est à vous d'envoyer le message puis de marquer « Confirmée ».",
          "Le bouton n'apparaît que si la réservation a un numéro de téléphone.",
          "En lot, un onglet WhatsApp s'ouvre pour CHAQUE réservation cochée ayant un téléphone — le navigateur peut bloquer ces fenêtres : autorisez-les si rien ne s'ouvre.",
        ],
        severity: "safe",
      },
    ],
    flows: [
      {
        title: "Le cycle de vie d'une réservation",
        lanes: [
          [
            {
              label: "Réservée",
              tone: "neutral",
              note: "La demande arrive (site ou manuelle). Le stock n'est pas bloqué. Si elle vient du site et que le client a laissé un email, il reçoit un récapitulatif avec un bouton WhatsApp.",
            },
            {
              label: "Confirmée",
              tone: "neutral",
              note: "Vous avez convenu du passage avec le client. La réservation n'expire plus automatiquement.",
            },
            {
              label: "Remise",
              tone: "ok",
              note: "Le client a payé et emporté ses produits : stock décrémenté, coût figé pour la marge, vente comptabilisée. La ligne part dans l'écran Ventes.",
            },
          ],
          [
            {
              label: "Réservée",
              tone: "neutral",
              note: "Sans confirmation à temps (24 h pour le site, 30 jours pour une manuelle)…",
            },
            {
              label: "Expirée",
              tone: "bad",
              note: "Passage automatique, vérifié toutes les 15 minutes. Le stock n'a jamais bougé. Définitif — le client peut réserver de nouveau.",
            },
          ],
          [
            {
              label: "Réservée ou Confirmée",
              tone: "neutral",
              note: "Le client se désiste, ou vous renoncez…",
            },
            {
              label: "Annulée",
              tone: "bad",
              note: "Annulation manuelle, définitive. Le stock est intact (il ne baisse qu'à la remise).",
            },
          ],
          [
            {
              label: "Remise",
              tone: "ok",
              note: "Vente déjà comptabilisée, visible dans l'écran Ventes.",
            },
            {
              label: "Annulée (depuis l'écran Ventes)",
              tone: "warn",
              note: "Le stock est automatiquement re-crédité et la vente sort du chiffre d'affaires du mois.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Réserver ne bloque pas le stock : il ne baisse qu'au moment de la remise. Le dernier exemplaire d'un produit peut donc être promis à deux clients — vérifiez le rayon avant de confirmer.",
      "Seules les réservations « Réservées » expirent automatiquement (24 h pour le site, 30 jours pour une manuelle, vérification toutes les 15 minutes). Une réservation « Confirmée » ne disparaît jamais toute seule : c'est à vous de la remettre ou de l'annuler.",
      "« Annulée » et « Expirée » sont des états définitifs : aucun bouton ne permet de réactiver. S'il faut reprendre la demande, recréez une réservation via « Nouvelle manuelle ».",
      "L'email de confirmation au client ne concerne que les réservations passées sur le SITE avec une adresse email connue, et seulement si la clé d'envoi d'emails est configurée — sinon rien ne part, sans message d'erreur. Une création manuelle n'envoie jamais d'email : prévenez le client vous-même.",
      "Le prix ajusté au crayon ne vaut que pour cette réservation : la fiche produit et les autres réservations gardent leur prix. Après la remise, les prix sont verrouillés (message « Prix verrouillé »).",
      "L'onglet « Toutes » n'inclut pas les ventes remises : elles vivent dans l'écran Ventes. Seul le compteur « au total » en haut de page compte toute la base, ventes remises comprises.",
      "La recherche ne fouille que l'onglet en cours : pour chercher partout, placez-vous d'abord sur « Toutes ».",
      "Le bouton « Exporter CSV » n'est pas encore actif — il affiche « Export CSV prochainement ».",
      "Le « Rappel WhatsApp » en lot ouvre un onglet par client : si rien ne s'ouvre, le navigateur bloque probablement les fenêtres surgissantes.",
      "Les actions par lot avancent les statuts une réservation à la fois : sur une grosse sélection, laissez l'écran finir avant de cliquer ailleurs. Le bouton d'avancement groupé n'apparaît que si toutes les lignes cochées ont le même statut, et uniquement pour des « Réservées » ou des « Confirmées ».",
      "Annuler une réservation ne prévient pas le client : pensez à lui écrire sur WhatsApp.",
      "La note interne n'est jamais visible par le client, mais toute modification de réservation (statut, note, prix, création) est consignée au journal d'audit avec votre nom.",
    ],
  },
]
