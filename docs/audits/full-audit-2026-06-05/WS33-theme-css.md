# WS33 — Système de thème / CSS

**Périmètre** : `src/app/globals.css` (412 LOC), `src/lib/themes.ts` (84 LOC), `src/lib/themeModeScript.ts` (15 LOC) ; recoupé avec `src/app/layout.tsx`, `next.config.ts`, `src/components/LocaleSwitcher.tsx`, `src/components/home/HomeBrands.tsx`, `src/components/AddToCartButton.tsx`, le CSS compilé `.next/static/css/af6419dedcfc268a.css`, et tous les usages d'utilitaires couleur dans `src/`.
**Fichiers lus** : 3 (périmètre) + ~8 (recoupement) · **Lignes parcourues (approx.)** : ~520 (périmètre) + recoupements
**Synthèse** : P0=0 · P1=2 · P2=4 · P3=3

> Méthode contraste : ratios WCAG calculés en interpolant `color-mix(in srgb, …)` par canal dans l'espace gamma (comportement réel du moteur CSS pour `srgb`), puis luminance relative WCAG 2.x. Seuils : AA texte normal **4.5:1**, AA grand texte / UI **3:1**.

## Findings

### [WS33-01] Dark mode : le CTA primaire `bg-clay-700 text-sand-50` est sous le seuil de contraste sur 4 thèmes / 6 — P1
- **Fichier** : `src/app/globals.css:24` (`--color-clay-700: var(--c-accent-strong)`) + ancres dark lignes 154/174/184/194 ; usages `bg-clay-700 text-sand-50` dans ~14 éléments **base** (non-hover), p.ex. `src/components/ProductCard.tsx` (flag « best »), `src/components/admin/admins/*` (badge super-admin), badges/pills divers ; pattern global présent dans 60 fichiers.
- **Catégorie** : a11y
- **Constat** : `clay-700` = `--c-accent-strong` (ton **moyen**) et `text-sand-50` = `--c-bg` (qui devient **sombre** en dark mode). Le contraste fond/texte du bouton tombe à : botánico-D **2.74**, marino-D **2.98**, coral-D **4.31**, terra-D **4.41** (seuls noir-D 15.7 et ámbar-D 4.83 passent). En mode clair tout passe (4.6–19.8). C'est le bouton d'action principal (réserver/ajouter, flags produit, badges).
- **Impact** : en mode sombre, le libellé des CTA/badges « accent fort » est peu lisible (échoue AA texte normal, voire AA-large pour 2 thèmes) → action principale du site mal perçue. Le mode sombre est explicitement neuf (cf. CLAUDE.md « Limite connue »).
- **Reco** : en dark mode, le foreground d'un bouton `accent-strong` ne doit pas être `--c-bg`. Soit forcer un foreground lisible spécifique (token type `--c-on-accent` qui reste clair en dark), soit relever `--c-accent-strong` dans les ancres dark (le rendre plus clair) pour garder ≥4.5:1 avec `--c-bg`. À vérifier visuellement dans les 6 thèmes.
- **Confiance** : haute

### [WS33-02] `clay-800`/`clay-900` dérivés vers `#000` → `text-clay-800` invisible en dark mode — P1
- **Fichier** : `src/app/globals.css:111-112` (`--c-accent-deep: color-mix(... accent-strong 72%, #000)`, `--c-accent-900: color-mix(... 50%, #000)`) ; `text-clay-800` utilisé **27×** dans `src/`.
- **Catégorie** : a11y
- **Constat** : la rampe accent foncée est dérivée **en mélangeant avec le noir**, quel que soit le mode. En dark mode, `clay-800` reste donc un ton foncé posé sur un fond foncé : `text-clay-800` sur `--c-bg` donne botánico-D **1.76**, marino-D **1.92**, coral-D **2.54**, terra-D **2.59** — bien sous 3:1, texte quasi invisible. (En light mode c'est correct.) Même logique pour `clay-900`.
- **Impact** : tout libellé/lien stylé `text-clay-800` (27 occurrences) disparaît visuellement en mode sombre.
- **Reco** : dériver `accent-deep`/`accent-900` par rapport à la **direction du mode** (mélanger vers `#000` en light mais vers `--c-text`/`#fff` en dark), ou définir ces deux ancres dans les blocs `[data-mode="dark"]`/`[data-mode="light"]` au lieu d'un mix figé vers `#000`.
- **Confiance** : haute

### [WS33-03] `--c-ink-400` (54 %) sous AA pour le texte normal sur plusieurs thèmes (et utilisé comme couleur de placeholder) — P2
- **Fichier** : `src/app/globals.css:100` (`--c-ink-400`), `:281` (`::placeholder { color: var(--color-ink-400) }`) ; `text-ink-400` utilisé 15× ; `text-clay-400` (même niveau de mix accent) 23×.
- **Catégorie** : a11y
- **Constat** : `ink-400` = 54 % de texte sur fond. Contraste **texte normal** : coral-L **2.79** (FAIL), terra-L 3.66, marino-L 3.33, ámbar-L 3.14, botánico-L 3.09 (tous LRG, < 4.5). Sur surface (cartes) : botánico/marino/ámbar-L **< 2.9** (FAIL même pour large). Les placeholders sont techniquement exemptés de WCAG 1.4.3, mais les 15 usages `text-ink-400` en **texte de contenu** ne le sont pas.
- **Impact** : texte mué `text-ink-400` illisible/limite en mode clair sur 4–5 thèmes ; placeholders très pâles.
- **Reco** : réserver `ink-400` aux éléments décoratifs ; pour du texte muté lisible, viser `ink-500`/`ink-600`. Le commentaire CLAUDE.md affirme « tokens remontés pour WCAG AA » — c'est vrai pour `ink-500` mais **pas** pour `ink-400`, qui reste sous le seuil.
- **Confiance** : haute

### [WS33-04] `--c-ink-500` (66 %) — le token de texte muté le plus utilisé (415×) — échoue AA texte normal sur coral/light et borderline ailleurs — P2
- **Fichier** : `src/app/globals.css:101` (`--c-ink-500`), `:297` (scrollbar hover), `:408` (placeholder éditeur) ; `text-ink-500` utilisé **415×** dans `src/`.
- **Catégorie** : a11y
- **Constat** : sur **surface** (cartes `sand-100`, cas fréquent) : coral-L **3.27**, botánico-L 3.81, ámbar-L 3.82, marino-L 4.08, terra-L 4.98 — seuls terra et noir passent AA texte normal ; les autres restent < 4.5 (LRG). Sur `bg` : coral-L **3.74** (< 4.5). C'est le gris muté par défaut du design (texte secondaire partout). Globalement « presque AA » mais pas conforme sur ~4 thèmes en clair.
- **Impact** : énorme surface de texte secondaire (415 usages) légèrement sous AA en clair sur la moitié des thèmes — surtout coral.
- **Reco** : relever `--c-ink-500` (p. ex. 70–72 %) pour passer AA texte normal **sur surface** dans tous les thèmes clairs, ou auditer thème par thème. Au minimum traiter coral/light.
- **Confiance** : haute

### [WS33-05] `bg-white` littéral hors thème dans LocaleSwitcher (variante mobile) — P2
- **Fichier** : `src/components/LocaleSwitcher.tsx:59` (`'bg-white text-ink-800 border-sand-300 …'`).
- **Catégorie** : a11y / dette (thème)
- **Constat** : le bouton de langue non-actif (variant `block`, utilisé dans le `MobileDrawer`) est forcé `bg-white` au lieu d'un token thémé (`bg-sand-50`/`bg-sand-100`). En dark mode, ce bouton reste **blanc** tandis que `text-ink-800` devient **clair** → texte clair sur fond blanc, illisible ; et en thème clair non-Terra, le blanc pur jure avec le fond `sand` (off-white) du drawer. C'est le seul `bg-white` non-thémé hors `layout.tsx`/`globals.css` (le `focus:bg-white` du skip-link `layout.tsx:78` est volontaire/transitoire au focus, OK).
- **Impact** : bouton de sélection de langue cassé visuellement en dark mode (et incohérent en thèmes clairs colorés). Touche tous les écrans mobiles.
- **Reco** : remplacer `bg-white` par `bg-sand-50` (état non-actif) — cohérent avec le reste des contrôles thémés.
- **Confiance** : haute

### [WS33-06] Footer muté coral/light sous AA (4.46) — P3
- **Fichier** : `src/app/globals.css:216` (`--c-ink-panel-muted: color-mix(in srgb, var(--c-bg) 60%, var(--c-text))` en mode clair).
- **Catégorie** : a11y
- **Constat** : le texte muté du footer (panel sombre = `--c-text`) atteint coral-L **4.46** (juste sous 4.5 AA texte normal, ≥ 3:1 large). Autres thèmes OK (5.4–6.6).
- **Impact** : marginal — un seul thème, écart minime, sur du texte secondaire de footer.
- **Reco** : passer le mélange à ~55 % bg (texte muté un peu plus clair sur le panneau sombre) pour repasser AA sur coral.
- **Confiance** : moyenne

### [WS33-07] Tokens de rampe définis mais jamais utilisés — P3
- **Fichier** : `src/app/globals.css:18/26/28/124-...` — `clay-100`, `clay-900`, `ink-50`, `sand-600` (mappés `--color-*` mais aucun utilitaire `*-clay-100`/`*-clay-900`/`*-ink-50`/`*-sand-600` employé dans `src/`). (NB `text-ink-50` apparaît 1× mais comme **classe Tailwind** `text-ink-50` → c'est `ink-50`, pas `sand` ; vérifié : `ink-50` est bien référencé une fois ; `clay-900`/`sand-600`/`clay-100` non.)
- **Catégorie** : dette
- **Constat** : 3–4 niveaux de rampe sont déclarés (génèrent des règles CSS) sans aucun consommateur. Coût quasi nul mais c'est du bruit dans la source unique de palette.
- **Impact** : négligeable (quelques règles CSS mortes, surface de maintenance).
- **Reco** : garder si on veut une rampe « complète » volontaire (cohérent avec la politique « définir avant d'utiliser »), sinon élaguer. Confiance moyenne (un usage dynamique via `clsx`/concat improbable ici mais non exclu à 100 %).
- **Confiance** : moyenne

### [WS33-08] Bandes décoratives `bg-ink-900` s'inversent en clair en mode sombre — P3 (limite connue, confirmée)
- **Fichier** : usages `bg-ink-900` dans ~20 composants (`HomeExpertise`, `HomeHero`, `AboutPartner/Visit/LeaveReview`, `BannerEditorial/Quote`, `WhatsappHero`, `CartEmpty`, etc.) ; tokens prévus `--c-ink-panel*` (`globals.css:212-227`) pas encore appliqués partout.
- **Catégorie** : a11y / dette (thème)
- **Constat** : `bg-ink-900` = `--c-text` → en dark mode il devient **clair**, donc une bande « volontairement sombre » s'éclaircit (lisible mais inversée). Le système fournit déjà `--c-ink-panel*` (restent sombres dans les 2 modes) mais le markup décoratif n'a pas migré. C'est explicitement documenté comme « Limite connue ». Je le **confirme** ici comme statut réel, sans le re-développer (cause = markup hors périmètre WS33 ; côté CSS, les tokens panel existent et sont corrects).
- **Impact** : esthétique en dark mode (pas de perte de lisibilité bloquante).
- **Reco** : migrer les bandes décoratives sombres vers `bg-[--c-ink-panel]`/`text-[--c-ink-panel-fg]`. (Travail markup, pas CSS.)
- **Confiance** : haute (sur le mécanisme)

## Points positifs (court)
- **Piège « thème imbriqué » correctement géré** : les mappings `--color-*: var(--c-*)` sont bien redéclarés DANS `[data-theme]` (globals.css:119-144) — vérifié dans le **CSS compilé** (`.next/static/css/af6419dedcfc268a.css` : le bloc `[data-theme]{…}` final, 906 chars, contient `--color-sand-50 … --color-ink-900`). Le shell admin imbriqué re-thématise donc réellement.
- **Couverture des teintes complète** : croisement de **tous** les utilitaires couleur de `src/` contre les `--color-*` définis → **0 teinte utilisée non déclarée** (aucun élément invisible par teinte manquante). Les complétions annoncées (brick-700, olive-100, clay-500/900, ink-50/100/300/600) sont effectivement définies ET utilisées.
- **Anti-flash propre** : `THEME_MODE_SCRIPT` est try/catch-safe (localStorage absent/SSR géré), borne le mode à `light|dark`, résout `system` via `matchMedia`, et ne touche **que** `data-mode` (le thème reste SSR + corrigé par `ThemeFavicon`). Son **hash SHA-256 est recalculé** dans `next.config.ts:11` à partir de la même constante → `script-src 'sha256-…'` sans `'unsafe-inline'`, SSG préservé. Architecture solide.
- **`@keyframes marquee` + `motion-reduce`** : double garde-fou — `motion-reduce:animate-none` sur l'élément (`HomeBrands.tsx:34`) ET la règle globale `@media (prefers-reduced-motion: reduce)` (globals.css:284). Conforme.
- **CSS valide** : accolades équilibrées (62/62), pas de doublon de bloc, commentaires explicatifs de qualité sur les pièges.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/components/AddToCartButton.tsx:124` utilise `text-white` littéral (variant `default`) au lieu d'un token thémé (mineur, light-mode OK).
- Les ancres dark `--c-accent-strong` valent l'`--c-accent` light (réutilisation), ce qui explique les CTA dark peu contrastés (cf. WS33-01) — choix de palette à revoir côté thèmes.
- `og:image` / favicons par thème dépendent de `ThemeFavicon` côté client pour suivre un changement live (SSG fige `data-theme`) — comportement documenté, à valider visuellement.

## Zones non couvertes / à re-vérifier humainement
- **Rendu visuel réel des 6 thèmes × 2 modes** : mes ratios sont calculés (mix srgb gamma) ; à confirmer à l'œil, surtout les CTA dark (WS33-01/02) et coral globalement (le thème le plus à risque).
- **Usages dynamiques de teintes** (concat de classes / `clsx` avec interpolation) non détectables par grep statique — les tokens « dead » (WS33-07) pourraient être utilisés via composition ; confiance moyenne.
- **Contraste des combinaisons accent-sur-accent** (p. ex. `border-clay-700` sur `bg-clay-50`) non exhaustivement balayé ; j'ai couvert les cas de texte muté + CTA, les plus fréquents.
