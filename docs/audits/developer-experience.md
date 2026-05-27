# Audit Developer Experience

Dernière mise à jour : 2026-05-27

## Synthèse

**Note : A- (8/10) — CI complet, SDKs à jour, DX solide**

Amélioration majeure depuis 6/10 initial. TypeScript strict avec 0 erreur et 0 warning ESLint, pre-commit hooks actifs, CI sur PR/push, et un setup de test Playwright mature.

## État actuel

| Domaine | État | Détail |
|---|---|---|
| **Build** | ✅ | `next build` propre, Turbopack en dev |
| **TypeScript** | ✅ STRICT | `strict: true`, **0 erreur tsc**, **0 `any`**, 0 `@ts-ignore` |
| **Lint** | ✅ | **0 warning ESLint** (0 erreur) |
| **Pre-commit** | ✅ | Husky + lint-staged → `eslint --fix --no-warn-ignored` sur TS/TSX stagés |
| **CI** | ✅ | lint + tsc + vitest + **build** + **Playwright chromium** (needs secrets) |
| **Tests unit** | ⚠️ | 1 fichier (8 tests auth). Pas de tests hooks/API/utils |
| **Tests E2E** | ✅ | 11 specs Playwright, multi-navigateur (Chromium/Firefox/WebKit/mobile) |
| **Documentation** | ✅ | `CLAUDE.md` exhaustif, `HANDOFF.md`, audits complets |
| **Scripts** | ✅ | 11 npm scripts + 8 scripts utilitaires |
| **Hot reload** | ✅ | `next dev --turbopack` rapide |
| **Types DB** | ✅ | Générés via MCP (`database.types.ts`, 1 091 LOC) |
| **Logging** | ⚠️ | 126 `console.error/log` — pas de logger structuré |

## Findings

### ~~1. `.env.local.example` manquant~~ ✅ FERMÉ
Template versionné avec les 3 variables requises.

### ~~2. Aucune CI~~ ✅ FERMÉ
`.github/workflows/ci.yml` : lint + tsc + vitest sur PR et push main.

### ~~3. Pas de pre-commit~~ ✅ FERMÉ
Husky + lint-staged configurés.

### ~~4. 73 warnings ESLint~~ ✅ FERMÉ
**0 warning** depuis session 2026-05-22.

### ~~5. 32 `any` types~~ ✅ FERMÉ
**0 usage de `any`** dans tout le codebase (hors `database.types.ts` ignoré par ESLint).

### ~~6. Types Supabase non générés~~ ✅ FERMÉ
`database.types.ts` généré via MCP, singleton typé `Database`.

### ~~7. 35 `alert()` natifs~~ ✅ QUASI-FERMÉ
31 `toast()` via sonner. **3 `alert()` restants** dans admin users/newsletter.

### ~~8. E2E Playwright pas dans CI~~ ✅ FERMÉ (session 2026-05-27)
Job Playwright chromium ajouté au CI avec upload artifacts. Nécessite 3 secrets GitHub configurés.

### ~~9. Step `build` manquant dans CI~~ ✅ FERMÉ (session 2026-05-27)
`npm run build` ajouté au job CI principal.

### ~~10. Supabase SDKs en retard~~ ✅ FERMÉ (session 2026-05-27)
supabase-js 2.50→2.106, ssr 0.6→0.10. 3 routes API corrigées pour les types plus stricts.

### 11. 126 `console.error/log` — ❌ OUVERT (Low)
Pas de logger structuré (pino, winston). Pas de corrélation possible en prod.
**Recommandation** : centraliser via un helper `log.error()` / `log.info()`, ou Sentry.

### 12. Pas de script `typecheck` — ❌ OUVERT (Low)
`npx tsc --noEmit` n'est pas dans `package.json`. CI l'appelle mais le dev doit connaître la commande.
**Recommandation** : `"typecheck": "tsc --noEmit"` dans scripts.

## Tests

### Vitest (8/8)
- `src/__tests__/auth.test.tsx` — test auth avec mocks next-intl + Supabase
- Setup comprehensive dans `setup.ts`

### Playwright (11 specs)

| Spec | Tests | Scope |
|---|---|---|
| `golden-path.spec.ts` | 4 | Home, catalogue, produit, contact |
| `admin-smoke.spec.ts` | 3 | Login admin, sidebar, 9 pages |
| `reservation.spec.ts` | 2 | Happy path + 409 already_active |
| `cart.spec.ts` | 5 | Ajout, suppression, quantité |
| `admin-auth.spec.ts` | 2 | Redirects sans auth |
| `account-auth.spec.ts` | 2 | Redirects sans auth |
| `besoins.spec.ts` | 3 | Landing pages besoins |
| `i18n.spec.ts` | 2 | Bascule locale + hreflang |
| `marques.spec.ts` | 2 | Index et landing marques |
| `wishlist-anon.spec.ts` | 1 | Heart → redirect /login |
| `footer-links.spec.ts` | 1 | Audit liens internes |

Config : 60s timeout, retries 1 en dev, 5 projets navigateur.

## Dépendances (35 total)

### Production
next 15.5, react 19, next-intl 4.12, @supabase/supabase-js 2.50, @supabase/ssr 0.6, swr 2.2, lucide-react 0.522, sonner 2.0, dotenv 16.6

### Dev
typescript 5, tailwindcss 4, @playwright/test 1.53, vitest 3.2, @testing-library/* 16+, eslint 9, husky 9, lint-staged 16

## Recommandations

1. **(High)** Ajouter Playwright au CI (chromium-only pour la rapidité)
2. **(High)** Ajouter `npm run build` au CI
3. **(Medium)** Mettre à jour Supabase SDKs (supabase-js 2.50→2.106, ssr 0.6→0.10)
4. **(Low)** Centraliser le logging (remplacer 126 console.error par un logger)
5. **(Low)** Ajouter script `"typecheck": "tsc --noEmit"` dans package.json
6. **(Low)** Ajouter des tests unitaires pour les hooks (useCart, useWishlist) et les API routes
