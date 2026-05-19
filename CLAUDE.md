# CLAUDE.md

Guide pour les futures instances de Claude Code sur ce repo.

## Stack

Next.js 15.5.18 (App Router) + React 19 + Supabase (Auth, Postgres + RLS, Storage) + Tailwind 4. Tout le texte UI est en **français**. Marché cible : République Dominicaine (devise `DOP`).

## Commandes courantes

```bash
npm run dev                  # http://localhost:3000 (Turbopack)
npm run build && npm start   # build prod
npm run lint                 # ESLint (~39 warnings actuels, non bloquants)
npm run test:unit            # Vitest, 8/8 tests passent
npm run test                 # Playwright (auto-start dev server)
npx tsc --noEmit             # 0 erreur TS

# Scripts métier (voir scripts/)
npm run create-admin -- email pwd          # bootstrap admin
npm run parse-pdfs                         # contenu_bd/fiche/*.pdf → db/catalog.json
npm run validate-catalog                   # rapport anomalies du parser
npm run prices:export                      # → data/prices.csv (saisie en masse)
npm run prices:import                      # CSV → catalog.json
npm run prices:default 100                 # uniformise les prix (placeholder)
npm run seed-import -- --dry-run           # simulation
npm run seed-import                        # import réel (+ uploads Storage)
npm run seed-import -- --brands isdin,acm  # re-jouer marques spécifiques
```

## Variables d'environnement requises

`.env.local` doit contenir :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...    # ou SUPABASE_SERVICE_KEY (les 2 noms acceptés)
```

Pas de `.env.local.example` versionné (à créer — finding DX #1).

## Architecture

### Trois clients Supabase — choisir le bon

| Client | Fichier | Usage |
|---|---|---|
| Browser | `src/lib/supabaseClient.ts` | Client Components uniquement. Inclut un fallback `localStorage` pour la navigation privée (**finding security #4 critique** — exfiltration XSS possible). |
| Server (cookies) | `src/lib/supabaseServer.ts` | Server Components, route handlers agissant pour le user. |
| Service-role | `src/lib/supabaseAdmin.ts` | Singleton. Routes `/api/admin/*` uniquement. Bypasse RLS. |

### Auth & gating admin (deux couches)

1. **`src/middleware.ts`** sur `/admin/:path*` — lit session, vérifie `profiles.is_admin`, redirige si non admin.
2. **`src/app/admin/layout.tsx`** — re-check côté client via `useIsAdmin` hook.
3. **`src/lib/requireAdmin.ts`** — helper pour les routes `/api/admin/*` (ajouté pour fix sécurité #1 — toutes les 16 routes admin sont maintenant gardées).

La table `admin_users` est la **source de vérité RLS** (évite la récursion sur `profiles`). Toujours utiliser `is_user_admin(auth.uid())` dans les policies.

### Route map

- `src/app/(auth)/{login,signup}` — auth group sans chrome
- `src/app/admin/*` — dashboard gated. **Sections câblées** : `product`, `marques`, `stock`, `tags`, `messages`, `annonce`, `setup`. **Pages démo (badge jaune)** : `my-team`, `settings`.
- `src/app/api/admin/*` — 16 routes service-role, toutes commencent par `requireAdmin()`
- `src/app/api/{cart,contact}` — APIs publiques
- Pages publiques : `/`, `/catalogue`, `/product/[id]`, `/cart`, `/contact`, `/a-propos`

### Données

Schéma canonique unique : **`db/schema.sql`** (520 lignes idempotent). À exécuter dans Supabase SQL Editor sur un projet neuf.

Modèle :
- `brands` → `ranges` → `products` via `product_ranges` (n-n)
- `tag_types` → `tags` → `product_tags` (tags polymorphes)
- `product_images` (multi-images par produit ; **doublon avec `products.image_url`** — finding archi #3)
- `carts` + `cart_items` (guest via `anonymous_id`, authenticated via `user_id`)
- `orders` + `order_items` (pas de checkout encore)
- `banners`, `contact_messages` (CMS + admin)

État BDD actuel (sur projet `adxpoxcynrpnbbxnncsk`) : 13 brands, 52 ranges, **353 produits actifs à 100 DOP placeholder**, 299 product_images, 36 tags, 844 product_tags, 1 admin.

### State client

- **`src/hooks/useCart.ts`** — SWR sur `/api/cart`, optimistic updates.
- **`src/hooks/useIsAdmin.ts`** — session + check admin factorisé (utilisé par admin/layout + NavBar).
- **`src/hooks/useAuth.ts`** — onAuthStateChange + merge panier anonyme→authentifié.

## Conventions

- Tout en **français** (UI, erreurs, commits, docs internes).
- Path alias `@/*` → `src/*`.
- TypeScript `strict: true`, **0 erreur tsc**. Lint : 39 warnings restants (mostly `any` dans admin pages, non bloquants).
- ESLint warnings non bloquants au build (cf `eslint.config.mjs`).
- **Ne jamais commit sans demande explicite** (règle Cursor `alwaysApply`).

## État du projet (2026-05-19)

Voir **`docs/audits/INDEX.md`** pour l'audit complet 9 dimensions (142 findings, 5740 lignes). Status :

### Fait ✅

- Cleanup massif : 22 SQL legacy → 1 `schema.sql`, 11 routes mortes supprimées, 44 scripts obsolètes nettoyés (commit `d032574`)
- Quick wins lint+types+tests : 99→39 warnings, types propres sur server components, hook `useIsAdmin` factorisé (commit `583dbcb`)
- Outils prix CSV + audit catalog + dédup slugs parser (commit `61c65c3`)
- Next.js 15.3.4 → 15.5.18 (CVE fix) (commit `33b8191`)
- Audit complet 9 dimensions livré dans `docs/audits/` (commit `5458d59`)
- **Auth sur les 16 routes `/api/admin/*`** via `requireAdmin` + suppression UUID admin hardcodé (commit `8c6bf63`)

### Reste critique / important — voir `docs/audits/INDEX.md`

- **Bug RPC `add_to_cart`** : `db/schema.sql:328` écrase la quantité (`= EXCLUDED.quantity`) au lieu d'incrémenter
- **`<html lang="en">`** dans `src/app/layout.tsx:31` alors que tout est en français
- **Rate limit absent** sur `/api/contact` (énumération emails + spam possible)
- **Checkout cassé** : bouton "Procéder au paiement" sur `/cart` sans handler ni disabled (UX #1)
- **`.limit(100)` dans catalogue** : 253 produits sur 353 invisibles
- **7 indexes DB manquants** sur FKs (perf)
- **5 `<img>` à migrer vers `next/image`** (CartDrawer, ProductClient×2, DirectImageUpload, ImageUpload)
- **Stockage image dupliqué** : `products.image_url` + `product_images` cohabitent (finding archi #3)
- **Pas de sitemap.ts / robots.ts / metadataBase / generateMetadata** (SEO)
- **Pas de CI ni pre-commit hook**
- **Types Supabase non générés** (`supabase gen types typescript`)

## Pièges & règles non évidentes

- **Pas de commit sauf demande explicite** (Cursor rule `alwaysApply`).
- **Bash deny list** dans `.claude/settings.local.json` bloque `rm`, `git --force`, `git rebase`, `git reset --hard`, etc. Utiliser `git rm` + `git reset --soft` à la place.
- **Storage MCP Supabase** : le `.mcp.json` à la racine scope le MCP au projet `adxpoxcynrpnbbxnncsk`. Re-auth si token expiré : `/mcp` → supabase → Authenticate.
- **Le `.next/types/`** est un cache TS — quand on supprime des routes, `.next/` doit être effacé pour que `tsc --noEmit` arrête de râler (move out → rebuild).
- **`scripts/*.cjs`** : on a `"type": "module"` dans `scripts/package.json`, donc les nouveaux scripts doivent être `.cjs` ou utiliser la syntaxe ES.
- **bd1/, bd2/, contenu_bd/** sont gitignorés (203 MB) — c'est de la donnée source pour `seed-import.cjs`.

## Référence rapide

- Audit complet : `docs/audits/INDEX.md` + 9 rapports thématiques
- Plan post-audit : phase 1 sécu → phase 2 quick wins → phase 3 a11y/UX → phase 4 hygiène
- Schéma DB : `db/schema.sql` (canonique, idempotent)
- Seed pipeline : `parse-pdfs` → `catalog.json` → optionnel `prices:*` → `seed-import`
- Vercel : auto-deploy sur push `main`, env vars à synchroniser via Dashboard
