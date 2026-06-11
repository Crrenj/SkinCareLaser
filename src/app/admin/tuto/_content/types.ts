/**
 * Contrat de contenu du guide admin (/admin/tuto).
 *
 * Le contenu vit dans des fichiers par locale (`fr.ts`, `es.ts`, `en.ts`)
 * typés par `TutoContent` — même modèle que les pages légales (gros corps de
 * texte hors messages i18n, parité garantie par le COMPILATEUR au lieu du
 * compteur de clés JSON). Le chrome de la page (titres de rubriques, libellés
 * des badges…) reste dans `Admin.tuto` des messages next-intl.
 */

/**
 * Gravité d'une opération :
 *  - safe    : annulable trivialement, aucun impact externe
 *  - caution : visible sur le site public / la compta, ou pénible à annuler
 *  - danger  : irréversible ou destructeur (perte de données possible)
 */
export type TutoSeverity = 'safe' | 'caution' | 'danger'

/** Type de bloc dans un wireframe schématique d'écran. */
export type TutoBlockKind =
  | 'kpi' // tuile chiffre-clé
  | 'toolbar' // barre de filtres / recherche
  | 'tabs' // onglets de statut
  | 'table' // liste / tableau
  | 'button' // bouton d'action (accent)
  | 'panel' // carte / panneau
  | 'input' // champ de saisie
  | 'text' // bloc de texte
  | 'drawer' // tiroir latéral

export type TutoMockupBlock = {
  /** Largeur relative sur une grille de 12. */
  w: number
  kind: TutoBlockKind
  /** Petit libellé mono affiché dans le bloc. */
  label?: string
  /** Numéro de pastille — doit correspondre à un `hotspots[].n`. */
  hotspot?: number
}

/** Wireframe annoté : lignes de blocs, de haut en bas comme l'écran réel. */
export type TutoMockup = {
  rows: { blocks: TutoMockupBlock[] }[]
}

/** Légende d'une pastille numérotée du wireframe. */
export type TutoHotspot = {
  n: number
  label: string
  desc: string
}

/** Étape numérotée d'un mode opératoire. */
export type TutoStep = {
  title: string
  body: string
}

export type TutoWorkflow = {
  title: string
  steps: TutoStep[]
}

/** Une opération (bouton / contrôle) et sa chaîne de conséquences. */
export type TutoAction = {
  /** Libellé du contrôle tel qu'affiché à l'écran. */
  label: string
  /** Où le trouver. */
  where: string
  /** Ce que ça fait, en une phrase. */
  does: string
  /** Conséquences concrètes, dans l'ordre où elles se produisent. */
  effects: string[]
  severity: TutoSeverity
  /** Comment revenir en arrière (absent = pas de retour possible). */
  undo?: string
  /** L'opération est tracée dans le journal d'audit. */
  audited?: boolean
  /** Impact visible sur le site public (description courte). */
  publicImpact?: string
  /** Impact sur la comptabilité (description courte). */
  accountingImpact?: string
}

export type TutoFlowTone = 'neutral' | 'ok' | 'warn' | 'bad'

export type TutoFlowNode = {
  label: string
  tone?: TutoFlowTone
  /** Note courte sous le nœud (ce qui se passe à cette étape). */
  note?: string
}

/** Diagramme de flux : une ou plusieurs chaînes (lanes) de nœuds reliés. */
export type TutoFlow = {
  title: string
  lanes: TutoFlowNode[][]
}

export type TutoSection = {
  /** Ancre URL (#id) — stable entre les locales. */
  id: string
  /** Libellé court pour le sommaire. */
  navLabel: string
  title: string
  /** Route de l'écran documenté (vide pour les sections conceptuelles). */
  route: string
  /** À quoi sert l'écran, pour qui, quand. */
  intro: string
  mockup?: TutoMockup
  hotspots?: TutoHotspot[]
  workflows?: TutoWorkflow[]
  actions: TutoAction[]
  flows?: TutoFlow[]
  /** Pièges, limites et avertissements à connaître. */
  gotchas?: string[]
}

export type TutoContent = {
  /** Introduction générale du guide (comment le lire). */
  intro: {
    title: string
    body: string[]
    /** Légende des trois niveaux de gravité. */
    severityLegend: { safe: string; caution: string; danger: string }
  }
  sections: TutoSection[]
}
