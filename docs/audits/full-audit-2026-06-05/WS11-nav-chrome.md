# WS11 — Navigation & chrome

**Périmètre** : `src/components/NavBar.tsx`, `src/components/MobileDrawer.tsx`, `src/components/nav/{ScrollToTop,SearchOverlay}.tsx`, `src/components/Footer.tsx`, `src/components/footer/FooterNewsletter.tsx`, `src/components/Breadcrumb.tsx`, `src/components/LocaleSwitcher.tsx`, `src/components/ThemeFavicon.tsx`, `src/components/ThemeModeToggle.tsx`, `src/components/IframeHeightReporter.tsx`, `src/components/SWRProvider.tsx`
**Fichiers lus** : 11 (périmètre) + 9 de contexte (CartDrawer, useModalA11y, FarmauLogo, layout.tsx, getShopSettings, supabaseServer, routes /api/theme + /api/newsletter, besoins/[slug], catalogue, globals.css, not-found, message files)
**Lignes parcourues (approx.)** : ~1 700
**Synthèse** : P0=0 · P1=0 · P2=4 · P3=6

## Findings

### [WS11-01] Le `Footer` async force les pages statiques (legal/faq/manifeste) en rendu dynamique — leur ISR `revalidate=86400` est neutralisé — P2
- **Fichier** : `src/components/Footer.tsx:56-59` (`getShopSettings()`), via `src/lib/getShopSettings.ts` → `createSupabaseServerClient()` → `cookies()`
- **Catégorie** : perf / archi (SSR)
- **Constat** : `Footer` est un Server Component `async` qui appelle `getShopSettings()`. Ce helper passe par `createSupabaseServerClient()` qui lit `cookies()` (`src/lib/supabaseServer.ts:9`). En Next 15 App Router, tout accès à `cookies()` opte la route hors du rendu statique → dynamique par requête. Or `Footer` est rendu sur **toutes** les pages publiques, y compris celles qui ne touchent JAMAIS Supabase autrement et déclarent explicitement un ISR long : `legal/cgv|confidentialite|cookies|mentions-legales` (`revalidate=86400`), `faq` (`86400`), `manifeste` (`86400`) — via `LegalShell` qui rend `<Footer/>` (`src/components/legal/LegalShell.tsx:89`). Ces pages sont donc re-rendues à chaque requête au lieu d'être servies depuis le cache ISR. Ironie : `src/app/layout.tsx:33-36` documente avoir **délibérément évité** d'appeler `getShopSettings` au niveau layout *pour cette raison exacte* (« lire shop_settings ici utilise `cookies()` et forcerait TOUTES les pages en rendu dynamique ») — le `Footer` réintroduit ce coût.
- **Impact** : pages quasi-statiques (CGV, FAQ, mentions légales, manifeste) servies en dynamique → latence + charge DB inutile (1 SELECT `shop_settings` par requête, juste pour le `wa.me` du footer). Les pages catalogue/produit/home étaient déjà dynamiques (elles appellent `createSupabaseServerClient` pour leurs données), donc PAS de régression là — l'impact réel est sur les pages sans autre source de cookies.
- **Reco** : lire le numéro WhatsApp via un client Supabase anon **sans cookies** + `unstable_cache` (exactement le pattern déjà utilisé par `getThemeConfig` pour rester SSG-compatible, cf. `src/lib/getThemeConfig.ts`), au lieu de `getShopSettings()` cookie-based. Alternative minimale : extraire le bloc social/WhatsApp du footer dans un petit Client Component qui lit `/api/theme`-style ou une route publique, laissant `Footer` synchrone.
- **Confiance** : haute

### [WS11-02] `LocaleSwitcher` variant `block` : pilule active codée en `bg-white` littéral (hors thème) → blanc pur en mode sombre — P2
- **Fichier** : `src/components/LocaleSwitcher.tsx:59`
- **Catégorie** : a11y / thème (régression dark mode)
- **Constat** : la branche inactive du bouton (variant `block`, utilisé dans le `MobileDrawer`) utilise `bg-white text-ink-800`. `white` est une couleur littérale Tailwind **non thémée** ; tous les autres fonds du chrome passent par les tokens `sand-*`/`ink-*` qui basculent avec `[data-theme][data-mode]`. En mode sombre (ou thème Noir), `text-ink-800` devient clair tandis que `bg-white` reste blanc pur → texte clair sur fond blanc = quasi illisible, et incohérent avec le reste du drawer (lui en `bg-sand-50`).
- **Impact** : boutons de langue inactifs illisibles / hors-charte dans le drawer mobile en mode sombre. Surface : tout visiteur mobile en dark mode.
- **Reco** : remplacer `bg-white` par `bg-sand-50` (token thémé), aligné sur le reste du drawer.
- **Confiance** : haute

### [WS11-03] `SearchOverlay` : pas de navigation clavier ↑/↓ ni sémantique `combobox`/`listbox` sur les résultats live — P2
- **Fichier** : `src/components/nav/SearchOverlay.tsx:174-189` (input) + `:202-241` (liste résultats)
- **Catégorie** : a11y / dette (drift doc)
- **Constat** : l'overlay gère `Enter` (lance la recherche) et `Escape`, mais **aucune** touche `ArrowDown`/`ArrowUp` pour parcourir les résultats, et la liste est un `<ul>` de `<button>` sans `role="listbox"`/`role="option"`/`aria-activedescendant`/`aria-controls`. `CLAUDE.md` (section NavSearch) et le commentaire d'en-tête revendiquent pourtant une « navigation clavier ↑↓ ↵ Esc ». Réalité : on ne peut atteindre les résultats qu'en `Tab` (ordre DOM), sans surbrillance ni pattern combobox attendu par les lecteurs d'écran.
- **Impact** : interaction clavier dégradée pour la recherche (feature chrome centrale) ; les utilisateurs lecteur d'écran n'ont pas le motif combobox annoncé. Écart documentation/réalité.
- **Reco** : soit implémenter un index actif (`activeIndex` + `aria-activedescendant`, ↑/↓ + `Enter` ouvrant le hit surligné, `role="listbox"`/`option` sur la liste), soit corriger CLAUDE.md/commentaires pour ne plus promettre ↑↓. Au minimum, ajouter `role="combobox" aria-expanded aria-controls` sur l'input et `role="listbox"` sur le `<ul>`.
- **Confiance** : haute

### [WS11-04] Méga-menus : `role="menu"` sans `role="menuitem"` ni navigation flèches — ARIA incohérent — P2
- **Fichier** : `src/components/NavBar.tsx:177` (`role="menu"` catalogo), `:258` (needs), `:309` (lang), `:350` (account)
- **Catégorie** : a11y
- **Constat** : quatre conteneurs portent `role="menu"` mais leurs enfants (`<Link>` / `<button>`) n'ont pas `role="menuitem"`, et aucun gestionnaire flèches/`tabindex` roving n'est implémenté. Le rôle `menu` impose un contrat ARIA (enfants `menuitem`, navigation ↑↓, focus management) qui n'est pas tenu. De plus ces panneaux restent montés en permanence (`visibility:hidden`/`pointer-events-none` quand fermés via `panelCls`) : le `role="menu"` est donc toujours exposé à l'arbre d'accessibilité, même fermé. Comme le `<nav aria-label>` (`:168`) fournit déjà la sémantique de navigation, ces `role="menu"` mal formés sont **pires** que pas de rôle.
- **Impact** : annonces lecteur d'écran trompeuses (« menu, 0 éléments » / attente d'items non trouvés) ; comportement clavier non conforme au pattern annoncé par le rôle.
- **Reco** : retirer `role="menu"` (laisser la sémantique `nav`/liens), OU implémenter le pattern complet (menuitem + roving tabindex + flèches). Le retrait est le correctif le plus simple et sûr.
- **Confiance** : haute

### [WS11-05] Counts du méga-menu codés en dur — exacts aujourd'hui mais dérivent silencieusement — P3
- **Fichier** : `src/components/NavBar.tsx:37-57` (SKIN_TYPES/MEGA_BRANDS/NEEDS `count`)
- **Catégorie** : dette / data
- **Constat** : les compteurs affichés (ex. Avène 32, ISDIN 29, hydratation 92…) sont des littéraux. Vérifiés en base live ce jour : ils **correspondent exactement** (brands avene=32/isdin=29/filorga=32/uriage=30 ; types-peau sensible=29/grasse=43/seche=25/atopique=23 ; besoins hydratation=92/anti-age=71/protection-solaire=58/acne=52/taches=43). Le commentaire `:36` les qualifie d'« indicatif ». Mais tout ajout/retrait/désactivation de produit les rendra faux sans aucun signal.
- **Impact** : faible aujourd'hui ; risque de chiffres mensongers dans le chrome principal après évolution du catalogue.
- **Reco** : soit alimenter ces compteurs depuis la DB (au montage du méga-menu ou via props serveur), soit assumer un affichage approximatif (« 90+ ») pour ne pas exposer un chiffre exact périmé.
- **Confiance** : haute

### [WS11-06] Footer affiche des badges de paiement (Visa/Mastercard/PayPal/Azul) alors que le projet est click-&-collect sans paiement en ligne — P3
- **Fichier** : `src/components/Footer.tsx:131`
- **Catégorie** : logique-métier / contenu
- **Constat** : la bottom-bar rend en dur `['Visa', 'Mastercard', 'PayPal', 'Azul']` comme moyens de paiement acceptés. Or le stade du projet est explicitement **réservation click & collect, sans paiement en ligne** (le « checkout » est un placeholder). Annoncer des marques de paiement induit le visiteur en erreur sur les capacités réelles (paiement sur place uniquement).
- **Impact** : promesse trompeuse en pied de page (toutes pages publiques). Risque de confusion / attente non tenue côté client.
- **Reco** : retirer les badges de paiement tant qu'il n'y a pas de paiement en ligne, ou les remplacer par un libellé honnête (ex. « Paiement en pharmacie »). Décision produit — à confirmer.
- **Confiance** : moyenne

### [WS11-07] `Breadcrumb` : `aria-label="Breadcrumb"` codé en anglais (non i18n) — P3
- **Fichier** : `src/components/Breadcrumb.tsx:21`
- **Catégorie** : i18n / a11y
- **Constat** : le `<nav aria-label="Breadcrumb">` est en anglais en dur, lu tel quel par les lecteurs d'écran sur les locales FR et ES. Convention du repo : tout texte UI (y compris labels a11y des autres composants chrome) passe par `useTranslations`.
- **Impact** : annonce lecteur d'écran non localisée du fil d'Ariane sur FR/ES.
- **Reco** : tirer le label d'un namespace i18n (ex. `Nav.breadcrumbAriaLabel` ou `Common.breadcrumb`) FR/ES/EN.
- **Confiance** : haute

### [WS11-08] Doublon de destination footer : « Nos pharmaciens » et « À propos » pointent tous deux vers `/a-propos` ; incohérent avec le drawer (`/pharmacie`) — P3
- **Fichier** : `src/components/Footer.tsx:43` (`pharmacists` → `/a-propos`) vs `:49` (`about` → `/a-propos`) ; cf. `src/components/MobileDrawer.tsx:128` (`utility.pharmacists` → `/pharmacie`)
- **Catégorie** : dette / UX
- **Constat** : dans le footer, le lien colonne Service « pharmacists » et le lien colonne Marque « about » mènent à la même page `/a-propos`. Par ailleurs le même libellé « pharmaciens » mène à `/pharmacie` dans le drawer mobile — deux destinations différentes pour un intitulé identique selon la surface.
- **Impact** : deux entrées footer redondantes ; incohérence d'information entre footer et drawer. Faible mais salissant pour la nav.
- **Reco** : faire pointer le « pharmacists » footer vers `/pharmacie` (aligné drawer) ou vers une vraie page équipe, et différencier de « À propos ».
- **Confiance** : haute

### [WS11-09] Bouton panier (toggle d'un dialog) sans `aria-expanded`/`aria-haspopup` — P3
- **Fichier** : `src/components/NavBar.tsx:408-413`
- **Catégorie** : a11y
- **Constat** : le bouton panier est un vrai toggle (`onClick={() => setCartOpen(o => !o)}`) qui ouvre/ferme le `CartDrawer` (un `role="dialog"`). Il a un `aria-label` mais pas d'`aria-expanded`/`aria-haspopup="dialog"`. Les triggers de méga-menu voisins, eux, exposent correctement `aria-haspopup="menu"` + `aria-expanded` (`:294-296`, `:340-342`, `MenuTrigger:482-483`) — le panier est la seule commande d'overlay sans état annoncé.
- **Impact** : l'état ouvert/fermé du panier n'est pas annoncé aux lecteurs d'écran. Mineur.
- **Reco** : ajouter `aria-haspopup="dialog"` + `aria-expanded={cartOpen}` sur le bouton panier.
- **Confiance** : haute

### [WS11-10] `SWRProvider` : fetcher par défaut sans contrôle `res.ok` (footgun latent) — P3
- **Fichier** : `src/components/SWRProvider.tsx:15`
- **Catégorie** : dette / bug latent
- **Constat** : le `fetcher` global fait `fetch(url).then(res => res.json())` sans vérifier `res.ok`. Une réponse 401/500 (corps `{error:...}`) serait donc résolue comme **donnée valide** plutôt que comme erreur SWR. Tous les consommateurs actuels (`useCart`, `useWishlist`, `CartEmpty`, `SearchOverlay`, `ThemeFavicon`, pages admin) passent leur **propre** fetcher (avec check `.ok` quand pertinent), donc ce défaut est dormant aujourd'hui. Mais c'est un piège pour tout futur `useSWR(key)` sans fetcher explicite (qui hériterait ce comportement permissif).
- **Impact** : nul actuellement ; risque que de futurs hooks affichent un corps d'erreur comme s'il s'agissait de données.
- **Reco** : durcir le fetcher par défaut (`if (!res.ok) throw ...`) pour qu'il échoue proprement, comme les fetchers locaux. `errorRetryCount:3` + `errorRetryInterval:5000` rejouera alors correctement les erreurs réseau.
- **Confiance** : moyenne

## Points positifs (court)
- **Piège `backdrop-filter` correctement traité** : les overlays (`SearchOverlay`, `CartDrawer`, `MobileDrawer`, `ScrollToTop`) sont rendus en **frères** du `<header>` (NavBar.tsx:448-462, fragment `<>`), donc leurs `position:fixed` se calent bien sur le viewport. Commentaire explicatif présent. Navbar bien `relative` (non-sticky), bouton panier bien en toggle.
- **`ThemeFavicon`** : conforme au contrat — applique `data-theme` live **uniquement** hors `/admin` (`:40`), réutilise la **même clé SWR** `/api/theme` que les autres consommateurs (dédup par clé, pas de requête réseau supplémentaire), réécrit les `<link rel=icon>` et purge les favicons concurrents. Fallback propre sur `<html data-theme>` pendant le fetch.
- **`useModalA11y`** bien réutilisé par `CartDrawer` et `MobileDrawer` (focus trap + scroll lock + restauration focus + Escape). `ScrollToTop` gère `aria-hidden`/`tabIndex`/`prefers-reduced-motion` correctement.
- **`IframeHeightReporter`** robuste : inerte hors iframe (`window.parent === window.self`), `postMessage` ciblé sur `window.location.origin`, cleanup complet du `ResizeObserver`/listener.
- **`FooterNewsletter`** : `aria-invalid`/`aria-describedby`/`aria-live="polite"` corrects, mapping des codes d'erreur API (`invalid_email`/`rate_limited`) vérifié contre `/api/newsletter`, désactivation du form pendant submit/success. Tous les liens besoins du footer (14 slugs) résolvent à de vrais tags peuplés (vérifié DB).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/components/NavSearch.tsx` n'existe plus (remplacé par `nav/SearchOverlay.tsx`) mais `CLAUDE.md` le documente encore lourdement (drift doc).
- `getShopSettings` (`src/lib/getShopSettings.ts`) est cookie-based : tout Server Component qui l'appelle force la page en dynamique (cf. WS11-01) — à arbitrer globalement (WS sur perf/SSR).
- `src/lib/supabaseServer.ts:set/remove` avalent silencieusement les erreurs d'écriture cookie depuis un Server Component (attendu, mais masque aussi de vraies erreurs).

## Zones non couvertes / à re-vérifier humainement
- **Course de scroll-lock multi-overlay** : `SearchOverlay` et `CartDrawer`/`MobileDrawer` posent chacun `body.style.overflow='hidden'` indépendamment et restaurent leur `prevOverflow`. Cart + Search peuvent être ouverts simultanément (ni l'un ni l'autre ne ferme l'autre). En pratique la fermeture est LIFO (search est au-dessus, Esc/scrim ferment search d'abord), donc la restauration s'enchaîne correctement — mais une fermeture dans un ordre inattendu pourrait laisser le `body` verrouillé ou déverrouillé à tort. À valider au navigateur (P3 potentiel, non confirmé).
- Rendu visuel des méga-menus / drawer en **mode sombre** réel sur chaque thème (au-delà du `bg-white` de WS11-02) — non vérifiable en lecture seule.
