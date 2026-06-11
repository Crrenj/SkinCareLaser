import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "contabilidad",
    navLabel: "Comptabilité",
    title: "Comptabilité — le bilan du mois",
    route: "/admin/contabilidad",
    intro:
      "Cet écran fait le bilan financier d'un mois : ce que la pharmacie a encaissé, ce que les produits vendus ont coûté, les dépenses (loyer, salaires…) et le résultat net. Presque tout est en lecture seule : les chiffres se calculent automatiquement à partir des ventes encaissées, des réceptions de stock et des pertes déclarées. La seule chose que vous saisissez ici, ce sont les dépenses du mois. C'est aussi ici que vous téléchargez les fichiers 606 et 607 pour le comptable (DGII).",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 4, kind: "text", label: "junio de 2026", hotspot: 1 },
            { w: 8, kind: "toolbar", label: "◀  mois ▼  ▶" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Ingresos", hotspot: 2 },
            { w: 3, kind: "kpi", label: "Coste de ventas" },
            { w: 3, kind: "kpi", label: "Gastos" },
            { w: 3, kind: "kpi", label: "Resultado neto" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "text", label: "Exportar DGII" },
            { w: 4, kind: "button", label: "606 · Compras", hotspot: 3 },
            { w: 5, kind: "button", label: "607 · Ventas (borrador)" },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "panel", label: "01 · Resultado del mes", hotspot: 4 },
            { w: 5, kind: "panel", label: "Ventas por canal", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "panel", label: "02 · Gastos — saisie + liste", hotspot: 6 },
            { w: 5, kind: "panel", label: "Gastos por categoría" },
          ],
        },
        {
          blocks: [{ w: 12, kind: "table", label: "03 · Márgenes por producto", hotspot: 7 }],
        },
        {
          blocks: [
            { w: 5, kind: "panel", label: "04 · Inventario valorizado", hotspot: 8 },
            { w: 7, kind: "panel", label: "Compras del mes (606)", hotspot: 9 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Mois affiché",
        desc: "Le titre indique le mois en cours d'affichage. Les flèches passent au mois précédent ou suivant (la flèche « suivant » est bloquée sur le mois en cours), et le menu déroulant liste les 12 derniers mois. Tout l'écran se recalcule pour le mois choisi.",
      },
      {
        n: 2,
        label: "Les 4 chiffres-clés",
        desc: "Ingresos = ventes encaissées du mois (montant, unités, nombre de ventes). Coste de ventas = coût des produits vendus, avec le pourcentage du chiffre d'affaires dont le coût est connu. Gastos = total des dépenses saisies. Resultado neto = recettes moins coût des ventes moins dépenses ; la tuile s'affiche en alerte si le mois est en perte.",
      },
      {
        n: 3,
        label: "Téléchargements DGII",
        desc: "Deux boutons qui téléchargent un fichier CSV (à ouvrir dans Excel) pour le mois affiché : le 606 (registre des achats, reconstruit depuis les réceptions de stock) et le 607 (journal des ventes encaissées, fourni en brouillon).",
      },
      {
        n: 4,
        label: "Resultado del mes",
        desc: "Le compte de résultat ligne par ligne : Recettes − Coût des ventes = Marge brute, puis − Dépenses = Résultat net. En dessous : la jauge « Cobertura de coste » (part du chiffre d'affaires dont le coût est connu) et la comparaison avec le mois précédent (Δ en pourcentage).",
      },
      {
        n: 5,
        label: "Ventas por canal",
        desc: "Répartition des recettes encaissées entre les trois canaux : Mostrador (vente au comptoir), Web invitado (réservation sans compte) et Cuenta cliente (réservation avec compte). Chaque barre montre le montant et le nombre de ventes.",
      },
      {
        n: 6,
        label: "Saisie et liste des dépenses",
        desc: "Le seul endroit de l'écran où vous modifiez quelque chose : un formulaire (montant, catégorie, date, description facultative) avec le bouton « Añadir », et la liste des dépenses du mois, chacune avec une icône corbeille pour la supprimer.",
      },
      {
        n: 7,
        label: "Márgenes por producto",
        desc: "Tableau des produits vendus dans le mois : unités, recettes, coût et marge en pourcentage. En dessous, les produits à plus faible marge. Le tableau reste vide tant qu'aucune vente du mois n'a de coût connu — il se remplit avec les ventes encaissées APRÈS vos premières réceptions dans l'écran Stock (le coût est figé au moment de l'encaissement, les ventes déjà encaissées ne sont pas recalculées).",
      },
      {
        n: 8,
        label: "Inventario valorizado",
        desc: "Photo du stock actuel (pas seulement du mois affiché) : valeur au coût d'achat, valeur au prix de vente, nombre d'unités, et combien de produits actifs ont un coût enregistré. Les produits sans coût connu ne sont pas comptés à zéro : ils sont simplement exclus de la valeur au coût.",
      },
      {
        n: 9,
        label: "Compras del mes",
        desc: "Résumé des réceptions de stock saisies dans le mois : total acheté, base imposable et ITBIS estimés (18 %), nombre de lignes d'entrée (chaque produit reçu compte une ligne) et d'unités, principaux fournisseurs. Un avertissement compte les lignes sans NCF : elles sortiront avec une case NCF vide dans le fichier 606 — le NCF ne peut plus être ajouté après coup, gardez les factures pour le comptable.",
      },
    ],
    workflows: [
      {
        title: "Enregistrer une dépense (loyer, salaire, facture…)",
        steps: [
          {
            title: "Ouvrez la section « Gastos operativos »",
            body: "Sur l'écran Comptabilité, descendez jusqu'au bloc 02. Le formulaire de saisie est en haut du panneau de gauche.",
          },
          {
            title: "Remplissez le formulaire",
            body: "Montant en pesos (obligatoire, supérieur à zéro), catégorie (loyer, salaires, services…), date (aujourd'hui par défaut) et description facultative, par exemple « Alquiler de junio ».",
          },
          {
            title: "Cliquez « Añadir »",
            body: "Un message « Gasto registrado » confirme l'enregistrement. La dépense est écrite dans la base de données et tracée dans le journal d'audit.",
          },
          {
            title: "Vérifiez le résultat",
            body: "La ligne apparaît dans la liste, le total « Gastos del mes » augmente et le « Resultado neto » diminue d'autant. Si la date choisie tombe dans un autre mois, changez de mois pour voir la ligne.",
          },
        ],
      },
      {
        title: "Faire le point en fin de mois",
        steps: [
          {
            title: "Choisissez le mois",
            body: "Avec les flèches ou le menu déroulant en haut de l'écran. Tous les chiffres se recalculent pour ce mois.",
          },
          {
            title: "Lisez les 4 tuiles du haut",
            body: "Recettes, coût des ventes, dépenses, résultat net. Une tuile rouge sur le résultat net signale un mois en perte.",
          },
          {
            title: "Contrôlez la couverture de coût",
            body: "Si la jauge « Cobertura de coste » est sous 100 %, une partie des ventes n'a pas de coût connu : la marge est calculée sur une partie seulement, et le résultat net est plus optimiste que la réalité. Enregistrez vos réceptions dans l'écran Stock pour y remédier sur les ventes futures.",
          },
          {
            title: "Comparez au mois précédent",
            body: "Sous le compte de résultat, les lignes « Δ vs mes anterior » montrent l'évolution des recettes, du coût des ventes et de la marge brute.",
          },
          {
            title: "Parcourez les marges par produit",
            body: "Le tableau du bloc 03 met en avant les produits qui rapportent le plus, et la rangée « Menor margen » ceux dont la marge est la plus faible (même s'ils se vendent bien) — utile pour ajuster les prix.",
          },
        ],
      },
      {
        title: "Préparer les fichiers pour le comptable (DGII)",
        steps: [
          {
            title: "Affichez le mois clôturé",
            body: "Sélectionnez le mois concerné en haut de l'écran.",
          },
          {
            title: "Vérifiez l'encadré « Compras del mes »",
            body: "Si un avertissement indique des réceptions sans NCF, retrouvez les factures fournisseurs concernées : ces lignes partiront avec un NCF vide dans le fichier 606.",
          },
          {
            title: "Téléchargez le 606 (achats)",
            body: "Une ligne par réception : fournisseur, RNC, NCF, date de facture, base imposable et ITBIS séparés. Les produits reçus ensemble sont regroupés sur la même ligne.",
          },
          {
            title: "Téléchargez le 607 (ventes)",
            body: "Le journal des ventes encaissées du mois, avec la date, la référence, le canal, le client et le montant. C'est un brouillon : la colonne NCF est vide.",
          },
          {
            title: "Transmettez au comptable",
            body: "Envoyez les deux fichiers en précisant que le 607 est un journal interne sans comprobantes fiscaux : c'est au comptable de décider comment le déclarer.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Añadir (enregistrer une dépense)",
        where: "Bloc 02 « Gastos operativos », formulaire en haut du panneau « Registrar y revisar gastos »",
        does: "Enregistre une dépense (montant, catégorie, date, description) dans la comptabilité.",
        effects: [
          "La dépense est écrite définitivement dans la base de données, avec votre identité comme auteur.",
          "Elle compte dans le mois de la date choisie (pas forcément le mois affiché) : la liste, le total « Gastos del mes » et le résultat net de ce mois sont recalculés aussitôt.",
          "La ventilation « Gastos por categoría » est mise à jour.",
          "Le montant doit être supérieur à zéro ; la description est limitée à 200 caractères ; la catégorie « Mermas y pérdidas » n'est pas proposée (elle est réservée aux pertes déclarées depuis l'écran Stock).",
        ],
        severity: "caution",
        undo: "Supprimez la ligne avec l'icône corbeille dans la liste juste en dessous.",
        audited: true,
        accountingImpact: "Ajoute une charge au mois de la date choisie : le résultat net de ce mois diminue d'autant.",
      },
      {
        label: "Icône corbeille (supprimer une dépense)",
        where: "Bloc 02, à droite de chaque ligne de la liste des dépenses",
        does: "Supprime définitivement la dépense de la comptabilité, sans demande de confirmation.",
        effects: [
          "La ligne est effacée de la base de données immédiatement — il n'y a pas de corbeille de récupération.",
          "Le total des dépenses, la ventilation par catégorie et le résultat net du mois sont recalculés aussitôt.",
          "Si la ligne supprimée est une « Mermas y pérdidas » (créée automatiquement par une perte de stock), le stock n'est PAS remis : la perte reste actée côté inventaire, seule la charge disparaît de la comptabilité. Le registre des pertes garde sa trace, mais le lien vers la charge est rompu.",
        ],
        severity: "danger",
        undo: "Ressaisissez une dépense identique (même montant, catégorie et date). Exception : une ligne « Mermas y pérdidas » ne peut pas être recréée à la main — ne la supprimez qu'en cas d'erreur avérée.",
        audited: true,
        accountingImpact: "Retire la charge du mois concerné : le résultat net remonte d'autant.",
      },
      {
        label: "606 · Compras (télécharger)",
        where: "Sous les 4 tuiles, rangée « Exportar DGII »",
        does: "Télécharge le registre des achats du mois affiché, au format CSV (lisible dans Excel).",
        effects: [
          "Ne modifie rien : c'est un simple téléchargement, recommençable à volonté.",
          "Le fichier reconstruit les achats depuis les réceptions de stock saisies dans le mois : une ligne par réception (fournisseur, RNC, NCF, date de facture, base imposable, ITBIS, total).",
          "Si la réception était marquée « ITBIS inclus », le fichier sépare la base et la taxe (18 %) ; sinon le montant est traité comme exonéré (ITBIS à zéro).",
          "Les réceptions sans NCF sortent avec une case NCF vide — l'écran vous en avertit dans l'encadré « Compras del mes ».",
        ],
        severity: "safe",
      },
      {
        label: "607 · Ventas (borrador) (télécharger)",
        where: "Sous les 4 tuiles, rangée « Exportar DGII »",
        does: "Télécharge le journal des ventes encaissées du mois affiché, au format CSV — en brouillon.",
        effects: [
          "Ne modifie rien : c'est un simple téléchargement, recommençable à volonté.",
          "Une ligne par vente encaissée : date d'encaissement, référence, canal (Mostrador / Web / Cuenta), nom du client et montant total.",
          "La colonne NCF est vide sur toutes les lignes : la pharmacie n'émet pas encore de comprobantes fiscaux. Ce fichier est un journal interne, pas une déclaration prête à déposer.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "Seules les ventes ENCAISSÉES comptent dans le chiffre d'affaires (réservations marquées « retirée » et ventes au comptoir). Une réservation en attente ou confirmée ne compte pas encore — et une vente compte dans le mois de son encaissement, pas dans celui où la réservation a été créée.",
      "Un coût inconnu n'est jamais compté à zéro : une vente dont le produit n'a pas de coût enregistré est simplement exclue du coût des ventes et de la marge. La jauge « Cobertura de coste » indique la part du chiffre d'affaires dont le coût est connu — tant qu'elle est sous 100 %, le résultat net est plus optimiste que la réalité.",
      "La catégorie « Mermas y pérdidas » s'alimente toute seule quand vous déclarez une perte (produit périmé, cassé, volé) dans l'écran Stock. Elle n'apparaît pas dans le formulaire de saisie : impossible de la créer à la main.",
      "Supprimer une ligne « Mermas y pérdidas » ne remet pas le produit en stock : la perte reste actée côté inventaire, seule la charge comptable disparaît. À ne faire qu'en cas d'erreur réelle.",
      "Une réception de stock compte dans le mois où elle a été saisie dans l'écran Stock, pas dans celui de la facture du fournisseur (la date de facture figure quand même dans le fichier 606).",
      "Une réception enregistrée ne se modifie plus : fournisseur, RNC, NCF et date de facture sont figés à la saisie. Vérifiez-les au moment d'enregistrer la réception dans l'écran Stock — une réception sans NCF sortira pour toujours avec une case vide dans le 606.",
      "Le 607 est un brouillon : NCF vide sur toutes les lignes. Ne le déposez pas tel quel à la DGII — transmettez-le au comptable.",
      "À part les dépenses, rien n'est modifiable sur cet écran : pour corriger un chiffre, agissez à la source (écran Stock pour les réceptions et les pertes, écran Ventes pour les encaissements).",
      "Cet écran s'affiche en espagnol quelle que soit la langue choisie pour le panneau d'administration.",
    ],
  },
]
