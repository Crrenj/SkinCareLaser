# Audit Developer Experience

> Repo : `/Users/juan/Documents/skincarelaser` (FARMAU — Next.js 15 / React 19 / Supabase / Tailwind 4)
> Date : 2026-05-19
> Auditeur : Developer Experience review

## Synthèse

**Note globale : 6.0 / 10** — Stack moderne (Next 15 + Turbopack), TypeScript strict, ESLint configuré, 0 erreur de compilation. Mais la DX se dégrade sur les fondamentaux d'un projet en équipe : pas de CI, pas de pre-commit hooks, pas de `.env.example`, couverture de tests anecdotique (1 fichier unit + 1 fichier E2E avec auth commentée), et 73 warnings de lint qui restent ignorés. Le `console.error` dispersé (120 occurrences) sert d'unique outil d'observabilité côté serveur.

### Top 3 quick wins DX

1. **Ajouter `.env.local.example` au repo** (15 min) — Le README y fait référence (`cp .env.local.example .env.local`) mais le fichier n'existe pas. Nouveau dev = onboarding cassé immédiatement.
2. **GitHub Actions CI minimale** (1h) — Workflow `lint + typecheck + vitest` sur PR/push. Zéro coût Vercel, et coupe court à toute régression typescript / test.
3. **Husky + lint-staged sur `pre-commit`** (30 min) — Empêche les 73 warnings ESLint actuels d'augmenter, fait passer `tsc --noEmit` localement avant chaque commit. Bonus : enforce le `.gitignore` des fichiers `.env*`.

## État actuel

| Domaine | État | Détail |
|---|---|---|
| **Build** | OK | `next build` (Turbopack en dev), 0 erreur TypeScript (`tsc --noEmit` propre) |
| **Lint** | DÉGRADÉ | ESLint configuré, **73 warnings** (`@typescript-eslint/no-explicit-any`, hooks deps, unused vars, unescaped entities, `<img>` au lieu de `next/image`) — 4 règles downgrade en `warn`, jamais en `error` |
| **TypeScript** | STRICT mais permissif | `strict: true` activé, mais **32 occurrences de `any`** (surtout `catch (error: any)` et casts Supabase), pas de `noUncheckedIndexedAccess`, pas de génération automatique des types Supabase |
| **Tests unit** | FAIBLE | 1 fichier (`src/__tests__/auth.test.tsx`, 8 tests, tous OK). Couvre login/signup uniquement. **Aucun test pour : panier, API routes, hooks (`useCart`, `useAuth`), composants admin, middleware** |
| **Tests E2E** | TRÈS FAIBLE | 1 spec Playwright (`tests/cart.spec.ts`) — 6 tests panier guest dont **1 partiellement commenté** (fusion panier post-connexion). Pas de tests sur le flux admin, le catalogue, le checkout, l'auth |
| **CI/CD** | ABSENT | **Pas de `.github/workflows/`**, aucun GitHub Action, GitLab CI ou Vercel pipeline custom |
| **Pre-commit** | ABSENT | Pas de Husky, pas de lint-staged, pas de commitlint — commits possibles avec lint cassé et types invalides |
| **Documentation** | BONNE (root) / DISPERSÉE | `README.md` clair (60 lignes), `CLAUDE.md` excellent (74 lignes d'architecture), `db/README.md` complet. MAIS référence à des fichiers `SOLUTION_*.md` / `GUIDE_*.md` qui n'existent pas (le `CLAUDE.md` mentionne `GUIDE_MIGRATION_TAGS.md`, `GUIDE_ADMIN_PRODUCTS.md`...). README cible un `.env.local.example` qui n'existe pas |
| **Scripts utilitaires** | BONS | 10 scripts dans `scripts/` (`parse-pdfs.cjs`, `seed-import.cjs`, `prices-export/import/default.cjs`, `create-admin-user.js`, `validate-catalog.cjs`, etc.). Bien intégrés à `package.json` |
| **Logging / Observabilité** | NUL | **120 `console.log/error`** dispersés. Pas de logger structuré (winston/pino), pas de Sentry / OpenTelemetry. Aucune corrélation possible des erreurs en production |
| **Env vars** | FRAGILE | `.env.local` versionné par erreur (`.env.local` présent ET dans `.gitignore` via wildcard `.env*` — mais déjà tracké ? à vérifier). **Pas de validation runtime** (zod, t3-env) : les routes échouent en silence ou avec un `console.error('❌ Configuration manquante')` au boot |
| **Type generation Supabase** | NON UTILISÉ | `supabase gen types typescript` jamais exécuté, types DB inférés manuellement → casts `as any` sur les jointures (`stock/route.ts:85,95,96`) |
| **Hot reload / dev** | EXCELLENT | `next dev --turbopack` — rapide, fonctionnel |
| **Monorepo** | NON | 1 `package.json` racine + 1 `scripts/package.json` minimal (juste `{"type":"module"}`). Cohabitation `.cjs` (scripts) / `.ts` (app) propre |

---

## Findings

### 1. `.env.local.example` manquant — Impact: **High**

**Lieu** : racine du repo. Référencé dans `README.md:11` (`cp .env.local.example .env.local`).
**Problème** : Le fichier référencé n'existe pas. Nouveau dev clone le repo, suit le README, échoue immédiatement (`cp: .env.local.example: No such file or directory`). Aucune liste exhaustive des variables nécessaires en un endroit unique : il faut grepper `process.env` dans `src/`. Les routes admin acceptent `SUPABASE_SERVICE_KEY` **OU** `SUPABASE_SERVICE_ROLE_KEY` (cf. `CLAUDE.md:19`), confusion supplémentaire.
**Fix** : Créer un `.env.local.example` listant toutes les variables avec commentaires (voir template plus bas). Aligner `README.md` et `CLAUDE.md` sur un seul nom de variable canonique (recommandation : `SUPABASE_SERVICE_ROLE_KEY`, garder l'alias en code temporairement).

### 2. Aucune CI / GitHub Actions — Impact: **High**

**Lieu** : pas de `.github/workflows/`.
**Problème** :
- Aucune validation automatisée sur PR / push. Le `npm run lint` et `npx tsc` sont laissés à la discipline du dev (et `npx tsc` n'est même pas dans `package.json` — il faut le connaître).
- Les 73 warnings ESLint croissent silencieusement (ils étaient probablement <20 il y a 6 mois).
- Les 8 tests Vitest et 6 Playwright n'ont aucun garde-fou : un commit peut tout casser sans alerte.
- Pas de vérif des secrets accidentellement commités, pas d'audit `npm audit` automatique.
**Fix** : Workflow minimal `ci.yml` qui exécute `npm ci && npm run lint && npx tsc --noEmit && npm run test:unit` à chaque PR + push sur `main`. Voir template plus bas.

### 3. Aucun pre-commit hook — Impact: **High**

**Lieu** : pas de `.husky/`, pas de `lint-staged` dans `package.json`.
**Problème** : N'importe quel `git commit` passe — y compris avec :
- du code TS invalide (puisque `next dev` continue à tourner malgré une erreur de compilation grâce à `incremental: true`),
- des `console.log` oubliés,
- 5 nouveaux `any`,
- une clé Supabase recopiée dans un test.

Le `.gitignore` couvre les `.env*`, mais rien n'empêche de forcer un `git add -f .env.local`.
**Fix** : Husky v9 (zéro-config) + `lint-staged` qui lance `eslint --fix` sur les `.ts/.tsx` touchés et `tsc --noEmit` sur le projet. Voir template plus bas. Bonus : `git secrets` ou `gitleaks` pour bloquer les patterns de clé.

### 4. Couverture de tests insuffisante (8 unit + 6 E2E pour 67 fichiers TS) — Impact: **High**

**Lieu** : `src/__tests__/auth.test.tsx` (uniquement login/signup), `tests/cart.spec.ts` (panier guest, fusion post-connexion **commentée**).
**Problème** : Aucun test sur :
- les **18 routes API admin** (`src/app/api/admin/**/route.ts`) — pourtant porteuses du métier critique (RBAC, RLS bypass via service key, uploads Storage),
- le **middleware** (`src/middleware.ts`) — la garde admin → c'est précisément ce qui se casse en production lors des changements de cookies Supabase,
- les **hooks** (`useCart`, `useAuth`) — toute la logique panier client + auth state,
- le **callback OAuth** (`src/app/auth/callback/page.tsx`),
- les pages admin (CRUD produits, marques, tags, bannières, stock — toutes >500 lignes chacune).

Le test Playwright `Fusion du panier invité avec compte utilisateur` est **commenté à 70%** (`tests/cart.spec.ts:131-142`) — c'est un test fantôme qui passe parce qu'il ne teste rien.
**Fix** :
- Étape 1 (haute valeur, faible coût) : tests Vitest pour `middleware.ts` (mock `createServerClient`, vérifier les 3 cas : pas de session → redirect, pas admin → redirect, admin → next) et pour chacune des routes API (mock Supabase service client, tester 200/401/500).
- Étape 2 : tests Playwright sur le flux admin complet (login → CRUD produit → logout).
- Étape 3 : configurer un seuil de couverture minimum dans `vitest.config.ts` (`coverage: { thresholds: { lines: 50 } }`) et exposer un script `npm run test:unit:coverage`.

### 5. ESLint trop permissif — 73 warnings ignorés — Impact: **Medium**

**Lieu** : `eslint.config.mjs:14-21` downgrade 4 règles importantes en `warn`.
**Problème** :
```js
"@typescript-eslint/no-explicit-any": "warn",
"@typescript-eslint/no-unused-vars": "warn",
"react/no-unescaped-entities": "warn",
"react-hooks/exhaustive-deps": "warn",
```
Les `warn` n'arrêtent pas `next lint` (exit code 0). Résultat : 73 warnings cumulatifs (32 `any`, ~15 unused, ~10 unescaped, ~5 hooks deps, ~7 `<img>` au lieu de `Image`). Quelques warnings hooks deps cachent des bugs réels (cf. `src/hooks/useAuth.ts:25` — `handleUserLogin`, `handleUserLogout` non listés en dépendances : si ces fonctions changent, le `useEffect` ne se re-exécute pas).
**Fix** :
- Soit promouvoir progressivement les règles en `error` après un nettoyage (priorité : `react-hooks/exhaustive-deps` → bugs, et `<img>` → perf LCP).
- Soit ajouter `--max-warnings 0` au script `lint` (durcit immédiatement, force le clean avant nouveau commit).
- Soit ajouter une règle CI qui échoue si le compteur de warnings augmente vs la branche `main`.

Recommandation : `--max-warnings 50` au début (laisse passer l'existant), puis baisser progressivement jusqu'à 0.

### 6. 32 `any` dans `src/`, dont 20 dans `catch (error: any)` — Impact: **Medium**

**Lieu** : toutes les routes API admin + les composants admin + 4 pages admin (cf. liste complète au point 5 supra).
**Problème** : Pattern systématique :
```ts
} catch (error: any) {
  return NextResponse.json({ error: error.message || '...' }, { status: 500 })
}
```
TypeScript 4.4+ type `catch` en `unknown` par défaut (avec `useUnknownInCatchVariables`, activé via `strict: true`). Le `: any` court-circuite cette protection — un `error` peut être `null`, `string`, etc. et `.message` exploser. Les autres `any` cachent les jointures Supabase mal typées (`(range as any)?.brands`) → c'est exactement ce que `supabase gen types typescript` résoudrait.
**Fix** :
- Helper `getErrorMessage(error: unknown): string` (cf. template plus bas) à utiliser dans tous les `catch`.
- Générer les types Supabase : `npx supabase gen types typescript --project-id <id> > src/types/supabase.ts`, importer le type `Database` dans `createClient<Database>()`.

### 7. Logging non structuré (120 `console.log/error`) — Impact: **Medium**

**Lieu** : disséminé dans tout `src/`. Top fichiers : `admin/annonce/page.tsx` (9), `api/admin/banners/route.ts` (8), `admin/marques/page.tsx` (8), `api/cart/route.ts` (7).
**Problème** :
- Aucune corrélation possible en prod (Vercel logs = ligne par ligne, pas d'`request_id`).
- Pas de niveau (`info`/`warn`/`error`/`debug`), pas de contexte structuré (`{userId, route, method}`), pas de redaction des PII.
- Les pages client poussent des `console.error` qui finissent dans la console du navigateur de l'utilisateur final.
- Pas de Sentry → un 500 en production = `vercel logs` à la main, sans stack lisible.
**Fix** :
- Adopter un mini-logger structuré (cf. template plus bas) : `logger.error('contact_message_failed', { userId, error })`.
- Brancher Sentry (gratuit jusqu'à 5k errors/mois) — `@sentry/nextjs` s'intègre en 1 commande (`npx @sentry/wizard@latest -i nextjs`).
- Règle ESLint `no-console: ['error', { allow: ['warn', 'error'] }]` dans `src/` (mais permettre `console.log` dans `scripts/`).

### 8. Pas de validation runtime des env vars — Impact: **Medium**

**Lieu** : `process.env.NEXT_PUBLIC_SUPABASE_URL!` partout (forçage avec `!`), check ad-hoc dans `src/app/api/admin/products/route.ts:9-14`.
**Problème** :
- Le forçage `!` ment au typeur : si la variable manque, `supabaseUrl === undefined`, `createClient(undefined, ...)` crash à runtime au premier appel.
- Le check dans `products/route.ts` se contente d'un `console.error('❌ Configuration manquante')` et continue à exporter un client `null` → toutes les autres routes ne font même pas ce check.
- Aucun feedback à `npm run dev` au boot.
**Fix** : Valider toutes les env vars **au démarrage** via Zod (`src/lib/env.ts`, cf. template plus bas) et importer `env` depuis ce fichier dans tout le code. Échec → throw au boot, pas en production.

### 9. Types Supabase non générés — Impact: **Medium**

**Lieu** : `src/lib/supabaseClient.ts`, `src/lib/supabaseServer.ts`, tous les `createClient` des routes API.
**Problème** : Aucun `createClient<Database>` — donc :
- `supabase.from('products').select('*')` retourne `any[]` au lieu de `Product[]`,
- Les jointures (`product_ranges(range_id, ranges(...))`) forcent les développeurs à caster en `as any` (cf. `api/admin/stock/route.ts:85,95,96`),
- Tout refactor de schéma SQL casse silencieusement le code TS (ex : renommer `product_images.alt` en `alt_text` → 0 erreur de compilation, bug en runtime).
**Fix** : Pipeline `npm run db:types` qui exécute `npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > src/types/supabase.ts`. Faire de cette commande un pré-requis du `prebuild`. Ensuite : `createClient<Database>(url, key)` partout.

### 10. `console.error('❌ ...')` au lieu d'un boot guard — Impact: **Medium**

**Lieu** : `src/app/api/admin/products/route.ts:9-14`, `ranges/route.ts:5-6`, `brands/route.ts:5-7`, etc. (~9 routes admin).
**Problème** : Chaque route admin re-déclare son client service-role, re-check les env vars, et soit log une erreur, soit retourne un 500 dynamique. Code dupliqué × 9. Si demain on veut migrer vers un client unique (ex : `lib/supabaseAdmin.ts`), il faut éditer 9 fichiers.
**Fix** : Créer `src/lib/supabaseAdmin.ts` exportant un client singleton (lazily instantiated, fail-fast si env vars manquantes). Importer partout. Voir template plus bas.

### 11. Documentation interne incohérente : `GUIDE_*.md` référencés mais introuvables — Impact: **Medium**

**Lieu** : `CLAUDE.md:54` mentionne `GUIDE_MIGRATION_TAGS.md`, `src/app/api/admin/products/route.ts:27` redirige le dev vers `GUIDE_ADMIN_PRODUCTS.md`, `CLAUDE.md:66` parle de "many troubleshooting markdown files at the root (`SOLUTION_*.md`, `GUIDE_*.md`, `DOCUMENTATION_*.md`)" — **aucun de ces fichiers n'existe** à la racine (seuls `README.md` et `CLAUDE.md` sont présents).
**Problème** : Soit ces fichiers ont été supprimés et la doc / les messages d'erreur n'ont pas été mis à jour, soit ils n'ont jamais existé et `CLAUDE.md` a été écrit de manière prospective. Dans les deux cas, un nouveau dev qui voit `Consultez GUIDE_ADMIN_PRODUCTS.md` dans un message d'erreur va chercher en vain.
**Fix** :
- Audit du repo : `git log --all --diff-filter=D --name-only -- '*.md' | grep -E '(GUIDE|SOLUTION|DOCUMENTATION)_'` pour voir si ces fichiers existaient.
- Soit restaurer les fichiers pertinents dans `docs/troubleshooting/`, soit supprimer les références dans `CLAUDE.md` + les messages d'erreur. Ne pas laisser ces "fantômes" pointer vers du néant.

### 12. Pas de Prettier (formatting) — Impact: **Low**

**Lieu** : pas de `.prettierrc`, pas de `prettier` dans `devDependencies`.
**Problème** : Indentation et style libres → diffs PR pollués par des changements stylistiques (tabs vs spaces, quotes simples vs doubles, trailing commas...). ESLint Next inclut quelques règles cosmétiques mais ne gère pas le formatting de manière exhaustive.
**Fix** : Ajouter `prettier` + `eslint-config-prettier` (désactive les règles ESLint qui entrent en conflit). Configuration suggérée dans `.prettierrc.json` (cf. template plus bas). Intégrer à `lint-staged`.

### 13. Pas de script `typecheck` ni `format` dans `package.json` — Impact: **Low**

**Lieu** : `package.json:5-21`.
**Problème** : Aucun raccourci pour `tsc --noEmit` (le check de type), `format`, ou un script "tout valider" type `check`. Le dev doit connaître les commandes.
**Fix** : Ajouter :
```json
"typecheck": "tsc --noEmit",
"format": "prettier --write .",
"format:check": "prettier --check .",
"check": "npm run lint && npm run typecheck && npm run test:unit -- --run"
```
Le script `check` devient l'unique commande locale pré-commit et CI.

### 14. Pages admin trop grosses (700+ lignes par page) — Impact: **Low**

**Lieu** : `src/app/admin/product/page.tsx` (703 lignes), `tags/page.tsx` (753), `annonce/page.tsx` (668).
**Problème** : Logique métier, fetch, formulaire et UI dans un même fichier. Difficile à tester, à comprendre, à refactor. Probablement la raison principale des `console.error` (15+ par page) et des `useEffect` mal listés (cf. lint warnings).
**Fix** : Pas un quick win, mais à terme : extraire `useProducts`, `useTags`, etc. dans `src/hooks/admin/`, et les formulaires dans `src/components/admin/forms/`. Permet d'écrire des tests unitaires sur les hooks (qui sont aujourd'hui inaccessibles).

### 15. Dépendances en retard (Supabase JS 2.50 → 2.106) — Impact: **Low**

**Lieu** : `package.json:24-27`.
**Problème** : `@supabase/supabase-js` est à `2.50.0` (sortie juin 2025), la dernière est `2.106.0`. `@supabase/ssr` à `0.6.1` (latest : `0.10.3`). `@supabase/auth-helpers-nextjs` à `0.10.0` (latest : `0.15.0` — d'ailleurs **déprécié en faveur de `@supabase/ssr`**, donc cette dépendance peut probablement être supprimée). `@playwright/test`, `eslint-config-next`, `framer-motion`, `lucide-react` également en retard mineur.
**Fix** :
- Audit `npm outdated` régulier (déjà fait pour cet audit — 18 paquets en retard).
- Souscrire à Dependabot ou Renovate (gratuits sur GitHub).
- Supprimer `@supabase/auth-helpers-nextjs` (legacy) — vérifier qu'aucun import ne reste.

---

## Recommandations prioritaires

1. **Créer `.env.local.example`** (cf. template) — débloquer l'onboarding immédiatement.
2. **Ajouter `.github/workflows/ci.yml`** (cf. template) — lint + typecheck + vitest sur chaque PR.
3. **Installer Husky + lint-staged** (cf. template) — pre-commit qui lance `eslint --fix` et `tsc`.
4. **Ajouter un helper `getErrorMessage(unknown)`** + remplacer les 20 `catch (error: any)` (find/replace facile).
5. **Générer les types Supabase** (`npx supabase gen types typescript ... > src/types/supabase.ts`) et utiliser `createClient<Database>` partout.
6. **Créer `src/lib/env.ts` avec Zod** pour valider les env vars au boot.
7. **Créer `src/lib/supabaseAdmin.ts` singleton** pour dédupliquer les 9 instanciations de service-role client.
8. **Ajouter Sentry** (`npx @sentry/wizard@latest -i nextjs`).
9. **Promouvoir `react-hooks/exhaustive-deps` en `error`** et corriger les 4 cas (bugs potentiels).
10. **Étendre les tests** : 1 fichier de tests par route admin + tests sur `middleware.ts`.
11. **Nettoyer les références fantômes** dans `CLAUDE.md` et les messages d'erreur (`GUIDE_*.md` inexistants).
12. **Ajouter Prettier + scripts `check`, `typecheck`, `format`** dans `package.json`.
13. **Migrer `@supabase/auth-helpers-nextjs` (déprécié) vers `@supabase/ssr` uniquement.**
14. **Découper les pages admin >500 lignes** en hooks + composants.
15. **Configurer Dependabot ou Renovate** pour les mises à jour automatiques.

---

## Templates suggérés

### 1. `.env.local.example`

```bash
# .env.local.example — copier en .env.local et remplir
# ⚠️ ne JAMAIS commiter le .env.local (voir .gitignore)

# ─── Supabase ──────────────────────────────────────────
# Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Service role key — bypass RLS, utilisée par /api/admin/*
# ⚠️ NEVER expose côté client, NEVER commit
# Le code accepte aussi SUPABASE_SERVICE_KEY (alias historique)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# ─── Optionnel : observabilité ─────────────────────────
# SENTRY_DSN=https://xxx@sentry.io/yyy
# SENTRY_AUTH_TOKEN=

# ─── Optionnel : Node env ─────────────────────────────
# NODE_ENV est géré automatiquement par Next.js
```

### 2. `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    name: Lint + Typecheck + Test
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint -- --max-warnings 75

      - name: Typecheck
        run: npx tsc --noEmit

      - name: Unit tests
        run: npx vitest run --reporter=verbose

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://fake.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: fake-anon-key
          SUPABASE_SERVICE_ROLE_KEY: fake-service-key

  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: validate
    if: github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Run Playwright
        run: npx playwright test --project=chromium
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL_TEST }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_TEST }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY_TEST }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 3. Husky + lint-staged

```bash
# Install
npm install --save-dev husky lint-staged
npx husky init
# Le fichier .husky/pre-commit est créé — éditer son contenu :
echo "npx lint-staged" > .husky/pre-commit
```

Dans `package.json` :

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "*.{js,cjs,mjs,json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

Optionnel — un `pre-push` qui valide `tsc` + vitest (plus lent, fait sens en pre-push) :

```bash
echo "npm run typecheck && npx vitest run" > .husky/pre-push
chmod +x .husky/pre-push
```

### 4. `src/lib/env.ts` (validation Zod des env vars)

```ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  SUPABASE_SERVICE_KEY: z.string().min(20).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
}).refine(
  (data) => data.SUPABASE_SERVICE_ROLE_KEY || data.SUPABASE_SERVICE_KEY,
  { message: 'SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SERVICE_KEY requis' }
)

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Variables d\'environnement invalides:')
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error('Env vars invalides — voir .env.local.example')
}

export const env = {
  ...parsed.data,
  SUPABASE_SERVICE_KEY:
    parsed.data.SUPABASE_SERVICE_ROLE_KEY ?? parsed.data.SUPABASE_SERVICE_KEY!,
}
```

Puis dans le code : `import { env } from '@/lib/env'` à la place de `process.env.X!`.

### 5. `src/lib/supabaseAdmin.ts` (client service-role singleton)

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'
import type { Database } from '@/types/supabase'

let _client: SupabaseClient<Database> | null = null

/**
 * Client Supabase service-role (bypass RLS).
 * À utiliser EXCLUSIVEMENT dans /api/admin/*.
 * Throw si les env vars sont absentes — fail fast.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (_client) return _client
  _client = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _client
}
```

Usage :

```ts
// src/app/api/admin/products/route.ts
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin()
  // ...
}
```

### 6. `src/lib/getErrorMessage.ts` (helper `catch`)

```ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Erreur inconnue'
}
```

Remplacement :

```ts
// Avant
} catch (error: any) {
  return NextResponse.json({ error: error.message || '...' }, { status: 500 })
}

// Après
} catch (error) {
  return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
}
```

### 7. `src/lib/logger.ts` (logger structuré minimal)

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

const isDev = process.env.NODE_ENV !== 'production'

function log(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context,
  }
  if (isDev) {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(`[${level.toUpperCase()}] ${message}`, context)
  } else {
    // En prod : JSON line pour ingestion (Vercel Logs / Sentry / Datadog)
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
  info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
}
```

Usage :

```ts
logger.error('cart_fetch_failed', { cartId, anonId, error: getErrorMessage(error) })
```

### 8. `.prettierrc.json` + `.prettierignore`

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5",
  "arrowParens": "always"
}
```

```
# .prettierignore
.next/
node_modules/
public/
db/catalog.json
db/populate_catalog.sql
contenu_bd/
bd1/
bd2/
*.tsbuildinfo
package-lock.json
```

### 9. `package.json` — scripts enrichis

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --max-warnings 75",
    "lint:strict": "next lint --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check": "npm run lint && npm run typecheck && npx vitest run",
    "test": "playwright test",
    "test:unit": "vitest",
    "test:unit:run": "vitest run",
    "test:unit:watch": "vitest watch",
    "test:unit:coverage": "vitest run --coverage",
    "db:types": "npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > src/types/supabase.ts",
    "check-products": "node scripts/check-products.js",
    "parse-pdfs": "node scripts/parse-pdfs.cjs",
    "validate-catalog": "node scripts/validate-catalog.cjs",
    "prices:export": "node scripts/prices-export.cjs",
    "prices:import": "node scripts/prices-import.cjs",
    "prices:default": "node scripts/prices-set-default.cjs",
    "seed-import": "node scripts/seed-import.cjs",
    "create-admin": "node scripts/create-admin-user.js",
    "prepare": "husky"
  }
}
```

### 10. `vitest.config.ts` — avec coverage

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
    exclude: ['tests/**', 'node_modules/**', '.next/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'src/__tests__/**',
        'tests/**',
        '**/*.config.*',
        '.next/**',
        'scripts/**',
      ],
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 30,
        statements: 30,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 11. `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
    open-pull-requests-limit: 5
    groups:
      supabase:
        patterns: ['@supabase/*']
      react:
        patterns: ['react', 'react-dom', '@types/react', '@types/react-dom']
      testing:
        patterns: ['vitest', '@testing-library/*', '@playwright/test', 'happy-dom']
      types:
        patterns: ['@types/*']
    labels: ['dependencies']

  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'monthly'
```

### 12. `eslint.config.mjs` — durci

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "react/no-unescaped-entities": "warn",
      // Promu en error : peut cacher des bugs
      "react-hooks/exhaustive-deps": "error",
      // Évite les console.log en prod, autorise warn/error
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // Plus permissif dans les scripts
    files: ["scripts/**/*.{js,cjs,mjs}"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Plus permissif dans les tests
    files: ["src/__tests__/**/*.{ts,tsx}", "tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
```

### 13. Test Vitest pour `middleware.ts` (exemple)

```ts
// src/__tests__/middleware.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

const mockGetSession = vi.fn()
const mockSingle = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getSession: mockGetSession },
    from: () => ({
      select: () => ({
        eq: () => ({ single: mockSingle }),
      }),
    }),
  }),
}))

const makeRequest = (path: string) =>
  new NextRequest(new URL(`http://localhost:3000${path}`))

describe('middleware', () => {
  beforeEach(() => vi.clearAllMocks())

  it('laisse passer /login sans session check', async () => {
    const res = await middleware(makeRequest('/login'))
    expect(mockGetSession).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
  })

  it('redirige vers /login si pas de session sur /admin', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    const res = await middleware(makeRequest('/admin/product'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
    expect(res.headers.get('location')).toContain('redirectedFrom=%2Fadmin%2Fproduct')
  })

  it('redirige vers /login?error=unauthorized si user non admin', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'uid' } } },
      error: null,
    })
    mockSingle.mockResolvedValue({ data: { is_admin: false }, error: null })

    const res = await middleware(makeRequest('/admin/product'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('error=unauthorized')
  })

  it('laisse passer si admin', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'uid' } } },
      error: null,
    })
    mockSingle.mockResolvedValue({ data: { is_admin: true }, error: null })

    const res = await middleware(makeRequest('/admin/product'))
    expect(res.status).toBe(200)
  })
})
```

### 14. README — section "Développement local" à ajouter

```markdown
## Développement local

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.local.example .env.local
# → éditer .env.local avec les clés du projet Supabase

# 3. Démarrer le serveur de dev
npm run dev          # → http://localhost:3000

# 4. Pendant le développement
npm run check        # lint + typecheck + tests unit (cf. CI)
npm run typecheck    # juste tsc --noEmit
npm run lint         # juste eslint
npm run test:unit    # vitest watch
npm run test         # playwright (lance dev server auto)

# 5. Régénérer les types Supabase après modif du schéma
npm run db:types
```

### Pre-commit

Husky lance automatiquement `eslint --fix` + `prettier` sur les fichiers staged.
Si le commit est bloqué, lancer `npm run check` pour diagnostiquer.
```

### 15. `src/lib/supabaseServer.ts` typé (extrait)

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { env } from './env'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Server Component → set ignoré, c'est attendu
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch {
            // idem
          }
        },
      },
    }
  )
}
```

---

## Annexe : checklist de mise en oeuvre

Plan d'action en 3 sprints d'environ 2h chacun :

**Sprint 1 (foundations)** — 2h
- [ ] Créer `.env.local.example`
- [ ] Créer `.github/workflows/ci.yml`
- [ ] Installer Husky + lint-staged + Prettier
- [ ] Ajouter scripts `typecheck`, `format`, `check` dans `package.json`
- [ ] Configurer `.prettierrc.json` + `.prettierignore`
- [ ] Nettoyer les références `GUIDE_*.md` fantômes dans `CLAUDE.md` et routes API
- [ ] Mettre à jour `README.md` avec la section "Développement local"

**Sprint 2 (types & error handling)** — 3h
- [ ] Créer `src/lib/env.ts` avec validation Zod
- [ ] Créer `src/lib/getErrorMessage.ts`
- [ ] Créer `src/lib/supabaseAdmin.ts` singleton
- [ ] Générer `src/types/supabase.ts` via `supabase gen types`
- [ ] Migrer 5 routes admin pilote vers le nouveau pattern (env + admin client + error helper)
- [ ] Supprimer les 20 `catch (error: any)` par find/replace + helper

**Sprint 3 (tests & observabilité)** — 3h
- [ ] Ajouter Sentry (`npx @sentry/wizard@latest -i nextjs`)
- [ ] Créer `src/lib/logger.ts`
- [ ] Migrer 10 fichiers vers `logger.*` au lieu de `console.*`
- [ ] Écrire `src/__tests__/middleware.test.ts` (cf. template)
- [ ] Écrire 3 tests Vitest sur les routes API les plus critiques (`cart`, `admin/products`, `admin/upload`)
- [ ] Décommenter / réparer le test de fusion de panier dans `tests/cart.spec.ts`
- [ ] Configurer `vitest --coverage` avec seuils minimums

À mesurer après ces 3 sprints :
- Warnings ESLint passés de 73 à <20
- `any` dans `src/` passés de 32 à <10
- Tests unit passés de 8 à ~30
- Délai d'onboarding d'un nouveau dev : passé de "indéterminé" (README cassé) à "<30 min"
