# CLAUDE.md

Guide pour les futures instances de Claude Code sur ce repo.

## Stack

Next.js 15.5.18 (App Router) + React 19 + Supabase (Auth, Postgres + RLS, Storage) + Tailwind 4 + **next-intl 4.12** (FR/EN/ES). Tout le texte UI passe par les fichiers de traduction. Marché cible : République Dominicaine (devise `DOP`, locale par défaut `fr`).

## Commandes courantes

```bash
npm run dev                  # http://localhost:3000 (Turbopack)
npm run build && npm start   # build prod
npm run lint                 # ESLint (~38 warnings actuels, non bloquants)
npm run test:unit            # Vitest, 8/8 tests passent
npm run test                 # Playwright (auto-start dev server)
npm run test:smoke           # 4 smoke tests Playwright (~45s, chromium-only)
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

Template versionné : `.env.local.example` (copier en `.env.local` et remplir).

## Architecture

### Trois clients Supabase — choisir le bon

| Client | Fichier | Usage |
|---|---|---|
| Browser | `src/lib/supabaseClient.ts` | Client Components uniquement. Inclut un fallback `localStorage` pour la navigation privée (**finding security #4 critique** — exfiltration XSS possible, non corrigé). |
| Server (cookies) | `src/lib/supabaseServer.ts` | Server Components, route handlers agissant pour le user. |
| Service-role | `src/lib/supabaseAdmin.ts` | Singleton typé avec `Database`. Utilisé par toutes les routes `/api/admin/*` + `/api/contact` (rate limit). Bypasse RLS. |

Types Supabase générés dans **`src/lib/database.types.ts`** (via MCP `generate_typescript_types`). À regénérer après chaque migration touchant les types.

### Auth & gating admin

1. **`src/middleware.ts`** chaîne :
   - `/admin/*` → check session Supabase SSR + `is_admin`
   - `/auth/callback` → passthrough (OAuth Supabase)
   - tout le reste → `next-intl` (routing locale `/(fr|es|en)/...`)
2. **`src/app/admin/layout.tsx`** — re-check côté client via `useIsAdmin` hook.
3. **`src/lib/requireAdmin.ts`** — helper pour les routes `/api/admin/*` (toutes les 16 routes admin sont maintenant gardées).

La table `admin_users` est la **source de vérité RLS** (évite la récursion sur `profiles`). Toujours utiliser `is_user_admin(auth.uid())` dans les policies.

### Route map

**Pages publiques sous `[locale]/`** (FR/EN/ES) :
- `src/app/[locale]/page.tsx` — accueil
- `src/app/[locale]/catalogue/page.tsx` + `CatalogueClient` + `Filters`
- `src/app/[locale]/product/[id]/page.tsx` + `ProductClient` (UUID, slug pas encore)
- `src/app/[locale]/cart/page.tsx` + `CartClient`
- `src/app/[locale]/contact/page.tsx` + `ContactForm`
- `src/app/[locale]/a-propos/page.tsx`
- `src/app/[locale]/(auth)/{login,signup}/page.tsx` — auth group
- `src/app/[locale]/account/profile/page.tsx` + `ProfileEditForm`

**Admin (non localisé, FR)** :
- `src/app/admin/*` — `product`, `marques`, `stock`, `tags`, `messages`, `annonce`, `setup`, **`reservations`** (vue 8/8 du système de réservation). Pages démo (badge jaune) : `my-team`, `settings`.

**API** :
- `src/app/api/admin/*` — 16 routes service-role + `/admin/reservations` (GET liste + PATCH status). Toutes commencent par `requireAdmin()`.
- `src/app/api/cart/{,reserve}` — public (rate-limited pour reserve)
- `src/app/api/contact` — public + rate limit (5 req/min/IP)
- `src/app/auth/callback` — OAuth Supabase, non localisé

**SEO** :
- `src/app/sitemap.ts` — sitemap dynamique (routes × locales + produits × locales avec hreflang)
- `src/app/robots.ts` — règles + disallow admin/api/account/auth/cart
- `generateMetadata` sur chaque page Server (home, catalogue, contact, a-propos, product, cart, profile)

### Données

Source de vérité : **`supabase/migrations/`** (fichiers SQL timestampés, ordonnés).
Baseline `00000000000000_baseline.sql` + une migration par changement. Le remote (Supabase project `adxpoxcynrpnbbxnncsk`) trace les migrations appliquées dans `supabase_migrations.schema_migrations` ; rejouer un fichier déjà appliqué est idempotent (toutes les migrations utilisent `IF NOT EXISTS` / `CREATE OR REPLACE`).

`db/schema.sql` reste comme **snapshot de lecture** (regénérable). Ne pas l'éditer sans aussi écrire une migration.

**Ajouter une migration :**
1. Écrire le SQL dans `supabase/migrations/YYYYMMDDHHMMSS_<nom>.sql` (timestamp UTC, snake_case).
2. Appliquer via MCP `apply_migration` (le `name` doit matcher le nom du fichier).
3. Mettre à jour `db/schema.sql` à la main.
4. Si types touchés : regénérer `src/lib/database.types.ts` via MCP `generate_typescript_types`.

Modèle (résumé) :
- `brands` → `ranges` → `products` via `product_ranges` (n-n)
- `tag_types` → `tags` → `product_tags` (tags polymorphes)
- `product_images` (multi-images ; **doublon avec `products.image_url`** — finding archi #3, non corrigé)
- `carts` + `cart_items` (guest via `anonymous_id`, authenticated via `user_id`)
- `reservations` + `reservation_items` (système de réservation, snapshot pattern, partial unique 1 active par user, pg_cron expire après 24h)
- `rate_limit_buckets` (fixed-window pour /api/contact + autres)
- `orders` + `order_items` (legacy, pas branché — peut-être à supprimer)
- `banners`, `contact_messages` (CMS + admin)

État BDD actuel (projet `adxpoxcynrpnbbxnncsk`) : 13 brands, 52 ranges, **353 produits actifs à 100 DOP placeholder**, 299 product_images, 36 tags, 844 product_tags, 1 admin.

### i18n (next-intl)

- **Config** : `src/i18n/routing.ts` (3 locales, default `fr`, `localePrefix: 'always'`)
- **Loader** : `src/i18n/request.ts` charge `src/messages/{fr,es,en}.json`
- **Navigation helper** : `src/i18n/navigation.ts` expose `Link`, `useRouter`, `usePathname`, `redirect` locale-aware
- **Composants Client** : `useTranslations('Namespace')`
- **Composants Server** : `await getTranslations({ locale, namespace: 'Namespace' })` + `setRequestLocale(locale)` pour ISR
- **`LocaleSwitcher`** : composant utilisé dans NavBar (variant inline) + MobileDrawer (variant block)
- **Helpers SEO** : `src/lib/seo.ts` (`localizedPath`, `buildLanguageAlternates` avec `x-default`)

Namespaces principaux dans `src/messages/*.json` :
- `Nav`, `Footer`, `LocaleSwitcher` — chrome
- `Home`, `Catalogue`, `Filters`, `Product`, `Cart`, `Reservation`, `AddToCart`
- `Login`, `Signup`, `Profile`, `Contact`, `ContactForm`, `About`
- `PageMeta.{home,catalogue,...}` — title + description SEO par page
- `NavSearch`, `ProductPage` (sous-namespaces ajoutés par le user lors du sprint design)

### Système de réservation (catalogue + click & collect)

Workflow : user connecté ajoute au panier → clique "Réserver" → RPC `create_reservation` crée snapshot + vide cart → admin voit dans `/admin/reservations` → contacte via WhatsApp pré-rempli → marque confirmée puis collectée. TTL 24h, auto-expiration via `pg_cron` (job `expire-stale-reservations`, toutes les 5 min).

Fichiers clés :
- DB : `reservations`, `reservation_items`, enum `reservation_status` (pending/confirmed/collected/expired/cancelled), RPC `create_reservation`, fonction `expire_stale_reservations`, partial unique index `uniq_active_reservation_per_user`
- API : `POST /api/cart/reserve` (mapping ERRCODE → HTTP), `GET/PATCH /api/admin/reservations`
- UI user : `CartClient` (bouton "Réserver" + écran de confirmation avec référence `#XXXXXXXX`)
- UI admin : `/admin/reservations` avec onglets status, filtres, lien WhatsApp pré-rempli `wa.me/<phone>?text=<résumé panier>`
- Téléphone obligatoire : `signup/page.tsx` + `ProfileEditForm` + check côté RPC

### State client

- **`src/hooks/useCart.ts`** — SWR sur `/api/cart`, optimistic updates.
- **`src/hooks/useIsAdmin.ts`** — session + check admin factorisé (utilisé par admin/layout + NavBar).
- **`src/hooks/useAuth.ts`** — onAuthStateChange + merge panier anonyme→authentifié.

## Conventions

- **i18n** : tout texte UI passe par `useTranslations`/`getTranslations`. Pas de string FR dur dans le code. Le contenu BDD (noms produits, marques) reste tel quel.
- Path alias `@/*` → `src/*`.
- TypeScript `strict: true`, **0 erreur tsc**. Lint : ~38 warnings (mostly `any` dans admin pages, non bloquants).
- ESLint warnings non bloquants au build (cf `eslint.config.mjs`). Le fichier `database.types.ts` est ignoré (généré).
- **Ne jamais commit sans demande explicite** (règle Cursor `alwaysApply`).
- **Pre-commit hook** (Husky + lint-staged) : `eslint --fix --no-warn-ignored` sur les TS/TSX stagés.
- **CI** (`.github/workflows/ci.yml`) : lint + tsc + vitest sur PR et push main.

## État du projet (2026-05-20)

### Fait ✅ (session 2026-05-19/20)

Sécurité + bugs P1 :
- Auth sur les 16 routes `/api/admin/*` via `requireAdmin` + UUID admin dégagé (commit `8c6bf63`)
- Rate limit `/api/contact` (5/min/IP) avec table `rate_limit_buckets` + RPC `check_rate_limit` (commit `be5b2bc`)
- Bug `add_to_cart` (quantité écrasée → incrémentée) (commit `b8ea667`)
- `<html lang="en">` → `<html lang="fr">` + skip link a11y (commit `0d0f432`)
- 4 indexes FK manquants (commit `0dd8721`)
- Catalogue `.limit(100) → 500` (253 produits invisibles débloqués) (commit `4f4db48`)
- `revalidate = 60` sur pages publiques (commit `bcefbbe`)

Système de réservation (8/8, commits `5be92fa` → `5e51720`)

DX / outillage (Tier 1) :
- `.env.local.example`, CI GitHub Actions, Husky + lint-staged, types Supabase générés, factorisation singleton (commits `acc2326` → `2348950`)

Migrations versionnées (Tier 2) : `supabase/migrations/` comme source de vérité (commit `02edb94`)

Tests Playwright golden path (Tier 3) : 4 smoke tests (`npm run test:smoke`, commit `7bd0050`)

i18n FR/EN/ES (4 paliers, commits `4ce4974` → `342096e`) :
- next-intl + routing préfixé
- migration toutes pages publiques sous `[locale]/`
- ~250+ strings UI traduites (chrome, pages, forms)
- LocaleSwitcher fonctionnel desktop + mobile

SEO post-i18n (commit `3521c21`) : sitemap.ts + robots.ts + helpers seo.ts + generateMetadata + hreflang sur toutes les pages publiques, noindex sur cart/profile

### Reste à faire

**P2 (impact moyen-élevé)** :
- `/product/[id]` → `/product/[slug]` : slugs déjà en BDD, URL SEO-friendly
- 5 `<img>` → `next/image` : `CartDrawer`, `ProductClient×2`, `DirectImageUpload`, `ImageUpload`
- Anti-énumération `create_contact_message` : réponse différentielle selon email existant
- Footer vrais liens : `<li>` Produits/Besoins non cliquables → vers `/catalogue?tag=...`
- 19 vulnerabilities npm (1 critique, 11 high) : trier avec `npm audit fix`, attention breaking changes

**P3 (hygiène long terme)** :
- `<html lang>` dynamique : nécessite un route group `(admin)` pour séparer l'arbre admin/public
- Stockage image dédupliqué : `products.image_url` + `product_images` → choisir un seul
- Tests d'intégration des routes admin Playwright
- Split pages admin > 500 lignes (`tags` 753, `marques` 708, `product` 703, `annonce` 668)
- Fallback `localStorage` pour tokens Supabase (finding security #4)
- Audit toutes les RPC SECURITY DEFINER pour vérifier `SET search_path = public`

Voir `docs/audits/INDEX.md` pour l'audit complet et `docs/HANDOFF.md` pour le résumé courant à reprendre.

## Pièges & règles non évidentes

- **Pas de commit sauf demande explicite** (Cursor rule `alwaysApply`).
- **Bash deny list** dans `.claude/settings.local.json` bloque `rm`, `git --force`, `git rebase`, `git reset --hard`, etc. Utiliser `git rm` + `git reset --soft`.
- **MCP Supabase** : `.mcp.json` scope le MCP au projet `adxpoxcynrpnbbxnncsk`. Re-auth si token expiré : `/mcp` → supabase → Authenticate.
- **`.next/types/`** est un cache TS — quand on supprime des routes, déplacer `.next/` ailleurs pour que `tsc --noEmit` arrête de râler (`mv .next /tmp/.next-stale-...`).
- **`scripts/package.json`** a `"type": "module"` — nouveaux scripts doivent être `.cjs` ou syntaxe ES.
- **bd1/, bd2/, contenu_bd/** sont gitignorés (203 MB) — data source pour `seed-import.cjs`.
- **next-intl `redirect` signature** : prefer manuellement `redirect(\`/${locale}/...\`)` avec `next/navigation` plutôt que la version next-intl (signature object plus rigide).
- **Login + Signup utilisent `next/navigation` useRouter** (pas next-intl) pour les redirects vers `/admin/*` non localisé.
- **Pre-commit Husky** auto-fixe via `eslint --fix --no-warn-ignored` sur les `*.{ts,tsx}` stagés ; `database.types.ts` est ignoré.

## Référence rapide

- Audit complet : `docs/audits/INDEX.md` + 9 rapports thématiques
- Handoff courant : `docs/HANDOFF.md`
- Schéma DB : `supabase/migrations/` (canonique) + `db/schema.sql` (snapshot dérivé) + `src/lib/database.types.ts` (types TS)
- i18n : `src/i18n/{routing,request,navigation}.ts` + `src/messages/{fr,es,en}.json`
- SEO : `src/app/{robots,sitemap}.ts` + `src/lib/seo.ts`
- Seed pipeline : `parse-pdfs` → `catalog.json` → optionnel `prices:*` → `seed-import`
- Vercel : auto-deploy sur push `main`. Domaine prod `https://farmau.do` (set dans `metadataBase` du root layout).
