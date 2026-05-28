# WS15 — Tests & QA (audit PRE-V1, lecture seule)

Date : 2026-05-28 · Auditeur : QA senior · Périmètre : suite Playwright (11 specs / ~27 blocks) + Vitest (8) + config CI. **Aucune exécution de la suite** (lecture/grep/git uniquement, conforme aux règles).

---

## Verdict

**C+ — la suite est bien outillée mais ne protège PAS le flux le plus critique du commerce du site (panier/quantité), et le seul test qui le touche masque un bug P0 réel.**

Points forts réels : sélecteurs `data-testid` partout (pas de texte fragile), helpers service-role propres (createTestUser/cleanup), auth-guards exhaustifs (admin + account, 14 routes), E2E réservation avec merge anon→user, audit liens footer. La config Playwright est mature (timeouts cold-compile, serial sur les flux stateful, retries CI=2).

Mais :
- **Le stepper de quantité du panier est cassé en prod (P0 produit) et le test cart censé le couvrir asserte la valeur optimiste, donc il « passe » par timing au lieu d'échouer.** C'est la cause racine probable de la flakiness « cart » documentée.
- **0 test unitaire sur 100 % des libs pures critiques** (csrf, rateLimit, schemas Zod, formatPrice, slug, catalogueFilters, reservation, seo, shipping) — l'unique fichier Vitest teste les pages auth.
- **0 test** sur thème/apparence, newsletter double opt-in, blog, signup réel (E2E), recherche, wishlist authentifiée, RLS/RPC.
- **Les E2E ne tournent en CI que si 3 secrets GitHub sont configurés** (finding DX connu, non confirmable en lecture seule) — sinon le job e2e crashe au démarrage (`test-users.ts` throw si pas de service role).
- **Aucun script de parité i18n** : le « 1466 clés FR/EN/ES » est vérifié à la main, non testé.

---

## Matrice de couverture — flux critiques V1

| Flux critique | Couvert ? | Spec / preuve | Note |
|---|---|---|---|
| Auth — login (erreur creds, redirect admin/user) | ✅ unit | `src/__tests__/auth.test.tsx:114-218` | Mocké (pas E2E). Login admin réel testé via `admin-smoke`. |
| Auth — signup (validation mdp, metadata) | ✅ unit | `auth.test.tsx:221-293` | Mocké uniquement. **Pas de signup E2E réel** (création via service-role contourne le form). |
| Auth — guard `/admin/*` non connecté | ✅ E2E | `admin-auth.spec.ts:16-51` (12 routes + chrome check) | Solide. |
| Auth — guard `/account/*` + `/favoris` | ✅ E2E | `account-auth.spec.ts:17-37` (5 routes + multilocale) | Solide. |
| Panier — ajout invité | ✅ E2E | `cart.spec.ts:36-41` | OK. |
| Panier — persistance refresh | ✅ E2E | `cart.spec.ts:43-51` | OK. |
| Panier — ouverture drawer | ✅ E2E | `cart.spec.ts:53-62` | OK. |
| **Panier — modif quantité (stepper)** | ⚠️ **FAUX POSITIF** | `cart.spec.ts:64-78` | Asserte la valeur **optimiste** (`2`), pas le résultat serveur (`3` à cause de l'increment). Masque le P0. Voir WS15-01. |
| Panier — suppression item | ⚠️ flaky | `cart.spec.ts:80-100` | Durci 2026-05-28 (`38a6a34`). Flakiness résiduelle liée au modèle optimistic + refresh. Voir WS15-02. |
| Réservation — happy path (merge → reserve → confirmation) | ✅ E2E | `reservation.spec.ts:85-105` | Excellent (poll `/api/cart` avant reserve). |
| Réservation — 409 already_active | ✅ E2E | `reservation.spec.ts:107-124` | OK. |
| Admin — login + sidebar + 9 pages sans 500 | ✅ E2E | `admin-smoke.spec.ts:47-96` | OK (re-login par test, toléré). **`/admin/annonce`, `/admin/blog`, `/admin/apariencia`, `/admin/setup` NON dans la liste.** |
| Catalogue / PDP / contact (golden path) | ✅ E2E | `golden-path.spec.ts:18-86` | OK (contact mocké, pas de DB). |
| i18n — bascule FR/ES/EN + hreflang | ✅ E2E | `i18n.spec.ts:9-30` | OK (attribut `lang` + count `<link hreflang>`). |
| Pages besoins (landing + 404) | ✅ E2E | `besoins.spec.ts:11-39` | 2e test (`hydratation`) a une assertion **no-op** `>= 0` (WS15-07). |
| Pages marques (index + landing) | ✅ E2E | `marques.spec.ts:9-30` | OK. |
| Footer — aucun lien interne 404 | ✅ E2E | `footer-links.spec.ts:12-37` | OK. |
| Wishlist — heart anon → /login | ⚠️ flaky | `wishlist-anon.spec.ts:7-27` | Durci (`toPass` retry). Wishlist **authentifiée NON testée**. |
| **Thème / apparence (6 palettes, mode sombre, toggle visiteur)** | ❌ **NON** | aucune spec | Feature majeure 2026-05-28, 0 test. |
| **Newsletter double opt-in (Resend, confirm token)** | ❌ **NON** | aucune spec | Nécessite `RESEND_API_KEY`. Documenté non testé. |
| **Blog (`/blog`, `/blog/[slug]`, admin CRUD)** | ❌ **NON** | aucune spec | Feature 2026-05-27, 0 test (ni public ni admin, ni XSS sanitize). |
| **Recherche `⌘K` / NavSearch** | ❌ **NON** | aucune spec | Composant central nav, 0 test. |
| **RLS / RPC (panier, reservation, merge, is_user_admin)** | ❌ **NON** | aucune spec | 10 findings authz ouverts (WS03) → aucune régression-test. |
| **i18n — parité des clés FR/EN/ES** | ❌ **NON** | aucun script | « 1466 clés » vérifié manuellement. |

**Bilan : 17 flux couverts (dont 4 fragiles/faux positifs), 6 flux critiques NON couverts.**

---

## Analyse de la flakiness (cause racine)

Deux specs sont documentées comme flaky en run unifié : `wishlist-anon` et `cart Suppression`. Plus un faux positif sur `cart Modification de la quantité`. La cause racine n'est pas (seulement) le cold-compile Turbopack invoqué dans les commentaires — c'est le **pattern optimistic-update + revalidation SWR** combiné à un **bug serveur** sur la quantité.

### Mécanisme commun : optimistic vs refreshCart

`useCart` applique d'abord un update optimiste (`mutate(url, data, false)`) puis `await refreshCart()` qui re-fetch `/api/cart` (`src/hooks/useCart.ts:98,113`). Entre les deux, l'UI affiche une valeur **prédite**. Les tests asservissent leurs assertions sur cet état intermédiaire avec un timeout de 10 s. Selon que la revalidation SWR arrive avant ou après l'assertion, le résultat varie → flakiness intrinsèque, indépendante du cold-compile.

### Le faux positif quantité (= le P0 panier sous un autre angle)

- `CartLineItem.handleInc` (`CartLineItem.tsx:43-47`) appelle `onUpdateQuantity(productId, item.quantity + 1)` — il passe la **valeur cible absolue** (ex. 2).
- `useCart.updateQuantity` (`useCart.ts:166-214`) fait un optimistic **SET** `quantity = 2` (`:185`) **puis** POST `/api/cart` avec `{ quantity: 2 }`.
- La route POST (`api/cart/route.ts:214-221`) appelle la RPC `add_to_cart(p_quantity=2)`.
- La RPC **incrémente** : `quantity = cart_items.quantity + EXCLUDED.quantity` (`20260519092026:28`). Item à 1 + delta 2 = **3** en base.
- Après `refreshCart()`, `/api/cart` renvoie **3**, pas 2.

Le test `cart.spec.ts:74-77` asserte `quantity-display` = `'2'` et `cart-badge` = `'2'`. **Vérité serveur = 3.** Le test ne « passe » que si l'assertion fenêtre l'état optimiste avant que la revalidation n'écrase à 3 — sinon il échoue. C'est un faux positif structurel qui **masque un bug P0 produit** : le stepper de quantité du panier ne remplace pas, il additionne. Un client qui passe de 1 à 2 obtient 3 ; de 2 à 3 obtient 5 ; etc. Le bouton `−` a le même défaut inversé (`handleDec` envoie `quantity - 1` qui sera additionné).

> Cross-réf : WS02-06 confirme le cumul de `add_to_cart` côté stock (TOCTOU). WS15 le confirme côté **UX/correction fonctionnelle** : `updateQuantity` ne peut pas réutiliser une RPC d'increment. Il faut soit une RPC `set_cart_quantity` (UPDATE absolu), soit `updateQuantity` doit calculer et envoyer le **delta** signé.

### Suppression (`cart Suppression`)

Le durcissement `38a6a34` attend l'hydratation de l'item puis asserte `toHaveCount(0)` sur l'item ET le badge. Robuste sur le principe, mais reste tributaire de la double-attente optimistic→refresh. La flakiness résiduelle vient du même couplage (le badge `cart-badge` n'est rendu que si `totalItems>0` ; la transition 1→0 dépend de quel `mutate` gagne la course).

### Wishlist anon

Cause documentée et plausible : le clic peut précéder l'hydratation React du handler en cold-compile. Le `toPass` retry (`wishlist-anon.spec.ts:18-23`) est un bon contournement. Flakiness d'hydratation pure, pas de bug applicatif. Low.

---

## Findings

### WS15-01 · P0 · Test quantité panier = faux positif masquant un bug produit · confirmé
**Preuve.** `cart.spec.ts:72-77` (asserte `2`) vs chaîne `CartLineItem.tsx:43` → `useCart.ts:185,198` → `api/cart/route.ts:214` → `20260519092026:28` (increment). Item 1 + delta 2 = 3 serveur.
**Impact.** Le seul test du stepper quantité valide l'état optimiste, pas la vérité serveur → bug P0 (quantité additionnée au lieu de remplacée) invisible en CI. Régression silencieuse sur le flux d'achat.
**Reco.** (1) Corriger le code : `updateQuantity` doit envoyer un delta, ou une nouvelle RPC `set_cart_quantity`. (2) Rendre le test déterministe : après le clic `+`, **attendre la réponse POST `/api/cart`** puis re-fetch `/api/cart` via `page.request.get` et asserter la quantité **serveur** (pas le DOM optimiste). Ajouter un cas 1→2→3 pour piéger l'increment.
**Effort.** S (test) + S/M (fix produit, hors WS15).

### WS15-02 · P1 · Assertions panier sur l'état optimiste (flakiness intrinsèque) · confirmé
**Preuve.** `cart.spec.ts:40,46,50,56,77,99` asservissent badge/display sans attendre la réponse réseau ; `useCart.ts:98 puis :113` (optimistic→refresh).
**Impact.** Flakiness documentée (suppression, quantité) ; faux verts. Indépendant du cold-compile.
**Reco.** Ancrer chaque assertion stateful sur `page.waitForResponse(POST|DELETE /api/cart)` AVANT d'asserter le DOM, ou asserter directement la réponse serveur. Pattern déjà utilisé proprement dans `reservation.spec.ts:48-55` — généraliser.
**Effort.** S.

### WS15-03 · P1 · 0 test unitaire sur les libs pures critiques · confirmé
**Preuve.** Recherche : `csrf, rateLimit, schemas, formatPrice, slug, catalogueFilters, reservation, seo, shipping, whatsapp, themes` → **0 fichier de test**. Seul `src/__tests__/auth.test.tsx` existe (pages login/signup mockées).
**Impact.** Logique de sécurité (CSRF origin, rate-limit windowing), validation Zod des 22 routes admin, formatage prix DOP, génération slug, parsing filtres catalogue URL, référence réservation `FAR-…` — toutes non testées. Régression facile et indétectée.
**Reco.** Vitest pur (pas de DOM) sur au minimum : `schemas.ts` (cas valides/invalides par schéma), `csrf.ts` (origin allow/deny + `getSiteUrl`), `rateLimit.ts` (fenêtre), `formatPrice.ts` (locales + fractionDigits), `slug.ts`, `catalogueFilters.ts`, `reservation.ts` (`buildReservationReference*`), `seo.ts` (`buildLanguageAlternates` x-default). Rapide, haut ROI, tourne déjà en CI.
**Effort.** M.

### WS15-04 · P1 · E2E en CI dépendants de 3 secrets non vérifiables · suspecté
**Preuve.** `ci.yml:60-71` injecte `NEXT_PUBLIC_SUPABASE_URL`, `..._ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` depuis `secrets.*`. `tests/_helpers/test-users.ts:13-17` **throw** si service role absent → tout fichier qui l'importe (reservation, admin-smoke) crashe à l'import. Finding DX connu (« Playwright CI secrets — à configurer »).
**Impact.** Si les secrets ne sont pas posés dans GitHub, le job `e2e` échoue (ou pire, ne teste qu'une fraction). Le job principal `ci` (lint/tsc/vitest/build) utilise des placeholders → reste vert, donnant une fausse impression de couverture.
**Reco.** Confirmer la présence des 3 secrets (Settings → Secrets). Documenter explicitement dans le README CI. Optionnel : faire échouer le build placeholder si on veut un vrai garde-fou, ou marquer le job e2e `continue-on-error: false` + alerter sur skip.
**Effort.** S (config, hors lecture seule).

### WS15-05 · P1 · Flux V1 majeurs sans aucun test · confirmé
**Preuve.** grep tests/ : aucune occurrence de thème/apparence, newsletter/opt-in, blog, signup E2E réel, NavSearch, wishlist authentifiée.
**Impact.** Système de thèmes (6 palettes × clair/sombre, anti-flash, SSG) — risque de régression visuelle/hydratation non détecté. Newsletter double opt-in — flux email jamais exercé. Blog — XSS sanitize (`DOMPurify`) jamais testé. Signup réel — seul le mock unitaire existe, le parcours form→Supabase→profile n'a pas de E2E.
**Reco.** Prioriser pour V1 : (a) smoke thème (charger `/fr` et asserter `<html data-theme data-mode>` + pas de flash) ; (b) smoke blog public (`/blog` + un `/blog/[slug]` publié + assert sanitize) ; (c) E2E signup réel (form → email confirm bypass service-role → login). Newsletter et NavSearch en P2.
**Effort.** M.

### WS15-06 · P2 · admin-smoke ne couvre pas annonce/blog/apariencia/setup · confirmé
**Preuve.** `admin-smoke.spec.ts:58-84` liste 9 routes ; manquent `/admin/annonce`, `/admin/blog`, `/admin/apariencia`, `/admin/setup`. (`admin-auth.spec.ts:16-29` couvre annonce+setup pour le guard, mais pas le rendu loggé.)
**Impact.** 3 pages admin récentes (blog, apparence) jamais chargées loggées → un crash 500 admin passerait CI.
**Reco.** Ajouter ces 4 routes à `adminPages` dans admin-smoke.
**Effort.** S.

### WS15-07 · P2 · Assertion no-op dans besoins.spec · confirmé
**Preuve.** `besoins.spec.ts:26-27` : `expect(hasCards).toBeGreaterThanOrEqual(0)` — toujours vrai (un count est toujours ≥ 0).
**Impact.** Le test « rend la liste des produits » ne vérifie en réalité que le `<h1>`. Couverture illusoire.
**Reco.** Asserter `> 0` (la page hydratation a des produits en DB) ou tester explicitement le fallback empty-state.
**Effort.** S.

### WS15-08 · P2 · Dépendance forte à l'état DB de prod (353 produits, featured, stock) · confirmé
**Preuve.** `cart.spec.ts:13-27` (commentaire) s'appuie sur « les 4 produits `is_featured` qui ont du stock » sur la home ; les 349 autres ont `stock=0` et `/api/cart` POST renvoie 400. `marques.spec.ts:16` exige ≥ 5 marques ; `besoins` exige des slugs précis (`nettoyage`, `hydratation`).
**Impact.** Les tests tournent contre la **prod live** (service-role réel). Un changement de curation (dé-featuring, mise à stock 0, suppression de tag) casse les tests sans changement de code. Risque aussi : pollution DB (users `playwright+*@farmau.test`, réservations) si un afterEach ne s'exécute pas.
**Reko.** Documenter l'invariant « ≥ 4 produits featured en stock + slugs besoins requis » comme pré-requis testbed. À terme : projet Supabase de test seedé déterministe. Vérifier que `cleanupStaleTestUsers` est appelé en bootstrap (il existe mais n'est invoqué nulle part dans les specs — voir WS15-09).
**Effort.** M.

### WS15-09 · P2 · cleanupStaleTestUsers jamais invoqué + nettoyage best-effort · confirmé
**Preuve.** `test-users.ts:84` exporte `cleanupStaleTestUsers` mais `grep` → 0 call-site dans tests/. `reservation.spec.ts:36` et `admin-smoke.spec.ts:30` font `deleteTestUser(...).catch(() => undefined)` (échec silencieux).
**Impact.** Si un run crashe (timeout, OOM dev server), des users `playwright+*@farmau.test` + leurs carts/réservations s'accumulent dans la **prod**. Pas de garde-fou de bootstrap.
**Reco.** Appeler `cleanupStaleTestUsers()` dans un `globalSetup` Playwright. Ou au moins le documenter comme étape manuelle.
**Effort.** S.

### WS15-10 · P2 · `npm run test:unit` lance Vitest en mode watch · confirmé
**Preuve.** `package.json` : `"test:unit": "vitest"` (watch par défaut). CI le sauve avec `npm run test:unit -- --run` (`ci.yml:34`), et HANDOFF recommande `--run`.
**Impact.** Un dev qui tape `npm run test:unit` reste bloqué en watch (peut sembler « hang »). Hazard DX, et piège si un script l'appelle sans `--run`.
**Reco.** `"test:unit": "vitest run"` + `"test:unit:watch": "vitest"` (l'inverse de l'actuel). CI déjà sûr.
**Effort.** S.

### WS15-11 · P2 · Aucun test de parité i18n (1466 clés FR/EN/ES) · confirmé
**Preuve.** Aucun script ni test ne compare les clés des 3 `messages/*.json`. La parité « 1466 » est une affirmation manuelle (CLAUDE.md/HANDOFF).
**Impact.** Une clé ajoutée en FR mais oubliée en ES/EN ne casse rien au build (next-intl fallback) mais affiche la clé brute en prod. Régression i18n silencieuse — risque réel sur un site tri-langue marché RD.
**Reco.** Test Vitest pur : charger les 3 JSON, aplatir, asserter égalité des ensembles de clés (diff symétrique vide). 20 lignes, tourne en CI.
**Effort.** S.

### WS15-12 · P3 · Suite multi-navigateur configurée mais e2e CI = chromium seul · confirmé
**Preuve.** `playwright.config.ts:20-41` (5 projets : Chromium/Firefox/WebKit/Mobile Chrome/Mobile Safari) ; `ci.yml:67` `--project=chromium`.
**Impact.** Firefox/WebKit/mobile jamais exercés en CI. Le site est responsive (drawer mobile, PdpStickyBar IntersectionObserver) → régressions Safari/mobile possibles. Faible (chromium couvre l'essentiel V1).
**Reco.** Garder chromium en CI rapide ; ajouter un job nightly cross-browser ou au moins Mobile Safari pour le drawer/sticky.
**Effort.** S.

### WS15-13 · P3 · Golden path contact mocké → route `/api/contact` réelle jamais E2E · confirmé
**Preuve.** `golden-path.spec.ts:62-73` intercepte `/api/contact` (fulfill 200). La validation Zod, le rate-limit, le CSRF origin de la route ne sont pas exercés E2E (ni en unit, cf WS15-03).
**Impact.** Le form contact « passe » sans toucher le backend. Régression côté route (validation, rate-limit) indétectée. Faible.
**Reco.** Couvrir `/api/contact` en unit (validation/CSRF) plutôt qu'en E2E (éviter pollution + rate-limit). Inclus dans WS15-03.
**Effort.** S.

---

## Tableau récapitulatif

| ID | Sév | Sujet | Preuve | Effort | Statut |
|---|---|---|---|---|---|
| WS15-01 | **P0** | Test quantité = faux positif masquant bug increment | `cart.spec.ts:72-77` + `20260519092026:28` | S+S | confirmé |
| WS15-02 | P1 | Assertions panier sur état optimiste → flakiness | `cart.spec.ts:40-99` + `useCart.ts:98,113` | S | confirmé |
| WS15-03 | P1 | 0 unit test sur libs pures critiques | grep libs → 0 | M | confirmé |
| WS15-04 | P1 | E2E CI dépendants de 3 secrets non vérifiés | `ci.yml:60-71` + `test-users.ts:13` | S | suspecté |
| WS15-05 | P1 | Thème/newsletter/blog/signup/search non testés | grep tests/ → 0 | M | confirmé |
| WS15-06 | P2 | admin-smoke manque annonce/blog/apariencia/setup | `admin-smoke.spec.ts:74-84` | S | confirmé |
| WS15-07 | P2 | Assertion no-op `>= 0` dans besoins | `besoins.spec.ts:27` | S | confirmé |
| WS15-08 | P2 | Couplage fort à l'état DB prod (featured/stock/slugs) | `cart.spec.ts:13-27`, `marques.spec.ts:16` | M | confirmé |
| WS15-09 | P2 | cleanupStaleTestUsers jamais appelé + cleanup best-effort | `test-users.ts:84` (0 call-site) | S | confirmé |
| WS15-10 | P2 | `test:unit` en mode watch par défaut | `package.json` scripts | S | confirmé |
| WS15-11 | P2 | Aucun test de parité i18n | absence script | S | confirmé |
| WS15-12 | P3 | CI e2e chromium seul (5 projets configurés) | `ci.yml:67` vs `playwright.config.ts:20` | S | confirmé |
| WS15-13 | P3 | `/api/contact` mocké → route réelle jamais testée | `golden-path.spec.ts:63` | S | confirmé |

**Total : 1 P0 · 4 P1 · 6 P2 · 2 P3 = 13 findings.**

---

## Recommandations prioritaires (ordre V1)

1. **WS15-01** — rendre le test quantité déterministe (assert serveur) ; il révélera le P0 increment. Bloquant V1.
2. **WS15-04** — confirmer/poser les 3 secrets GitHub, sinon les E2E ne protègent rien en CI.
3. **WS15-02** — généraliser `waitForResponse` avant assertions panier (tue la flakiness à la racine).
4. **WS15-03 + WS15-11** — batterie Vitest sur libs pures + parité i18n (haut ROI, déjà en CI).
5. **WS15-05** — smoke thème + blog + signup E2E (features V1 majeures à 0 test).
