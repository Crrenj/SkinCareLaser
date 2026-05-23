# Handoff — Prompt pour le prochain Claude

Copier-coller ce qui suit dans une nouvelle session Claude Code ouverte sur `/Users/juan/Documents/skincarelaser`.

---

## Prompt à coller

Tu reprends le projet FARMAU (catalogue + réservation dermo-cosmétique, marché RD, Next.js 15 + Supabase, multilingue FR/EN/ES). Lis d'abord :

1. `CLAUDE.md` à la racine — état actuel, conventions, pièges
2. Ce fichier (`docs/HANDOFF.md`) — punch list courante
3. `docs/audits/INDEX.md` si tu attaques un finding d'audit

## État actuel (2026-05-23, post chantiers architecture/sécurité)

**Branche `main` synchronisée avec `origin/main`.** Dernier commit : `b7ad240 refactor(db): products.range_id direct, drop product_ranges n-n table`.

**Métriques** :
- 0 erreur TypeScript, 8/8 vitest, **0 warning lint** (depuis 2026-05-22)
- 23 tests Playwright (4 golden-path smoke + 6 cart + 13 auth-guard admin/account)
- CI verte (lint + tsc + vitest sur PR et push main)
- Pre-commit hook actif (Husky + lint-staged → `eslint --fix --no-warn-ignored`)
- Vercel auto-deploy sur push main, domaine prod `https://farmau.do`
- Supabase project `adxpoxcynrpnbbxnncsk` : 13 brands, 52 ranges, 353 produits actifs à 100 DOP placeholder (tous ont `range_id`), 299 product_images, 36 tags, 844 product_tags, 1 admin, 1 row dans shop_settings

**Chantiers fermés sessions 2026-05-22 → 2026-05-23** (commits `186058b` → `b7ad240`, 16 commits) :

### Hygiène + a11y
- `186058b` chore: zero lint warnings (73 unescaped + 14 ESLint + custom splitChunks)
- `c4b851b` fix(a11y): stretched-link pattern ProductCard (button-in-link fixed)
- `a037202` fix(security): localStorage tokens removed + Secure cookie en prod
- `423cd62` feat(a11y): useConfirmDialog hook + 3 confirm() admin migrés
- `325660b` test(e2e): 13 Playwright auth-guard (admin + /account/*)
- `c1f1a04` chore: uninstall framer-motion + @supabase/auth-helpers-nextjs
- `688859c` feat(a11y): role=dialog + focus trap sur 13 modales admin (hook `useModalA11y`)

### Refactors structurels
- `d914f26` refactor(admin/tags): 797 → 211 LOC (10 fichiers colocalisés)
- `e522a1f` refactor(admin/product): 733 → 157 LOC + `src/lib/slug.ts` centralisé
- `34612d0` refactor(admin/marques): 765 → 229 LOC
- `00b6606` refactor(admin/annonce): 828 → 162 LOC

### Architecture + SEO
- `bb95ef6` feat(a11y/seo): `<html lang={locale}>` dynamique via `getLocale()`
- `4567e19` refactor(db): drop `products.image_url`, source unique `product_images`
- `b7ad240` refactor(db): drop table `product_ranges`, FK directe `products.range_id`

### Configuration boutique
- `be5f318` feat(admin/settings): table `shop_settings` + API GET/PATCH + page rewrite 2 tabs
- `5b0e7fe` feat(public): /pharmacies + /contact lisent shop_settings (helper `getShopSettings()`)

### Sécurité
- `57a92cc` fix(security): `getUser` (validation JWT) + RPC `is_user_admin` dans middleware + requireAdmin (audit security #8 + #11)

**6 sessions historiques livrées entre `c37a915` et `8d8ec14`** :

### Session 1 (commit `279f462`) — `/marques` + filtres URL + 404
- Page `/marques` Server data-driven (count + image par marque) — s'adapte aux marques ajoutées en admin
- `CatalogueClient` lit `?brand`, `?range`, `?need`, `?tag=type:slug` au mount avec matching tolérant name OU slug
- `not-found.tsx` design FARMAU (NavBar + Footer + serif italic 160px + CTAs + quick-links) au niveau locale + fallback global
- Footer Productos câblé vers `/besoins/[slug]` quand mapping, sinon `/catalogue` (au lieu de `?category=` cassé)

### Session 2 (commit `da37dfe`) — Pages légales + cookies
- 4 pages `/legal/{mentions-legales,cgv,confidentialite,cookies}` avec contenu FR pré-rédigé (Ley 172-13 + 358-05 + 126-02 RD)
- Composants `LegalShell` + `LegalSidebar` + `LegalSection` partagés (`src/components/legal/`)
- Bandeau `CookieBanner` fixed bottom-right monté dans `[locale]/layout.tsx`, persistence `farmau:cookies:consent` localStorage
- Footer bottom-bar 4 liens légaux câblés vers vraies routes
- Traductions FR/EN/ES UI (`Legal.shell`, `Legal.sidebar`, `Legal.cookieBanner`, `Legal.pageMeta`) — contenu juridique FR uniquement avec disclaimer "à valider par juriste"

### Session 3 (commit `ac1f9c3`) — Hub `/account`
- Layout `/account` Server avec check session + sidebar 5 onglets (Profil / Réservations / Favoris / Sécurité / Préférences)
- `/account/reservations` SSR avec status badges colorés, preview 3 items, lien WhatsApp/détail
- `/account/security` : CTA email reset → `/reset-password`, session info (`last_sign_in_at`), danger zone mailto demande RGPD
- `/account/preferences` : toggle newsletter (GET/DELETE) + select langue préférée (PATCH)
- Migration `profiles.preferred_locale text CHECK ('fr'|'en'|'es')` nullable
- APIs `/api/newsletter` étendues (GET/DELETE auth, POST modifié pour body vide quand user connecté) + `/api/account/preferences` PATCH

### Session 4 (commit `46ea917`) — Pages éditoriales statiques
- `/livraison` (workflow click & collect 3 étapes + 3 cards info + bloc TTL 24h)
- `/faq` (5 sections : Réservation/Produits/Compte/Retrait/Confidentialité, 19 Q&A, `<details>` natifs)
- `/pharmacies` (1 pharmacie Cerros de Gurabo, hero + carte Google Maps + sidebar contact + cards Accès/Pour qui)
- `/manifeste` (hero gradient + 3 paragraphes drop cap + 4 piliers + citation dark mode ink-900)
- Traductions FR/EN/ES exhaustives (~150 nouvelles clés)
- Footer service/brand câblé vers ces routes (au lieu de `/contact`/`/a-propos`)

### Session 5 (commit `ebad106`) — Admin hygiène
- `/admin/users` : 3 stats cards + recherche email/nom/téléphone + table avec toggle Promover/Admin (insert/delete dans `admin_users` source RLS + sync `profiles.is_admin`) + garde-fou self-demote + pagination
- `/admin/newsletter` : 4 stats cards (total + par langue) + filtre lang/search + export CSV (`?format=csv`) + delete par ligne
- APIs `GET/PATCH /api/admin/users[/id]` + `GET/DELETE /api/admin/newsletter[/id]` toutes gardées par `requireAdmin()`
- Sidebar admin nouvelle section "Clientes" (Usuarios + Newsletter)
- `/admin/my-team` supprimé (était en démo)

### Session 6 (commit `8d8ec14`) — Quick wins SEO/perf
- **JSON-LD Product schema** sur `/product/[slug]` via composant `ProductJsonLd` (Server, injecté hors `<main>`). Schema complet : `name`, `description`, `image[]` URLs absolues, `brand`, `offers` (URL, priceCurrency, price.toFixed(2), `availability` calculé depuis `stock`, `itemCondition: NewCondition`, `seller: FARMAU`).
- `stock` ajouté au `PRODUCT_SELECT` + propagation au type `MappedProduct` (page + ProductClient avec `stock?: number | null`)
- 2 derniers `<img>` migrés vers `next/image` : `CartEmpty` (bestsellers fallback) + `ConfirmationRecap` (items recap). Les autres `<img>` du HANDOFF d'origine (`CartDrawer`, `ProductClient`) avaient déjà été refactorés en composants utilisant `next/image` lors du sprint 3.

### Curation home (DB seule)
- 4 produits `is_featured=true` : Avène Hyaluron Activ B3 Serum + Avène Hydrance Aqua Gel + Babe Aloe Vera + Babe Bicalm+ (4 besoins distincts)
- 3 tags besoins `featured_on_home=true` : hydratation, anti-age, protection-solaire (les 3 plus peuplés)
- Section HomeBestsellers + HomeByNeed désormais 100 % data-driven (plus de fallback statique)

_(Les détails de la session 7 et toutes les vérifications sont désormais dans le récap "État actuel" en haut du fichier + dans `CLAUDE.md` section "État du projet 2026-05-23". Tous les chantiers session 7 ont été commités + poussés entre `186058b` et `b7ad240`.)_

---

## Findings restants — par priorité

### Quick wins (≤ 1h chacun)
- **Migration `banner_type_enum`** strict : la colonne reste `text` pour compat legacy. Quand toutes les lignes auront été re-sauvegardées via l'admin, créer l'enum strict.
- **AggregateRating** sur `ProductJsonLd` si on ajoute un système de reviews un jour.
- **Tests Playwright admin interactifs** (CRUD product/marques/tags via login) — nécessite seed test admin en CI.

### Accessibilité
- **Contraste palette** : certains hover sand-50 / clay-200 passent juste WCAG AA — à mesurer
- **Standardisation CTAs `bg-blue-*` → palette FARMAU** (sand/clay) — audit UX #13, visuel à valider

### Contenu éditorial (gros chantiers)
- **Blog** : table `posts` + admin CRUD + `/blog` + `/blog/[slug]` + sitemap (Footer "blog" pointe encore vers `/a-propos`)
- **Saisie INCI / benefits / pharmacist_advice** sur les 353 produits — colonnes prêtes, contenu à fournir
- **Traductions ES/EN du contenu juridique** `/legal/*` — actuellement FR uniquement avec disclaimer

### Consommation `shop_settings` à finir
- **Tunnel de réservation** lit encore `SHIPPING_COSTS` + `PICKUP_LOCATIONS` (`lib/shipping.ts` constants) + `NEXT_PUBLIC_WHATSAPP_NUMBER` env var. Le swap nécessite de passer PICKUP_LOCATIONS de 3-array à single-pickup (changement UX — séparé)
- **Footer + CartEmpty** utilisent encore `NEXT_PUBLIC_WHATSAPP_NUMBER`
- **`metadata.openGraph.siteName`** pourrait lire `shop_name` depuis settings

### Hygiène long terme
- **Double opt-in newsletter** : provider d'envoi (Resend/Postmark) + email de confirmation
- **Audit Storage policies** : 2 buckets publics avec policy `select` large (`brand-fiche` + `product-image`) — Supabase advisor `public_bucket_allows_listing`
- **Refactor `auth.uid()` → `(SELECT auth.uid())`** dans les policies RLS (perf, audit DB #3)

### Décisions produit en suspens
- **Services esthétiques laser** : le repo s'appelle `skincarelaser` mais le projet vendu est FARMAU pharmacie. Si volet services laser pertinent → discussion produit avant code (catalogue prestations, booking créneaux, etc.)

## Workflow recommandé

1. **Lis `CLAUDE.md` + ce HANDOFF + l'audit relevant** d'abord.
2. **Demande à l'utilisateur ce qu'il veut attaquer** — ne pas démarrer en autonome sauf demande explicite.
3. **Vérifie le MCP Supabase** : `mcp__supabase__get_project_url` doit renvoyer `https://adxpoxcynrpnbbxnncsk.supabase.co`.
4. **Changements DB** : via MCP `apply_migration`, miroir dans `supabase/migrations/`, regen types via `mcp__supabase__generate_typescript_types` puis `Edit` sur `src/lib/database.types.ts`.
5. **Avant chaque commit** : `npx tsc --noEmit && npm run test:unit -- --run && npm run lint`.
6. **Convention commit** : `<type>(<scope>): <description FR>` + corps + `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`. Passer le message via fichier (`git commit -F /tmp/...`) pour éviter les soucis d'échappement d'apostrophes.
7. **Push** : seulement sur demande explicite. Vercel auto-deploy sur push main.

## Pièges connus (résumé — voir CLAUDE.md pour détails)

- Cursor rule `alwaysApply` : **NE JAMAIS commit sans demande explicite**.
- Bash deny list bloque `rm`, `git --force`, `git rebase`, `git reset --hard` → utiliser `git rm` + `git reset --soft`.
- Cache `.next/types/` stale après suppression de routes : `mv .next /tmp/.next-stale-...` puis re-tsc. Vu sur la suppression de `/admin/my-team` à la session 5.
- `next-intl` redirect : préférer `redirect(\`/${locale}/...\`)` avec `next/navigation` plutôt que la version next-intl.
- Login + Signup utilisent `next/navigation` useRouter (pas next-intl) pour gérer les redirects `/admin/*` (non localisé).
- L'utilisateur push régulièrement en parallèle. Toujours `git status` avant de commit.
- `Link` next-intl exigé pour les `<a>` internes vers `/legal/*`, `/contact`, etc. (ESLint `@next/next/no-html-link-for-pages` errors sinon).
- `mailto:` et `tel:` restent des `<a>` normaux.

## Premier prompt suggéré au prochain Claude

> Lis CLAUDE.md, docs/HANDOFF.md, vérifie l'état git + le MCP Supabase. Confirme ce qui est OK et propose-moi le prochain chantier parmi les findings restants (quick wins SEO/perf, a11y focus-visible, blog complet, ou autre).
