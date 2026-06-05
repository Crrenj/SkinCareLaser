# WS37 — Tests

**Périmètre** : `tests/*` (account-auth, admin-auth, admin-smoke, besoins, cart, footer-links, golden-path, i18n, marques, reservation, wishlist-anon + `_helpers/test-users.ts`), `src/__tests__/*` (auth.test.tsx, rateLimit.test.ts, safeRedirect.test.ts, themeModeScript.test.ts, setup.ts), `playwright.config.ts`, `vitest.config.ts`, recoupé avec `.github/workflows/ci.yml`.
**Fichiers lus** : 18 fichiers de test + ~15 fichiers cibles (login/signup/middleware/cart route/useCart/RPC/Sidebar/ProductCard/CartLineItem/constants…) pour vérification du comportement réel · **Lignes parcourues (approx.)** : ~2 400
**Synthèse** : P0=0 · P1=2 · P2=5 · P3=7

> Méthodo : j'ai exécuté `npx vitest run` (19/19 verts), `npx tsc --noEmit` (0 erreur), et recoupé chaque assertion contre le code réel + la DB live (`execute_sql` SELECT only). Les findings ci-dessous distinguent **tests cassés** (faux positif inverse : échouent alors qu'attendus verts), **faux positifs** (verts alors que le comportement attendu n'est plus celui testé), **trous de couverture**, **flakiness**, **risques d'infra de test**.

## Findings

### [WS37-01] `admin-smoke.spec.ts` est cassé : attend `/admin/product` après login, le code va sur `/admin` — TOUS les tests du fichier échouent — P1
- **Fichier** : `tests/admin-smoke.spec.ts:42` (`waitForURL(/\/admin\//)`), `:49` (`toHaveURL(/\/admin\/product/)`)
- **Catégorie** : bug
- **Constat** : Le commit `ea67dc9` (2026-06-04) a changé `ADMIN_HOME_PATH` de `/admin/product` → `/admin` (`src/lib/constants.ts:18`) ; `login/page.tsx:106` pousse désormais `redirectPath = … ?? (isAdmin ? ADMIN_HOME_PATH : '/')` = `/admin` (pas de trailing slash, `next.config.ts` n'a pas `trailingSlash`). Or :
  - `loginAdmin()` (helper appelé par **les 4+ tests** via `beforeEach`-like) fait `page.waitForURL(/\/admin\//, { timeout: 30_000 })`. La regex exige le sous-chaîne littéral `/admin/` (slash après « admin ») ; l'URL réelle `http://localhost:3000/admin` ne le contient pas → **timeout 30 s → échec du login helper → tout le describe échoue**.
  - Le test 1 (`:49`) asserte en plus `toHaveURL(/\/admin\/product/)` : l'admin atterrit sur le dashboard `/admin` (la page `src/app/admin/page.tsx` existe, aucun redirect vers `/admin/product`), donc faux de toute façon.
  Le commit `ea67dc9` a explicitement mis à jour le test **unitaire** `src/__tests__/auth.test.tsx` (« Tests de redirection mis à jour ») mais **pas** ce spec Playwright (dernier touch `2452693`, antérieur).
- **Impact** : Le seul test qui vérifie qu'un admin peut se connecter et que les 9 pages admin chargent sans 500 est mort. En CI (`npx playwright test --project=chromium`, ci.yml:71) il fait échouer le job e2e (pas de `continue-on-error`). CLAUDE.md affirme « 47 passing + 2 flaky » : incompatible avec la réalité post-`ea67dc9` → soit le suite Playwright n'a pas tourné depuis, soit elle est rouge silencieusement.
- **Reco** : Remplacer `/\/admin\//` par `/\/admin(\/|$)/` (ou `(url) => url.pathname.startsWith('/admin')`) dans `loginAdmin`, et l'assertion `:49` par `toHaveURL(/\/admin(\/|$)/)` (l'admin lande sur `/admin`). Étendre la liste `expectedHrefs` (cf. WS37-08).
- **Confiance** : haute

### [WS37-02] Le job e2e CI écrit en base de PRODUCTION et dépend de secrets non configurés — P1
- **Fichier** : `.github/workflows/ci.yml:46-75` ; `tests/_helpers/test-users.ts:6` (`loadEnv('.env.local')`) + `:46` (`admin.auth.admin.createUser`) ; `tests/reservation.spec.ts:29`, `tests/admin-smoke.spec.ts:26`
- **Catégorie** : sécurité / data / dette
- **Constat** : (a) Il n'existe qu'un seul projet Supabase (`adxpoxcynrpnbbxnncsk`, prod). `test-users.ts` lit `.env.local` / `SUPABASE_SERVICE_ROLE_KEY` → **les tests créent de vrais users `auth.users` + profils + réservations dans la prod** (`createTestUser`, `create_reservation`). Le commentaire « lecture seule sur prod » (`admin-smoke.spec.ts:9`) est faux : `reservation.spec.ts` et `admin-smoke.spec.ts` **écrivent**. (b) Le job e2e (ci.yml:64-75) injecte `secrets.SUPABASE_SERVICE_ROLE_KEY` ; or CLAUDE.md « Reste à faire » liste « Playwright CI secrets (configurer pour les tests E2E en CI) » → s'ils ne sont pas posés, le build (ci.yml:62) reçoit des env vides et toute la suite tape un site sans Supabase → échecs en cascade qui bloquent le workflow (`needs: ci`, pas de `continue-on-error`).
- **Impact** : Risque de pollution prod (users de test, réservations orphelines si un run crashe), et CI e2e probablement rouge/instable sur chaque PR (ou jamais vraiment exécuté). Un run e2e parallèle (local + CI) sur la même prod peut se marcher dessus (unicité réservation active par user, buckets rate-limit partagés).
- **Reco** : Faire tourner l'e2e contre une **branche Supabase éphémère** (ou un projet de test dédié) ; au minimum documenter le risque et gater le job e2e derrière la présence des secrets (`if: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY != '' }}`). Câbler un `globalTeardown` qui appelle `cleanupStaleTestUsers` (cf. WS37-03).
- **Confiance** : haute (DB vérifiée : un seul projet ; secrets non vérifiables d'ici mais cohérent avec la doc)

### [WS37-03] `cleanupStaleTestUsers` défini mais JAMAIS appelé — filet de sécurité anti-fuite inerte — P2
- **Fichier** : `tests/_helpers/test-users.ts:84-108` ; `playwright.config.ts` (absence de `globalSetup`/`globalTeardown`)
- **Catégorie** : dette / data
- **Constat** : `cleanupStaleTestUsers()` (purge des `playwright+*@farmau.test` > 1 h) n'est référencé nulle part (`grep -rn cleanupStaleTestUsers tests/ src/` → seule la définition). `playwright.config.ts` n'a ni `globalSetup` ni `globalTeardown`. Le cleanup ne repose donc QUE sur les `afterEach`/`afterAll` par-test — qui ne s'exécutent pas si un test crashe hard (OOM Turbopack, kill CI). Sa docstring (« Utile en bootstrap de session si un test précédent a crashé ») décrit un usage qui n'existe pas.
- **Impact** : En cas de crash mid-run, des users de test s'accumulent en prod sans purge automatique. (État live au moment de l'audit : 0 user `playwright+%@farmau.test` résiduel → le cleanup par-test marche pour les runs propres, mais le filet annoncé est absent.)
- **Reco** : Ajouter `globalSetup: './tests/_helpers/global-setup.ts'` qui appelle `cleanupStaleTestUsers()` au démarrage de la suite, OU supprimer la fonction si on assume le cleanup par-test. Ne pas laisser une fonction « de sécurité » morte.
- **Confiance** : haute

### [WS37-04] `npm run test` (sans `--project`/`--workers`) lance les 5 projets navigateurs en parallèle → 5× créations prod + OOM dev — P2
- **Fichier** : `package.json:13` (`"test": "playwright test"`) ; `playwright.config.ts:3-8` (`fullyParallel: true`, 5 projets), `:43-48` (webServer dev = `npm run dev`)
- **Catégorie** : dette / perf / data
- **Constat** : Le script `test` n'impose ni projet ni workers. `playwright test` exécute donc **chromium + firefox + webkit + Mobile Chrome + Mobile Safari** × tous les specs, `fullyParallel` + workers = nb CPU en dev. Conséquences : `admin-smoke` crée un admin **par projet** (×5) et `reservation` un user **par test × projet** dans la prod ; et 5 navigateurs en cold-compile Turbopack saturent Node (le commentaire `footer-links.spec.ts:14-16` constate déjà que « la version parallèle crashait Node »). Les scripts fiables (`test:smoke`, `test:auth`) forcent `--project=chromium --workers=1` ; le script générique `test` est en pratique inutilisable/dangereux et n'est jamais utilisé par la CI (qui passe `--project=chromium`).
- **Impact** : Quiconque tape `npm run test` pollue la prod ×5 et risque de planter sa machine. Couverture cross-browser annoncée par les 5 projets jamais réellement obtenue (CI = chromium only).
- **Reco** : Soit aligner `test` sur `--project=chromium --workers=1` (cohérent avec CI), soit retirer les 4 projets non utilisés de `playwright.config.ts` (firefox/webkit/mobile ne tournent jamais) pour ne pas suggérer une couverture inexistante. Si le cross-browser est voulu, le réserver à un script explicite contre un env de test.
- **Confiance** : haute

### [WS37-05] Trou de couverture : open-redirect login/signup non testé en intégration, et signup utilise un check plus faible que `safeRedirectPath` — P2
- **Fichier** : `src/__tests__/safeRedirect.test.ts` (helper testé en isolation) ; `tests/`+`src/__tests__/` (aucun test de wiring) ; cible : `src/app/[locale]/(auth)/signup/page.tsx:134-138`
- **Catégorie** : sécurité / logique-métier (trou de couverture)
- **Constat** : `safeRedirect.test.ts` couvre bien `safeRedirectPath`/`safeRedirectOr` (6 cas, verts). Mais **aucun test ne prouve que login/signup appellent réellement ce helper avant `router.push`**. Or `login/page.tsx` l'utilise (`:105`), tandis que **`signup/page.tsx:136` ré-implémente un check maison plus faible** : `nextParam.startsWith('/') && !nextParam.startsWith('//')`. Cette garde laisse passer `/\evil.com` (backslash trick : commence par `/`, pas par `//`) → `router.push('/\evil.com')`, qu'un navigateur peut traiter comme protocol-relative (open-redirect). `safeRedirectPath` bloque explicitement ce vecteur (`safeRedirect.test.ts:16` `'/\\evil.com' → null`), mais signup ne l'emploie pas. L'audit « Lanjo » (mémoire) listait l'open-redirect login comme finding historique : il est fermé côté login, **rouvert côté signup**, et non couvert par un test.
- **Impact** : Régression de sécurité non détectable par la suite : un futur changement du wiring login/signup ne casserait aucun test ; le vecteur `?next=/\evil.com` sur `/signup` est exploitable aujourd'hui.
- **Reco** : (1) Faire passer signup par `safeRedirectPath` (corrige le bug — relève de WS auth). (2) Ajouter un test d'intégration login ET signup qui injecte `?next=//evil.com` / `?next=/\evil.com` et asserte que `router.push` reçoit `/admin`/`/` et **jamais** la cible externe (le mock `mockPush` est déjà en place dans `auth.test.tsx`).
- **Confiance** : haute

### [WS37-06] Trou de couverture : sur-vente panier (POST cumulatif) non testée — le test cart valide seulement +1 / stepper — P2
- **Fichier** : `tests/cart.spec.ts:36-86` (couvre add 1, stepper→2, persist) ; cible : `src/app/api/cart/route.ts:197-203` + RPC `add_to_cart` (`supabase/migrations/20260519092026…`)
- **Catégorie** : logique-métier (trou de couverture)
- **Constat** : Le POST `/api/cart` valide `(product.stock ?? 0) < quantity` où `quantity` est le **delta entrant**, puis `add_to_cart` fait `cart_items.quantity + EXCLUDED.quantity` (cumul). Donc avec stock=50 : 50 POST de qty=1 (chaque check `1 < 50` passe) → 50 en panier, puis un POST qty=50 (`50 < 50` faux → passe) → cumul = 100 > stock. **La quantité cumulée n'est jamais re-validée contre le stock.** Le seul test panier monte à 2 via PATCH (quantité absolue, correctement bornée `:281`). Le cas POST-cumulatif-au-delà-du-stock n'est pas couvert.
- **Impact** : Sur-réservation possible (panier > stock disponible) non détectée par les tests ; combiné au click-&-collect, un client peut « réserver » plus que le stock.
- **Reco** : Ajouter un test API (`page.request.post('/api/cart')` répété, ou direct) prouvant qu'un cumul dépassant le stock est refusé (400). Le correctif côté route (valider `existant + delta`) relève du WS panier ; ici on documente le trou de test.
- **Confiance** : haute (mécanique POST/RPC vérifiée ligne par ligne)

### [WS37-07] Trous de couverture : aucun test pour super_admin, mass-assignment produit/role, XSS blog, merge panier A→B, appearance/blog/newsletter — P2
- **Fichier** : `tests/` + `src/__tests__/` (recherche exhaustive `grep -niE "super_admin|mass|xss|dompurify|merge|appearance|blog|newsletter|preferences|reset"` → 0 test pertinent)
- **Catégorie** : sécurité / logique-métier (trou de couverture)
- **Constat** : Les flux les plus sensibles du projet n'ont **aucun** test, unitaire ou e2e :
  - **Hiérarchie super_admin** : garde-fous `requireSuperAdmin` (anti auto-modification, anti-modification d'un autre super_admin) — 0 test.
  - **Mass-assignment** : `PATCH /api/admin/users/[id]` (`{ isAdmin, role }`) super-admin-only — 0 test prouvant qu'un admin simple ne peut pas se promouvoir.
  - **XSS blog** : sanitization `isomorphic-dompurify` du `post.body` — 0 test (un payload `<script>`/`<img onerror>` n'est jamais vérifié).
  - **Merge panier identité A→B** : `useAuth` + `merge_anon_cart_to_user` — `reservation.spec.ts` exerce le merge happy-path d'**un** user, mais jamais le cas « cookie cart_id de A réclamé par session B » (vol de panier).
  - **Appearance API**, **blog CRUD**, **newsletter double opt-in / confirm** : 0 test.
- **Impact** : Ces surfaces correspondent exactement aux lentilles sécurité du brief (mass-assignment, IDOR, XSS). Une régression sur l'une d'elles passerait inaperçue. La suite donne une fausse impression de filet de sécurité (smoke « la page charge ») alors que les invariants d'autorisation/sécurité ne sont pas testés.
- **Reco** : Prioriser au minimum 3 tests d'intégration : (a) admin simple → `PATCH /api/admin/users/[id] {role:'super_admin'}` → 403 ; (b) `POST /api/admin/posts` avec body XSS → `GET /blog/[slug]` ne contient pas le script ; (c) merge : A ajoute au panier, B se connecte avec le cookie de A → le panier de A ne fuit pas chez B.
- **Confiance** : haute

### [WS37-08] `admin-smoke` « Sidebar liste tous les liens » n'en vérifie que 9/14 et le test i18n « Bascule » ne bascule pas — P3
- **Fichier** : `tests/admin-smoke.spec.ts:53-72` ; `tests/i18n.spec.ts:9-18`
- **Catégorie** : dette (assertion faible / mislabel)
- **Constat** : (a) Le test nommé « Sidebar liste **tous** les liens des sections admin » n'asserte que `product/marques/tags/stock/reservations/messages/users/newsletter/settings` (9) ; la sidebar réelle (`src/components/admin/dashboard/Sidebar.tsx:81-118`) expose en plus `annonce`, `blog`, `apariencia`, `admins` (14 au total) — non vérifiés. (b) `i18n.spec.ts` « Bascule FR → ES → EN » fait 3 `page.goto('/xx/catalogue')` directs et vérifie `html[lang]` ; il **n'actionne jamais le `LocaleSwitcher`** (le vrai composant, qui doit préserver route+query). Le nom « Bascule » suggère un switch UI non testé.
- **Impact** : Faux sentiment de couverture (un lien sidebar cassé parmi les 5 non testés, ou un `LocaleSwitcher` qui perd la route, passeraient verts).
- **Reco** : Compléter `expectedHrefs` aux 14 liens ; renommer le test i18n en « SSR lang par locale » ou ajouter un vrai clic sur le switcher avec vérif de préservation de la route.
- **Confiance** : haute

### [WS37-09] Commentaire `gotoCatalogueReady` faux : prétend que les produits catalogue ont stock=0 — contredit par la DB (tous à 50) — P3
- **Fichier** : `tests/cart.spec.ts:14-19` (et `reservation.spec.ts:40-46` même logique)
- **Catégorie** : dette (dérive de doc)
- **Constat** : Le commentaire justifie l'usage de la home par « les 349 autres en catalogue ont stock=0 et /api/cart renvoie 400 ». Vérifié en base live : **les 353 produits actifs sont tous à stock=50** (min=max=50, 0 produit à stock 0). La justification est périmée : utiliser la home reste correct (les 4 `is_featured` y sont), mais le « pourquoi » est faux et trompeur.
- **Impact** : Un mainteneur pourrait croire que le catalogue n'est pas ajoutable au panier et bâtir un mauvais correctif, ou ne pas oser tester l'add depuis `/catalogue`.
- **Reco** : Corriger le commentaire (« on prend la home car `.first()` y est garanti `is_featured`+visible ; tous les produits ont du stock »). Accessoirement, aucun test n'exerce le quick-add hover depuis `/catalogue` — petit trou.
- **Confiance** : haute (DB vérifiée)

### [WS37-10] Commentaires/noms de tests faisant référence à `profiles.is_admin` (colonne droppée) — P3
- **Fichier** : `tests/admin-smoke.spec.ts:11` (docstring) ; `src/__tests__/auth.test.tsx:155` (nom de test « (table profiles) »)
- **Catégorie** : dette (dérive de doc)
- **Constat** : (a) La docstring d'`admin-smoke` dit « Crée un user … promu admin (**admin_users + profiles.is_admin**) » ; or `createTestUser` (`test-users.ts:61-67`) n'insère QUE dans `admin_users`, et la colonne `profiles.is_admin` a été **droppée** (migration `20260523104708` ; vérifié : `information_schema.columns` ne la liste plus). (b) Le test unitaire `auth.test.tsx:155` s'appelle « redirige vers /admin pour un utilisateur admin (**table profiles**) » mais exerce en réalité le chemin RPC `is_user_admin` (`mockRpc.mockResolvedValueOnce({ data: true })`, `:167`) — aucun accès `profiles`.
- **Impact** : Confusion : un lecteur croit que le système lit encore `profiles.is_admin`. Test toujours vert (le comportement est bon), seul le label ment.
- **Reco** : Docstring → « admin_users uniquement » ; renommer le test « (via RPC is_user_admin) ».
- **Confiance** : haute

### [WS37-11] Mocks `mockReplace`/`mockBack` morts dans `auth.test.tsx` — P3
- **Fichier** : `src/__tests__/auth.test.tsx:7-8` (déclaration), `:17-18` + `:75-76` (wiring router)
- **Catégorie** : dette (code mort de test)
- **Constat** : `mockReplace` et `mockBack` sont déclarés et branchés dans les deux mocks `useRouter`, mais **jamais assertés** (login/signup n'appellent que `router.push`). `grep` → 6 occurrences, toutes du wiring, 0 `expect(mockReplace…)`.
- **Impact** : Bruit ; suggère faussement que `replace`/`back` sont des chemins testés.
- **Reco** : Retirer `mockReplace`/`mockBack` (ou un seul mock router partagé), garder `push`/`get`.
- **Confiance** : haute

### [WS37-12] Doc « vitest 8/8 » périmée : il y a 19 tests unitaires — P3
- **Fichier** : `CLAUDE.md` (multiple, ex. ligne « npm run test:unit … 8/8 ») vs réalité ; `package.json:17` (`"test:unit": "vitest"`)
- **Catégorie** : dette (dérive de doc) + DX
- **Constat** : `vitest run` exécute **19 tests** (themeModeScript 2, safeRedirect 6, rateLimit 3, auth 8) répartis sur 4 fichiers, tous verts. CLAUDE.md répète « 8/8 tests passent » (état d'avant l'ajout de safeRedirect/rateLimit/themeModeScript). De plus, `"test:unit": "vitest"` lance le **mode watch** en TTY local (un dev attendant un one-shot reste bloqué) ; la CI contourne avec `npm run test:unit -- --run` (ci.yml:38).
- **Impact** : Doc trompeuse ; friction DX (watch inattendu).
- **Reco** : Mettre à jour la doc (19 tests). Optionnel : `"test:unit": "vitest run"` + `"test:unit:watch": "vitest"` pour un défaut non-bloquant.
- **Confiance** : haute

### [WS37-13] `setup.ts` : mock Supabase trop partiel (chaînes manquantes) → faux positifs silencieux si réutilisé — P3
- **Fichier** : `src/__tests__/setup.ts:74-97`
- **Catégorie** : dette
- **Constat** : Le mock global `@/lib/supabaseClient` ne stub que `select().eq().single()` et `update().eq()` ; il n'a ni `.maybeSingle()`, ni `.order()`, ni `.insert().select()`, ni `.rpc`. `auth.test.tsx` contourne en redéclarant son **propre** mock complet (avec `rpc`). Tout nouveau test client qui s'appuierait sur le mock global et toucherait une chaîne non stubbée obtiendrait `undefined.eq is not a function` (échec) ou pire, un `vi.fn()` retournant `undefined` interprété comme « 0 row » → assertion faussée.
- **Impact** : Piège pour l'extension de la suite (le brief demande d'ajouter des tests sécurité côté client) ; risque de faux positifs.
- **Reco** : Soit étoffer le mock global en query-builder chaînable complet, soit le retirer et forcer chaque test à mocker explicitement (comme `auth.test.tsx`).
- **Confiance** : moyenne (impact conditionnel à de futurs tests)

## Points positifs (court)
- **`safeRedirect.test.ts` / `rateLimit.test.ts` / `themeModeScript.test.ts`** : excellents tests unitaires, ciblés sur les vraies fonctions, couvrant les vecteurs d'attaque (CWE-348 spoof XFF, traversal, protocol-relative, hash CSP déterministe). Ils reflètent fidèlement le code.
- **`data-testid` discipline** : tous les selectors des specs (`add-to-cart-button`, `cart-badge`, `cart-drawer`, `cart-item`, `quantity-*`, `remove-item`, `admin-sidebar`, `product-card`) existent réellement en source — 0 selector orphelin. Bon découplage UI/refacto.
- **Isolation des users de test** : convention de naming `playwright+<ts>-<rand>@farmau.test`, `afterEach`/`afterAll` qui suppriment via service role + cascade FK ; 0 résidu en prod au moment de l'audit.
- **Mitigations de flakiness réfléchies** : attente du `GET /api/cart` avant clic (cart/reservation), `expect.poll` sur le merge, `toPass` sur le heart non-hydraté, re-vérif serveur après reload (régression P0 panier). La cause racine est comprise et commentée.
- **`admin-auth.spec.ts` / `account-auth.spec.ts`** : tests de garde robustes, sans credentials, assertent le `redirectedFrom` exact — fiables et rapides.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `signup/page.tsx:136` : check de redirection maison plus faible que `safeRedirectPath` (laisse passer `/\evil.com`) → open-redirect (WS auth).
- `api/cart/route.ts:197-203` : la validation de stock au POST ignore la quantité déjà au panier → sur-vente cumulative (WS panier).
- `CartDrawer.tsx:53-68` : l'`<aside>` du drawer est toujours monté (translate-x-full) → `[data-testid="cart-item"]` présent même drawer fermé ; `toBeVisible()` sur un élément hors-écran peut induire en erreur (WS UI/cart).
- `auth.test.tsx:84` + `login/page.tsx:84` : l'admin via `app_metadata.role` n'est jamais émis par le système (admin_users est la SoV) — chemin probablement mort (WS auth).
- `useCart.ts:78` placeholder `name: 'Chargement...'` en dur (non i18n) dans l'optimistic add (WS i18n/cart).

## Zones non couvertes / à re-vérifier humainement
- **État réel du job e2e en CI** : impossible de voir d'ici si `secrets.SUPABASE_*` sont posés. Vérifier l'onglet Actions du repo : si rouge/skippé, WS37-02 est confirmé en P1 opérationnel.
- **Flakiness `cart Suppression` / `wishlist-anon`** : non reproduite ici (pas d'exécution e2e dans cet audit). Cause probable = timing optimistic/hydratation Turbopack (mitigée par `toPass`/waits), pas une assertion fausse. À confirmer par un run unifié `npm run test --project=chromium`.
- **Couverture cross-browser** : les projets firefox/webkit/mobile sont déclarés mais jamais lancés (CI = chromium). Décider s'ils doivent être supprimés ou réellement exécutés.
- **Comportement exact de `waitForURL(/\/admin\//)` vs `/admin`** confirmé par lecture (trailingSlash absent, push `/admin`) ; une exécution e2e réelle lèverait tout doute résiduel sur WS37-01.
