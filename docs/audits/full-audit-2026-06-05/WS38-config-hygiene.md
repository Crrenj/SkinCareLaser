# WS38 — Config, hygiène repo, docs

**Périmètre** : `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.claude/settings.json`(+`.local`), `.github/workflows/ci.yml`, `.husky/*`, `.gitignore`, `.env.local.example`, `.nvmrc`, `README.md` ; cohérence `CLAUDE.md` / `docs/HANDOFF.md` / `docs/audits/INDEX.md` vs réalité du code/DB. **Sujet exclusif : `venv/` commité.**
**Fichiers lus** : 18 · **Lignes parcourues (approx.)** : ~900 (config) + scans repo (1502 fichiers trackés, dont 1010 venv)
**Synthèse** : P0=0 · P1=2 · P2=4 · P3=6

## Findings

### [WS38-01] `venv/` (1010 fichiers Python, 491 `.pyc`) commité, non ignoré, sans aucune raison d'être — P1
- **Fichier** : `venv/**` (1010 fichiers) ; `.gitignore` (absence d'entrée `venv/`) ; ajouté commit `72a2029` (2025-07-02)
- **Catégorie** : dette | sécurité (mineure) | archi
- **Constat** : Un virtualenv Python 3.12 complet est versionné : **1010 fichiers = 67,2 % de tous les fichiers trackés du repo** (1010/1502), dont **491 binaires `.pyc`** (churn binaire pur). Il ne contient que `pip 23.2.1` (venv vierge, zéro paquet projet). Or il n'existe **aucun `.py` hors venv**, **aucun `requirements.txt`**, **aucun `pyproject.toml`** dans le repo : projet 100 % Node/Next.js → ce venv n'a **aucune fonction**. Il n'est même pas dans `.gitignore` (`git check-ignore venv/` → exit 1). Il est par nature **inutilisable ailleurs** : `pyvenv.cfg` et `bin/pip`/`bin/activate` codent en dur `/Users/juan/Documents/skincarelaser/venv` + un symlink absolu `/Library/Frameworks/Python.framework/...` (machine du dev uniquement).
- **Impact** : (1) gonfle l'historique git de façon permanente et alourdit clones/CI ; (2) **fuite d'info mineure** : le chemin home absolu du développeur (`/Users/juan/Documents/skincarelaser/`) est publié dans `pyvenv.cfg` (ligne `command =`), `bin/pip` (shebang), `bin/activate` (l.45/48) ; (3) bruit massif pour tout outil qui scanne les fichiers trackés (dependabot, gitleaks, audits) ; (4) confusion : laisse croire à un composant Python du stack. Aucun secret réel trouvé (les seuls hits `token/auth/password` sont du code source pip interne).
- **Reco** : `git rm -r --cached venv/` + ajouter `venv/` (et idéalement `*.pyc`, `__pycache__/`, `.venv/`) à `.gitignore`. Optionnel mais recommandé : purge de l'historique (`git filter-repo`) puisque le contenu est inutile et expose le chemin local. Supprimer le dossier sur disque (15 Mo) — il n'est référencé par aucun script (`scripts/` est 100 % `.cjs`/`.js`).
- **Confiance** : haute

### [WS38-02] Dépendances avec vulnérabilités connues (2 critiques, 2 hautes) — P1
- **Fichier** : `package.json:53-72` (devDependencies) + arbre transitif (`package-lock.json`)
- **Catégorie** : sécurité | dette
- **Constat** : `npm audit` remonte **8 vulnérabilités (2 critical, 2 high, 4 moderate)** :
  - **CRITICAL `vitest <4.1.0`** (projet : `^3.2.4`) — GHSA-5xrq-8626-4rwp : le serveur Vitest UI permet lecture/exécution de fichier arbitraire. Surface dev/CI uniquement, mais réelle. Fix = major (`vitest@4`).
  - **CRITICAL `happy-dom <=20.8.8`** (via devDep test) — exécution de code lors du parsing. Dev/CI. Fix = major (`happy-dom@20.10.1`).
  - **HIGH `picomatch <=2.3.1`** + **HIGH `minimatch <=3.1.3`** — ReDoS / injection de méthode (transitifs de l'outillage). Fix dispo non-breaking (`npm audit fix`).
  - **MODERATE `postcss <8.5.10`** (transitif `next`) — XSS via `</style>` ; **MODERATE `brace-expansion`** ; chaîne `next`/`next-intl` tirée par postcss.
- **Impact** : surface principalement build/CI (vitest/happy-dom ne tournent pas en prod), mais 2 critiques non triées affaiblissent la posture. Le job CI `npm audit --audit-level=high` existe mais est en **`continue-on-error: true`** (`ci.yml:29`) → ne bloque jamais, donc ces vulns passent silencieusement.
- **Reco** : `npm audit fix` pour les transitifs non-breaking (picomatch/minimatch/brace-expansion) immédiatement. Planifier la montée `vitest@4` + `happy-dom@latest` (majors, à tester). Pour postcss/next : suivre les releases `next` 15.x (déjà sur caret, un `npm update next` peut suffire). Envisager de retirer `continue-on-error` du job audit une fois les critiques résolues.
- **Confiance** : haute

### [WS38-03] `.env.local.example` incomplet — variables runtime réellement lues mais non documentées — P2
- **Fichier** : `.env.local.example:1-14`
- **Catégorie** : dette | logique-métier (onboarding/déploiement)
- **Constat** : Le code lit 10 variables `process.env.*` ; l'exemple n'en documente que 5. **Manquent** :
  - `NEXT_PUBLIC_WHATSAPP_NUMBER` (`src/lib/whatsapp.ts:39`) — **canal principal de coordination des réservations**. Absent → `buildReservationWhatsappLink` (l.87-92) **dégrade silencieusement** : tout lien « confirmer ma réserve » bascule vers `/contact` au lieu de `wa.me/...`. Aucune erreur, juste un flux cœur amoindri sans avertissement.
  - `NEXT_PUBLIC_SITE_URL` (`src/lib/csrf.ts:6`) — base URL pour `getSiteUrl()` (emails Resend, CSRF allowlist). Fallback `VERCEL_URL` puis `https://farmau.do` en dur, donc tolérant, mais à documenter.
  - `SUPABASE_SERVICE_KEY` — alias accepté (mentionné en commentaire l.7-8 mais pas listé comme variable).
- **Impact** : un opérateur qui déploie un nouvel environnement à partir de `.env.local.example` n'a aucun indice qu'il faut renseigner le numéro WhatsApp → réservations sans handoff WhatsApp en prod, bug invisible. `CLAUDE.md` (section « Variables d'environnement requises ») a la même lacune.
- **Reco** : ajouter `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL` (+ note `VERCEL_URL` auto sur Vercel) à `.env.local.example` et au tableau env de `CLAUDE.md`/`README.md`. Recoupe WS28.
- **Confiance** : haute

### [WS38-04] `next lint` déprécié — cassera en Next.js 16 (vers lequel le caret peut auto-bumper) — P2
- **Fichier** : `package.json:11` (`"lint": "next lint"`) ; `package.json:42` (`"next": "^15.5.18"`)
- **Catégorie** : dette | bug (futur)
- **Constat** : `npm run lint` émet « `next lint` is deprecated and will be removed in Next.js 16 ». `next` est pinné en **caret `^15.5.18`** → un `npm install`/`npm update` tirera n'importe quelle 15.x (et `package-lock` régénéré pourrait franchir vers 16 si publié). Au passage à Next 16, `next lint` disparaît → `npm run lint`, le hook lint-staged (`eslint --fix`) reste OK mais le script `lint` du CI (`ci.yml:32`) **échoue**.
- **Impact** : dette de migration certaine ; CI rouge dès la bascule Next 16. Aujourd'hui la commande **fonctionne** et confirme **0 warning** (claim `CLAUDE.md` exact).
- **Reco** : migrer vers l'ESLint CLR (`npx @next/codemod@canary next-lint-to-eslint-cli .` → `"lint": "eslint ."`). Et/ou pinner `next` plus strictement (`~15.5.x`) tant que la migration n'est pas faite.
- **Confiance** : haute

### [WS38-05] Dérive documentaire CLAUDE.md vs réalité (compteurs périmés) — P2
- **Fichier** : `CLAUDE.md` (sections « API », « État BDD actuel ») ; recoupé contre `find src/app/api/admin` et SELECT live DB
- **Catégorie** : dette (doc)
- **Constat** : Écarts factuels entre `CLAUDE.md` et le code/DB réels :
  - **Routes admin** : CLAUDE.md affirme « **22 routes** service-role » et « API : `src/app/api/admin/*` — **22 routes** ». Réel : **28 fichiers `route.ts`** sous `src/app/api/admin/` (38 routes API au total). Routes non listées dans la doc : `admins/`, `banners/stats/`, `home-layout/`, `products/with-tags/`.
  - **Admins** : doc dit « 1 admin » → DB live : **2** `admin_users`.
  - **Blog** : doc dit « 0 posts (table prête) » → DB live : **4** `posts` (le seed `seed-example-content` a tourné).
  - (Vérifiés **exacts** : 353 produits actifs, 1 prix distinct = placeholder 100 DOP, 13 brands, 52 ranges, 299 product_images, 36 tags, 844 product_tags.)
- **Impact** : `CLAUDE.md` est explicitement la source d'onboarding des futures instances ; des compteurs faux (surtout « 22 routes » alors qu'il y en a 28, et « 0 posts » alors que des posts existent) induisent en erreur sur le périmètre à sécuriser/tester.
- **Reco** : rafraîchir les compteurs (28 routes admin, 2 admins, 4 posts) ou — mieux — retirer les chiffres volatils de `CLAUDE.md` et pointer vers une requête. Idéalement automatiser un encart « état DB » régénéré.
- **Confiance** : haute

### [WS38-06] CI : étapes de sécurité présentes mais non bloquantes + secret scan informationnel — P2
- **Fichier** : `.github/workflows/ci.yml:27-29` (npm audit), `:85-98` (gitleaks)
- **Catégorie** : sécurité (CI) | dette
- **Constat** : Le workflow a de bons réflexes (audit deps + gitleaks), mais **les deux sont `continue-on-error: true`** (l.29 et l.96). `npm audit --audit-level=high` ne fait donc jamais échouer la CI malgré les 2 vulns critiques actuelles (cf. WS38-02). `gitleaks` ne bloque pas un secret commité. Par ailleurs le job `ci` (build) injecte des placeholders Supabase (l.43-44) — OK pour un build statique — mais le **build sans `SUPABASE_SERVICE_ROLE_KEY`** ne couvre pas les chemins service-role ; ils ne sont validés que dans le job `e2e` (qui dépend de secrets repo, donc skippé sur les forks/PR externes).
- **Impact** : les garde-fous existent mais sont décoratifs — un secret commité ou une vuln critique passent le merge sans rien casser. Faux sentiment de sécurité.
- **Reco** : pour gitleaks, retirer `continue-on-error` (le commentaire le dit déjà : « Durcir en retirant ce flag ») — un compte perso GitHub a la licence gratuite. Pour `npm audit`, une fois WS38-02 traité, retirer le flag ou abaisser le seuil à `--audit-level=critical` bloquant.
- **Confiance** : moyenne (le choix « informationnel » est documenté/assumé ; je le signale car il neutralise des contrôles sécurité réels)

### [WS38-07] `db/catalog.json` (data générée) commité — P3
- **Fichier** : `db/catalog.json` (tracké) ; `.gitignore` (pas d'entrée)
- **Catégorie** : dette
- **Constat** : `db/catalog.json` est versionné. C'est un **artefact généré** par `npm run parse-pdfs` (le README l.37 le qualifie « déjà fait, idempotent »). Le brief le range avec les fichiers générés que les autres agents ignorent, confirmant son statut d'output.
- **Impact** : faible — fichier texte, sert de fallback/source de seed sans les PDF (gitignorés). Mais c'est de la data dérivée versionnée → divergence possible vs `contenu_bd/` et churn de diff illisible à chaque re-parse.
- **Reco** : décision consciente à acter — soit l'assumer comme « snapshot seed » (le documenter ainsi dans `CLAUDE.md`), soit l'ignorer et le régénérer. À ce stade, le garder est défendable (PDF sources non versionnés) ; je le note pour traçabilité, pas comme défaut net.
- **Confiance** : haute (sur le fait) / basse (sur la reco — dépend d'une intention)

### [WS38-08] `images.remotePatterns` totalement permissif (`https://**`) — P3
- **Fichier** : `next.config.ts:89-95`
- **Catégorie** : sécurité (mineure) | perf
- **Constat** : `remotePatterns` autorise **n'importe quel hôte HTTPS** (`hostname: '**'`, `pathname: '/**'`). Le commentaire suggère pourtant de restreindre à Supabase Storage/Cloudinary. Toutes les images du projet viennent en pratique de Supabase Storage (`*.supabase.co`).
- **Impact** : faible. Le proxy `/_next/image` de Next devient un **open image proxy** (SSRF-léger / abus de bande passante : n'importe qui peut faire optimiser des images arbitraires via votre domaine). Aussi : `img-src ... https:` dans la CSP (`next.config.ts:68`) est cohérent mais tout aussi large.
- **Reco** : restreindre à `{ protocol: 'https', hostname: 'adxpoxcynrpnbbxnncsk.supabase.co', pathname: '/storage/v1/object/public/**' }` (+ tout CDN réellement utilisé).
- **Confiance** : moyenne

### [WS38-09] Drift mineur : « SSG » dans CLAUDE.md alors que les pages publiques sont en ISR — P3
- **Fichier** : `CLAUDE.md` (sections thèmes/SEO, « pages `[locale]` restent SSG ») vs `src/app/[locale]/**` (`export const revalidate = …`)
- **Catégorie** : dette (doc)
- **Constat** : CLAUDE.md répète « SSG » / « pages restent SSG ». En réalité les pages publiques déclarent `revalidate` (60s catalogue/produit/blog, 300s marques/besoins, 86400s éditoriales) → ce sont des pages **ISR**, pas du SSG pur. Le point de fond du doc (le thème via `unstable_cache` ne force pas `dynamic`) reste **correct** — c'est juste le vocabulaire « SSG » qui est imprécis.
- **Impact** : négligeable, terminologique. Aucune incidence runtime.
- **Reco** : remplacer « SSG » par « ISR/statique régénéré » dans CLAUDE.md pour la précision.
- **Confiance** : haute

### [WS38-10] Le chemin home du dev fuit aussi hors venv (origins/commentaires) — P3
- **Fichier** : `venv/pyvenv.cfg`, `venv/bin/activate:45,48`, `venv/bin/pip` (shebang)
- **Catégorie** : sécurité (info disclosure, mineure)
- **Constat** : Sous-cas de WS38-01 isolé pour visibilité : `/Users/juan/Documents/skincarelaser/` est publié en clair dans plusieurs fichiers venv trackés. (Hors venv, aucun chemin absolu home n'est versionné — vérifié.)
- **Impact** : très faible (révèle l'OS, le nom d'utilisateur `juan`, l'arborescence locale). Disparaît avec la suppression du venv (WS38-01).
- **Reco** : résolu par WS38-01.
- **Confiance** : haute

### [WS38-11] `.husky/pre-commit` minimal mais OK ; aucune étape de typecheck/test au commit — P3
- **Fichier** : `.husky/pre-commit:1` (`npx lint-staged`) ; `package.json:74-76`
- **Catégorie** : dette
- **Constat** : Le hook ne fait que `lint-staged` → `eslint --fix --no-warn-ignored` sur les `*.{ts,tsx}` stagés. Pas de `tsc --noEmit`, pas de test. C'est un **choix raisonnable** (rapidité du commit, typecheck couvert par CI). Je le note seulement : un `eslint --fix` auto-modifie les fichiers stagés au commit (effet de bord silencieux sur le contenu commité), sans `prettier` ni vérif de formatage dédiée. `.husky/_` correctement non tracké (seul `pre-commit` l'est) — bonne hygiène.
- **Impact** : nul aujourd'hui. Mention pour exhaustivité.
- **Reco** : aucune action requise ; éventuellement ajouter `tsc --noEmit` au pre-push (pas pre-commit) si on veut un filet supplémentaire.
- **Confiance** : haute

### [WS38-12] `.claude/settings.json` référence des permissions MCP Stripe/Vercel sans rapport avec le projet — P3
- **Fichier** : `.claude/settings.json:16-30` (12 perms `mcp__stripe__*`) + `.claude/settings.local.json` (perms Stripe également)
- **Catégorie** : dette (config)
- **Constat** : Le settings projet (versionné) pré-autorise une douzaine d'outils MCP **Stripe** (`list_products`, `list_prices`, `list_subscriptions`, `list_customers`, `list_invoices`, `list_payment_intents`, `list_disputes`, `list_coupons`, etc.) et Vercel. Or **le projet n'a aucun paiement en ligne** (décision intentionnelle documentée — checkout = placeholder) et aucun `.mcp.json` Stripe (non tracké). Ces permissions sont donc orphelines/sans serveur correspondant.
- **Impact** : nul fonctionnellement (une permission sans serveur MCP est inerte), mais c'est un **résidu trompeur** : laisse croire à une intégration Stripe contraire au stade du projet, et élargit inutilement la surface autorisée si un MCP Stripe était un jour branché.
- **Reco** : retirer les entrées `mcp__stripe__*` du `settings.json` projet (et du `.local`) tant qu'aucun paiement n'est prévu. Garder uniquement les MCP réellement utilisés (supabase read-only, vercel lecture).
- **Confiance** : haute

## Points positifs (court)
- **`.env.local` correctement NON tracké** + ignoré (`git check-ignore` OK) ; `.env*` bien gitignoré avec exception `!.env.local.example`. Aucun secret réel trouvé dans tout le tracké (`.mcp.json`/`.vercel` non versionnés). **Pas de fuite de credentials.**
- **`next.config.ts` solide** : `poweredByHeader: false`, `removeConsole` en prod (garde error/warn), **CSP par hash SHA-256 du script anti-flash** (pas de `unsafe-eval`, pas de nonce → SSG préservé), HSTS, `frame-ancestors 'self'`, `object-src 'none'`. **Ne suppress NI `eslint.ignoreDuringBuilds` NI `typescript.ignoreBuildErrors`** → le build enforce lint + types.
- **`tsconfig` strict** (`strict: true`, `noEmit`, alias `@/*`) ; **lint = 0 warning** confirmé en exécution ; `eslint.config.mjs` honore `^_` et ignore `database.types.ts` (généré).
- **CI complète** (`actions/checkout@v4`, `setup-node` via `.nvmrc` + cache npm, `npm ci`, lint+tsc+vitest+build+e2e, artefact Playwright, **jobs `npm audit` + `gitleaks`**). `engines.node=20.x` == `.nvmrc=20`. `package-lock` lockfileVersion 3, en sync.
- **Hygiène git par ailleurs propre** : aucun artefact `.next/`/`node_modules/`/`playwright-report/`/`test-results/`/`.DS_Store` tracké ; `.husky/_` non versionné. Le venv est l'unique gros défaut d'hygiène.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/lib/whatsapp.ts` contient encore de la logique **livraison payante** (`SHIPPING_COSTS`, zones santo_domingo/interior) alors que le projet est click-&-collect only (WS « tunnel/réservation » à confirmer — peut être du code mort).
- `.env.local.example` documente `RESEND_FROM_EMAIL` mais pas le fallback expéditeur si absent — à vérifier côté `src/lib/resend.ts` (WS « newsletter/email »).
- `CLAUDE.md` mentionne `mark_message_as_read` droppée + « regénérer `database.types.ts` » comme TODO — vérifier que les types générés sont à jour (WS DB/types).

## Zones non couvertes / à re-vérifier humainement
- **Purge historique du venv** : `git rm --cached` enlève le suivi mais l'historique garde les 1010 fichiers (et le chemin home). Décider si un `git filter-repo` (réécriture d'historique, impacte les clones/forks) est justifié — arbitrage humain.
- **`db/catalog.json` tracké** : statut « snapshot seed assumé » vs « artefact à ignorer » = décision produit, pas tranchable en audit.
- **Severité réelle des vulns vitest/happy-dom** : critiques côté outillage dev, surface prod nulle ; la priorisation du major-bump dépend de l'appétence risque de l'équipe.
- **`next lint` → ESLint CLI** : la migration est mécanique mais doit être testée (le codemod peut changer le set de règles effectif) ; à valider que « 0 warning » tient après bascule.
