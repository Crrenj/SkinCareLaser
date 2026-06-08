# CLAUDE.md

Guide pour les futures instances de Claude Code sur ce repo.

## Stack

Next.js 15.5.18 (App Router) + React 19 + Supabase (Auth, Postgres + RLS, Storage) + Tailwind 4 + **next-intl 4.12** (FR/EN/ES). Tout le texte UI passe par les fichiers de traduction. Marché cible : République Dominicaine (devise `DOP`, locale par défaut `fr`).

## Modèle & orchestration agents

- **Modèle** : toujours **Opus 4.8** (`claude-opus-4-8`) en **effort max**. Pinné dans `.claude/settings.json`, `.claude/settings.local.json` et `~/.claude/settings.json` (clés `model` + `effortLevel: "max"`). Ne jamais redescendre en 4.7.
- **Agents indépendants** : tout sous-agent tourne aussi en Opus 4.8 max effort — passer `model: "opus"` au tool Agent (résout vers la dernière Opus = 4.8 ; l'effort est hérité du parent).
- **Pas de restriction** : aucune limite sur les tokens consommés ni sur le nombre d'agents parallèles. Privilégier le fan-out massif (un agent par workstream) plutôt que le sériel quand la tâche s'y prête.
- Préférences détaillées d'orchestration d'audit : voir la mémoire `audit-orchestration-prefs`.

## Commandes courantes

```bash
npm run dev                  # http://localhost:3000 (Turbopack)
npm run build && npm start   # build prod
npm run lint                 # ESLint (0 warning depuis 2026-05-22)
npm run test:unit            # Vitest, 8/8 tests passent
npm run test                 # Playwright (50 tests, 47 passing + 2 flaky)
npm run test:smoke           # 4 smoke tests golden path (~45s, chromium-only)
npm run test:auth            # 19 tests auth-guard /admin & /account redirects (~50s)
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
RESEND_API_KEY=...               # optionnel — sans elle, newsletter = single opt-in direct
```

Template versionné : `.env.local.example` (copier en `.env.local` et remplir).

## Architecture

### Trois clients Supabase — choisir le bon

| Client | Fichier | Usage |
|---|---|---|
| Browser | `src/lib/supabaseClient.ts` | Client Components uniquement. Pas de fallback `localStorage` pour les tokens (audit security #4 fermé 2026-05-23) — cookie Supabase SSR uniquement. |
| Server (cookies) | `src/lib/supabaseServer.ts` | Server Components, route handlers agissant pour le user. |
| Service-role | `src/lib/supabaseAdmin.ts` | Singleton typé avec `Database`. Utilisé par toutes les routes `/api/admin/*` + `/api/contact` (rate limit) + `/api/cart` GET/POST/DELETE (RLS sur `cart_items` exige un claim JWT `anonymous_id` jamais émis, validation faite côté route). Bypasse RLS. |

Types Supabase générés dans **`src/lib/database.types.ts`** (via MCP `generate_typescript_types`). À regénérer après chaque migration touchant les types.

### Auth & gating admin

1. **`src/middleware.ts`** chaîne :
   - `/admin/*` → check session Supabase SSR + `is_admin`
   - `/auth/callback` → passthrough (OAuth Supabase)
   - tout le reste → `next-intl` (routing locale `/(fr|es|en)/...`)
2. **`src/app/admin/layout.tsx`** — re-check côté client via `useIsAdmin` hook.
3. **`src/lib/requireAdmin.ts`** — helper pour les routes `/api/admin/*` (toutes les 20 routes admin sont maintenant gardées).

La table `admin_users` est la **source de vérité unifiée** : middleware, `requireAdmin` helper, pages `/login` + `/auth/callback`, et hook `useIsAdmin` lisent tous la RPC `is_user_admin(check_user_id)`. La colonne legacy `profiles.is_admin` a été droppée (migration `20260523104708`) — plus aucun consommateur, plus de sync.

**Hiérarchie de rôles** (migration `20260529120000`) : `admin_users.role` ∈ `{admin, super_admin}`. `is_user_admin` reste binaire (présence dans la table = accès panel) — **inchangée**. La gestion de l'équipe admin (promouvoir/révoquer/changer de rôle) est réservée aux **super_admin** via `requireSuperAdmin()` (`src/lib/requireAdmin.ts`, + `getAdminRole(userId)`). Garde-fous serveur : pas d'auto-modification, pas de modification d'un AUTRE super_admin (anti-coup / anti-orphelinage → retrait d'un super_admin = en base). UI : page `/admin/admins` (section *Acceso* sidebar) + `GET /api/admin/admins` ; la mutation passe par `PATCH /api/admin/users/[id]` (désormais super-admin only, body `{ isAdmin?, role? }`). L'owner fondateur (`j@gmail.com`) est seedé super_admin.

**Modèle « un compte, deux casquettes »** (2026-06-04) : un admin **n'est pas** un compte séparé — c'est un compte client + une ligne `admin_users` (**additif** ; il garde panier/réservations/favoris/profil, aucun privilège client perdu). L'UX reflète ça : footer sidebar admin → **« Voir le site »** + **« Mon compte »** (`/account/profile`) ; sidebar `/account` → **« Panneau admin »** si `is_user_admin` (calculé server-side dans `account/layout.tsx`). **Pas de page profil dédiée dans l'admin** : on réutilise `/account/*` (choix explicite, zéro duplication — ne pas créer `/admin/account`). **Landing post-login** = `ADMIN_HOME_PATH` (= **`/admin`**, le dashboard avec stats), mais `login/page.tsx` + `/auth/callback` font primer `redirectedFrom`/`next` pour TOUT LE MONDE (l'admin n'est plus happé vers le dashboard s'il visait une page précise). Création d'un admin = **promouvoir un inscrit** via `/admin/users` (pas d'invitation email). Mémoire `account-model-one-user-two-hats`.

### Route map

**Pages publiques sous `[locale]/`** (FR/EN/ES) — `not-found.tsx` design FARMAU au niveau locale :

*Catalogue & produit*
- `src/app/[locale]/page.tsx` — accueil **éditorial** (refonte `home-moderna`, 2026-06) : Hero éditorial (sans dégradé) → brandline marquee → Bestsellers (01) → besoins (02) → quote → expertise → routine (03) + bannières CMS. Ordre/visibilité pilotés par `shop_settings.home_layout` (`resolveHomeLayout`)
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
- `src/app/[locale]/pharmacie/page.tsx` — page pharmacie (1 lieu, sans table DB)
- `src/app/[locale]/manifeste/page.tsx` — valeurs/positionnement

*Legal (contenu juridique : CGV + confidentialité = FR + ES sélectionné par locale dans la page ; mentions-légales + cookies = FR only ; UI tri-langue)*
- `src/app/[locale]/legal/{mentions-legales,cgv,confidentialite,cookies}/page.tsx`
- `LegalShell` + `LegalSidebar` + `LegalSection` partagés (`src/components/legal/`)
- `CookieBanner` monté dans `[locale]/layout.tsx`

*Auth & compte (hub avec sidebar 5 onglets)*
- `src/app/[locale]/(auth)/{login,signup,forgot-password,reset-password}/page.tsx`
- `src/app/[locale]/account/layout.tsx` — check session SSR + `AccountSidebar` (Client, usePathname)
- `src/app/[locale]/account/{profile,reservations,security,preferences}/page.tsx`

*Blog*
- `src/app/[locale]/blog/page.tsx` — index des posts publiés (SSR, `revalidate=60`)
- `src/app/[locale]/blog/[slug]/page.tsx` — post individuel (metadata, hreflang)

**Admin (localisé FR/ES/EN via cookie)** sidebar 6 sections (General/Catálogo/Operaciones/Clientes/Configuración [settings + apariencia]/Acceso [admins]) :
- `src/app/admin/*` — `product`, `marques`, `stock`, `tags`, `messages`, `annonce`, `reservations`, **`users`**, **`newsletter`**, **`blog`**, **`apariencia`** (thème du site), `setup` (diag), `settings`

**API** :
- `src/app/api/admin/*` — **28 fichiers `route.ts`** service-role (toutes `requireAdmin()`, toutes validées Zod via `src/lib/schemas.ts`) : `products` (+`[id]`, +`with-tags`), `brands` (+`[id]`), `ranges` (+`[id]`), `tags` (+`[id]`), `tag-types` (+`[id]`), `banners` (+`stats`), `messages`, `reservations`, `stock`, `upload`, `sidebar-stats`, `users` (GET/PATCH, +`[id]`), `newsletter` (GET/DELETE/CSV export, +`[id]`), `posts` (GET/POST/PATCH/DELETE), `appearance` (GET/PATCH thème + `revalidateTag`), `settings`, `admins` (super-admin only), `home-layout`, `set-locale`
- `src/app/api/account/preferences` — PATCH auth-only (preferred_locale)
- `src/app/api/cart/{,reserve,merge}` — public (GET/POST/PATCH/DELETE ; rate-limited pour reserve, merge = httpOnly cookie server-side). **POST appelle `add_to_cart` qui INCRÉMENTE ; PATCH écrit la quantité ABSOLUE** (`.update()` direct sur `cart_items` en service-role) pour le stepper panier — ne pas confondre.
- `src/app/api/contact` — public + rate limit (5/min/IP) + CSRF origin check
- `src/app/api/search` — public ilike + mode `?bestsellers=1`
- `src/app/api/newsletter` — POST publique (rate-limited + CSRF, double opt-in via Resend) OU auth (re-sub depuis preferences) + GET/DELETE auth-only
- `src/app/api/newsletter/confirm` — GET public (valide `confirmation_token`, marque `confirmed_at`)
- `src/app/api/wishlist` — auth required
- `src/app/api/theme` — **GET public** : thème d'apparence courant (`getThemeConfig`, `Cache-Control: no-store`). Source unique du favicon client (`ThemeFavicon`) + du thème du shell admin (`_AdminShell`)
- `src/app/auth/callback` — OAuth Supabase

**SEO** :
- `src/app/sitemap.ts` — dynamique : routes statiques (catalogue/marques/blog/legal/livraison/faq/…) + produits + brands + needs + blog posts × 3 locales avec hreflang
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
- `brands` → `ranges` → `products` via `products.range_id` (FK directe 1-n depuis migration `20260522205544`, plus de table n-n)
- `tag_types` → `tags` → `product_tags` (tags polymorphes ; `tags.featured_on_home` curate les 3 cards "Besoins" sur la home)
- `product_images` (multi-images ; source unique pour l'image produit — la colonne `products.image_url` a été supprimée le 2026-05-22)
- `products` enrichis sprint 2 : `volume`, `pharmacist_advice`, `pharmacist_name`, `benefits[]`, `usage`, `inci`, `technical_pdf_url`, `skin_type[]`, `texture`, `old_price`, `is_new`, `is_featured`, `range_id`
- `profiles.preferred_locale` (`fr|en|es|null`, ajouté sprint 4) — utilisé par `/account/preferences`
- `carts` + `cart_items` (guest via `anonymous_id` cookie, authenticated via `user_id`). Merge anon→user au login : RPC `merge_anon_cart_to_user` SECURITY DEFINER (la policy UPDATE de `carts` empêche le UPDATE direct quand `user_id IS NULL`). Routes `/api/cart` utilisent `supabaseAdmin` pour les SELECT `cart_items` (la policy lit `auth.jwt() ->> 'anonymous_id'` qui n'est jamais émis par Supabase Auth).
- `reservations` + `reservation_items` (système de réservation, snapshot pattern, partial unique 1 active par user, pg_cron expire après 24h)
- `wishlists` (favoris user, PK composite `(user_id, product_id)`, RLS "users manage own")
- `posts` (blog : `title`, `slug` UNIQUE, `body` HTML, `excerpt`, `cover_image_url`, `locale`, `is_published`, `published_at`, RLS public SELECT published + admin ALL, indexes slug/published/locale)
- `newsletter_subscribers` (email UNIQUE, lang CHECK, `confirmation_token` UNIQUE partiel + `confirmed_at` pour double opt-in, RLS service-role only)
- `rate_limit_buckets` (fixed-window pour /api/contact + /api/newsletter)
- `shop_settings` (single-row `id = 1 CHECK`, RLS public SELECT + admin UPDATE via `is_user_admin`) — nom, contact, pickup, tarifs livraison (édité via `/admin/settings`) + **apparence** : `theme` (6 valeurs CHECK), `default_mode` (light/dark/system), `allow_visitor_mode` (édité via `/admin/apariencia`, migration `20260528120000`)
- ~~`orders` + `order_items`~~ — supprimées (migration `20260527110000`, 0 ligne, jamais branchées)
- `banners` (Sprint 3 refonte : enum `banner_slot` (hero/banner/card/modal) + enum `banner_status` (draft/scheduled/active/paused/expired) + colonnes `direction`, `attribution_name/title/photo_url`, `start_date`, `end_date`, `view_count`, `click_count`), `contact_messages`
- Vue `v_bestsellers` : tri produits par `sold_30d desc` + `is_featured desc` + `created_at desc`, consommée par home + nav-search fallback

État BDD actuel (projet `adxpoxcynrpnbbxnncsk`, vérifié 2026-06-06 via MCP) : 13 brands, 52 ranges, **353 produits actifs à stock=50, 100 DOP placeholder** (tous ont un `range_id`), 299 product_images, 36 tags, 844 product_tags, **2 admins**, 1 row dans shop_settings, **4 posts (3 publiés)**. Tables `orders`/`order_items` supprimées (migration `20260527110000`). 28 RLS policies optimisées avec `(SELECT auth.uid())` + `is_user_admin` STABLE (migration `20260527100000`). Enums `banner_slot` (4 valeurs) + `banner_status` (5 valeurs) ajoutés (migration `20260527212633`).

### i18n (next-intl)

- **Config** : `src/i18n/routing.ts` (3 locales, default `fr`, `localePrefix: 'always'`)
- **Loader** : `src/i18n/request.ts` — résolution duale depuis 2026-05-26 :
  - segment `[locale]` URL → pages publiques `/fr/...`, `/es/...`, `/en/...`
  - sinon fallback **cookie `farmau_admin_locale`** → pages `/admin/*` (pas de segment locale dans l'URL, switch in-place via le footer sidebar)
  - fallback final : `routing.defaultLocale` (fr)
  - export `ADMIN_LOCALE_COOKIE` réutilisable
- **Navigation helper** : `src/i18n/navigation.ts` expose `Link`, `useRouter`, `usePathname`, `redirect` locale-aware
- **Composants Client** : `useTranslations('Namespace')`
- **Composants Server** : `await getTranslations({ locale, namespace: 'Namespace' })` + `setRequestLocale(locale)` pour ISR
- **`LocaleSwitcher`** : composant utilisé dans NavBar (variant inline) + MobileDrawer (variant block)
- **Admin header-tools (langue + thème)** : `HeaderTools.tsx` (client) rendu dans le `PageHeader` de toutes les pages `/admin/*` (alignement maquette *Sprint 3 - Admin Dashboard*, 2026-06-01 — **plus dans la sidebar**). Deux segmented controls : FR/ES/EN + bascule clair/sombre. Langue → POST `/api/admin/set-locale` (admin-only, valide la locale, pose le cookie 1 an `sameSite=lax`) → `router.refresh()`. Thème → `AdminModeContext` (état + persistance `localStorage['farmau:admin-mode']` dans `_AdminShell`)
- **Helpers SEO** : `src/lib/seo.ts` (`localizedPath`, `buildLanguageAlternates` avec `x-default`)

Namespaces principaux dans `src/messages/*.json` :
- `Nav`, `Footer`, `LocaleSwitcher`, `Banner` — chrome
- `Home`, `Catalogue`, `Filters`, `Product`, `Cart`, `Reservation`, `AddToCart`
- `Login`, `Signup`, `Profile`, `Contact`, `ContactForm`, `Favoris`
- `About.{hero,stats,manifest,team,criteria,visit,partner,review,cta}` — refonte 8 sections Sprint 4 (2026-05-26)
- `Pharmacie` (renommé de `Pharmacies` 2026-05-23, page unique Cerros de Gurabo)
- `PageMeta.{home,catalogue,pharmacie,about,...}` — title + description SEO par page
- `NavSearch` — recherche dropdown (placeholder, recents, popular, no-results, keyboard hints)
- `Home.{hero,bestsellers,byNeed,brands,expertise,routine}` — sections home sprint 2
- `Admin.{chrome,sidebar,crumbs,common,stockState,product,marques,stock,tags,messages,annonce}` — admin localisé (2026-05-26, ~130 clés)
- `Admin.{modals.product,modals.brand,modals.range,modals.tag,modals.tagType,modals.banner}` — 6 modaux d'édition (2026-05-27, ~120 clés)
- `Admin.{reservations,users,newsletter,settings,setup}` — 5 pages admin restantes (2026-05-27, ~150 clés). **Admin entièrement localisé FR/ES/EN (~400 clés).**
- `Admin.blog` — admin blog CRUD (2026-05-27)
- `Admin.appearance` — écran thème `/admin/apariencia` (2026-05-28) ; `Footer.themeTo{Light,Dark}` pour le toggle visiteur
- `Blog` — pages publiques blog (heading, subtitle, empty, meta)
- `Error` — error boundary (title, body, retry, home)

### Système de thèmes (palette admin + logo monochrome)

6 palettes (**Terra** défaut · Noir · Botánico · Coral · Marino · Ámbar) × clair/sombre, choisies par l'admin et appliquées au site public. Handoff design : `design_handoff_themes_system/`. Source unique des métadonnées : `src/lib/themes.ts`.

- **Tokens** (`globals.css`) : les utilitaires Tailwind `sand-*`/`ink-*`/`clay-*` pointent vers des variables d'ancrage `--c-*`. Chaque combinaison `[data-theme][data-mode]` ne définit que **6 ancres** (bg/surface/text/accent/accent-strong/bird) ; le reste de la rampe (bordures, gris, teintes) est **dérivé via `color-mix`** dans le bloc `[data-theme]`. → tout le markup existant (`bg-sand-50`, `text-ink-900`, `bg-clay-700`…) se re-thématise sans changement. Statuts (olive/brick/ochre) **non thémés**. Footer & zones volontairement sombres = tokens `--c-ink-panel*` (restent sombres dans les 2 modes ; en mode clair ils reproduisent l'ancien look). ⚠️ Les mappings `--color-* : var(--c-*)` sont déclarés DANS `@theme` (génère les utilitaires) **ET** redéclarés dans le bloc `[data-theme]` : sans ça ils se résolvent/figent sur `:root`, et un `[data-theme]` imbriqué (shell admin) ne re-thématise rien (cf. Pièges + mémoire `theme-nested-resolution-gotcha`). **Rampe complète + contraste (2026-06-03)** : toutes les teintes *utilisées* sont définies (ink-50→900 dont 100/300/600 ; clay-50→900 ; olive/brick statiques avec 100/700/…) — une teinte **non** déclarée ne génère **aucune** couleur → élément invisible. Les tokens de texte muté ont été remontés pour WCAG AA (`--c-ink-400/500/700`, `--c-neutral-500/600` ; `ink-500` ≈ **5.4:1**).
- **Injection serveur** : `getThemeConfig()` (`src/lib/getThemeConfig.ts`) lit `shop_settings` via un client anon **sans cookies** + `unstable_cache` (tag `shop-theme-config`, invalidé par `revalidateTag` au save admin) → **ne force pas le rendu dynamic**, les pages `[locale]` restent SSG. Le root layout pose `<html data-theme data-mode>` + script anti-flash (résout `system`/override visiteur avant le 1er paint).
- **Favicon + thème public en direct (client)** : **`src/components/ThemeFavicon.tsx`** (client) lit le thème live via **`GET /api/theme`** (SWR) et, à chaque navigation : **(1)** réécrit les `<link rel=icon>` (toutes routes) + retire tout favicon concurrent ; **(2)** applique **`data-theme` en direct sur `<html>` pour les routes PUBLIQUES** (`!pathname.startsWith('/admin')` — l'admin garde sa gestion via `_AdminShell`). → un changement d'apparence admin se reflète sur le site public **sans rechargement** (le `<html data-theme>` SSR est figé au build sur les pages SSG / jamais re-rendu en navigation interne ; le client le corrige). **Aucun appel réseau en plus** (même requête SWR `/api/theme` que le favicon). `src/app/favicon.ico` **supprimé** (Next l'injectait → logo FARMAU concurrent gagnait sur l'admin).
- **Admin = thème d'apparence** : `_AdminShell` pose `data-theme={siteTheme}` (thème d'apparence lu sur `<html data-theme>` frais au mount + `/api/theme` pour le live) — **plus forcé Terra**. Seul le **mode clair/sombre** reste propre à l'admin (`AdminModeContext`, toggle du `HeaderTools`, persisté `localStorage['farmau:admin-mode']`). Save `/apariencia` → `globalMutate('/api/theme')` (update live). Le `<div>` racine du shell pose aussi **`text-ink-900`** : sinon le texte admin sans classe explicite hérite de `body{color}` figé sur le mode **site/visiteur** → inputs illisibles quand mode admin ≠ mode visiteur (cf. Pièges).
- **Logo monochrome** : `src/components/brand/FarmauLogo.tsx` (`FarmauBird`/`FarmauWord`/`FarmauLockup`) via `mask-image` + `--c-bird` (masques dans `public/brand/`). Remplace l'ancien `Logo` (supprimé). Utilisé NavBar + MobileDrawer + Footer.
- **Favicons** : `npm run favicons:build` (`scripts/build-favicons.cjs`, sharp) → 24 PNG `public/favicons/{theme}-{16,32,64,180}.png` (logo officiel disque+oiseau recomposé par luminance). Le `<head>` injecte le set du thème actif.
- **Toggle visiteur** : `ThemeModeToggle` (footer, monté si `allow_visitor_mode`) → bascule `data-mode` + persiste `localStorage['farmau:mode']`.
- **Écran admin** : `/admin/apariencia` (sidebar → *Personalización*) — grille 6 cartes + toggles mode/visiteur. API `/api/admin/appearance` GET/PATCH (Zod `appearanceBody`). i18n `Admin.appearance` FR/ES/EN.
- **Limite connue** : le mode **sombre** est neuf. Des bandes décoratives volontairement sombres (AboutStats, AboutCriteria, BannerQuote, manifeste, WhatsappHero) s'inversent en clair en mode sombre (lisible mais inversé) — à convertir aux tokens `--c-ink-panel*` pour un sombre 100 % cohérent.

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
- **`src/components/home/*`** — `HomeHero`, `HomeBestsellers`, `HomeByNeed`, `HomeBrands`, `HomeExpertise`, `HomeRoutine`, `HomeSectionHeader` (header partagé). **Refonte éditoriale `home-moderna` (2026-06)** : index courants 01/02/03 dans `HomeSectionHeader`, `HomeBrands` = **brandline marquee** (`@keyframes marquee` dans `globals.css`), grilles séparées 1px, placeholders via `ui/Plate`, Hero sans dégradé/blobs
- **`src/components/about/*`** (Sprint 4, 2026-05-26) — `AboutSectionHead` (header numéroté partagé), `AboutHero`, `AboutStats`, `AboutManifest`, `AboutTeam`, `AboutCriteria`, `AboutVisit`, `AboutPartner` (Skin Laser Center carte clinique partenaire), `AboutLeaveReview` (CTA Google Reviews), `AboutCta`
- **`src/components/catalogue/*`** (Sprint 4, 2026-05-26) — `CatalogueHeader` (breadcrumb + serif 88px + compteur 60px), `CatalogueToolbar` (sticky, chips actifs + sort dropdown), `CatalogueSidebar` (flat 280px, chips toggle pour `types-peau`/`ingredients`, checkboxes ailleurs), `CataloguePagination` (tiles mono 36×36), `FiltersMobileSheet` + `FiltersPill` (déjà existants pour mobile)
- **`src/components/banners/*`** — `BannerEditorial`, `BannerHero`, `BannerQuote`. `Banner.tsx` racine est un dispatcher sur `type` + normalize pour rétro-compat des 6 anciens `banner_type`.
- **`src/components/pdp/*`** — `PdpGallery`, `PdpAccordions` (5 `<details>` natifs), `PdpPharmacist` (variantes A/B, conditionnel), `PdpStickyBar` (IntersectionObserver mobile), `PdpTrustSignals`, `PdpQuantity`, `PdpStockBadge`, `PdpWishlistButton`
- **`src/components/footer/*`** — `FooterNewsletter` = **bande claire `.news`** (sand-100) rendue AVANT le footer sombre (form POST `/api/newsletter` optimistic). Le `Footer.tsx` racine est sur fond `--c-ink-panel*` avec grid 5 colonnes (Brand+socials | Produits | Besoins | Service | FARMAU) + bottom bar legal/payments.
- **`src/components/admin/dashboard/*`** — `Sidebar` (sticky `top-0 h-screen` ; brand `FARMAU` + pill `Admin`, footer = carte identité avatar+email+rôle+logout + **ponts côté client** (« Voir le site » → boutique `/{locale}`, « Mon compte » → `/{locale}/account/profile`, locale via `useLocale()`) — **plus de switcher langue/thème ici**), `PageHeader` (crumbs + title serif + `HeaderTools` + actions, partagé par toutes les pages admin), `HeaderTools` + `AdminModeContext` (langue/thème du header, cf. section i18n), `StatusBadge`, **dashboard « vue 360° »** — données agrégées dans `src/app/admin/_dashboard/data.ts` (`getDashboardData()`, Node, sans migration), primitives partagées `WidgetCard`/`StatCard`/`MeterBar`/`MiniStat`/`DashboardSectionHeader`, et widgets `RevenueWidget`, `ReservationStatusWidget`, `CatalogueReadinessWidget`, `InventoryWidget`, `BrandBreakdownWidget`, `TopProductsWidget`, `LowStockWidget`, `CustomersWidget`, `EngagementWidget`, `ContentWidget`, `RecentReservationsWidget`, `RecentMessagesWidget`, `QuickActionsWidget` (espagnol en dur ; les 5 widgets historiques acceptent une prop `className` pour le placement dans la grille 12 colonnes)
- **`src/components/NavSearch.tsx`** — input + dropdown sticky avec recents (localStorage `farmau:search:recents`), popular categories, résultats live SWR `/api/search`, bestsellers fallback en no-result, navigation clavier ↑↓ ↵ Esc, `⌘K`/`Ctrl+K` global.
- **`src/components/MobileDrawer.tsx`** — off-canvas fullscreen, nav serif italique actif, LocaleSwitcher block, footer login/admin/signout.
- **`src/components/NavBar.tsx`** — barre unique 70px **non-sticky** (défile avec la page ; v2 commit `bc7e158`). Méga-menus catálogo/besoins, recherche plein écran (`nav/SearchOverlay`), panier (`CartDrawer`), drawer mobile, langue, compte. ⚠️ Les overlays/drawers sont rendus **HORS du `<header>`** (en frères via fragment) : son `backdrop-blur` (= `backdrop-filter`) en ferait sinon le bloc conteneur de leurs `position:fixed` (drawer panier qui déborde à droite → scroll horizontal, scrim coupé à 70px) — voir Pièges. Bouton panier = **toggle**. **`src/components/nav/ScrollToTop.tsx`** = bouton flottant « remonter en haut » (visible quand le header quitte le viewport, IntersectionObserver ; clé i18n `Nav.backToTop`).
- **`src/components/ThemeFavicon.tsx`** + **`IframeHeightReporter.tsx`** — favicon client par thème **+ sync `data-theme` live du site public** (cf. Système de thèmes) ; reporter de hauteur (postMessage) pour l'iframe d'aperçu home admin. (L'ancien `Logo.tsx` est supprimé — utiliser `FarmauLogo`.)
- **`src/components/Breadcrumb.tsx`** — fil d'Ariane générique séparateur `›`.
- **`src/components/ProductCardHeart.tsx`** — bouton heart top-right de l'image ProductCard, propagation arrêtée (la card est un `<Link>`).
- **`src/components/ProductCard.tsx`** — refonte Sprint 4 : aspect 4/5, flags top-left auto-dérivés (`isFeatured`/`isNew`/`oldPrice` → `best/new/promo`), fav top-right pill, quick-add hover via `AddToCartButton variant="card-cta-quick"`, prix serif 24px + suffix `/{volume}` mono, stock dot. data-testid `product-card` préservé.

**Shell admin** (`src/app/admin/`) :
- `layout.tsx` (Server) — résout la locale via `getLocale()` + charge messages via `getMessages()` + wrap avec `NextIntlClientProvider`, délègue à `_AdminShell` la logique client.
- `_AdminShell.tsx` (Client) — auth-gate via `useIsAdmin`, sidebar desktop + drawer mobile + barre mobile sticky. Affiche le spinner full-screen uniquement quand `loading && !user` (premier mount), pas sur re-check (évite le flash « reload » au retour de tab).

**Primitives UI partagées** (`src/components/ui/` — ajoutées en parallèle des docs 2026-05-26) :
- `PopClose.tsx` — bouton X de fermeture standardisé (drawers, modales)
- `Scrim.tsx` — overlay backdrop standardisé
- `Plate.tsx` — placeholder « plaque » hachuré (+ colibri optionnel) pour les emplacements image sans photo (home + bannières)
- Utilisés par `Sidebar.tsx`, `CartDrawer.tsx`, `MobileDrawer.tsx`, `ConfirmDialog.tsx`, `ReservationDrawer.tsx`. Si tu ajoutes un nouveau drawer/modal, réutilise ces primitives.

## Conventions

- **i18n** : tout texte UI passe par `useTranslations`/`getTranslations`. Pas de string FR dur dans le code. Le contenu BDD (noms produits, marques) reste tel quel.
- Path alias `@/*` → `src/*`.
- TypeScript `strict: true`, **0 erreur tsc**. Lint : **0 warning**. ESLint config honore `^_` pattern.
- ESLint warnings non bloquants au build (cf `eslint.config.mjs`). Le fichier `database.types.ts` est ignoré (généré).
- **Commit sur demande explicite** (règle Cursor `alwaysApply`) — pas de commit spontané.
- **Stager UNIQUEMENT les fichiers modifiés par la session courante** : `git add <chemins explicites>`, **jamais `git add -A` / `git add .`**. Une session parallèle peut avoir modifié ou **staged** d'autres fichiers ; `git commit` embarque TOUT l'index → on committe alors par erreur le travail d'autrui (incident vécu : du refactor PDP/i18n parallèle s'est retrouvé dans une commit de réservations). Réflexe avant commit : `git reset` (vide l'index) puis `git add` de tes seuls fichiers, et **vérifier `git diff --cached --name-only`** avant de committer.
- **Pre-commit hook** (Husky + lint-staged) : `eslint --fix --no-warn-ignored` sur les TS/TSX stagés.
- **CI** (`.github/workflows/ci.yml`) : lint + tsc + vitest + build + e2e sur PR et push main.

## État du projet (2026-06-08)

### Fait ✅ (session 2026-06-07 → 06-08 — module Comptabilité de bout en bout)

Construction d'un **module comptable complet** adossé au stock et aux ventes : du coût d'achat jusqu'au compte de résultat + exports DGII. **4 commits sur `main`** (`e289169`, `e33dd52`, `8abfb7a`, `8ed87cc`), **2 migrations appliquées prod** (`20260607130000`, `20260608120000`). Plan stock validé par 10 agents (`~/.claude/plans/jaunty-watching-moth.md`). Vérif à chaque lot : tsc 0 · lint 0 · build vert.

**1. Entrées de stock + prix de revient (CMP)** (`e289169`, migration `20260607130000_stock_entries_cost_basis.sql`) — fondation : capture enfin un COÛT par produit.
- `products.cost_price` = **coût moyen pondéré (CMP)**, cache recalculé UNIQUEMENT par RPC `record_stock_entries` (atomique, idempotente par `client_token`, verrou `FOR UPDATE`, NULL-safe, dé-duplique un produit multi-lignes). `recompute_cost_price` = réconciliation à vie.
- `reservation_items.unit_cost` = snapshot CMP **write-once** posé par `apply_reservation_collection` à la vente (collected) → marge figée par vente, jumeau de `unit_price`.
- Table `stock_entries` (réceptions append-only, **606-ready** : `supplier_name`/`supplier_rnc`/`ncf`/`invoice_date` + flag `itbis_included` ; `client_token` idempotence ; ancre future lots/péremption).
- 🔒 **Sécurité** : `cost_price`/`unit_cost` masqués à anon/authenticated. ⚠️ Un `REVOKE` au niveau **colonne est inopérant** tant qu'un `GRANT` table-level existe → révoquer le SELECT **table** + re-grant une **liste blanche** de colonnes (bloc `DO` dynamique, cf. mémoire `column-revoke-noop-under-table-grant`). Ne JAMAIS ajouter `cost_price` à `v_bestsellers` (SECURITY DEFINER servie à anon). Coût **hors** `productCreate/Update` (test vitest l'impose).
- UI : `StockEntryDrawer` dans `/admin/stock` (réception multi-lignes + section 606 repliable), colonnes **Coût/Marge %**, `StockEditModal` relabellé « Ajuste de inventario » (**réception ≠ ajustement absolu**). i18n `Admin.stock.entry` FR/ES/EN.

**2. Onglet Comptabilité** (`e33dd52`) — page serveur read-only **`/admin/contabilidad`** (`src/app/admin/contabilidad/_data.ts` `getAccountingData`, sélecteur de mois `?month=YYYY-MM`, **espagnol en dur** convention dashboard, lien sidebar `navAccounting` i18n, primitives dashboard réutilisées). CA, **COGS = Σ(unit_cost·qty) sur collected**, marge, **cobertura de coste** (unit_cost NULL **exclu**, jamais `COALESCE(…,0)` = marge inconnue ≠ 0), ventes par canal, marges par produit, inventario valorizado (coût vs vente), achats 606 du mois.

**3. Export CSV 606/607 DGII** (`8abfb7a`) — **`GET /api/admin/accounting/export?type=606|607&month`** (`src/lib/csv.ts` : anti-injection de formule + BOM/CRLF Excel). **606 réel** groupé par comprobante depuis `stock_entries` (base + ITBIS séparés) ; **607 = journal *borrador*** depuis les réservations collected (NCF vide — FARMAU n'émet pas de comprobante fiscal, couche e-CF différée).

**4. Dépenses + compte de résultat (P&L)** (`8ed87cc`, migration `20260608120000_expenses_table.sql`) — table **`expenses`** admin-only (RLS + service-role, CHECK 8 catégories, aucune surface publique). Routes **`/api/admin/expenses`** (GET ?month / POST) + `[id]` DELETE (Zod `expenseCreate`/`expenseDelete`, `created_by` = `auth.userId`). Page étendue : état de résultat **Ingresos − COGS − Gastos = Resultado neto** + `ExpensesPanel` (client : ajout/liste/suppression, `router.refresh()` recalcule le P&L côté serveur) + répartition par catégorie.

**Honnêteté du calcul** : tant que les coûts ne sont pas saisis (réceptions), marge « sin costes aún » + états vides gracieux (lien vers les entrées de stock) ; le P&L se remplit à l'usage. Le CMP est approximatif si on ajuste le stock en **absolu** (modal/form produit ne touchent pas `cost_price`) → `recompute_cost_price` répare.

**Reste à faire** : facturation **e-CF/NCF sur les ventes** (prérequis d'un vrai 607 + ITBIS ventes — taxabilité par produit, *medicamentos* exonérés) ; **clôture de caisse** journalière ; vue ledger `v_stock_ledger` (entrées ⊎ ventes ⊎ ajustements) ; table fournisseurs structurée ; lots/péremption ; ITBIS per-ligne (actuellement batch-level). **`db/schema.sql` non régénéré** cette session (entrelacé avec une session parallèle vente-comptoir/quick-create non committée — à démêler). Mémoires : `stock-entries-cost-basis-feature`, `column-revoke-noop-under-table-grant`.

## État du projet (2026-06-06)

### Fait ✅ (session 2026-06-06 — remédiation V1 post-audit, phases 0-5)

Exécution du plan `docs/audits/full-audit-2026-06-05/00-REMEDIATION-PLAN.md` (audit 38 workstreams, verdict GO-conditionnel, 0 P0 / 24 P1). **8 commits sur `main`** (`4030af9`→`b8b160b`), **1 migration appliquée (M1)**, 2 fixes de données DB. Vérif par phase : tsc 0 · lint 0 · build vert.

- **P0 `4030af9`** : `venv/` dé-suivi (1010 fichiers) ; **job e2e retiré de la CI** (écrivait en prod ; lancer `ALLOW_E2E=1 npm run test`) ; deps `npm audit fix` + **vitest@4 / happy-dom** ; `npm audit --audit-level=high` bloquant.
- **P1 `e065e33`** : **`getShopSettings` réécrit cookieless + `unstable_cache`** (tag `shop-settings-config`, modèle `getThemeConfig`) → fin du couplage `cookies()` + du FALLBACK figé ; `/api/admin/settings` PATCH → `revalidateTag` + validation email ; email canonique **`contact@farmau.do`** (legal ×4, account/security, messages) ; `shop_settings.contact_email` posé en DB.
- **P2 `c3d9731`** : tunnel **pickup-only** (`ShippingStep` sans zones payantes ; `AddressStep` adresse optionnelle) ; **WhatsApp threadé** `confirmation/[id]/page`→`ConfirmationClient`→`buildReservationWhatsappLink(payload, shop_settings.whatsapp_number)` + `WhatsappHero` tel/mailto depuis settings (**`NEXT_PUBLIC_WHATSAPP_NUMBER` supprimé**) ; message/total = sous-total seul ; `formatPrice` défaut **0 décimale** ; footer sans badges paiement.
- **P3 `84b82e7`+`4ba9aef`** : `safeRedirectPath` signup+profil ; **`getUser()`** sur `/account/layout` + `/api/cart/reserve` ; **`productCreate`/`productUpdate` STRICT** (sans `.passthrough()`) + routes consomment `parsed.data` + `23505→409` (fin du mass-assignment) ; `slug` jamais vide ; **migration M1 `add_to_cart`** = stock **cumulé atomique** (`FOR UPDATE`) + cap 99 (**appliquée prod**, grants `service_role` + `search_path` préservés, 0 régression advisor) ; `cartItemBody` Zod ; `useAuth` rejoue merge+purge wishlist sur switch A→B ; export newsletter sans IP + anti-injection formule ; mdp min 12 ; **bannières** : titre `DOMPurify` (allowlist `<em>/<strong>/<br>`) + CTA `<a>` externe / `<Link>` interne dé-préfixé + `banners.link_url` normalisés en DB.
- **P4 `7baa051`** : `BlogClient` `dialogRef` attaché (focus-trap réparé) ; `ContactForm` `role=status/alert` ; **dark mode** `clay-800/900` (`--c-accent-deep/900`) éclaircis vers le texte dans `[data-mode="dark"]` (étaient mélangés vers #000 → `text-clay-800` invisible) ; `LocaleSwitcher` `bg-white`→`bg-sand-50`.
- **P5 `b8b160b`** : `create-admin`/`make-existing-user-admin` réparés (retrait `profiles.is_admin` droppé → **bootstrap admin re-fonctionne**) ; `robots` `disallow /*/account/` ; blog `hreflang` = locale du post seule ; `admin-smoke` landing `/admin` ; garde-fou `ALLOW_E2E` (e2e refuse de tourner sans opt-in).

**Reliquat exécuté (session 2026-06-06 bis)** : i18n admin réservations (C-10, hook `useReservationFormat` + ~68 clés ×3 ; `BannerDeleteModal`, `TagSelector`, compteur panier `Cart.drawerProductsCount`) · `seed-import.cjs` (C-16, `image_url`→`range_id` direct, drop `product_ranges`) · `database.types.ts` régénéré (drop `mark_message_as_read`) + compteurs CLAUDE.md rafraîchis via MCP (C-130) · `sitemap` hreflang blog locale-du-post-seule + `noindex` pages auth via `(auth)/layout.tsx` (C-12/C-46) · playwright `globalSetup`/`globalTeardown` (purge `@farmau.test`) + `schemas.test.ts` (mass-assignment/cap panier, unitaire) + `security.spec.ts` (open-redirect login) (C-19) · `getUser()` sur `reservation/page`+`confirmation/[id]` (C-30). Vérif : tsc 0 · lint 0 · **vitest 26/26** · build vert. **`db/schema.sql` régénéré** (dump fidèle host-`pg_dump` 17, **sans Docker**, via nouveau `scripts/db-dump.sh` : récupère le pipeline de `supabase db dump --dry-run` et l'exécute avec le `pg_dump` natif). **Restant** : contraste CTA dark `--c-on-accent` (C-15 — touche ~72 sites `bg-clay-700 text-sand-50`, décision design + QA visuelle 6×2 requise). **D6** (« Leaked password protection ») : nécessite le **plan Supabase Pro → non retenu** (risque accepté tel quel).

## État du projet (2026-06-04)

### Fait ✅ (session 2026-06-04 — refonte dashboard admin « vue 360° »)

Refonte de `/admin` (la landing post-login) en tableau de bord complet : « voir tous les aspects de la pharmacie d'un coup d'œil ». De 5 widgets à une vue structurée — bande KPI + 3 sections numérotées + accès rapides — sur le système de cartes existant (`sand-50`/`border-sand-300`/`rounded-xl`, chiffres serif, accents mono, palette `ink/clay/olive/brick/ochre`, teintes auditées contre `globals.css`). 1 commit sur `main` (`edbcd3c`, 20 fichiers, +1 689/−304).

- **Bande « pulse »** : 6 tuiles KPI cliquables (produits actifs · réservations actives · stock critique · messages non lus · clients · paniers actifs), anneau d'alerte quand une métrique demande une action (`StatCard`).
- **01 · Réservations & revenus** : `RevenueWidget` (chart existant) + nouveau `ReservationStatusWidget` (5 statuts + ingreso confirmado + cesta media) + `RecentReservationsWidget`.
- **02 · Catalogue & inventaire** : `CatalogueReadinessWidget` (**score de complétude** moyen + couverture par champ : imagen/precio/INCI/beneficios/consejo/volumen/PDF — le signal le plus actionnable avant lancement, ~12 % à ce stade) + `InventoryWidget` (unidades, valeur stock, distribution en stock/bajo/agotado, flag prix placeholder) + `BrandBreakdownWidget` (13 marques en barres) + `TopProductsWidget` + `LowStockWidget`.
- **03 · Clients & activité** : `CustomersWidget` (total, locale, couverture téléphone) + `EngagementWidget` (paniers actifs/uds, favoris, newsletter) + `ContentWidget` (blog/banners/tags/associations) + `RecentMessagesWidget`.
- **Accesos rápidos** : `QuickActionsWidget`, grille de 13 tuiles vers toutes les sections admin.

**Archi** : toute la donnée est agrégée **côté Node** dans **`src/app/admin/_dashboard/data.ts`** (server module, `getDashboardData()` = un seul `Promise.all`) via `supabaseAdmin` sur les tables live → **aucune migration DB** (cohérent MCP read-only). Nouvelles primitives partagées `WidgetCard`/`StatCard`/`MeterBar`/`MiniStat`/`DashboardSectionHeader`. Les 5 widgets historiques deviennent **composables** via une prop `className` (placement grille piloté par la page). **Espagnol en dur**, cohérent avec les widgets dashboard existants (seule surface admin hors i18n → pas de charge de parité).

**Vérif** : tsc 0 · lint 0 · `next build` vert.

### Fait ✅ (session 2026-06-04 — modèle compte « un user, deux casquettes » + landing admin)

Alignement de l'UX compte sur le modèle de données réel : un admin n'est pas un compte séparé mais un compte client + une ligne `admin_users` (**additif**, aucun privilège client perdu). Avant, l'admin était enfermé dans la coquille `/admin` sans retour ni accès à son profil perso. 2 commits sur `main` (`443d8b9`, `ea67dc9`).

- **Ponts admin ↔ client (`443d8b9`)** : footer sidebar admin → **« Voir le site »** (`/{locale}`, nouvel onglet) + **« Mon compte »** (`/{locale}/account/profile`, locale via `useLocale()`). Sidebar `/account` → **« Panneau admin »** (`/admin`, `next/link` brut) si `is_user_admin` (calculé server-side dans `account/layout.tsx`, prop `isAdmin`). **Pas de page profil dédiée dans l'admin** : on réutilise `/account/*` (choix explicite, zéro duplication). Login : la destination explicite (`redirectedFrom`/`next`) prime **pour tout le monde** → l'admin n'est plus happé vers le dashboard s'il visait une page. Sidebar admin réorganisée : `sectionAccount`/`sectionPersonalization` supprimées → **« Configuration »** (settings + apparence) + **« Accès »** (admins). `/admin/users` : bouton « Promouvoir admin ». Aucune migration DB. Mémoire `account-model-one-user-two-hats`.
- **Landing admin = dashboard, pas produits (`ea67dc9`)** : `ADMIN_HOME_PATH` passe de `/admin/product` à **`/admin`** (le tableau de bord avec widgets revenus/stock/top produits/réservations/messages) et devient la **source unique**, câblée dans login mot de passe + OAuth callback (`auth/callback`) + lien « Dashboard admin » NavBar + MobileDrawer + error boundary admin. Les liens vers la page produits (nav « Produits », CTA dashboard, `TopProductsWidget`, setup) restent inchangés. Tests de redirection mis à jour.

**Vérif** : tsc 0 · lint 0 · vitest 8/8 · parité i18n **1620×3**.

### Fait ✅ (session 2026-06-03 — fix overlays NavBar (drawer panier) + thème public en direct)

2 correctifs ciblés (commits `4e88f02`, `b45453e`, intercalés avec les commits annonce/thème ci-dessous) :

- **Bug d'affichage NavBar / panier (`4e88f02`)** : les overlays (`CartDrawer`, `Scrim`, `SearchOverlay`, `MobileDrawer`) étaient rendus **dans le `<header>`**, dont le `backdrop-blur` (= `backdrop-filter`) en faisait le **bloc conteneur** des `position:fixed` enfants. Symptômes : drawer panier `translate-x-full` débordait à droite (**scroll horizontal** — « le cart apparaît si je scroll à droite »), `Scrim` limité aux 70px du header (**clic-pour-fermer mort**), recherche plein écran + drawer mobile cassés pareil. Fix : overlays **sortis du `<header>`** (en frères via fragment) → `position:fixed` relatif au viewport. Demandes UX associées : bouton panier en **toggle** (re-clic ferme), **navbar non-sticky** (`relative` au lieu de `sticky top-0`), nouveau **`src/components/nav/ScrollToTop.tsx`** (bouton « remonter en haut », IntersectionObserver sur le header) + clé i18n `Nav.backToTop` FR/ES/EN. Mémoire + piège `fixed-overlay-backdrop-filter-gotcha`.
- **Thème public en direct (`b45453e`)** : `ThemeFavicon` applique désormais aussi `data-theme` sur `<html>` en live pour les routes publiques (réutilise la requête `/api/theme` existante → **0 appel réseau en plus**, pages toujours SSG). Un changement d'apparence admin se reflète sur le site public **sans rechargement** (avant : `<html data-theme>` figé au build, jamais re-rendu en navigation SPA — seul le favicon suivait). Admin exclu (géré par `_AdminShell`).

tsc 0 · lint 0 · build vert.

### Fait ✅ (session 2026-06-03 — refonte `/admin/annonce`, guide types, thème lisible)

Refonte de `/admin/annonce` en écran **« Page d'accueil »** unifié + correctifs de **lisibilité du thème** (contraste, palette incomplète, héritage de couleur admin). 5 commits sur `main` (`1f3012b` → `3066afc`, commits utilisateur NavBar v2 `bc7e158`/blog intercalés).

- **`/admin/annonce` → « Page d'accueil »** (`1f3012b`) : retiré tous les contrôles **morts/trompeurs** — système **slot** (hero/banner/card/modal, jamais lu ni même persisté par l'API), **statut** (draft…expired, contredisait `is_active`), **stats vues/clics/CTR** (jamais branchées → toujours 0), **dates de programmation** (ignorées par la home). Visibilité = **un seul badge En ligne/Hors ligne** (`is_active`). Écran en 2 blocs expliqués : « Sections de l'accueil » (`HomeLayoutPanel`) + « Bannières promo » (avec la dépendance : les bannières n'apparaissent que si la section est activée). `BannerStatsCards` supprimé, `SLOT_LABELS` retiré. **UI-only, aucune migration** : route API + `BannerData` gardent slot/status/dates (dormants), le formulaire les round-trip → colonnes intactes.
- **Guide visuel des types** (`c4981e6`) : `BannerTypeGuide` au bas du modal bannière — 3 schémas annotés (editorial/hero/quote, type courant surligné) + légende « quoi va où » (champ → zone). i18n `Admin.modals.banner.guide` FR/ES/EN.
- **Contraste texte muté** (`22fbc1f`) : `--c-ink-400/500/700` + `--c-neutral-500/600` remontés dans `[data-theme]` (`ink-500` 54→66 % → **3.66→5.38:1 AA**). Corrige le P1 historique « contraste ink-500 ». Global (admin + public, 6 thèmes × 2 modes).
- **Palette complétée** (`b5861f9`) : **8 teintes utilisées mais jamais définies** (`ink-100/300/600`, `olive-100/700`, `clay-500/900`, `brick-700`) → en Tailwind v4 l'utilitaire ne génère **aucune** couleur → contrôles **invisibles** (flèches d'ordre + œil + label « Visible » du panneau Sections, boutons/statuts blog, badges). Ajoutées à la source (`@theme` + dérivation `color-mix` + miroir `[data-theme]`).
- **Texte admin lisible dans les 2 modes** (`3066afc`) : le shell admin re-thématise les fonds (mode propre à l'admin) mais ne posait **aucune couleur de texte** → tout texte sans classe explicite héritait de `body { color: ink-900 }` figé sur le mode **site/visiteur**. Mode admin ≠ mode visiteur → inputs non colorés (formulaire blog) illisibles. Fix : **`text-ink-900` sur le `<div>` racine de `_AdminShell`**.

**Vérif** : `next build` vert (122/122) à chaque étape · contraste calculé · parité i18n **1617×3**.

### Fait ✅ (session 2026-06-01 → 06-03 — auth simple, home éditoriale « moderna », éditeur bannières, fixes thème)

Refonte design de la home (handoff `home-moderna`) + simplification auth + nettoyage de l'éditeur de bannières admin + chasse aux bugs du système de thèmes (dont une **cause racine CSS** subtile). ~10 commits sur `main` (`ec6a6d0` → `ff22293`).

**Auth simplifiée** (`ec6a6d0`) : confirmation email désactivée (toggle Supabase « Confirm email » off — à flipper côté dashboard) → signup = **auto-login** si `data.session` présent (fallback « vérifiez votre email » conservé via clé `Signup.successCheckEmail`). Email **éditable** au profil (`ProfileEditForm`, `auth.updateUser({ email })`) — avant `disabled`. Cf. mémoire `auth-simple-no-email-confirmation`.

**Home éditoriale « moderna »** (`ea51383`, `dcda2c8`, `ff22293`) — handoff `farmau/project/home-moderna`, « moins généré, plus éditorial » :
- `HomeHero` : kicker, titre serif géant (« Dermo-cosmétique conseillée, pas vendue »), deck, 2 CTA, plaque image, ligne de méta 4 colonnes (compteurs produits/marques réels). **Drop du dégradé + blobs SVG** (le tell #1 « IA »).
- `HomeSectionHeader` : système d'**index courants** (01/02/03) sur filet — casse la formule eyebrow+titre+CTA répétée.
- `HomeBrands` → **brandline marquee** (défilement CSS `@keyframes marquee`, pause survol, fondus, statique en `motion-reduce`). `HomeBestsellers`/`ByNeed`/`Routine` en grilles éditoriales 1px ; `HomeExpertise` manifeste split.
- Nouveau **`src/components/ui/Plate.tsx`** (placeholder hachuré + colibri) remplace dégradés/blobs ; vraies images produits conservées.
- 3 bannières CMS modernisées (`BannerQuote` sombre, `BannerEditorial` split, `BannerHero` full-bleed + overlay) — **schéma admin inchangé**.
- `FooterNewsletter` sortie dans sa bande claire `.news` (sand-100) avant le footer sombre. NavBar re-tonifiée en clair éditorial (`bg-sand-50/85` + blur). **JetBrains Mono** réellement chargée (`next/font`, était un simple fallback).
- i18n FR/ES/EN, parité **1587×3** (copie d'origine espagnole adaptée aux 3 langues ; public/admin restent tri-langue).

**Éditeur bannières `/admin/annonce` au propre** : `BannersPreview` réécrit → **iframe de la home complète `/fr`** mise à l'échelle (ResizeObserver largeur + hauteur réelle via `postMessage`/**`src/components/IframeHeightReporter.tsx`** + bouton rafraîchir) au lieu d'un rendu bannières-only. Chaînes FR en dur localisées FR/ES/EN, a11y (titre liste `h3`→`button`), `STATUS_LABELS` mort retiré.

**Système de thèmes — bugs corrigés (importants)** :
- **Cause racine CSS** (`9a41630`) : les tokens `@theme` (`--color-sand-50: var(--c-bg)`) se résolvent sur `:root` et se **figent** → un `[data-theme]` imbriqué (shell admin) ne re-thématisait rien. Fix : **redéclarer les mappings `--color-*: var(--c-*)` (sand/clay/ink) DANS le bloc `[data-theme]`** → re-résolution par élément thémé. Toggle dark admin OK enfin. Cf. mémoire `theme-nested-resolution-gotcha`.
- **Admin = thème d'apparence** (`477fd00`, `ff22293`) : `_AdminShell` pose `data-theme={siteTheme}` (lu sur `<html data-theme>` frais au mount + `/api/theme` SWR pour le live) au lieu de `terra` en dur → l'admin reflète la palette choisie (le mode clair/sombre reste propre à l'admin via `AdminModeContext`). Save `/apariencia` → `globalMutate('/api/theme')` (update live sans reload).
- **Favicon = thème apparence partout** (`9a41630`, `b94811a`) : nouvelle route **publique `GET /api/theme`** (`getThemeConfig`, `Cache-Control: no-store`). Nouveau **`src/components/ThemeFavicon.tsx`** (client, SWR) réécrit les `<link rel=icon>` à chaque nav + retire les concurrents. **`src/app/favicon.ico` supprimé** (Next l'injectait → logo FARMAU gagnait sur l'admin).
- **CSP** : `frame-ancestors 'none'` → **`'self'`** + `X-Frame-Options: SAMEORIGIN` (pour l'iframe d'aperçu home same-origin ; cross-origin toujours bloqué).
- Admin dark-ready : 72 utilitaires `bg-white`/`gray-*` littéraux → tokens `sand`/`ink` (12 fichiers).

**Vérif** : tsc 0 · lint 0 · build vert · parité i18n 1587×3. Rendus visuels confirmés OK par l'utilisateur au fil des déploiements.

### Fait ✅ (session 2026-05-28 — audit pré-V1 + remédiation P0/P1)

Audit complet sous tous les angles (18 workstreams parallèles) → `docs/audits/pre-launch-v1-2026-05-28/` (`00-VERDICT-V1.md` Go/No-Go + `00-REGISTRE-CONSOLIDE.md` + `WS01..WS18`). Recoupé en DB live via MCP. Verdict initial NO-GO → 3 P0 levés cette session.

- **P0-1 bug panier** : le stepper +/- envoyait une quantité **absolue** à `add_to_cart` (qui **incrémente**) → panier corrompu. Fix : handler **PATCH `/api/cart`** (écrit la quantité absolue en service-role, `.update()` sur `cart_items`, pas de nouvelle RPC) ; `useCart.updateQuantity` → PATCH. POST/`add_to_cart` reste l'incrément. Test e2e renforcé (persistance après reload). **Non vérifié en navigateur.**
- **P0-2a** : liens consentement signup `/cgv` `/confidentialite` (404) → `/legal/cgv` `/legal/confidentialite`.
- **P0-2b** : pages légales **CGV + confidentialité = FR + ES** (contenu sélectionné par locale dans la page ; corps légal hors messages i18n = exception assumée ; parité 1466×3 intacte). ES = traduction de travail **à valider juriste RD** ; `en`→FR. mentions-légales/cookies restent FR-only.
- **P1 sécurité — migration `20260528160000_harden_rpc_execute_grants.sql` appliquée** (vérifiée par 5 agents indépendants avant application, GO unanime) : `REVOKE EXECUTE FROM anon/authenticated` + `GRANT service_role` sur les RPC panier/messages ; `merge_anon_cart_to_user`→authenticated+service_role ; `handle_new_user` revoke (trigger-only) ; `DROP mark_message_as_read`. Advisor `anon_security_definer_function_executable` **11 → 2**. **`is_user_admin` laissée intacte** (cf. Pièges).
- **P1** : CSP `frame-src` autorise `https://maps.google.com` (cartes /contact + /pharmacie débloquées) + **HSTS** + `frame-ancestors 'none'` ; purge du cache SWR `/api/wishlist` au login/logout (`useAuth`).
- **Différés (vérif navigateur requise)** : contraste `ink-500` (token partagé), favicon FARMAU `.ico`, pagination catalogue serveur, regen `database.types.ts`. Reliquats P2 advisor : 2 vues SECURITY DEFINER, 2 buckets listables, `rls_auto_enable`, leaked-password protection.

### Fait ✅ (session 2026-05-28 — système de thèmes complet)

Implémentation du handoff `design_handoff_themes_system/` (« Themes - Palette Admin ») : 6 palettes × clair/sombre, écran admin, logo colibri monochrome, favicons par thème. Détail archi : section « Système de thèmes » plus haut.

- **DB** : migration `20260528120000` → `shop_settings` + `theme`/`default_mode`/`allow_visitor_mode`. Types regénérés. `db/schema.sql` reconstruit (full regen : + newsletter/wishlists/shop_settings, − orders/order_items/product_ranges, enum `order_status` vestigial conservé).
- **CSS** (`globals.css`) : `@theme` mappe les tokens Tailwind vers des ancres `--c-*` ; 12 blocs `[data-theme][data-mode]` (6 ancres chacun) + rampe dérivée `color-mix`. Tout le site public se re-thématise sans toucher au markup. Tokens `--c-ink-panel*` pour footer/zones sombres.
- **Composants** : `src/components/brand/FarmauLogo.tsx` (`FarmauBird`/`FarmauWord`/`FarmauLockup`), `ThemeModeToggle` (footer), `_AdminShell` neutralisé Terra clair. Ancien `Logo.tsx` supprimé (0 import).
- **Serveur** : `getThemeConfig()` (anon sans cookies + `unstable_cache` + `revalidateTag`), root layout pose `<html data-theme data-mode>` + script anti-flash + `<link rel=icon>`. Pages `[locale]` restent **SSG** (pas de bascule dynamic).
- **Admin** : `/admin/apariencia` (`AppearancePage`), API `/api/admin/appearance` GET/PATCH (Zod `appearanceBody`), sidebar section *Personalización*, i18n `Admin.appearance` + `Footer.themeTo*` FR/ES/EN (~24 clés/locale, parité 1 466).
- **Favicons** : `scripts/build-favicons.cjs` (`npm run favicons:build`, sharp) → 24 PNG `public/favicons/`. Masques source `public/brand/`.
- **Vérif** : `tsc` 0 erreur · `lint` 0 warning · `next build` passe · injection thème confirmée sur `/fr` servi (data-theme + favicons + anti-flash). **Aucune nouvelle dépendance** (sharp déjà présent).
- **Limite connue** : mode sombre neuf — quelques bandes décoratives volontairement sombres s'inversent en clair en mode sombre (lisibles).

### Fait ✅ (commit `5359b2e` 2026-05-27 — blog, double opt-in, code splitting, banner slots)

4 features majeures + nettoyage (33 fichiers, +1 531 / -262 LOC) :

**Blog complet** : table `posts` (migration `20260527210629`) + admin CRUD `/admin/blog` (`BlogClient.tsx`) + pages publiques `/blog` + `/blog/[slug]` (SSR, metadata, hreflang) + sitemap dynamique + Footer link corrigé. API `/api/admin/posts` (GET/POST/PATCH/DELETE) avec `requireAdmin()` + Zod. i18n `Blog` + `Admin.blog` namespaces FR/ES/EN. Blog dans sidebar admin section "Operaciones".

**Newsletter double opt-in** : colonne `confirmation_token` (migration `20260527211720`, index partiel UNIQUE), endpoint `/api/newsletter/confirm` (GET, valide token → `confirmed_at`), intégration Resend (`src/lib/resend.ts`). Fallback gracieux : sans `RESEND_API_KEY`, `confirmed_at` posé directement (single opt-in). Email de confirmation localisé FR/ES/EN.

**Code splitting** : `next/dynamic` avec skeletons `animate-pulse` sur `CatalogueClient`, `ProductClient`, `CartClient`, `ReservationClient`.

**Banner slots Sprint 3** : enums `banner_slot` (hero/banner/card/modal) + `banner_status` (draft/scheduled/active/paused/expired) via migration `20260527212633`. Admin UI avec 4 KPI cards par slot (actifs/vues/clics/CTR), onglets de filtre slot, status pills 5 couleurs. Data migration des banners existants.

**Nettoyage** : 6 scripts audit/check untracked supprimés de la racine. CI e2e utilise `npm start` au lieu du dev server.

**Nouvelle dépendance** : `resend`.

### Fait ✅ (session 2026-05-26 — refontes design Sprint 4 + Sprint 3 admin + i18n admin + UX fixes)

14 commits livrés (`e30e7a2` → `5228dfa`). Deux grands chantiers visuels (`/a-propos` + `/catalogue` design Sprint 4 ; toutes les pages admin design Sprint 3) + plomberie i18n pour l'admin + nettoyage copy + un fix UX critique.

**Design Sprint 4 — pages publiques** :
- `e30e7a2` refactor(pharmacie): collapse `PICKUP_LOCATIONS[3]` → singleton `PICKUP_LOCATION` (Cerros de Gurabo aligné sur `shop_settings`), rename `/pharmacies` → `/pharmacie`, supprime mentions « plusieurs pharmacies »
- `db8ad45` feat(a-propos): refonte éditoriale 8 sections — `AboutHero` (serif 120px + bottle SVG) · `AboutStats` ink-900 4 KPIs · `AboutManifest` pull-quote + sticky aside · `AboutTeam` 3 portraits SVG · `AboutCriteria` 4 filtres numérotés + cert aside ink-900 · `AboutVisit` SVG map Santiago + info card depuis `shop_settings` · **`AboutPartner`** clinique Skin Laser Center (même bâtiment, vraies infos Facebook + Maps) · **`AboutLeaveReview`** CTA Google Reviews honnête (pharmacie neuve) · `AboutCta` finale + consultation card. Drop des composants legacy `ReviewCard.tsx` + `BestProductsCard.tsx`.
- `4d4262a` feat(catalogue): refonte éditoriale — `CatalogueHeader` (breadcrumb mono + serif 88px + compteur 60px + activeCount) · `CatalogueToolbar` sticky (chips ink-900/clay-700 + sort dropdown) · `CatalogueSidebar` flat 280px (pas d'accordion, chips toggle pour types-peau/ingredients) · `CataloguePagination` (tiles 36×36 mono ink-900 active) · `ProductCard` redesign (aspect 4/5, gradient sand, flags clay/olive/brick auto depuis isFeatured/isNew/oldPrice, fav top-right pill bg-sand-50/85, quick-add hover via nouveau variant `card-cta-quick`, prix serif 24px + suffix `/{volume}` mono, stock dot olive/brick/ink). SELECT étendu `old_price/stock/is_new/is_featured/volume` + filtre `is_active=true`. Drop `Filters.tsx` (310 LOC orphelin). Drop input de recherche local (NavSearch s'en charge). Sort `bestsellers` désormais `is_featured` + alpha.
- `f54834b` fix(catalogue): drop `sold_30d` du SELECT (colonne vit sur la vue `v_bestsellers`, pas sur `products` table) — Vercel envoyait 400 sur tous les GET /rest/v1/products après le commit Sprint 4.

**Copy/branding cleanup** :
- `cd3bf6a` refactor(copy): drop toutes les promesses de consultation dermatologue à la pharmacie — `pharmacien-dermatologue` → `pharmacien`, `prescribe/recetar` → `recommend/referenciar`, suppression « consultation gratuite » + « sans rdv » + « café offert ». Tous les CTAs « Parler à un pharmacien » deviennent « Nous écrire sur WhatsApp ». FAQ et CTA finale renvoient explicitement vers la clinique partenaire Skin Laser Center pour les diagnostics dermato. Reformulation alignée avec la réalité : pharmacie qui répond aux questions produit, clinique pour les consultations.

**Design Sprint 3 — pages admin** :
- `4b9d76c` feat(admin/product): PageHeader + sticky filterbar sand-100 + bouton clay-700 + `ProductsTable` restylée (sand-50, sand-200 dividers, status pill avec dot, stock mono ochre/brick, action icons hover sand-200/brick).
- `5b1722f` feat(admin/marques): idem + `BrandStatsCards` simplifiée (3 KPIs sand-50 serif 32px au lieu des cercles colorés) + `BrandsTable` (brand serif 18px, slug mono, range row sand-100/60 avec icône Layers, pill "Gama" clay-200).
- `131230b` feat(admin/stock): idem + 4 KPI tiles (CheckCircle/AlertTriangle/XCircle accent olive/ochre/brick) + tabs statut (Sin stock paint brick-600 quand actif) + modal restylé serif + clay button.
- `13a8fc5` feat(admin/tags): idem **mais garde structure `tag_types → tags`** (per user "adapte au système existant", pas la liste plate du design). Chaque type devient une `<article>` sand-50 avec dot couleur en header et tags en `<li>` (au lieu de chips).
- `14fbf19` feat(admin/messages): PageHeader + 7 KPIs sand-50 + filterbar 5 pills statut + liste sand-50 (lignes non lues `bg-clay-50/50` avec dot clay) + status pills (clay/ink/olive/sand) + priority icons brick/ochre + modal restylé.
- `de00c36` feat(admin/annonce): chrome seulement (PageHeader + toggle Aperçu ghost/ink + bouton clay-700). `BannerStatsCards/List/Preview` + modales gardent leur style legacy pour cette passe.

**Admin sidebar + i18n** :
- `030f1f1` feat(admin/sidebar): `sticky top-0 h-screen` (le bouton Cerrar sesión reste visible quoi qu'on scroll dans une grosse table) + premier groupe « Sitio público » avec 3 Link FR/ES/EN vers la home publique.
- `8a9fc5e` feat(admin): **i18n admin in-place** — `src/i18n/request.ts` fallback cookie `farmau_admin_locale` quand pas de segment `[locale]` URL, `AdminLayout` (Server) wrap avec `NextIntlClientProvider`, nouveau `_AdminShell` (Client) héberge auth-gate + sidebar + barre mobile, route `POST /api/admin/set-locale` admin-only pose le cookie. Les 3 boutons FR/ES/EN du footer sidebar deviennent un vrai switcher (POST + `router.refresh()`, locale courante en `bg-ink-900`). Namespace `Admin.{chrome,sidebar,crumbs,common,stockState,product,marques,stock,tags}` ajouté en FR/ES/EN (~100 clés). Localisé : sidebar, AdminLayout mobile, dashboard, `/admin/product`, `/admin/marques`, `/admin/stock`, `/admin/tags`. Pas localisé encore : `/admin/messages` et `/admin/annonce` (ajoutées dans les 2 commits suivants) ; modaux d'édition ; pages `reservations/users/newsletter/settings/setup`.
- `14fbf19` (déjà cité) ajoute `Admin.messages` namespace (~30 clés).
- `de00c36` (déjà cité) ajoute `Admin.annonce` namespace (4 clés).

**UX fix critique** :
- `5228dfa` fix(auth): plus de flash spinner « reload » à chaque changement de tab. Supabase v2 ré-émet `SIGNED_IN` à chaque retour de focus → `useIsAdmin` repassait `loading=true` → `_AdminShell` affichait son spinner full-screen → re-render = sensation de reload. `useAuth` rejouait aussi `merge_anon_cart_to_user` RPC + `refreshCart`. Fix par `useRef<string|null>` qui retient l'ID user précédent dans les deux hooks : `SIGNED_IN` avec même ID est ignoré, on n'agit que sur les vraies transitions (`null↔user`, `userA→userB`). `_AdminShell` ne montre plus son spinner que si `loading && !user` (premier mount uniquement). Évènement `INITIAL_SESSION` enregistre l'ID sans side-effect.

**État DB / TS / tests** : 0 erreur tsc, 0 warning lint, 8/8 vitest. Le cookie `farmau_admin_locale` a 1 an de durée et `sameSite=lax`. Pas de migration DB cette session.

### Fait ✅ (session 2026-05-23 — suite, audit design "Modernisation - pages importantes")

Audit des 9 pages clés contre les maquettes Sprint 2/3 du bundle Claude Design (`farmau/project/Modernisation - pages importantes.html` + 9 maquettes individuelles). **7 pages déjà conformes** (Home, NavBar, PDP, Cart empty, Auth, Admin Dashboard, et — découverte de l'audit — le tunnel Réservation 3-étapes existait déjà : `AddressStep` + `ShippingStep` + `ReviewStep` + `StepIndicator` + `ReservationDisclaimer` + `lib/shipping.ts`). 3 deltas comblés :

- **Pagination catalogue** : ellipsis `‹ 1 [2] 3 … 19 ›` via helper `buildPageRange(current, total, siblings)` — fini les 20 boutons en ligne (commit `5f69077`)
- **Race condition `/reservation`** : ReservationClient redirigeait vers `/cart` au mount avant que SWR ait hydraté (`totalItems` initial = 0). Fix : gate sur `!cartLoading` (commit `33e626e`)
- **Référence réservation** `FAR-YYYYMMDD-XXXX` : factorisée dans `src/lib/reservation.ts` (helpers `buildReservationReference` + `buildReservationReferenceCompact`). ConfirmationClient + `account/reservations` utilisent la version complète ; admin RecentReservationsWidget reste compact `FAR-…XXXX` ; tests Playwright reservation adaptés
- **Chips de filtres actifs catalogue** : pilule ink-900 desktop au-dessus de la grille avec × removable + label "Filtres actifs" + lien "Réinitialiser les filtres". Mobile garde sa `FiltersPill`. Trad FR/ES/EN

### Fait ✅ (session 2026-05-23, expansion tests Playwright + chasse aux bugs)

**Bugs critiques fermés** :
- `/fr/besoins/*` renvoyait 404 — la query filtrait sur `tag_type='Besoins'` (= `tt.name`) alors que la vue `tags_with_types` expose `tt.slug` (lowercase `besoins`). 14 landing pages débloquées + sitemap (commit `1010462`)
- Merge cart anon→user silently bloqué par RLS — la policy UPDATE `carts` exige `auth.uid() = user_id`, impossible au moment du reclaim (user_id IS NULL). Fix : RPC `merge_anon_cart_to_user` SECURITY DEFINER (commit `e2b1cbb`)
- Policy SELECT `cart_items` exige un claim JWT `anonymous_id` jamais émis pour les anon → cart toujours vide au reload. Fix : `/api/cart` utilise `supabaseAdmin` (validation côté route) (commit `80468db`)
- Login / `/auth/callback` / `useIsAdmin` lisaient `profiles.is_admin` legacy au lieu de RPC `is_user_admin` — admin créé via `admin_users` seul ignoré (commit `e2b1cbb`)
- `/placeholder.png` 404 — fichier absent de `public/`, généré via sharp 800x800 sand-50 + label FARMAU (commit `e2b1cbb`)
- Stock=0 sur 353/353 produits → impossible d'ajouter au panier. Set `stock=50` partout (`UPDATE products SET stock = 50 WHERE stock = 0 AND is_active = true`)

**Migrations DB** :
- `20260523095131_merge_anon_cart_to_user_rpc` — RPC SECURITY DEFINER pour le merge anon→user + hardening `remove_from_cart`
- `20260523104708_drop_profiles_is_admin_legacy` — column `profiles.is_admin` supprimée définitivement
- `20260523111500_remove_from_cart_explicit_user_id` — accepte `p_user_id` explicite (auth.uid() = NULL en service-role)
- `20260523112000_drop_old_remove_from_cart_overload` — clean overload résiduel après CREATE OR REPLACE avec signature différente
- `20260523113000_handle_new_user_drop_is_admin_ref` — trigger signup référençait la colonne morte, cassait `auth.admin.createUser`

**Tests Playwright (50 tests total, 47 passing + 2 flaky en run unifié)** :
- `tests/_helpers/test-users.ts` — `createTestUser({ isAdmin?: bool })` + `deleteTestUser(id)` + `cleanupStaleTestUsers()` via service role. Convention email `playwright+<ts>-<rand>@farmau.test`
- 5 nouveaux specs publics : `besoins.spec.ts` (3), `marques.spec.ts` (2), `footer-links.spec.ts` (1 audit liens internes), `i18n.spec.ts` (2 bascule + hreflang), `wishlist-anon.spec.ts` (1 heart→/login)
- `reservation.spec.ts` — 2 tests E2E (happy path + 409 already_active) avec signup service role + login UI + addToCart + reserve
- `admin-smoke.spec.ts` — 11 tests admin loggé (login redirect, sidebar 9 liens, 9 pages chargent sans 500)
- Refactor `cart.spec.ts` data-testid partout + `gotoCatalogueReady` helper qui attend GET `/api/cart` (`useCart.addToCart` return silent si `data?.cart` pas hydraté)
- Refactor `golden-path.spec.ts` : `/fr/` explicite (Chromium en-US redirige vers `/en/` par défaut), heading `best-sellers` (refacto sprint 2), stretched-link click au lieu du `<h3>`
- `data-testid` ajoutés : NavBar (`cart-icon`, `cart-badge`), AdminSidebar (`admin-sidebar` sur aside desktop), CartLineItem (`remove-item` sur les 3 boutons trash)
- `playwright.config.ts` : `timeout: 60_000` + `retries: 1` en dev pour absorber le cold-compile Turbopack

### Fait ✅ (sessions 2026-05-22 → 2026-05-23, architecture + sécurité)

**A11y** :
- `role="dialog"` + focus trap + Escape + scroll lock sur 13 modales admin via hook `src/hooks/useModalA11y.ts` (commit `688859c`)
- ProductCard refondue en "stretched link" — plus de `<button>` dans `<a>` (HTML invalide), audit archi #5 + UX #18 fermés (commit `c4b851b`)
- `useConfirmDialog` hook + 3 `confirm()` natifs admin migrés (messages delete, reservations cancel single + bulk) — design system d'alerts unifié avec `sonner` (commit `423cd62`)

**Sécurité** :
- Fallback `localStorage` pour tokens Supabase retiré (audit security #4, XSS exfiltration triviale) + cookie `Secure` en prod (commit `a037202`)
- Middleware + requireAdmin passent à `getUser()` (validation JWT serveur vs `getSession()` cookie-only) + RPC `is_user_admin` (source de vérité unifiée vs `profiles.is_admin` historique) — audit security #8 + #11 fermés (commit `57a92cc`)

**SEO / a11y** :
- `<html lang={locale}>` dynamique via `getLocale()` next-intl (avant : `lang="fr"` hardcodé partout, even pour /es/* et /en/*) — commit `bb95ef6`

**Refactors structurels** :
- 4 pages admin obèses splittées en `_lib/` + `_hooks/` + `_components/` (commits `d914f26`, `e522a1f`, `34612d0`, `00b6606`) : `tags` 797→211, `product` 733→157, `marques` 765→229, `annonce` 828→162 LOC. `generateSlug` centralisé dans `src/lib/slug.ts`
- `products.image_url` dropped + view `v_bestsellers` recréée + 6 sites code mis à jour (commit `4567e19`) — audit DB #6 + archi #3 fermés
- `product_ranges` (n-n) supprimée, `products.range_id` direct (1-n) — migration `20260522205544`, 22 fichiers refactorés, jointures simplifiées (commit `b7ad240`) — audit DB #1 fermé

**Configuration boutique** :
- Table `shop_settings` (single-row pattern) + RLS public SELECT + admin UPDATE + API `GET/PATCH /api/admin/settings` + page admin rewrite (2 tabs Boutique/Livraison) — fin du "Mode démo" (commit `be5f318`)
- Helper `src/lib/getShopSettings.ts` (React `cache()`) + `/pharmacies` + `/contact` lisent contact/whatsapp/email depuis DB (commit `5b0e7fe`)

**Tests** :
- 13 tests Playwright auth-guard (`tests/admin-auth.spec.ts` + `tests/account-auth.spec.ts`, `npm run test:auth`) — vérifient les redirects sans credentials (commit `325660b`)
- 2 tests deps uninstall : `framer-motion` + `@supabase/auth-helpers-nextjs` retirés du package.json (commit `c1f1a04`)

**Qualité** :
- 0 warning lint (commit `186058b`) : 73 unescaped entities + 14 ESLint warnings + custom `splitChunks` retirés. `eslint.config.mjs` honore `argsIgnorePattern: '^_'`

### Fait ✅ (session 2026-05-22, hygiène technique autonome)

- Code mort retiré : `FiltersNew.tsx` (393 LOC), `admin/ImageUpload.tsx`, `admin/DirectImageUpload.tsx` — 0 import dans `src/`, totalisant ~700 LOC supprimées
- `src/lib/constants.ts` + `src/lib/formatPrice.ts` créés : centralisation `DEFAULT_CURRENCY`, `DEFAULT_LOCALE_TAG`, `LOCALE_TAG_MAP`/`toLocaleTag`, `LOW_STOCK_THRESHOLD`, `MAX_CART_QUANTITY`, `ADMIN_HOME_PATH` + helper `formatPrice(value, { locale?, fractionDigits? })`. Migration des 5 défauts `'DOP'` hardcodés + 13 `Intl.NumberFormat` (7 `localeMap` dupliqués supprimés). Seul `account/reservations/page.tsx` conserve son `Intl.NumberFormat` direct (comportement par défaut 0-3 chiffres, différent de `formatPrice`)
- **`focus-visible` global** : 64 occurrences de `focus:outline-none` migrées vers `focus-visible:` (incluant `focus:ring-*`, `focus:border-*` renommés en pair sur la même ligne). 13 cas isolés enrichis avec `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700`. Bloqueur WCAG 2.4.7 fermé
- **Toaster sonner** : `npm install sonner`, `<Toaster richColors position="top-right" closeButton />` monté dans `src/app/admin/layout.tsx`. 27 `alert()` admin migrés vers `toast.error()` / `toast.info()` (les 2 `window.alert("próximamente")` de reservations)
- Migration DB `20260522092810_set_search_path_security_definer.sql` : `ALTER FUNCTION ... SET search_path = public, pg_temp` sur les 9 fonctions sans config (`add_to_cart`, `cleanup_banner_positions`, `get_messages_stats`, `get_or_create_cart`, `is_user_admin`, `mark_message_as_read`, `remove_from_cart`, `reorder_banners`, `update_updated_at_column`). Advisor `function_search_path_mutable` désormais à 0

NB : `npm uninstall framer-motion @supabase/auth-helpers-nextjs` a été fait manuellement par l'utilisateur + commit `c1f1a04` (cf. session 2026-05-23 plus haut).

### Fait ✅ (sessions 2026-05-21 → 2026-05-22, post sprint 3)

Surfaces publiques ajoutées (commits `279f462` → `8d8ec14`) :
- `/marques` index data-driven (commit `279f462`) + filtres URL sur catalogue (`?brand`, `?range`, `?need`, `?tag=type:slug` matching name ou slug) + `not-found.tsx` design FARMAU (NavBar + Footer + serif italic 160px) global + locale-aware
- 4 pages légales `/legal/{mentions-legales,cgv,confidentialite,cookies}` avec contenu FR pré-rédigé (Ley 172-13 + 358-05 + 126-02 RD), composants `LegalShell/Sidebar/Section` partagés, disclaimer "à valider par juriste" + `CookieBanner` (localStorage `farmau:cookies:consent`) (commit `da37dfe`)
- Hub `/account` (Server layout + check session) avec sidebar 5 onglets : `profile` (refactor), `reservations` (SSR historique avec status badges + lien WhatsApp), `security` (CTA email reset → /reset-password + danger zone mailto RGPD), `preferences` (toggle newsletter + select langue préférée via `profiles.preferred_locale`). Migration `profiles.preferred_locale`, APIs `/api/newsletter` étendues (GET/DELETE auth) + `/api/account/preferences` PATCH (commit `ac1f9c3`)
- 4 pages éditoriales statiques `/livraison`, `/faq` (5 sections 19 Q&A), `/pharmacies` (1 lieu), `/manifeste` (4 piliers + citation dark mode) + traductions exhaustives FR/EN/ES (commit `46ea917`)
- Admin `/admin/users` (lecture via `auth.admin.listUsers` + jointure profiles + admin_users, toggle Promover/Admin avec garde-fou self-demote) + `/admin/newsletter` (stats + filtre lang + export CSV + delete par ligne). Sidebar admin nouvelle section "Clientes". Suppression `/admin/my-team` démo (commit `ebad106`)
- JSON-LD Product schema sur PDP (`src/components/pdp/ProductJsonLd.tsx` Server, rich snippets Google avec offers/price/availability calculée depuis stock) + 2 derniers `<img>` migrés vers `next/image` (`CartEmpty` bestsellers fallback + `ConfirmationRecap` items recap) — commit `8d8ec14`
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

### Fait ✅ (session 2026-05-27 soir — 19 tâches techniques, 17 commits `b00aa82`→`85fa6ad`)

**Sécurité (5)** : cookie `cart_id` httpOnly + `/api/cart/merge` server-side, CSRF origin check newsletter+contact (`src/lib/csrf.ts`), Zod validation sur 20 routes admin (`src/lib/schemas.ts`), CSP+Permissions-Policy headers, `(SELECT auth.uid())` dans 28 RLS policies + `is_user_admin` STABLE (migration `20260527100000`).

**Accessibilité (2)** : `aria-invalid`+`aria-describedby` sur login/signup, `aria-live="polite"` newsletter. Error boundaries `error.tsx` sur `[locale]` + `admin` (namespace `Error` FR/ES/EN).

**Architecture / DX (4)** : `src/lib/logger.ts` + 128 `console.error/warn` → `logger.error/warn` (49 fichiers). Drop `orders`+`order_items` (0 ligne) + `v_bestsellers` sans dépendance orders (migration `20260527110000`). CI `npm run typecheck`. Suppression 3 modaux orphelins (224 LOC).

**SEO (2)** : JSON-LD `CollectionPage` sur `/catalogue` + `/marques`. `og:image` dynamique sur `/marques/[slug]` + `/besoins/[slug]`.

**shop_settings SSR (2)** : confirmation réservation lit pickup depuis `getShopSettings()`. Footer (async Server Component) et CartEmpty lisent WhatsApp depuis DB.

**i18n admin complet (2, ~270 clés)** : 6 modaux d'édition + 5 pages admin + sous-composants (UsersClient, NewsletterClient) — namespaces `Admin.{modals.*,reservations,users,newsletter,settings,setup}`. **L'admin est entièrement localisé FR/ES/EN.**

**Nouvelle dépendance** : `zod` (validation API).

### Fait ✅ (session 2026-05-28 — correctifs review multi-agent + blocker build)

Correction des 9 findings de la review du commit `5359b2e` + 1 régression WCAG + 1 blocker build préexistant.

**Sécurité** : XSS blog fermé (`isomorphic-dompurify` → `DOMPurify.sanitize(post.body)`) · token newsletter TTL (`token_expires_at`, migration `20260528100000`, check `.gt()` au confirm) · rate limit `/api/newsletter/confirm` (10/min/IP) · Zod `postDelete` sur DELETE posts · URL de confirmation via `getSiteUrl()` (helper csrf.ts, plus de header `Origin`).

**Qualité** : ESLint 0 warning (`setup/page.tsx` useCallback + 2 préexistants `ConfirmationClient`/`BannerStatsCards`) · clé i18n `Admin.common.active` EN/ES (parité 1442×3) · 20 `text-ink-400`→`ink-500` (régression WCAG, 5 fichiers).

**DB** : migration posts replay-safe (`DROP TRIGGER/POLICY IF EXISTS`) · `db/schema.sql` partiellement régénéré (posts, enums banner, refs `is_admin` corrigées) + en-tête de staleness documentant les gaps (newsletter/wishlists/shop_settings absents, orders/product_ranges droppés encore listés — full regen via `supabase db dump` à faire).

**SEO** : JSON-LD `Article` sur les posts (`src/components/blog/BlogPostJsonLd.tsx`).

**Blocker build (hors plan)** : `not-found.tsx` (client) importait le `Footer` devenu async Server Component → `next build` cassé depuis `5c81dcb`. Converti `not-found.tsx` en Server Component (`getTranslations`). Build repasse.

**Nouvelle dépendance** : `isomorphic-dompurify`. **Non testé e2e** : flux email double opt-in (nécessite `RESEND_API_KEY` + post publié).

### Reste à faire

**Quick wins** :
- `db/schema.sql` full regen via `supabase db dump` (snapshot partiel : newsletter/wishlists/shop_settings absents, orders/product_ranges droppés encore listés)
- `metadata.openGraph.siteName` pourrait lire `shop_name` depuis `shop_settings`
- AggregateRating sur `ProductJsonLd` si système de reviews un jour
- Investiguer la flakiness des tests Playwright `wishlist-anon` + `cart Suppression` en run unifié
- Test e2e du flux newsletter double opt-in (nécessite `RESEND_API_KEY` + post publié)

**Banner slots — compléments** :
- Wirer le tracking impressions/clics côté client (`view_count`/`click_count` existent en DB)
- Scheduling auto : pg_cron ou middleware pour transitions `scheduled→active→expired` basées sur `start_date`/`end_date`

**Blog — compléments** :
- Intégrer l'upload image blog avec `/api/admin/upload` existant (actuellement URL manuelle)
- Rich text editor (ou markdown) pour le body au lieu du textarea brut

**Contenu éditorial / About** :
- Photos d'équipe réelles dans `AboutTeam.tsx` (silhouettes SVG génériques actuellement)
- Vrais noms/numéros de l'équipe (`Dra. María Pérez`, `Andrés Reyes`, `Yarisa Tavárez` sont des placeholders)
- Stat "60+ marques · 353 références · 7 farmacéuticos · 12 ans" — à confirmer vs DB
- "Reg. Sanitario DGM-42-2014" — placeholder, mettre le vrai numéro
- Avis Google réels dans `AboutLeaveReview`
- Adresse exacte Skin Laser Center dans `AboutPartner`

**Contenu éditorial — autres** :
- Saisie INCI / benefits / pharmacist_advice sur les 353 produits (colonnes prêtes, contenu à fournir)
- Traductions ES/EN du contenu juridique `/legal/*` (FR uniquement actuellement)

**Hygiène long terme** :
- Audit Storage policies (2 buckets publics avec policy `select` large — flag Supabase advisor)
- Playwright CI secrets (configurer pour les tests E2E en CI)

Voir `docs/audits/INDEX.md` pour l'audit complet et `docs/HANDOFF.md` pour le résumé courant à reprendre.

## Pièges & règles non évidentes

- **Pas de commit sauf demande explicite** (Cursor rule `alwaysApply`).
- **Bash deny list** dans `.claude/settings.local.json` bloque `rm`, `git --force`, `git rebase`, `git reset --hard`, `git reset --soft`, `git clean -f`, `git branch -D`, et `git push origin main` (auto-mode classifier). Utiliser `git rm` ou demander à l'utilisateur de taper la commande avec le préfixe `!`.
- **MCP Supabase** : `.mcp.json` scope le MCP au projet `adxpoxcynrpnbbxnncsk`. Re-auth si token expiré : `/mcp` → supabase → Authenticate.
- **GRANT EXECUTE des RPC durci** (migration `20260528160000`) : RPC panier/messages = `service_role`-only ; `merge_anon_cart_to_user` = `authenticated`+`service_role`. ⚠️ **Ne JAMAIS révoquer `anon` sur `is_user_admin`** : elle est appelée par des policies RLS `TO public` sur des tables en lecture anonyme (`products` « View active products », `banners`, etc.) ; comme l'appelant a besoin du privilège EXECUTE même sur une fonction `SECURITY DEFINER`, la révoquer casserait toute lecture anonyme (`permission denied for function is_user_admin`) → catalogue/home/blog HS. `mark_message_as_read` droppée → regénérer `database.types.ts`.
- **`.next/types/`** est un cache TS — quand on supprime des routes, déplacer `.next/` ailleurs pour que `tsc --noEmit` arrête de râler (`mv .next /tmp/.next-stale-...`). De même un cache `.next` périmé peut faire échouer `next build` avec des erreurs ESLint fantômes (refs à du code déjà corrigé) → `mv .next /tmp/...` puis rebuild.
- **Thème imbriqué** : pour qu'un `[data-theme]` imbriqué (shell admin, cartes d'aperçu) re-thématise, les mappings `--color-* : var(--c-*)` doivent vivre dans le bloc `[data-theme]` de `globals.css` (pas seulement `@theme`/`:root` où ils se figent). Vérifier un fix CSS de thème dans le CSS **compilé** (`.next/static/css/*.css`). Mémoire `theme-nested-resolution-gotcha`.
- **`position:fixed` sous `backdrop-filter`** : un ancêtre avec `backdrop-filter`/`filter`/`transform`/`will-change` devient le **bloc conteneur** de ses descendants `position:fixed` (ils ne se calent plus sur le viewport). Le `<header>` public porte `backdrop-blur` → ses overlays (`CartDrawer`, `Scrim`, `SearchOverlay`, `MobileDrawer`, `ScrollToTop`) **doivent être rendus en frères du `<header>`**, jamais dedans — sinon drawer panier qui déborde à droite (scroll horizontal), scrim coupé à 70px, clic-pour-fermer mort. Mémoire `fixed-overlay-backdrop-filter-gotcha`.
- **Palette = teintes définies uniquement** : en Tailwind v4, un utilitaire `text-ink-600`/`bg-olive-100`… dont la teinte n'est PAS déclarée dans `@theme` (+ dérivation `--c-*` + miroir `[data-theme]` si thémée) ne génère **aucune** règle → élément **invisible** (couleur héritée). Avant d'utiliser une teinte, la définir dans `globals.css`. Audit : `grep -oE '\-\-color-(ink|sand|clay|olive|brick|ochre)-[0-9]+'` (défini) vs usages. Teintes complétées 2026-06-03 : `ink-100/300/600`, `clay-500/900`, `olive-100/700`, `brick-700`.
- **Texte admin = mode admin, pas mode site** : `body { color: var(--color-ink-900) }` se calcule sur `<html data-mode=…>` (mode **site/visiteur**) ; l'admin vit dans un `<div data-mode={modeAdmin}>` imbriqué. Le `<div>` racine de `_AdminShell` pose `text-ink-900` pour que le texte sans classe explicite (inputs) se résolve sur le mode admin — sinon, mode admin ≠ mode visiteur → texte clair sur fond clair (illisible). Donner toujours un `text-ink-900` explicite aux inputs de formulaire admin par sécurité.
- **`/api/theme` en `no-store`** : pas de cache CDN. `revalidateTag('shop-theme-config')` invalide l'`unstable_cache` côté origine mais PAS le cache edge → un `s-maxage` y servirait un thème périmé (jusqu'à 5 min) et le favicon/thème admin ne suivraient pas le changement d'apparence.
- **CSP `frame-ancestors 'self'`** + `X-Frame-Options: SAMEORIGIN` (`next.config.ts`) : nécessaire à l'iframe d'aperçu home de `/admin/annonce` (same-origin). Cross-origin reste bloqué. Ne pas re-durcir à `'none'` sans casser l'aperçu.
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
