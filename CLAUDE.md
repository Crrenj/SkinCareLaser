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
3. **`src/lib/requireAdmin.ts`** — helper pour les routes `/api/admin/*` (toutes les 20 routes admin sont maintenant gardées).

La table `admin_users` est la **source de vérité RLS** (évite la récursion sur `profiles`). Toujours utiliser `is_user_admin(auth.uid())` dans les policies.

### Route map

**Pages publiques sous `[locale]/`** (FR/EN/ES) — `not-found.tsx` design FARMAU au niveau locale :

*Catalogue & produit*
- `src/app/[locale]/page.tsx` — accueil (7 sections : Hero → Bestsellers → ByNeed → Quote → Brands → Expertise → Routine + CMS banners optionnelles)
- `src/app/[locale]/catalogue/page.tsx` + `CatalogueClient` + `Filters` (filtres URL `?brand`, `?range`, `?need`, `?tag=type:slug` synchronisés au mount)
- `src/app/[locale]/product/[slug]/page.tsx` + `ProductClient`
- `src/app/[locale]/marques/page.tsx` — **index data-driven des marques** (Server, SSR Supabase) + `marques/[slug]/page.tsx`
- `src/app/[locale]/besoins/[slug]/page.tsx` — landing par tag de besoin
- `src/app/[locale]/favoris/page.tsx` — wishlist user

*Tunnel réservation*
- `src/app/[locale]/cart/page.tsx`, `/reservation/page.tsx`, `/reservation/confirmation/[id]/page.tsx`

*Éditorial / Service*
- `src/app/[locale]/a-propos/page.tsx`, `/contact/page.tsx`
- `src/app/[locale]/livraison/page.tsx` — click & collect workflow
- `src/app/[locale]/faq/page.tsx` — 5 sections, 19 Q&A, `<details>` natifs
- `src/app/[locale]/pharmacies/page.tsx` — page pharmacie (1 lieu, sans table DB)
- `src/app/[locale]/manifeste/page.tsx` — valeurs/positionnement

*Legal (FR uniquement pour le contenu juridique, UI tri-langue)*
- `src/app/[locale]/legal/{mentions-legales,cgv,confidentialite,cookies}/page.tsx`
- `LegalShell` + `LegalSidebar` + `LegalSection` partagés (`src/components/legal/`)
- `CookieBanner` monté dans `[locale]/layout.tsx`

*Auth & compte (hub avec sidebar 5 onglets)*
- `src/app/[locale]/(auth)/{login,signup,forgot-password,reset-password}/page.tsx`
- `src/app/[locale]/account/layout.tsx` — check session SSR + `AccountSidebar` (Client, usePathname)
- `src/app/[locale]/account/{profile,reservations,security,preferences}/page.tsx`

**Admin (non localisé, ES/FR mélangé)** sidebar 5 sections (General/Catálogo/Operaciones/Clientes/Cuenta) :
- `src/app/admin/*` — `product`, `marques`, `stock`, `tags`, `messages`, `annonce`, `reservations`, **`users`**, **`newsletter`**, `setup` (diag), `settings` (démo)

**API** :
- `src/app/api/admin/*` — **20 routes** service-role (toutes `requireAdmin()`) : `products`, `brands`, `ranges`, `tags`, `tag-types`, `banners`, `messages`, `reservations`, `stock`, `upload`, `sidebar-stats`, `users` (GET/PATCH), `newsletter` (GET/DELETE/CSV export)
- `src/app/api/account/preferences` — PATCH auth-only (preferred_locale)
- `src/app/api/cart/{,reserve}` — public (rate-limited pour reserve)
- `src/app/api/contact` — public + rate limit (5/min/IP)
- `src/app/api/search` — public ilike + mode `?bestsellers=1`
- `src/app/api/newsletter` — POST publique (rate-limited) OU auth (re-sub depuis preferences) + GET/DELETE auth-only
- `src/app/api/wishlist` — auth required
- `src/app/auth/callback` — OAuth Supabase

**SEO** :
- `src/app/sitemap.ts` — dynamique : routes statiques (catalogue/marques/legal/livraison/faq/…) + produits + brands + needs × 3 locales avec hreflang
- `src/app/robots.ts` — disallow admin/api/account/auth/cart
- `generateMetadata` + hreflang `x-default` sur toutes les pages publiques

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
- `tag_types` → `tags` → `product_tags` (tags polymorphes ; `tags.featured_on_home` curate les 3 cards "Besoins" sur la home)
- `product_images` (multi-images ; **doublon avec `products.image_url`** — finding archi #3, non corrigé)
- `products` enrichis sprint 2 : `volume`, `pharmacist_advice`, `pharmacist_name`, `benefits[]`, `usage`, `inci`, `technical_pdf_url`, `skin_type[]`, `texture`, `old_price`, `is_new`, `is_featured`
- `profiles.preferred_locale` (`fr|en|es|null`, ajouté sprint 4) — utilisé par `/account/preferences`
- `carts` + `cart_items` (guest via `anonymous_id`, authenticated via `user_id`)
- `reservations` + `reservation_items` (système de réservation, snapshot pattern, partial unique 1 active par user, pg_cron expire après 24h)
- `wishlists` (favoris user, PK composite `(user_id, product_id)`, RLS "users manage own")
- `newsletter_subscribers` (email UNIQUE, lang CHECK, RLS service-role only)
- `rate_limit_buckets` (fixed-window pour /api/contact + /api/newsletter)
- `orders` + `order_items` (legacy, pas branché — peut-être à supprimer)
- `banners` (sprint 2 : 3 variantes `editorial`/`hero`/`quote` + colonnes `direction`, `attribution_name/title/photo_url` ; legacy 6 types tolérés dans la colonne `text`), `contact_messages`
- Vue `v_bestsellers` : tri produits par `sold_30d desc` + `is_featured desc` + `created_at desc`, consommée par home + nav-search fallback

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
- `Nav`, `Footer`, `LocaleSwitcher`, `Banner` — chrome
- `Home`, `Catalogue`, `Filters`, `Product`, `Cart`, `Reservation`, `AddToCart`
- `Login`, `Signup`, `Profile`, `Contact`, `ContactForm`, `About`, `Favoris`
- `PageMeta.{home,catalogue,...}` — title + description SEO par page
- `NavSearch` — recherche dropdown (placeholder, recents, popular, no-results, keyboard hints)
- `Home.{hero,bestsellers,byNeed,brands,expertise,routine}` — sections home sprint 2

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
- **`src/hooks/useWishlist.ts`** — SWR sur `/api/wishlist` + `has(productId)` + `toggle()` optimistic. Retourne `needAuth: true` si non connecté (le bouton heart redirige vers `/login?redirectedFrom=/favoris`).

### Architecture composants (post sprint 2 design)

Découpage par scope/page :
- **`src/components/home/*`** — `HomeHero`, `HomeBestsellers`, `HomeByNeed`, `HomeBrands`, `HomeExpertise`, `HomeRoutine`, `HomeSectionHeader` (header partagé)
- **`src/components/banners/*`** — `BannerEditorial`, `BannerHero`, `BannerQuote`. `Banner.tsx` racine est un dispatcher sur `type` + normalize pour rétro-compat des 6 anciens `banner_type`.
- **`src/components/pdp/*`** — `PdpGallery`, `PdpAccordions` (5 `<details>` natifs), `PdpPharmacist` (variantes A/B, conditionnel), `PdpStickyBar` (IntersectionObserver mobile), `PdpTrustSignals`, `PdpQuantity`, `PdpStockBadge`, `PdpWishlistButton`
- **`src/components/footer/*`** — `FooterNewsletter` (form POST `/api/newsletter` optimistic). Le `Footer.tsx` racine est sur fond `ink-900` avec grid 5 colonnes (Brand+socials | Produits | Besoins | Service | FARMAU) + bottom bar legal/payments.
- **`src/components/NavSearch.tsx`** — input + dropdown sticky avec recents (localStorage `farmau:search:recents`), popular categories, résultats live SWR `/api/search`, bestsellers fallback en no-result, navigation clavier ↑↓ ↵ Esc, `⌘K`/`Ctrl+K` global.
- **`src/components/MobileDrawer.tsx`** — off-canvas fullscreen, nav serif italique actif, LocaleSwitcher block, footer login/admin/signout.
- **`src/components/Logo.tsx`** — cercle sand-50 + glyph `F` Instrument Serif italic + wordmark FARMAU, taille paramétrique.
- **`src/components/Breadcrumb.tsx`** — fil d'Ariane générique séparateur `›`.
- **`src/components/ProductCardHeart.tsx`** — bouton heart top-right de l'image ProductCard, propagation arrêtée (la card est un `<Link>`).

## Conventions

- **i18n** : tout texte UI passe par `useTranslations`/`getTranslations`. Pas de string FR dur dans le code. Le contenu BDD (noms produits, marques) reste tel quel.
- Path alias `@/*` → `src/*`.
- TypeScript `strict: true`, **0 erreur tsc**. Lint : ~38 warnings (mostly `any` dans admin pages, non bloquants).
- ESLint warnings non bloquants au build (cf `eslint.config.mjs`). Le fichier `database.types.ts` est ignoré (généré).
- **Ne jamais commit sans demande explicite** (règle Cursor `alwaysApply`).
- **Pre-commit hook** (Husky + lint-staged) : `eslint --fix --no-warn-ignored` sur les TS/TSX stagés.
- **CI** (`.github/workflows/ci.yml`) : lint + tsc + vitest sur PR et push main.

## État du projet (2026-05-21)

### Fait ✅ (sessions 2026-05-21, post sprint 3)

Surfaces publiques ajoutées (commits `279f462` → `46ea917`) :
- `/marques` index data-driven (commit `279f462`) + filtres URL sur catalogue (`?brand`, `?range`, `?need`, `?tag=type:slug` matching name ou slug) + `not-found.tsx` design FARMAU (NavBar + Footer + serif italic 160px) global + locale-aware
- 4 pages légales `/legal/{mentions-legales,cgv,confidentialite,cookies}` avec contenu FR pré-rédigé (Ley 172-13 + 358-05 + 126-02 RD), composants `LegalShell/Sidebar/Section` partagés, disclaimer "à valider par juriste" + `CookieBanner` (localStorage `farmau:cookies:consent`) (commit `da37dfe`)
- Hub `/account` (Server layout + check session) avec sidebar 5 onglets : `profile` (refactor), `reservations` (SSR historique avec status badges + lien WhatsApp), `security` (CTA email reset → /reset-password + danger zone mailto RGPD), `preferences` (toggle newsletter + select langue préférée via `profiles.preferred_locale`). Migration `profiles.preferred_locale`, APIs `/api/newsletter` étendues (GET/DELETE auth) + `/api/account/preferences` PATCH (commit `ac1f9c3`)
- 4 pages éditoriales statiques `/livraison`, `/faq` (5 sections 19 Q&A), `/pharmacies` (1 lieu), `/manifeste` (4 piliers + citation dark mode) + traductions exhaustives FR/EN/ES (commit `46ea917`)
- Admin `/admin/users` (lecture via `auth.admin.listUsers` + jointure profiles + admin_users, toggle Promover/Admin avec garde-fou self-demote) + `/admin/newsletter` (stats + filtre lang + export CSV + delete par ligne). Sidebar admin nouvelle section "Clientes". Suppression `/admin/my-team` démo (commit `ebad106`)
- Footer bottom-bar câblé vers /legal/* + cellule Productos /besoins/[slug] + cellule Marca câblée /marques /pharmacies /manifeste
- Curation home active : 4 produits `is_featured=true` (Avène Hyaluron B3 Serum, Avène Hydrance Aqua Gel, Babe Aloe Vera, Babe Bicalm+) + 3 tags `featured_on_home=true` (hydratation, anti-age, protection-solaire)

### Fait ✅ (sessions 2026-05-19/20)

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

Sprint 2 design (commits `677622c` → `c37a915`) :
- ProductCard refondue (eyebrow marque, prix Instrument Serif 24px, CTA outline ink-900, quick-add au hover)
- NavBar 3 rangées desktop sticky + drawer mobile + recherche `⌘K` avec dropdown (recents localStorage + popular + résultats live SWR + bestsellers fallback no-result)
- Fiche produit avec 5 accordéons `<details>` natifs + galerie sticky desktop + zoom natif + pharmacist conditionnel + sticky bar mobile via IntersectionObserver
- 6 anciennes bannières → 3 nouvelles (`editorial`/`hero`/`quote`) avec rétro-compat via `normalizeType`. Admin annonce form refait avec radio 3 types + champs conditionnels (direction + attribution_*)
- Home + Footer complets : 7 sections home (Hero éditorial → Bestsellers v_bestsellers → ByNeed tags featured → Quote pharmacist → Brands → Expertise → Routine), Footer 5 colonnes câblé + newsletter form
- Wishlist système complet (commits `e35b307` + `cd9ebd1`) : table `wishlists` RLS + `/api/wishlist` GET/POST toggle + `useWishlist` hook + `ProductCardHeart` + `PdpWishlistButton` fonctionnel + page `/favoris`
- Migration consolidée sprint 2 (`cf8f581`) : 12 nouvelles colonnes products, tags.featured_on_home, 4 colonnes banners (direction + attribution_*), table wishlists + RLS, vue v_bestsellers, 7 indexes FK

### Reste à faire

**Quick wins SEO / perf** :
- JSON-LD Product schema sur `/product/[slug]` (rich snippets Google)
- 3 `<img>` restants → `next/image` : `CartDrawer`, `ProductClient×2` (impact LCP fiche produit)
- Migration `banner_type_enum` strict : la colonne reste `text` pour compat legacy

**Accessibilité (WCAG AA — note 38/100 avant refonte, à re-mesurer)** :
- Remplacer ~50 `focus:outline-none` par `focus-visible:ring sand-700`
- Modales sans `role="dialog"` + focus trap (CartDrawer, MobileDrawer le font déjà)
- Audit contraste palette sand/clay (certains hover passent juste WCAG AA)

**Contenu éditorial** :
- Blog : table `posts` + admin CRUD + `/blog` + `/blog/[slug]` + sitemap (Footer "blog" pointe encore vers `/a-propos`)
- Saisie INCI / benefits / pharmacist_advice sur les 353 produits (colonnes prêtes, contenu à fournir)
- Traductions ES/EN du contenu juridique `/legal/*` (FR uniquement actuellement)

**Hygiène long terme** :
- `<html lang>` dynamique : route group `(admin)` pour séparer admin/public
- Stockage image dédupliqué : `products.image_url` + `product_images` → choisir un seul
- Tests d'intégration admin Playwright + `/account/*` Playwright
- Split pages admin > 500 lignes (`tags` 753, `annonce` ~890, `marques` 708, `product` 703)
- Fallback `localStorage` pour tokens Supabase (finding security #4, XSS exfiltration)
- Double opt-in newsletter (provider d'envoi : Resend/Postmark)
- Vraie `/admin/settings` câblée à une table `shop_settings`
- Audit RPC SECURITY DEFINER pour `SET search_path = public` manquants

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
