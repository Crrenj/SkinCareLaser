# WS10 — UI/UX · Mode sombre · i18n

Audit PRE-V1 **lecture seule**. Périmètre : système de thèmes (mode sombre des 6 palettes), parité i18n FR/ES/EN, textes en dur, états loading/error/empty, responsive, cohérence devise/format, toasts & dialogs.

Méthode : lecture de `src/lib/themes.ts`, `src/app/globals.css`, `src/app/layout.tsx`, comparaison des 3 fichiers `src/messages/*.json` (script Node), grep ciblé du JSX. Pas de dev server, pas de captures, pas de MCP — raisonnement sur classes Tailwind / tokens CSS / JSX / messages.

---

## Verdict

**B (UI/UX clair) · C+ (mode sombre)**

Le mode **clair** est solide : design system cohérent, i18n exemplaire, états vides/erreur présents et localisés, responsive discipliné. Rien de bloquant en clair.

Le mode **sombre** n'est PAS prêt pour V1 si on l'active réellement côté visiteur (`allow_visitor_mode`) ou par défaut admin (`default_mode = dark/system`). Au-delà des 5 bandes décoratives déjà documentées (inversion « lisible mais inversé »), il existe **deux familles de régressions plus graves** non documentées :

1. **`bg-white` littéral + texte thémé** (`text-ink-900`) → en sombre : carte blanche + texte clair = **illisible**. Touche la recherche globale (NavSearch, présente sur toutes les pages), le formulaire de contact, le profil, plusieurs cartes home. **P1.**
2. **HomeHero hors-thème** (gradient hex codé en dur) → le hero d'accueil reste **marron Terra** dans les 6 palettes ET les 2 modes. **P1** pour la cohérence multi-palettes (pas que le sombre).

**Recommandation V1** : garder `default_mode = light` et `allow_visitor_mode = false` jusqu'à conversion des `bg-white` → `bg-sand-50` et des bandes sombres → tokens `--c-ink-panel*`. En l'état le clair est livrable ; le sombre est une feature à durcir.

---

## Parité i18n — comptage

Source : `src/messages/{fr,es,en}.json`. Script de comptage des feuilles + diff exact des chemins de clés.

| Fichier | Lignes | Clés feuilles | Chemins manquants | Chemins en trop |
|---|---|---|---|---|
| `fr.json` | 1884 | **1466** | — (référence) | — |
| `es.json` | 1884 | **1466** | 0 | 0 |
| `en.json` | 1884 | **1466** | 0 | 0 |

**Parité parfaite** : 1466 clés × 3, mêmes chemins exacts, même nombre de lignes. Aligné avec le HANDOFF (« 1 466 par locale, parité »).

- **Valeurs vides** : 3, toutes attendues — `Auth.strength.empty` (FR/ES/EN), l'état « aucun mot de passe saisi » du compteur de force. **Non-finding.**
- **Valeurs ES/EN identiques au FR** (heuristique mots français) : 6 occurrences, **toutes légitimes** — `LocaleSwitcher.fr` = « Français » (label de langue), placeholders nom propre (`Pérez`), placeholders d'équipe About (`Dra. María Pérez Espinal`, `Lic. Andrés Reyes`), `About.criteria.cert2Name` (nom propre d'institution). Aucun texte UI non traduit. **Non-finding.**
- **Valeurs EN === ES** non triviales : 75. Normal (cognates ES/EN, noms de marque, sigles). Non investigué un par un — pas un signal de bug.

**Conclusion i18n** : aucune clé manquante, aucune valeur vide parasite, aucun texte FR resté en dur dans les JSON. La plomberie i18n est saine.

---

## Catalogue des inversions / défauts mode sombre

Mécanique : `globals.css` mappe les utilitaires Tailwind `sand-*`/`ink-*`/`clay-*` sur des ancres `--c-*` qui basculent par `[data-theme][data-mode]`. Donc `bg-ink-900 text-sand-50` reste **lisible dans les 2 modes** (encre=texte, sand=fond) — c'est le comportement voulu pour les boutons/pills/tiles « primaire ». Le problème survient pour :
- (A) les **bandes décoratives** voulues sombres : elles utilisent la rampe brute `bg-ink-900` qui devient CLAIRE en sombre (au lieu des tokens `--c-ink-panel*` qui restent sombres dans les 2 modes) ;
- (B) les surfaces en **`bg-white` littéral** (hors rampe) couplées à du texte thémé `text-ink-900` ;
- (C) les surfaces **hors-thème** (hex codés en dur).

### Inversions confirmées — bandes (A)

| ID | Sév | Preuve | Comportement en sombre |
|---|---|---|---|
| WS10-01 | P2 | `src/components/about/AboutStats.tsx:9` `bg-ink-900 text-sand-100` | Bande KPI devient claire ; texte `text-sand-*` devient sombre → reste lisible mais **inversé** (effet « tache claire » dans une page sombre). Connu. |
| WS10-02 | P2 | `src/components/about/AboutCriteria.tsx:56` `aside bg-ink-900 text-sand-100` | Idem (aside sticky certification). Connu. |
| WS10-03 | P2 | `src/components/banners/BannerQuote.tsx:31` `bg-ink-900 text-sand-200` + `:44` `bg-ink-800` + `:73` `text-ink-500` | Bandeau citation pharmacien s'éclaircit ; `text-ink-500` (semi-sombre) sur fond clair-éclairci → contraste faible. Connu. |
| WS10-04 | P2 | `src/app/[locale]/manifeste/page.tsx:127` `section bg-ink-900` (texte `text-sand-50`) | Bloc citation manifeste s'inverse. Connu. |
| WS10-05 | P2 | `src/components/confirmation/WhatsappHero.tsx:89` `bg-ink-900 border-ink-900` (cadre « téléphone ») | Cadre device s'éclaircit ; l'intérieur mêle `bg-white` + `bg-[#075E54]` (brand WhatsApp) → mélange incohérent en sombre. Connu. |
| WS10-06 | P2 | `src/components/about/AboutCta.tsx:13-16` `style={{ background: '… var(--color-ink-900)' }}` + `text-sand-100` | `--color-ink-900` = `--c-text` → en sombre, **fond clair + texte clair** (`text-sand-50/100/300` deviennent sombres, OK) mais le gradient `rgba(216,154,117,.16)` superposé sur fond désormais clair affadit tout. Inversion confirmée, **non listée** dans les 5 connues. |

> Les 6 ci-dessus sont la classe « inversion lisible mais visuellement fausse ». Fix unique : remplacer `bg-ink-900 text-sand-*` par `bg-[var(--c-ink-panel)] text-[var(--c-ink-panel-fg)]` (+ `text-[var(--c-ink-panel-muted)]` pour le secondaire), comme le Footer le fait déjà.

### Régressions graves — `bg-white` + texte thémé (B)

`bg-white` est un **blanc littéral** (≠ `bg-sand-50` qui est l'ancre `--c-bg`). Le texte interne utilise `text-ink-900`/`text-ink-700`/`text-ink-500` (thémés → **clairs en sombre**). Résultat en sombre : **carte blanche pleine + texte clair = quasi illisible**.

| ID | Sév | Preuve | Impact |
|---|---|---|---|
| WS10-07 | **P1** | `src/components/NavSearch.tsx:230` (input) + `:237` (dropdown) `bg-white` ; lignes de résultats `text-ink-900`/`text-ink-500` (`:241`, `:247`…) | **Recherche globale ⌘K présente sur TOUTES les pages.** Dropdown blanc + texte clair en sombre. Impact maximal car omniprésent. |
| WS10-08 | **P1** | `src/components/ContactForm.tsx:60` `bg-white shadow-lg` + `:62/:65/:168` `text-ink-900/700` | Formulaire contact illisible en sombre (carte blanche, texte clair). |
| WS10-09 | P1 | `src/components/ProfileEditForm.tsx:91` `bg-white` + champs `text-ink-*` | Édition profil (`/account/profile`) illisible en sombre. |
| WS10-10 | P1 | `src/components/ProductDetailCard.tsx:45` `bg-white shadow-lg` | Carte détail produit (si rendue) blanche en sombre. |
| WS10-11 | P2 | `src/components/home/HomeByNeed.tsx:84` `bg-white` ; `HomeRoutine.tsx:26` `bg-white` ; `HomeBrands.tsx:37` `hover:bg-white` | Cartes home « besoins »/« routine » blanches en sombre (texte thémé clair → contraste cassé au survol et au repos). |
| WS10-12 | P2 | `src/components/banners/BannerEditorial.tsx:41` `bg-white` | Bannière éditoriale blanche en sombre. |
| WS10-13 | P2 | `src/app/[locale]/account/reservations/page.tsx:147` `bg-white` (carte réservation) | Liste réservations compte : cartes blanches en sombre. |

> Fix : `bg-white` → `bg-sand-50` (ou `bg-sand-100`) partout en surface publique. `bg-white` ne doit subsister que dans les éléments **volontairement neutres et clairs même en sombre** (rare), ou les maquettes brand (WhatsApp).

### Hors-thème — hex codés en dur (C)

| ID | Sév | Preuve | Impact |
|---|---|---|---|
| WS10-14 | **P1** | `src/components/home/HomeHero.tsx:16` `bg-gradient-to-br from-[#C7B299] via-[#8E6D4F] to-[#4A3A2C]` + SVG `#F4EFE7/#8E6D4F/#CCC5BD/#D89A75/#F0D7C5` (`:59-75`) + `text-white` | Le **hero d'accueil** (1er écran, max impact) reste **marron Terra dans les 6 palettes ET les 2 modes**. Ne se re-thématise jamais. Incohérent avec Marino (navy), Botánico (vert), Noir, etc. Pas spécifiquement sombre — c'est un trou multi-palettes. |
| WS10-15 | P2 | `src/components/banners/BannerHero.tsx:51-58` `text-white` sur image/gradient CMS | Acceptable si l'image porte un overlay sombre ; à vérifier visuellement avec une bannière claire (texte blanc sur fond clair = illisible). Dépend du contenu admin. **Suspecté.** |
| WS10-16 | info | WhatsApp brand `bg-[#25D366]`/`bg-[#075E54]` + `text-white` (AboutCta, AboutVisit, WhatsappHero, StickyMobileCta) | **Intentionnel** (couleur de marque). Lisible dans les 2 modes. Non-finding. |

### Contraste des 6 palettes en sombre (raisonnement sur les ancres)

Les ancres sombres définies (`globals.css:107-160`) sont saines : fond très sombre + texte clair par palette. Couples bg/text vérifiés (estimation de luminance) :

| Palette | bg sombre | text sombre | Verdict couple bg/text |
|---|---|---|---|
| Terra | `#1F1B16` | `#F4EFE7` | OK (fort contraste) |
| Noir | `#0A0A0A` | `#F5F5F5` | OK (max contraste) |
| Botánico | `#1E2418` | `#DBE0CC` | OK |
| Coral | `#2E1810` | `#F0D7C5` | OK |
| Marino | `#0F1B22` | `#C5D6DC` | OK |
| Ámbar | `#2A2014` | `#EBD9A8` | OK |

Le système d'ancres lui-même donne un **bon contraste primaire** dans les 6 palettes. **Le risque sombre n'est PAS dans les ancres** mais dans les surfaces qui les contournent (B/C ci-dessus) + dérivés faibles :

| ID | Sév | Preuve | Impact |
|---|---|---|---|
| WS10-17 | P2 (suspecté) | `globals.css:90-91` `--c-ink-400` = `color-mix(text 40%, bg)`, `--c-ink-500` = 54% | Le texte secondaire `text-ink-500` (très utilisé : `text-ink-500` partout) à 54% de mix peut tomber sous **4.5:1** sur certaines palettes sombres (Ámbar/Coral fonds chauds peu contrastés). À mesurer en clair aussi. Le projet a déjà migré `ink-400`→`ink-500` pour WCAG en clair ; le mix sombre n'a pas été re-vérifié. **Suspecté — à confirmer par mesure.** |
| WS10-18 | P2 (suspecté) | `globals.css:175-182` tokens `--c-ink-panel*` en sombre = `--c-surface` (panneau « élevé ») | Footer en sombre devient `--c-surface` (gris sombre) avec `--c-ink-panel-fg` = `--c-text` (clair) → OK. Mais `--c-ink-panel-muted` = `--c-ink-500` (54%) → liens footer secondaires potentiellement faibles. À confirmer. |

---

## Textes en dur (hardcoded)

Grep JSX des nœuds texte littéraux (mots FR/ES capitalisés) hors `useTranslations`/`getTranslations`, hors contenu DB, hors `aria-label` techniques.

| ID | Sév | Preuve | Statut |
|---|---|---|---|
| WS10-19 | P2 (connu) | `src/app/[locale]/legal/{cgv,confidentialite,mentions-legales,cgu,cookies}/page.tsx` — corps juridique FR en dur (~150 nœuds) | **Cas documenté** (legal FR-only, UI tri-langue). Signalé, non re-prouvé. Bloqueur prod pour marché ES (cf. HANDOFF « Juridique ES/EN »). |
| WS10-20 | P2 | `src/app/layout.tsx:76` skip-link `"Aller au contenu principal"` en dur | Texte FR sur **toutes** les pages, y compris `/es/` et `/en/`. `sr-only` donc impact lecteur d'écran uniquement, mais c'est un texte UI non localisé. Reco : passer par un message `A11y.skipToContent`. Faible effort. |

**Hors legal + skip-link : ZÉRO texte en dur** dans les composants publics. Tous les toasts (`toast.error/success/info`) et `confirm()`/`useConfirmDialog` passent par `t(...)`/`tCommon(...)` — aucun message hardcodé trouvé. Discipline i18n excellente côté code.

---

## États loading / error / empty

### Error boundaries

| Surface | Fichier | i18n | Thémé |
|---|---|---|---|
| Locale | `src/app/[locale]/error.tsx` | ✅ `Error` namespace | ✅ `bg-clay-700 text-sand-50` + `text-ink-900` |
| Admin | `src/app/admin/error.tsx` | ✅ | ✅ (admin forcé Terra clair) |
| 404 locale | `src/app/[locale]/not-found.tsx` | ✅ | ✅ |
| 404 racine | `src/app/not-found.tsx` | ✅ (Server, `getTranslations`) | ✅ |

Aucun `global-error.tsx` (acceptable — `error.tsx` couvre les segments). **Cohérent.**

### Loading

- **Pas de `loading.tsx`** route-level — le code splitting passe par `next/dynamic` avec skeletons `animate-pulse` inline sur `CatalogueClient` (`catalogue/page.tsx:10`), `ProductClient` (`product/[slug]/page.tsx:10`), `CartClient` (`cart/page.tsx:8`), `ReservationClient` (`reservation/page.tsx:10`). Pattern cohérent. **OK.**
- WS10-21 · P2 (suspecté) : les skeletons `animate-pulse` utilisent vraisemblablement `bg-sand-*` (thémés) — à confirmer qu'ils ne sont pas `bg-white`/`bg-gray-*`. Non bloquant.

### Empty states

| Surface | Preuve | i18n |
|---|---|---|
| Catalogue sans résultat | `CatalogueClient.tsx:226` `t('noResults')` + `t('resetFilters')` | ✅ |
| Panier vide | `src/components/cart/CartEmpty.tsx` (+ bestsellers fallback) | ✅ |
| Favoris vides | `favoris/page.tsx:112` `<EmptyState>` → `t('emptyDescription')`/`emptyCta` | ✅ |
| Réservations vides | `account/reservations/page.tsx` (état vide localisé) | ✅ |
| Recherche no-result | `NavSearch.tsx` (bestsellers fallback) | ✅ |

**Tous les états vides existent et sont localisés.** Bon point.

---

## Responsive

| Aspect | Constat |
|---|---|
| Serif fluide (88/96/120/160px) | **Bien géré** : mobile-first scaling partout — `AboutHero` `text-[56px] sm:text-[88px] lg:text-[120px]` ; `CatalogueHeader` `text-[48px] sm:text-[64px] lg:text-[88px]` ; `AboutSectionHead` `text-[64px] lg:text-[96px]` ; blog `text-5xl sm:text-7xl lg:text-[88px]`. |
| WS10-22 · P2 (suspecté) | `not-found.tsx:24` « 404 » décoratif `text-[120px] md:text-[160px]` — à 120px sur viewport ~320px peut déborder ; `select-none` + décoratif → faible risque. |
| Tableaux admin larges | `overflow-x` présent sur les 7 tables principales (`ProductsTable`, `BrandsTable`, `ReservationsTable`, `UsersClient`, `NewsletterClient`, `stock`, `setup`). **OK.** |
| Drawer mobile | `MobileDrawer` (off-canvas) + admin `Sidebar.tsx:326` drawer `lg:hidden w-[260px]` + barre mobile sticky. **OK.** |
| Grilles | `AboutStats grid-cols-2 lg:grid-cols-4` ; dashboard widgets `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`. **OK.** |
| HomeHero `max-w-[60%]` | Le texte hero est limité à 60% de largeur même en mobile (`HomeHero.tsx:22`) — sur très petit écran, 60% peut serrer le titre 48px. **Suspecté, P2.** |

Discipline responsive globalement bonne. Pas de débordement bloquant identifié.

---

## Cohérence devise / format

| Aspect | Constat |
|---|---|
| Devise | `DEFAULT_CURRENCY = 'DOP'` centralisé (`src/lib/constants.ts:6`). `formatPrice(n, { locale })` utilisé dans **tout** le tunnel (cart, reservation, confirmation, whatsapp). Cohérent. |
| WS10-23 · P2 | `src/app/[locale]/account/reservations/page.tsx:135` `new Intl.NumberFormat('es-DO')` — **n'affiche pas la devise DOP** (nombre brut, ex. « 1 200 » sans symbole) ET locale figée `es-DO` quelle que soit l'UI. Incohérent avec `formatPrice` ailleurs. |
| WS10-24 · P2 | Dates figées hors locale UI : `account/reservations/page.tsx:136` et `account/security/page.tsx:38` → `Intl.DateTimeFormat('es-DO', …)` même sur `/fr/` et `/en/`. `legal/LegalShell.tsx:33` → `'fr-FR'` (cohérent FR-only legal). Blog + `ConfirmationRecap` utilisent bien `locale`. → 2 pages compte affichent les dates en es-DO en dur. |

Pas de bug de devise en checkout (le chemin critique utilise `formatPrice`). Les écarts sont sur les pages compte (P2).

---

## Toasts & ConfirmDialog

- **Toasts (sonner)** : montés via `<Toaster richColors />` (admin layout). Tous les appels `toast.*` audités passent par `t(...)`/`tCommon(...)` — **aucun message hardcodé**. Localisés.
- **ConfirmDialog / useConfirmDialog** : `confirm(t('deleteConfirmBody'), …)` partout (product, tags, reservations, messages). Localisé. Design unifié.

**Cohérent. Non-finding.**

---

## Tableau récapitulatif

| ID | Sév | Domaine | Fichier:ligne | Confirmé/Suspecté |
|---|---|---|---|---|
| WS10-07 | **P1** | Dark mode | `NavSearch.tsx:230,237` `bg-white` + texte thémé (recherche globale) | Confirmé |
| WS10-08 | **P1** | Dark mode | `ContactForm.tsx:60` `bg-white` + `text-ink-*` | Confirmé |
| WS10-09 | **P1** | Dark mode | `ProfileEditForm.tsx:91` `bg-white` | Confirmé |
| WS10-10 | **P1** | Dark mode | `ProductDetailCard.tsx:45` `bg-white` | Confirmé |
| WS10-14 | **P1** | Thème (toutes palettes) | `HomeHero.tsx:16,59-75` gradient + SVG hex codés en dur | Confirmé |
| WS10-01 | P2 | Dark mode | `AboutStats.tsx:9` bande `bg-ink-900` | Confirmé (connu) |
| WS10-02 | P2 | Dark mode | `AboutCriteria.tsx:56` aside `bg-ink-900` | Confirmé (connu) |
| WS10-03 | P2 | Dark mode | `BannerQuote.tsx:31,44,73` `bg-ink-900/800` + `text-ink-500` | Confirmé (connu) |
| WS10-04 | P2 | Dark mode | `manifeste/page.tsx:127` section `bg-ink-900` | Confirmé (connu) |
| WS10-05 | P2 | Dark mode | `WhatsappHero.tsx:89` cadre `bg-ink-900` | Confirmé (connu) |
| WS10-06 | P2 | Dark mode | `AboutCta.tsx:13-16` `var(--color-ink-900)` inline | Confirmé (non listé) |
| WS10-11 | P2 | Dark mode | `HomeByNeed.tsx:84` / `HomeRoutine.tsx:26` / `HomeBrands.tsx:37` `bg-white` | Confirmé |
| WS10-12 | P2 | Dark mode | `BannerEditorial.tsx:41` `bg-white` | Confirmé |
| WS10-13 | P2 | Dark mode | `account/reservations/page.tsx:147` `bg-white` | Confirmé |
| WS10-15 | P2 | Thème | `BannerHero.tsx:51-58` `text-white` sur image CMS | Suspecté |
| WS10-17 | P2 | Contraste sombre | `globals.css:90-91` `--c-ink-400/500` mix faible | Suspecté |
| WS10-18 | P2 | Contraste sombre | `globals.css:175-182` `--c-ink-panel-muted` footer | Suspecté |
| WS10-20 | P2 | i18n | `layout.tsx:76` skip-link FR en dur | Confirmé |
| WS10-23 | P2 | Devise | `account/reservations/page.tsx:135` `NumberFormat('es-DO')` sans DOP | Confirmé |
| WS10-24 | P2 | Format date | `account/reservations:136` + `account/security:38` `es-DO` figé | Confirmé |
| WS10-19 | P2 | i18n | `legal/*` corps FR-only | Confirmé (connu) |
| WS10-21 | P2 | Loading | skeletons `next/dynamic` couleur à confirmer | Suspecté |
| WS10-22 | P2 | Responsive | `not-found.tsx:24` 404 120px mobile | Suspecté |
| WS10-16 | info | Thème | WhatsApp brand `#25D366`/`#075E54` | Confirmé intentionnel |

**P0 : 0 · P1 : 5 · P2 : 17 · info : 1.**

---

## Synthèse priorités

1. **Avant d'activer le sombre** (`allow_visitor_mode` / `default_mode`) : corriger WS10-07→10 (`bg-white` → `bg-sand-50` en surface publique) — c'est le vrai bloqueur. Les 5 bandes connues (WS10-01→05) sont cosmétiques (« lisible mais inversé »), pas un bloqueur dur.
2. **WS10-14 (HomeHero hors-thème)** : indépendant du sombre — le hero ne respecte aucune des 6 palettes. À tokeniser (`--c-text`/`--c-bg`/`--c-accent`) pour que l'accueil reflète le thème choisi par l'admin.
3. **i18n** : parité parfaite, aucun texte UI en dur hors legal. Seul reste le skip-link FR (WS10-20, sr-only) et le contenu juridique ES/EN (WS10-19, déjà au backlog).
4. **Format** : checkout sain (`formatPrice`) ; 2 pages compte affichent dates/montants en `es-DO` figé (P2).
