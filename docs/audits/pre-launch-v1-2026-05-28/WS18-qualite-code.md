# WS18 — Qualité de code (audit PRE-V1, lecture seule)

Date : 2026-05-28 · Auditeur : agent WS18 · Périmètre : `/Users/juan/Documents/skincarelaser`
Stack : Next.js 15.5 App Router + React 19 + TS strict, next-intl FR/ES/EN.
Méthode : `npx tsc --noEmit` + `npm run lint` (sans `--fix`) + grep ciblés + sweep d'orphelins. **Aucune mutation.**

---

## Verdict

**A (maintenu).** Les métriques de santé du doc `code-quality.md` (noté A) **TIENNENT** après les ajouts blog / thèmes / banner slots : tsc 0 erreur, ESLint 0 warning, 0 `any`, 0 `console` brut hors logger, 0 `alert()`. Les types Supabase sont à jour vs les migrations récentes (enums banner, posts, shop_settings appearance, newsletter token TTL). Parité i18n parfaite (1466 clés × 3 locales).

**Aucun P0.** La dette résiduelle est mineure : un seuil métier dupliqué/divergent (LOW_STOCK), 2 modules entièrement orphelins (0 import) + une poignée d'exports morts, et quelques `!` non-null défendables mais fragiles. Rien ne bloque la V1.

Correction d'une fausse alarme inter-agents : la « duplication de helper de référence réservation (2 helpers FAR) » n'en est **pas** une — les deux helpers (`buildReservationReference` full + `buildReservationReferenceCompact`) sont co-localisés et exportés depuis le **même** `src/lib/reservation.ts`, sans logique copiée (cf. WS18-08).

---

## Métriques santé re-mesurées

| Indicateur | Doc (05-27) | Re-mesuré (05-28) | Statut |
|---|---|---|---|
| `npx tsc --noEmit` | 0 | **0** (exit 0) | ✅ tient |
| `npm run lint` (sans --fix) | 0 | **0** (`✔ No ESLint warnings or errors`) | ✅ tient |
| `: any` / `as any` / `<any>` | 0 | **0** (hors `database.types.ts`) | ✅ tient |
| `@ts-ignore` / `@ts-expect-error` | 0 | **0** | ✅ tient |
| `eslint-disable` | n/a | **6** (5× `no-img-element` justifiés MASK/SVG + 1 `exhaustive-deps` justifié) | ⚠️ acceptable |
| `console.*` hors logger | 0 (logger) | **0** | ✅ tient |
| `alert()` | 0 | **0** | ✅ tient |
| TODO/FIXME/HACK/XXX | — | **0** (seuls des commentaires-doc « FAR-… ») | ✅ |
| Fichiers TS/TSX | 241 | **266** | (info) |
| LOC `src/` | 31 315 | **33 145** | (info) |
| Parité i18n | 1466×3 (doc thèmes) | **1466 leaf keys × FR/ES/EN, 39 namespaces** | ✅ parfait |
| Casts `!` non-null | — | **21** (5 env, 6 `user!`, reste guardé) | ⚠️ P2 |
| `catch` swallowing | — | **0** réel (logger ou dégradation gracieuse) | ✅ |
| `switch` sans `default` | — | **0** (tous ont un fallback) | ✅ |

`eslint-disable` détaillés (tous légitimes) :
- `NavSearch.tsx:451`, `reservation/ReservationSummary.tsx:71`, `reservation/ReviewStep.tsx:89` → `@next/next/no-img-element` (images Storage avec ratio dynamique, choix assumé)
- `reset-password/page.tsx:29`, `Banner.tsx:50`, `catalogue/FiltersMobileSheet.tsx:103` → `react-hooks/exhaustive-deps` (mount-once / sync URL au mount, intentionnel)

Types Supabase (`database.types.ts`) **à jour** vs migrations récentes — vérifié :
- `banner_slot: "hero"|"banner"|"card"|"modal"` + `banner_status: "draft"|"scheduled"|"active"|"paused"|"expired"` ✅
- table `posts` ✅
- `shop_settings.theme` / `default_mode` / `allow_visitor_mode` ✅
- `newsletter_subscribers.confirmation_token` + `token_expires_at` ✅

---

## Dead code — candidats (preuve 0 référence)

Sweep : pour chaque export nommé de `src/{lib,hooks,components,types}`, comptage des références hors fichier de définition + vérification du module-import.

### Modules entièrement orphelins (0 import nulle part — supprimables)

| Fichier | LOC | Preuve | Sévérité |
|---|---|---|---|
| `src/hooks/useMediaQuery.ts` | 30 | `grep -rn useMediaQuery src/ \| grep -v hooks/useMediaQuery.ts` → **0 résultat** | P2 |
| `src/components/CartIcon.tsx` | 44 | `grep -rn CartIcon src/ \| grep -v components/CartIcon.tsx` → **0 résultat** | P2 |

### Exports morts dans des modules par ailleurs utilisés (suspectés supprimables)

| Symbole | Fichier | Preuve |
|---|---|---|
| `shippingCostFor` | `src/lib/shipping.ts:56` | 0 réf hors définition (le module est importé pour d'autres exports) |
| `getPickupLocation` | `src/lib/shipping.ts:60` | 0 réf hors définition |
| `userPatch` | `src/lib/schemas.ts` | 0 réf (autres schemas Zod tous utilisés) |
| `THEME_BY_SLUG` | `src/lib/themes.ts` | 0 réf hors définition |
| `QuotePlaceholderAvatar` | `src/components/banners/BannerQuote.tsx` | 0 réf (BannerQuote lui-même est importé) |
| `MAX_CART_QUANTITY` | `src/lib/constants.ts:15` | 0 import (la limite panier n'est appliquée nulle part — voir WS18-05) |
| `ADMIN_HOME_PATH` | `src/lib/constants.ts:18` | 0 import |
| `LOW_STOCK_THRESHOLD` | `src/lib/constants.ts:12` | 0 import (voir WS18-01) |

> Non-orphelins confirmés (référencés en interne, NE PAS toucher) : `LOCALE_TAG_MAP`, `DEFAULT_LOCALE_TAG`, `THEME_NAMES`, `THEME_MODES`, `scorePassword`.

### RPC sans call-site (corroboration côté code)

- `reorder_banners` : **a** un call-site → `src/app/api/admin/banners/route.ts:132`. PAS orphelin.
- `cleanup_banner_positions` : **0 call-site** dans `src/` (présent uniquement dans `database.types.ts`). Suspecté appelé par trigger/cron DB ; à confirmer côté SQL (hors périmètre lecture-seule code). Cf. WS18-09.

---

## Duplications / incohérences

### Seuil « stock bas » triple et divergent (WS18-01, **P1**)
Trois définitions concurrentes du même concept métier, **toutes différentes** :
- `src/lib/constants.ts:12` → `LOW_STOCK_THRESHOLD = 10` … **jamais importé**
- `src/components/ProductCard.tsx:38` → `const LOW_STOCK_THRESHOLD = 5` (re-déclaration locale)
- `src/app/api/admin/sidebar-stats/route.ts:32` → `.lt('stock', 5)` (hardcodé, commentaire ligne 10 « stock < 5 »)

Conséquence : la constante centralisée (10) est morte ; le seuil réel (5) est dupliqué en magic number. Front et badge sidebar concordent par accident (5), pas par design.

### formatPrice vs Intl.NumberFormat direct (WS18-02, **P2** — connu)
`src/app/[locale]/account/reservations/page.tsx:135` instancie `new Intl.NumberFormat('es-DO')` au lieu de `formatPrice()`. Le doc le note comme choix assumé (comportement 0-3 décimales vs `formatPrice` fixe). Locale codée en dur `'es-DO'` ⇒ pas localisé FR/EN sur cette page (recoupe WS10). Reste à `formatPrice(v, { locale })` près.

---

## Findings (détail)

### WS18-01 · P1 · confirmé — Seuil stock-bas dupliqué/divergent
**Preuve** : `constants.ts:12` (=10, 0 import) vs `ProductCard.tsx:38` (=5) vs `sidebar-stats/route.ts:32` (`.lt('stock',5)`).
**Impact** : source de vérité fantôme ; risque de divergence future entre badge produit, KPI admin et toute logique stock. Maintenabilité.
**Reco** : importer `LOW_STOCK_THRESHOLD` depuis `constants.ts` dans `ProductCard` et `sidebar-stats`, **et** aligner sa valeur (10 ou 5 — décision produit). Supprimer la re-déclaration locale.
**Effort** : 15 min.

### WS18-02 · P2 · confirmé — Intl.NumberFormat direct + locale en dur
**Preuve** : `account/reservations/page.tsx:135` `new Intl.NumberFormat('es-DO')`.
**Impact** : prix non localisés FR/EN sur l'historique réservations ; contourne le helper centralisé.
**Reco** : `formatPrice(value, { locale })`. Si la précision 0-3 décimales est voulue, étendre `formatPrice` d'un paramètre plutôt que dupliquer.
**Effort** : 10 min.

### WS18-03 · P2 · confirmé — 2 modules entièrement orphelins
**Preuve** : `useMediaQuery.ts` (30 LOC) + `CartIcon.tsx` (44 LOC) → 0 import dans tout `src/`.
**Impact** : ~74 LOC mortes ; bruit de maintenance. (CLAUDE.md vante « code mort 0 » — légère régression.)
**Reco** : supprimer après confirmation indépendante. **NE PAS supprimer dans cet audit (lecture seule).**
**Effort** : 5 min.

### WS18-04 · P2 · suspecté — Exports morts résiduels
**Preuve** : `shippingCostFor`, `getPickupLocation` (`lib/shipping.ts`), `userPatch` (`lib/schemas.ts`), `THEME_BY_SLUG` (`lib/themes.ts`), `QuotePlaceholderAvatar` (`banners/BannerQuote.tsx`) → 0 réf hors définition.
**Impact** : surface d'API inutile ; les schemas Zod morts (`userPatch`) peuvent masquer une route admin users sans validation à brancher.
**Reco** : vérifier l'intention (helpers prévus pour un futur tunnel livraison ? `userPatch` à brancher sur `/api/admin/users` PATCH ?) puis supprimer ou câbler.
**Effort** : 20 min.

### WS18-05 · P2 · confirmé — MAX_CART_QUANTITY défini mais non appliqué
**Preuve** : `constants.ts:15` `MAX_CART_QUANTITY = 99`, **0 import**.
**Impact** : la limite de quantité par ligne panier n'est **enforced nulle part** côté code (ni `useCart`, ni `/api/cart`, ni RPC `add_to_cart` côté client). Soit dette de validation (un client peut viser une quantité arbitraire), soit constante morte.
**Reco** : brancher la borne dans `PdpQuantity`/`useCart`/route `/api/cart`, ou retirer la constante. À recouper avec WS09 (catalogue métier) / WS02 (backend).
**Effort** : 30 min si on enforce.

### WS18-06 · P2 · confirmé — ADMIN_HOME_PATH non importé
**Preuve** : `constants.ts:18`, 0 import. Les redirects post-login utilisent vraisemblablement la string `/admin/product` en dur ailleurs.
**Reco** : utiliser la constante aux call-sites de redirect login, ou la retirer.
**Effort** : 10 min.

### WS18-07 · P2 · confirmé (fragile, défendable) — Non-null assertions `user!`
**Preuve** : 6× `user!.id`/`user!.email` dans `account/{profile,reservations,security,preferences}` + `favoris`. Le layout `account/layout.tsx:23` redirige les non-authentifiés, et chaque page **re-fetch** `getUser()` (commentaire « session garantie par le layout »).
**Impact** : double appel `getUser()` (perf mineure) ; sur expiration de session entre layout et page, `user!` crashe au lieu de rediriger proprement. Les autres `!` (env, `oldPrice!` ternaire-guardé, `p.id!` du SELECT) sont sûrs.
**Reco** : guard explicite `if (!user) redirect(...)` dans les pages, ou passer l'user du layout en prop. Cosmétique pour la V1.
**Effort** : 20 min.

### WS18-08 · INFO · confirmé — « 2 helpers FAR » = fausse alarme (résolu)
**Preuve** : `src/lib/reservation.ts` exporte `buildReservationReference` (full `FAR-YYYYMMDD-XXXX`) + `buildReservationReferenceCompact` (`FAR-…XXXX`), partageant `datePart`/`idPart` internes. Importés depuis ConfirmationClient, account/reservations, admin dashboard. **Aucune logique copiée**, factorisation correcte. Le finding inter-agents est invalidé.

### WS18-09 · INFO · suspecté — cleanup_banner_positions sans call-site code
**Preuve** : 0 appel dans `src/`. Présent dans `database.types.ts`.
**Impact** : potentiellement appelé par trigger/cron SQL (le doc mentionne `cleanup_banner_positions` parmi les fonctions `SET search_path`). Si vraiment sans déclencheur DB, c'est de la dette SQL — à valider côté migrations (hors périmètre lecture-seule code, recouper WS02).

---

## Tableau récapitulatif

| ID | Sév. | Sujet | Fichier:ligne | Statut |
|---|---|---|---|---|
| WS18-01 | P1 | LOW_STOCK_THRESHOLD triple/divergent (10/5/5) | constants.ts:12 · ProductCard.tsx:38 · sidebar-stats:32 | confirmé |
| WS18-02 | P2 | Intl.NumberFormat direct + locale 'es-DO' en dur | account/reservations/page.tsx:135 | confirmé |
| WS18-03 | P2 | 2 modules orphelins (0 import) | useMediaQuery.ts · CartIcon.tsx | confirmé |
| WS18-04 | P2 | Exports morts résiduels | shipping.ts · schemas.ts · themes.ts · BannerQuote.tsx | suspecté |
| WS18-05 | P2 | MAX_CART_QUANTITY non enforced | constants.ts:15 | confirmé |
| WS18-06 | P2 | ADMIN_HOME_PATH non importé | constants.ts:18 | confirmé |
| WS18-07 | P2 | `user!` non-null fragile (account/*) | account/* + favoris | confirmé |
| WS18-08 | INFO | « 2 helpers FAR » = factorisation correcte | lib/reservation.ts | confirmé (invalide) |
| WS18-09 | INFO | cleanup_banner_positions sans call-site code | api/admin/banners | suspecté |

**Santé build/CI : aucun P0.** tsc 0 / lint 0 / 0 any / 0 console / 0 alert — toutes les métriques A tiennent. La V1 n'est bloquée par aucun finding de ce workstream.
